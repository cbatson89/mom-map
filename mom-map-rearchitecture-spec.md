
# 30A Mom Map — Re-Architecture Spec

## Current state (verified by reading the repo)

- `30a-mom-map-mapbox.jsx` — 485 lines, one file, contains everything: brand color constants, the `CATEGORIES` config, the entire `SPOTS` dataset (39 hardcoded entries), and every component (`CategoryPin`, `MapContent`, `SpotCard`, `SpotListItem`, `SubmitForm`, `App`) with inline `style={{...}}` objects throughout.
- `src/main.jsx` just mounts `App` from that file — this is already a Vite + React project (`package.json`, `vite.config.js` exist), not a raw single-file script.
- Stack: React 18, `react-map-gl` 7 + `mapbox-gl` 3, Vite 5. Mapbox token read from `VITE_MAPBOX_TOKEN` env var.
- "Add a Spot" (`handleSubmit`, line 313) only pushes into local React state — nothing persists, nothing is sent anywhere. Refreshing the page loses every submission.
- **Bug found on inspection:** the submit handler (line 265) never uses the address the submitter typed. It assigns a literally random `lat`/`lng` (`30.32 + Math.random() * 0.08`, `-86.15 + Math.random() * 0.15`), so every current submission — if this ever went live as-is — would land at a random point in the Gulf/30A bounding box, not the actual location. This must be fixed as part of the rebuild, not just carried over.
- No tests, no TypeScript, no component boundaries, no data layer separate from UI.
- Deployed on Vercel already (git remote: `github.com/cbatson89/mom-map`), so hosting/CI is out of scope for this spec.

## Goals

1. Break the monolith into a conventional small-React-app structure (components / data / hooks / utils).
2. Move the 39-spot dataset out of code and into a real Supabase data layer with a submissions flow, so "Add a Spot" actually persists, is geocoded correctly, and stays hidden until you approve it.
3. Replace the inline `style={{...}}` objects with Tailwind CSS, driven by design tokens so the brand colors/spacing/radii are defined once and reused as utility classes.
4. Keep it plain JavaScript (no TypeScript), keep Vercel as the deploy target, no test suite required.
5. Produce a structure that's easy for you (or Claude Code) to extend later — new spot, new category, new field, new style tweak — without touching unrelated code.
6. Isolate all Mapbox-specific API calls behind `MapView.jsx`, so a future swap to a different map provider (e.g. Google Maps) touches one file instead of being spread across the app.

## Target architecture

```
src/
  main.jsx                     # entry point (unchanged in spirit)
  App.jsx                      # top-level layout/state orchestration only
  data/
    categories.js              # CATEGORIES config
    brand.js                   # BRAND color tokens
    spots.seed.js               # optional: seed/fallback data for local dev
  lib/
    supabase.js                # Supabase client init
    spots.api.js                # fetchSpots(), submitSpot() — talks to Supabase
  hooks/
    useIsMobile.js
    useSpots.js                  # loads spots from backend, exposes filtered state
  components/
    Map/
      MapView.jsx                # wraps react-map-gl <Map>
      CategoryPin.jsx
    Sidebar/
      SpotListItem.jsx
      SearchBar.jsx
    SpotCard/
      SpotCard.jsx
    SubmitForm/
      SubmitForm.jsx
    CategoryFilterBar.jsx
    Toast.jsx
index.css                        # Tailwind directives + any global overrides
tailwind.config.js                # design tokens (colors, radii, shadows, fonts)
```

## Styling: Tailwind + design tokens

- Install Tailwind (`tailwindcss`, `postcss`, `autoprefixer`) and initialize `tailwind.config.js` + `postcss.config.js`.
- Move every value out of the current `BRAND` object into `tailwind.config.js` under `theme.extend.colors`, using the same names so the mental model doesn't change (e.g. `sand`, `watermelon`, `bubblegum`, `seaGlass`, `kellyGreen`, `butter`, `vintageBlue`, `driftwood`, `cream`, `stripe`). These become classes like `bg-watermelon`, `text-driftwood`, `border-bubblegum`.
- Also tokenize the repeated non-color values currently duplicated across inline styles: border radius (pills use `20px`, cards use `20px`, buttons use `10-14px`), box shadows (the card shadow `0 24px 64px rgba(106,90,72,0.2)` appears twice, the stats-pill shadow appears once), and the striped-divider background (`repeating-linear-gradient(...)` appears 3 times). Put these in `theme.extend.borderRadius`, `theme.extend.boxShadow`, and a small custom utility/plugin for the stripe pattern, respectively.
- Rewrite each extracted component's `style={{...}}` prop as Tailwind utility classes referencing those tokens, so a color or radius change only ever happens in `tailwind.config.js`.
- Custom fonts already in use (`'Playfair Display', Georgia, serif` for headings/tagline, `'DM Sans', system-ui, sans-serif` for body text) should become `fontFamily` tokens too, not one-off inline styles.
- **Gap found on inspection:** both the mobile and desktop render branches of `App` currently embed their own `<style>{...}</style>` tag (lines 339 and 410) containing a Google Fonts `@import` for Playfair Display + DM Sans, a global reset (`* { box-sizing: border-box; margin: 0; padding: 0; }`), two `@keyframes` animations (`slideUp` — used by the desktop spot/submit card popup, `toastPop` — used by the toast), a `::-webkit-scrollbar` override, and a focus-state rule (`input:focus, textarea:focus, select:focus { border-color: ... }`). This is real global CSS, duplicated across both branches, that the Tailwind migration must not lose. It should all move once into `src/index.css` (or `tailwind.config.js`'s `theme.extend.keyframes`/`animation` for the two animations), loaded via the Google Fonts `<link>` tag in `index.html` instead of a runtime `@import`, with the two components no longer rendering their own `<style>` tags.
- `src/index.css` holds the three Tailwind directives (`@tailwind base/components/utilities`) plus the consolidated global rules described above (the `html, body, #root` reset currently inlined in `index.html`, the scrollbar/focus overrides, and the keyframes), imported once from `main.jsx`.

## Data / backend layer (Supabase)

- Backend: **Supabase** (Postgres + auto-generated REST API + JS client). Requires a Supabase project, with the URL and anon key stored as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env` alongside the existing `VITE_MAPBOX_TOKEN`.
- Single `spots` table (no separate `submissions` table — one table with a status column keeps "don't show pending on the map" trivial to enforce via the query itself):
  - Same fields as today: `name`, `category`, `lat`, `lng`, `address`, `description`, `age_range`, `free`, `hours`, `stroller`, `parking`, `bathrooms`, `shade`, `tags`, `verified`.
  - Plus `status` (`'approved' | 'pending' | 'rejected'`, default `'pending'`) and `submitted_at` (timestamp, default `now()`).
  - Plus `submitted_by` (text, nullable) — **gap found on inspection:** the form already has a "Your Name (optional)" field (`submittedBy` in `SubmitForm`'s state, line 229/264) but nothing in the original code ever stored it anywhere; it was silently dropped. The new schema must include this column so you can see who suggested a spot when reviewing pending submissions.
  - The 39 existing hardcoded spots are migrated in with `status = 'approved'`.
  - **Naming convention note:** the current JS objects use camelCase (`ageRange`), while the Postgres table uses snake_case (`age_range`), per normal Postgres convention. `fetchSpots()` and `submitSpot()` must convert between the two (e.g. map `age_range` → `ageRange` on the way out, `ageRange` → `age_range` on the way in) so every existing component that reads `spot.ageRange` keeps working unchanged.
- `fetchSpots()` in `src/lib/spots.api.js` queries **only `status = 'approved'`** — pending and rejected spots are never sent to the client, so there's no risk of a pending pin leaking onto the map even temporarily. This is a query-level guarantee, not a UI filter.
- `submitSpot()` inserts a new row with `status = 'pending'`. Because the fetch query excludes non-approved rows, the new submission simply doesn't appear anywhere until you change its `status` to `'approved'` directly in the Supabase table editor.
- `SubmitForm`'s `onSubmit` calls `submitSpot()` instead of pushing to local state; on success it shows the existing toast copy ("Your spot is in! We'll review it soon.") — no code changes needed to that message since it already sets the right expectation.
- `App` loads spots via `useSpots()` on mount (calls `fetchSpots()`). Keep a local seed file (`data/spots.seed.js`) as an offline-dev fallback only, used if Supabase env vars are missing.
- No image uploads for submissions in this pass — text/lat-lng fields only, matching the current form. Noted as a future feature.
- Recommended Row Level Security: anon key can `SELECT` where `status = 'approved'` and can `INSERT` new rows (forced to `status = 'pending'` via a default/trigger so a submitter can't self-approve); only you, via the Supabase dashboard, can `UPDATE status`.

### Fixing the random-coordinates bug: auto-geocode on submit

- Before inserting, `submitSpot()` (or a helper it calls) sends the form's `address` field to Mapbox's Geocoding API (`https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json?access_token=...`, reusing the existing `VITE_MAPBOX_TOKEN` — no new API key needed) and uses the top result's coordinates as `lat`/`lng`.
- If geocoding fails or returns no result (empty address field, garbage input, API error), do **not** fall back to random coordinates. Instead: reject the submission client-side with an inline error ("We couldn't find that address — try adding more detail") and don't call `submitSpot()` at all, so nothing bad ever reaches the database.
- Since the address field is optional today ("Address or Area"), decide whether to make it required once geocoding depends on it — recommended: make it required in the rebuilt form, since a spot with no location can't be geocoded or placed on the map.

### Supabase project setup (included in this pass)

Since there's no existing Supabase project, the Claude Code task should include:
1. Note in the PR/output that a Supabase project must be created manually at supabase.com (project creation itself isn't scriptable from the CLI) — Claude Code should pause and ask you to create the project and paste back the project URL and anon key if it can't do this via an MCP/API integration.
2. Once the project exists, Claude Code should provide the SQL to run in the Supabase SQL editor to create the `spots` table with the schema below, plus the RLS policies (anon `SELECT` where `status = 'approved'`, anon `INSERT` with `status` forced to `'pending'`).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env` and `.env.example`, and remind you these also need to be added to the Vercel project's environment variables (local `.env` isn't picked up by the Vercel deploy).

### Seed migration script

- Claude Code writes a one-time Node script (e.g. `scripts/seed-spots.js`, run manually with `node scripts/seed-spots.js`, not part of the app bundle) that reads the current 39-entry `SPOTS` array and inserts each row into Supabase with `status = 'approved'`, using the Supabase service-role key (not the anon key) so it bypasses RLS for this one-time load.
- The service-role key should only be used locally for this script and never committed or shipped to the client — keep it in `.env` under a name like `SUPABASE_SERVICE_ROLE_KEY` (no `VITE_` prefix, so Vite never bundles it into client code).
- After running the script once and confirming all 39 rows landed correctly, the script isn't needed again unless re-seeding from scratch.

## Explicit non-goals for this pass

- No TypeScript migration.
- No visual redesign — the Tailwind migration should reproduce the current look exactly (same colors, spacing, radii, shadows), just implemented with utility classes + tokens instead of inline style objects.
- No test suite.
- No change to hosting/CI (Vercel stays as-is).
- No admin dashboard UI — approving/rejecting submissions happens directly in the Supabase table editor by editing the `status` column.
- No image upload support for submitted spots (future feature).

## Phased build plan

Run this as four separate Claude Code sessions/prompts, in order, not one big pass. Each phase is independently shippable and verifiable — don't start the next phase until the current one's checklist passes. This keeps risk isolated: a pure file-split (Phase 1) can't break anything visual, a styling migration (Phase 2) can't break data, and the two backend phases (3–4) are the only ones touching an external service and are the only ones that need a pause for you to do something manually (create the Supabase project).

### Phase 1 — Componentize (no behavior or visual change)

**Goal:** break the monolith into files. Nothing about what the app does or looks like should change.

> Refactor this single-file React app (`30a-mom-map-mapbox.jsx`) into separate files, per the structure in `mom-map-rearchitecture-spec.md`'s "Target architecture" section, with zero behavior or visual changes — this is a pure file-split.
>
> 1. Extract `CATEGORIES`, `BRAND`, and the `SPOTS` array into `src/data/categories.js`, `src/data/brand.js`, `src/data/spots.seed.js`.
> 2. Split each component (`CategoryPin`, `MapContent`/`MapView`, `SpotCard`, `SpotListItem`, `SubmitForm`, `BottomSheet`, `useIsMobile`) into its own file under `src/components/` and `src/hooks/`, importing from the new data files. Keep all inline `style={{...}}` objects exactly as they are for now — do not touch styling in this phase.
> 3. **Map abstraction (for a possible future swap off Mapbox):** currently the sidebar list item's click handler in `App` calls `mapRef.current.flyTo({ center: [spot.lng, spot.lat], zoom, duration })` directly — a Mapbox GL JS-specific method reached from outside the map component. Encapsulate this: `MapView.jsx` should expose a library-agnostic imperative method (e.g. `flyToSpot(spot)`) via a forwarded ref or a small `useMapController` hook, and `App.jsx` should call that instead of touching `mapRef.current.flyTo` directly. No other component should reference Mapbox-specific APIs (`flyTo`, `mapboxAccessToken`, `mapStyle` strings, `NavigationControl`, etc.) outside of `MapView.jsx`. This doesn't change behavior at all right now — it just means that if you ever swap to Google Maps or another provider later, the change is contained to `MapView.jsx` and this one hook, instead of spread across `App.jsx` too.
> 4. `App.jsx` becomes the orchestration layer, importing everything above. `main.jsx` is unchanged.
> 5. Do not add Tailwind, Supabase, TypeScript, or tests in this phase. Confirm `npm run dev` renders identically to before (same 39 spots, same look, same interactions) and `npm run build` succeeds.

**Phase 1 checklist:**
- [ ] `npm run dev` renders the map with all 39 spots, identical look and behavior to the pre-refactor version.
- [ ] Filtering, search, mobile bottom sheets, and the submit form (still local-state-only at this point) all work exactly as before.
- [ ] Clicking a spot in the sidebar still flies the map to that spot — but via `MapView`'s `flyToSpot()` (or equivalent), not a direct `mapRef.current.flyTo` call from `App.jsx`.
- [ ] No file outside `MapView.jsx` references Mapbox-specific APIs directly.
- [ ] `npm run build` succeeds with no new console errors.
- [ ] No visual diff at all — this phase is invisible to a user.

### Phase 2 — Tailwind + design tokens

**Goal:** replace inline styles with Tailwind utilities and tokens. Still zero visual change — this is styling *implementation*, not a redesign.

> Building on the Phase 1 file structure, install and configure Tailwind CSS in this project.
>
> 1. Move every value from the `BRAND` object into `tailwind.config.js` under `theme.extend.colors`, using the same names (`sand`, `watermelon`, `bubblegum`, `seaGlass`, `kellyGreen`, `butter`, `vintageBlue`, `driftwood`, `cream`, `stripe`).
> 2. Tokenize the repeated non-color values: border radius (pills/cards use `20px`, buttons use `10–14px`), box shadows (the card shadow `0 24px 64px rgba(106,90,72,0.2)`, the stats-pill shadow), and the striped-divider background (`repeating-linear-gradient(...)`, used 3+ times) — add these to `theme.extend.borderRadius`, `theme.extend.boxShadow`, and a small custom utility/plugin for the stripe pattern.
> 3. Add `fontFamily` tokens for `'Playfair Display', Georgia, serif` and `'DM Sans', system-ui, sans-serif`.
> 4. Consolidate the `<style>` tags currently duplicated in both the mobile and desktop render branches of `App` (Google Fonts `@import`, the `slideUp`/`toastPop` `@keyframes`, the `::-webkit-scrollbar` override, the input focus-state rule) into `src/index.css` and `tailwind.config.js`'s `theme.extend.keyframes`/`animation`. Load the fonts via a `<link>` tag in `index.html` instead of a runtime `@import`. Neither render branch should render its own `<style>` tag afterward.
> 5. Rewrite every component's inline `style={{...}}` props as Tailwind utility classes referencing the tokens above.
> 6. Confirm the app looks pixel-identical to before — same colors, spacing, radii, shadows, fonts, animations — just implemented with Tailwind. No new data or backend work in this phase.

**Phase 2 checklist:**
- [ ] Visual diff against the pre-Tailwind version shows no unintended changes.
- [ ] Tailwind config is the single source of truth for brand colors/radii/shadows/fonts — no hardcoded hex values or one-off style objects left in component files.
- [ ] Fonts, the `slideUp`/`toastPop` animations, custom scrollbar, and input focus-color still work identically on both mobile and desktop, with no per-component `<style>` tags left duplicating them.
- [ ] `npm run build` succeeds with no new console errors.

### Phase 3 — Supabase setup + read path (spots load from the database)

**Goal:** get the app reading the 39 spots from a real Supabase database instead of the hardcoded array. Submissions still aren't wired up yet — that's Phase 4.

> I don't have a Supabase project yet. If you can't provision one directly, stop and tell me exactly what to create at supabase.com and what to paste back to you (project URL, anon key, service role key) before continuing.
>
> Once you have those:
> 1. Set up a Supabase client in `src/lib/supabase.js` using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (add both to `.env` and `.env.example`, and remind me they also need to be added to the Vercel project's environment variables).
> 2. Give me the SQL to run in the Supabase SQL editor to create a `spots` table: `name`, `category`, `lat`, `lng`, `address`, `description`, `age_range`, `free`, `hours`, `stroller`, `parking`, `bathrooms`, `shade`, `tags` (array), `verified`, `submitted_by` (nullable text), `status` (default `'pending'`), `submitted_at` (default `now()`). Include RLS policies: anon key can `SELECT` only where `status = 'approved'`, and can `INSERT` new rows but never set `status` to anything other than the default `'pending'`.
> 3. Write a one-time Node seed script (`scripts/seed-spots.js`) using a `SUPABASE_SERVICE_ROLE_KEY` (added to `.env`, no `VITE_` prefix so it's never bundled client-side) that inserts the 39 existing hardcoded spots with `status = 'approved'`. Tell me to run it manually with `node scripts/seed-spots.js` — don't call it from the app.
> 4. Add `fetchSpots()` in `src/lib/spots.api.js` that queries only rows where `status = 'approved'`, and converts snake_case columns (`age_range`, `submitted_by`) to the camelCase properties (`ageRange`) the existing components already expect — no component code should need to change.
> 5. Wire `App` to load spots via a `useSpots()` hook calling `fetchSpots()` on mount, instead of importing the hardcoded array. Keep `data/spots.seed.js` as an offline-dev fallback only, used if Supabase env vars are missing.
> 6. The submit form still only updates local state in this phase — do not touch `SubmitForm` yet, that's the next phase. Confirm the map still shows all 39 spots, now sourced from Supabase.

**Phase 3 checklist:**
- [ ] Supabase project created, `spots` table exists with the schema above, RLS policies in place.
- [ ] Seed script run successfully; all 39 spots visible in the Supabase table editor with `status = 'approved'`.
- [ ] `npm run dev` renders the map with all 39 spots, now fetched from Supabase (not the hardcoded array) — confirm by temporarily editing a row in Supabase and seeing it reflected on reload.
- [ ] Spot cards/list items still read fields like `spot.ageRange` without errors, confirming the snake_case ↔ camelCase mapping works.
- [ ] `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` added to both local `.env` and Vercel's environment variables; `SUPABASE_SERVICE_ROLE_KEY` kept out of client bundles.
- [ ] `npm run build` succeeds with no new console errors.

### Phase 4 — Wire submissions (geocoding + write path)

**Goal:** make "Add a Spot" actually persist to Supabase as a pending row, with a real geocoded location, and fix the random-coordinates bug.

> 1. Fix the existing bug where the submit handler assigns random `lat`/`lng` instead of using the typed address (`30.32 + Math.random() * 0.08`, `-86.15 + Math.random() * 0.15`). Add a `submitSpot()` function in `src/lib/spots.api.js` that first geocodes the form's `address` field via Mapbox's Geocoding API (reuse `VITE_MAPBOX_TOKEN`, no new key needed) and uses the top result's coordinates.
> 2. If geocoding fails or returns nothing (empty address, garbage input, API error), show an inline form error ("We couldn't find that address — try adding more detail") and do not call `submitSpot()` — nothing bad should reach the database. Make the address field required in the form since geocoding depends on it.
> 3. On success, `submitSpot()` inserts a row with `status` left as the default `'pending'`, including the `submitted_by` field from the form's "Your Name (optional)" input (previously collected but silently dropped — must now be saved).
> 4. Wire `SubmitForm`'s submit handler to call `submitSpot()` instead of updating local state, keeping the existing success toast copy ("Your spot is in! We'll review it soon.").
> 5. Do not add image upload fields, TypeScript, tests, or change the Vercel deploy config in this phase.
> 6. Confirm a freshly submitted spot (a) gets a real geocoded location, (b) is saved with `submitted_by` populated, and (c) does NOT appear on the map or sidebar list until its `status` is manually changed to `'approved'` in Supabase.

**Phase 4 checklist:**
- [ ] Submitting the form with a real address inserts a `status = 'pending'` row with correct, geocoded `lat`/`lng` — no more random coordinates.
- [ ] The "Your Name (optional)" field is saved to `submitted_by` and visible when reviewing the pending row in Supabase.
- [ ] That pending spot does **not** appear on the map or in the sidebar list.
- [ ] Manually flipping that row's `status` to `'approved'` in Supabase makes it appear on next reload.
- [ ] Submitting with a bad/empty address shows an inline error and does not create a database row.
- [ ] `npm run build` succeeds with no new console errors.
