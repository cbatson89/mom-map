// One-time seed script — NOT part of the app bundle.
// Run manually AFTER creating the Supabase project and the `spots` table:
//
//   node scripts/seed-spots.js
//
// It uses the SERVICE ROLE key (bypasses RLS) to insert the 39 existing spots
// with status='approved'. The service role key must live only in your local .env
// under SUPABASE_SERVICE_ROLE_KEY (no VITE_ prefix, so Vite never bundles it).
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import { SPOTS } from "../src/data/spots.seed.js";

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Missing env. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first."
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false },
  // Node < 22 has no global WebSocket; supabase-js eagerly inits its realtime
  // client, so hand it a ws transport. (Unused here — this script only inserts.)
  realtime: { transport: ws },
});

// camelCase (app) -> snake_case (Postgres). id/submitted_at are DB-generated;
// submitted_by is null for the original curated spots.
function spotToRow(s) {
  return {
    name: s.name,
    category: s.category,
    lat: s.lat,
    lng: s.lng,
    address: s.address,
    description: s.description,
    age_range: s.ageRange,
    free: s.free,
    hours: s.hours,
    stroller: s.stroller,
    parking: s.parking,
    bathrooms: s.bathrooms,
    shade: s.shade,
    tags: s.tags,
    verified: s.verified,
    status: "approved",
  };
}

async function main() {
  const rows = SPOTS.map(spotToRow);
  const { data, error } = await supabase.from("spots").insert(rows).select("id");
  if (error) {
    console.error("Seed failed:", error.message);
    process.exit(1);
  }
  console.log(`Inserted ${data.length} spots with status='approved'.`);
}

main();
