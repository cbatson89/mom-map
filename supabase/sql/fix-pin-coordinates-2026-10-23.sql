-- Pin coordinate fixes from the 2026-10-23 audit (npm run audit).
-- The same values are applied to src/data/spots.seed.js so the two stay in sync.
--
-- Run once in the Supabase SQL editor. Rows are matched by name because DB ids
-- are generated and may not equal the seed ids. All-or-nothing: if any name is
-- missing (renamed in the DB, etc.) it raises, lists the missing names, and
-- changes nothing. Re-running is harmless (sets the same values).
--
-- Updates don't fire the new-submission email trigger (that's INSERT-only).

do $$
declare
  missing text;
  n int;
begin
  create temp table pin_fixes (name text primary key, lat double precision, lng double precision, address text) on commit drop;
  insert into pin_fixes values
    -- Pin was ~550m north of the Village; address was wrong (9100 Baytowne Blvd).
    ('Baytowne Wharf Sandestin',            30.39052, -86.32415, '9300 Baytowne Wharf Blvd, Miramar Beach'),
    -- Was stacked on the Village pin; moved to the Baytowne Adventure Zone.
    ('Baytowne Wharf Adventure Playground', 30.38957, -86.32558, '9300 Baytowne Wharf Blvd, Miramar Beach'),
    -- Was at the park road, stacked with the outflow; moved to the beach day-use area.
    ('Grayton Beach State Park Beach',      30.3242,  -86.1547,  null),
    -- Moved to where Western Lake meets the beach.
    ('Grayton Beach Lake Outflow',          30.3238,  -86.1514,  null),
    -- Pin was in the water; moved to the park entrance lot where the tram boards.
    ('Topsail Hill Tram',                   30.37112, -86.27483, '7525 W County Hwy 30A, Santa Rosa Beach'),
    -- ~130m off; moved onto the restaurant at Silver Sands.
    ('Waldo''s Chicken & Beer — Kids Eat Free Monday', 30.37819, -86.34992, null);

  select string_agg(f.name, ', ') into missing
    from pin_fixes f
    where not exists (select 1 from public.spots s where s.name = f.name);
  if missing is not null then
    raise exception 'No spots row named: %. Nothing was changed.', missing;
  end if;

  update public.spots s
     set lat = f.lat,
         lng = f.lng,
         address = coalesce(f.address, s.address)
    from pin_fixes f
   where s.name = f.name;
  get diagnostics n = row_count;
  raise notice 'Updated % spots rows.', n;
end;
$$;

-- Check the result:
select id, name, lat, lng, address, status
  from public.spots
 where name in (
   'Baytowne Wharf Sandestin', 'Baytowne Wharf Adventure Playground',
   'Grayton Beach State Park Beach', 'Grayton Beach Lake Outflow',
   'Topsail Hill Tram', 'Waldo''s Chicken & Beer — Kids Eat Free Monday'
 )
 order by id;
