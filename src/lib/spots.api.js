import { supabase, hasSupabaseConfig } from "./supabase";
import { SPOTS } from "../data/spots.seed";
import { inServiceArea } from "../data/serviceArea";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Postgres uses snake_case; the app's components read camelCase (e.g. spot.ageRange).
// This mapper converts a DB row to the shape the UI already expects, so no
// component code has to change.
function rowToSpot(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    description: row.description,
    ageRange: row.age_range,
    free: row.free,
    hours: row.hours,
    stroller: row.stroller,
    parking: row.parking,
    bathrooms: row.bathrooms,
    shade: row.shade,
    tags: row.tags ?? [],
    verified: row.verified,
    submittedBy: row.submitted_by,
  };
}

// Loads spots for display. Queries ONLY approved rows — pending/rejected spots
// are excluded at the query level (also enforced by RLS), so they can never
// leak onto the map. Falls back to local seed data when Supabase isn't configured.
export async function fetchSpots() {
  if (!hasSupabaseConfig) {
    return SPOTS;
  }
  const { data, error } = await supabase
    .from("spots")
    .select("*")
    .eq("status", "approved")
    .order("id", { ascending: true });
  if (error) throw error;
  return data.map(rowToSpot);
}

// Geocodes a free-text address via Mapbox's Geocoding API (reusing the existing
// map token — no new key). Biased toward the 30A area for better local matches.
// Returns { lat, lng } for the top result, or null for empty input / no result /
// any API error — callers treat null as "couldn't find that address".
export async function geocodeAddress(address) {
  const query = (address || "").trim();
  if (!query) return null;
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?access_token=${MAPBOX_TOKEN}&limit=1&country=us&proximity=-86.18,30.33`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    const feature = json?.features?.[0];
    const center = feature?.center; // Mapbox returns [lng, lat]
    if (!Array.isArray(center) || center.length < 2) return null;
    // Mapbox is fuzzy — garbage input still returns a low-confidence best guess
    // (e.g. a random town in another state). Require a strong match so junk
    // addresses are treated as "not found" rather than placed at a wrong location.
    if (typeof feature.relevance === "number" && feature.relevance < 0.7) return null;
    const [lng, lat] = center;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Parses a pasted "lat, lng" pair (the format Google/Apple Maps copy out), e.g.
// "30.3243, -86.1514". Also accepts space separation. If the numbers only make
// sense swapped (someone typed lng first), they're swapped back. Returns
// { lat, lng } or null if it isn't two numbers.
export function parseCoordinates(text) {
  const parts = (text || "").trim().split(/[\s,]+/).filter(Boolean);
  if (parts.length !== 2) return null;
  const [a, b] = parts.map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (!inServiceArea({ lat: a, lng: b }) && inServiceArea({ lat: b, lng: a })) {
    return { lat: b, lng: a };
  }
  return { lat: a, lng: b };
}

// Nearest street address or place for a coordinate, as a short label like
// "Near 5999 W County Highway 30a, Santa Rosa Beach" — so GPS-only spots still
// show something readable in the card. Returns null on no result / any error.
async function reverseGeocode({ lat, lng }) {
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${MAPBOX_TOKEN}&types=address,poi,place&limit=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const feature = (await res.json())?.features?.[0];
    if (!feature) return null;
    const street = feature.address ? `${feature.address} ${feature.text}` : feature.text;
    const town = feature.context?.find(c => c.id.startsWith("place."))?.text;
    return `Near ${town && town !== street ? `${street}, ${town}` : street}`;
  } catch {
    return null;
  }
}

// Resolves the form's location to coordinates plus the address text to store.
// Address mode geocodes the typed address; GPS mode takes the pasted coordinates
// as-is and labels them with the nearest address.
async function resolveLocation(form) {
  if (form.locationMode === "coords") {
    const coords = parseCoordinates(form.coordinates);
    if (!coords) {
      const err = new Error("Couldn't read those coordinates");
      err.code = "BAD_COORDINATES";
      throw err;
    }
    if (!inServiceArea(coords)) {
      const err = new Error("Coordinates are outside the 30A area");
      err.code = "OUT_OF_AREA";
      throw err;
    }
    const label = await reverseGeocode(coords);
    return { coords, address: label ?? `${coords.lat}, ${coords.lng}` };
  }
  const coords = await geocodeAddress(form.address);
  if (!coords) {
    const err = new Error("We couldn't geocode that address");
    err.code = "GEOCODE_FAILED";
    throw err;
  }
  return { coords, address: form.address };
}

// camelCase form (app) -> snake_case row (Postgres). status is intentionally
// omitted so the column default ('pending') applies — the RLS insert policy
// also forces pending, so a submitter can't self-approve.
function formToRow(form, { coords, address }) {
  return {
    name: form.name,
    category: form.category,
    lat: coords.lat,
    lng: coords.lng,
    address,
    description: form.description,
    age_range: form.ageRange || null,
    free: form.free,
    hours: form.hours || null,
    stroller: form.stroller,
    parking: form.parking,
    bathrooms: form.bathrooms,
    shade: form.shade,
    tags: [],
    verified: false,
    submitted_by: form.submittedBy || null,
  };
}

// Submits a new spot. Resolves the location FIRST (geocoding the typed address —
// fixing the old bug that assigned random coordinates — or validating pasted GPS
// coordinates); if that fails it throws GEOCODE_FAILED / BAD_COORDINATES /
// OUT_OF_AREA BEFORE any DB write, so nothing bad ever reaches the database. On success inserts
// a pending row. No .select() on the insert: RLS hides non-approved rows, so a
// returning-select would come back empty and misfire.
export async function submitSpot(form) {
  const location = await resolveLocation(form);
  if (!hasSupabaseConfig) {
    const err = new Error("Supabase is not configured");
    err.code = "NO_BACKEND";
    throw err;
  }
  const { error } = await supabase.from("spots").insert(formToRow(form, location));
  if (error) throw error;
  return true;
}
