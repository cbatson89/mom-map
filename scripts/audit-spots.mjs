// Pin-accuracy audit — NOT part of the app bundle. Read-only: never writes data.
//
//   npm run audit                 # audit every row in Supabase (all statuses)
//   npm run audit -- --source=seed  # audit src/data/spots.seed.js (offline / project paused)
//
// For each spot it asks: does the pin sit where the spot actually is?
//   1. Sanity: coordinates present, numeric, and inside the 30A area.
//   2. Address match: forward-geocode the address (same Mapbox API and 30A bias the
//      app uses at submit time) and measure how far the pin is from the result.
//   3. Name match: search Mapbox POIs for "name, address" — catches spots whose
//      address is only a town ("Seaside, FL 32459") but whose venue is findable.
//   4. Water check: flags pins that land in water (beach pins on the shoreline can
//      trip this legitimately, so it only ever warns).
//   5. Duplicates: two spots on the exact same coordinates.
//
// Verdicts: OK, WARN (look at it), FAIL (almost certainly wrong), UNVERIFIED (the
// address is too vague and no POI matched, so precision can't be confirmed).
// Exits 1 if anything FAILs.
//
// The db source uses SUPABASE_SERVICE_ROLE_KEY so pending/rejected rows are
// included — the anon key only sees approved rows (RLS).
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { inServiceArea } from "../src/data/serviceArea.js";

const MAPBOX_TOKEN = process.env.VITE_MAPBOX_TOKEN;
const source = (process.argv.find(a => a.startsWith("--source=")) ?? "--source=db").split("=")[1];

const PROXIMITY = "-86.18,30.33";

// Distance thresholds (meters) for a precise (address/POI-level) match.
const OK_WITHIN = 250;
const FAIL_BEYOND = 1000;
// For a street-only or town-only match we can only confirm "same general area".
const STREET_FAIL_BEYOND = 3000;
const TOWN_FAIL_BEYOND = 8000;
const MIN_RELEVANCE = 0.7; // same cutoff the app's geocodeAddress() uses

if (!MAPBOX_TOKEN) {
  console.error("Missing VITE_MAPBOX_TOKEN in .env");
  process.exit(1);
}

async function loadSpots() {
  if (source === "seed") {
    const { SPOTS } = await import("../src/data/spots.seed.js");
    return SPOTS.map(s => ({ ...s, status: "seed" }));
  }
  if (source !== "db") {
    console.error(`Unknown --source=${source} (use db or seed)`);
    process.exit(1);
  }
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env, or use --source=seed.");
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    // Node < 22 has no global WebSocket; see scripts/seed-spots.js.
    realtime: { transport: ws },
  });
  const { data, error } = await supabase
    .from("spots")
    .select("id,name,category,lat,lng,address,status")
    .order("id");
  if (error) {
    console.error(`Supabase error: ${error.message}`);
    console.error("If the project is paused, unpause it or run with --source=seed.");
    process.exit(1);
  }
  return data;
}

function distanceMeters(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(bLat - aLat);
  const dLng = rad(bLng - aLng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function mapboxJson(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url);
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`Mapbox HTTP ${res.status}`);
    return res.json();
  }
  throw new Error("Mapbox rate limited");
}

// Top geocoding match as { lat, lng, precise, label }, or null.
async function geocode(query, { poiOnly = false } = {}) {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
    `?access_token=${MAPBOX_TOKEN}&limit=1&country=us&proximity=${PROXIMITY}` +
    (poiOnly ? "&types=poi" : "");
  const feature = (await mapboxJson(url)).features?.[0];
  if (!feature || (feature.relevance ?? 0) < MIN_RELEVANCE) return null;
  const [lng, lat] = feature.center;
  const types = feature.place_type ?? [];
  // An "address" result without a house number is a street centroid — anywhere
  // along the road — so only POIs and numbered addresses count as precise.
  const level = types.includes("poi") || (types.includes("address") && feature.address)
    ? "precise"
    : types.includes("address") ? "street" : "town";
  return { lat, lng, level, label: feature.place_name };
}

async function inWater(lat, lng) {
  const url =
    `https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${lng},${lat}.json` +
    `?layers=water&radius=0&limit=1&access_token=${MAPBOX_TOKEN}`;
  return ((await mapboxJson(url)).features?.length ?? 0) > 0;
}

const RANK = { FAIL: 0, WARN: 1, UNVERIFIED: 2, OK: 3 };
const worse = (a, b) => (RANK[a] <= RANK[b] ? a : b);
const fmtM = m => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m)}m`);

async function auditSpot(spot, dupes) {
  const issues = [];
  let verdict = "OK";
  const flag = (level, msg) => {
    verdict = worse(verdict, level);
    issues.push(`${level}: ${msg}`);
  };

  const { lat, lng } = spot;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    flag("FAIL", `missing/invalid coordinates (${lat}, ${lng})`);
    return { spot, verdict, issues };
  }
  if (!inServiceArea({ lat, lng })) {
    flag("FAIL", `outside the 30A area — lat/lng swapped or sign flipped?`);
  }
  if (dupes.has(`${lat},${lng}`)) {
    const others = dupes.get(`${lat},${lng}`).filter(id => id !== spot.id).join(", ");
    flag("WARN", `exact same coordinates as spot(s) ${others} — the pins stack and one hides the other`);
  }

  try {
    const [byAddress, byName] = await Promise.all([
      spot.address ? geocode(spot.address) : null,
      geocode(`${spot.name}, ${spot.address ?? ""}`, { poiOnly: true }),
    ]);
    const candidates = [
      byAddress && { ...byAddress, via: "address" },
      byName && { ...byName, via: "name" },
    ]
      .filter(Boolean)
      .map(c => ({ ...c, dist: distanceMeters(lat, lng, c.lat, c.lng) }));

    const precise = candidates.filter(c => c.level === "precise").sort((a, b) => a.dist - b.dist);
    const coarse = candidates.filter(c => c.level !== "precise");

    if (precise.length) {
      const best = precise[0];
      const where = `${fmtM(best.dist)} from ${best.via} match "${best.label}" (${best.lat.toFixed(5)}, ${best.lng.toFixed(5)})`;
      if (best.dist > FAIL_BEYOND) flag("FAIL", `pin is ${where}`);
      else if (best.dist > OK_WITHIN) flag("WARN", `pin is ${where}`);
      else issues.push(`ok: ${where}`);
    } else if (coarse.length) {
      const c = coarse[0];
      if (c.dist > (c.level === "street" ? STREET_FAIL_BEYOND : TOWN_FAIL_BEYOND)) {
        flag("FAIL", `pin is ${fmtM(c.dist)} from ${c.level} match "${c.label}" — wrong area`);
      } else {
        flag("UNVERIFIED", `address only resolves to ${c.level} "${c.label}" (${fmtM(c.dist)} away); no POI match for the name`);
      }
    } else {
      flag("UNVERIFIED", `Mapbox couldn't match the address or the name`);
    }

    if (await inWater(lat, lng)) flag("WARN", `pin is in water (fine for some beach spots — check it)`);
  } catch (e) {
    flag("UNVERIFIED", `lookup error: ${e.message}`);
  }

  return { spot, verdict, issues };
}

const spots = await loadSpots();
console.log(`Auditing ${spots.length} spots from ${source === "seed" ? "src/data/spots.seed.js" : "Supabase (all statuses)"}...\n`);

const byCoord = new Map();
for (const s of spots) {
  const k = `${s.lat},${s.lng}`;
  byCoord.set(k, [...(byCoord.get(k) ?? []), s.id]);
}
const dupes = new Map([...byCoord].filter(([, ids]) => ids.length > 1));

const results = [];
for (const spot of spots) results.push(await auditSpot(spot, dupes));
results.sort((a, b) => RANK[a.verdict] - RANK[b.verdict] || a.spot.id - b.spot.id);

for (const { spot, verdict, issues } of results) {
  console.log(`[${verdict}] #${spot.id} ${spot.name} (${spot.status})`);
  console.log(`    pin ${spot.lat}, ${spot.lng} | ${spot.address ?? "(no address)"}`);
  for (const i of issues) console.log(`    - ${i}`);
}

const counts = Object.fromEntries(Object.keys(RANK).map(k => [k, results.filter(r => r.verdict === k).length]));
console.log(`\nSummary: ${counts.OK} OK, ${counts.WARN} WARN, ${counts.UNVERIFIED} UNVERIFIED, ${counts.FAIL} FAIL`);
process.exit(counts.FAIL ? 1 : 0);
