import { useState, useCallback, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

const BRAND = {
  sand: "#F6EFE5",
  watermelon: "#EF7266",
  bubblegum: "#EAC2D3",
  seaGlass: "#A9D8D6",
  kellyGreen: "#56734F",
  butter: "#EBCB69",
  vintageBlue: "#7FB3C6",
  driftwood: "#6A5A48",
  cream: "#FAF6F0",
  stripe: "#F2E4D8",
};

const CATEGORIES = [
  { id: "beach",   label: "Beach",       icon: "☂️",  color: BRAND.vintageBlue,  badge: "BEACH ACCESS" },
  { id: "splash",  label: "Splash Pads", icon: "💧",  color: BRAND.seaGlass,    badge: "SPLASH PAD" },
  { id: "treat",   label: "Treat Stops", icon: "🍦",  color: BRAND.butter,      badge: "TREAT STOP" },
  { id: "park",    label: "Parks",       icon: "🌳",  color: BRAND.kellyGreen,  badge: "PARKS" },
  { id: "daytrip", label: "Day Trips",   icon: "🚗",  color: BRAND.driftwood,   badge: "DAY TRIP" },
  { id: "indoor",  label: "Indoor",      icon: "🎨",  color: BRAND.bubblegum,   badge: "INDOOR PLAY" },
  { id: "nature",  label: "Nature",      icon: "🌿",  color: "#7AAF72",         badge: "NATURE" },
  { id: "eats",    label: "Kids Eats",   icon: "🍕",  color: BRAND.watermelon,  badge: "KIDS EAT FREE" },
  { id: "camp",    label: "Camps",       icon: "⛺",  color: "#E8935A",         badge: "CAMPS" },
];

const SPOTS = [
  // SPLASH PADS
  { id: 1,  name: "Padgett Park Splash Pad",          category: "splash",  lat: 30.3791, lng: -86.1851, address: "810 J D Miller Rd, Santa Rosa Beach", description: "Splash pad, full playground, walking trail, BBQ area. Toddler heaven. Clean restrooms on site.", ageRange: "All ages", free: true,  hours: "Open 24 hours",      stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["splash pad","playground","trail"], verified: true },
  { id: 2,  name: "Helen McCall Park Splash Pad",     category: "splash",  lat: 30.3698, lng: -86.2366, address: "325 Moll Dr, Santa Rosa Beach",        description: "Big shaded playground with age-separated areas, splash pad open spring–fall, skate park and sports fields.", ageRange: "All ages", free: true,  hours: "6AM–8PM daily",      stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["splash pad","skate park","shade"], verified: true },
  { id: 3,  name: "Seaside Amphitheater Splash Pad",  category: "splash",  lat: 30.3235, lng: -86.1397, address: "Seaside, FL 32459",                    description: "Open-air splash pad in the heart of Seaside. Walk to shops and Airstream Row after. Free and fun.", ageRange: "All ages", free: true,  hours: "Seasonal hours",     stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["splash pad","Seaside","walkable"], verified: true },
  { id: 4,  name: "Alys Beach Amphitheater Fountain", category: "splash",  lat: 30.2870, lng: -86.0315, address: "Alys Beach, FL 32461",                 description: "Interactive fountain splash pad on the Alys Beach lawn. Free, walkable, open seasonally. Beautiful setting.", ageRange: "All ages", free: true,  hours: "Seasonal hours",     stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["splash pad","Alys Beach","free"], verified: true },
  { id: 5,  name: "Rosemary Beach Splash Pad",        category: "splash",  lat: 30.2760, lng: -85.9986, address: "St. Augustine Park, Rosemary Beach",   description: "Interactive children's fountain in the heart of Rosemary Beach on the north side. Walkable from Barrett Square. Community amenity — accessible but not a public facility.", ageRange: "All ages", free: true,  hours: "Seasonal hours",     stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["splash pad","Rosemary Beach","walkable"], verified: true },
  { id: 6,  name: "Grand Boulevard Fountain",         category: "splash",  lat: 30.3872, lng: -86.3512, address: "495 Grand Blvd, Miramar Beach",        description: "Free interactive fountain splash pad in the Grand Boulevard town center. Walkable from shops — grab Kilwin's or Menchie's after.", ageRange: "All ages", free: true,  hours: "During shopping hours", stroller: true, parking: true, bathrooms: true, shade: false, tags: ["splash pad","Miramar Beach","free","walkable"], verified: true },

  // PARKS & PLAYGROUNDS
  { id: 7,  name: "Alys Beach Playground",            category: "park",    lat: 30.2859, lng: -86.0308, address: "Alys Beach, FL 32461",                 description: "Architecturally unique play area with rolling hills. Walk to the Alys Beach splash pad nearby.", ageRange: "2–6 years", free: true,  hours: "Dawn to dusk",       stroller: false, parking: true,  bathrooms: true,  shade: false, tags: ["playground","unique","walkable"], verified: true },
  { id: 8,  name: "Fonville Park at Raw & Juicy",     category: "park",    lat: 30.2875, lng: -86.0300, address: "Alys Beach, FL 32461",                 description: "Swings, seesaw, playhouses, zip line, and the famous Fonville Hill. Grab a donut from Charlie's food truck after. A local favorite.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: false, parking: true,  bathrooms: true,  shade: true,  tags: ["playground","zip line","food nearby"], verified: true },
  { id: 9,  name: "Seaside Playground",               category: "park",    lat: 30.3238, lng: -86.1405, address: "Seaside, FL 32459",                    description: "Playground near the Seaside Amphitheater. Free and walkable from Central Square, Airstream Row, and the splash pad.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["playground","Seaside","walkable"], verified: true },
  { id: 10, name: "Walton Sports Complex",            category: "park",    lat: 30.3622, lng: -86.1178, address: "240 Mc Davis Loop, Santa Rosa Beach",  description: "100+ acres of free family fun. Playground, picnic areas, 8 pickleball courts (lighted til 9PM), baseball fields, soccer fields, restrooms, huge parking lot.", ageRange: "All ages", free: true,  hours: "6AM–9PM daily",      stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["playground","pickleball","sports","free"], verified: true },
  { id: 11, name: "Baytowne Wharf Adventure Playground", category: "park", lat: 30.3948, lng: -86.3268, address: "9100 Baytowne Blvd, Sandestin",       description: "Huge fenced nautical playground, zip line, ropes course, carousel, ice cream next door. Paid activities available alongside the free playground.", ageRange: "All ages", free: false, hours: "Check schedule",      stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["playground","zip line","carousel","Sandestin"], verified: true },
  { id: 12, name: "Frank Brown Park",                 category: "park",    lat: 30.2309, lng: -85.8773, address: "16200 Panama City Beach Pkwy, PCB",    description: "100+ acre park with shaded playgrounds, youth freshwater fishing pond, kids splash pool at the Aquatic Center, baseball, soccer, tennis, dog parks, and Gayle's Trails. A full day destination.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["playground","fishing pond","splash pool","trails","PCB"], verified: true },

  // BEACH ACCESS
  { id: 13, name: "Grayton Beach State Park Beach",   category: "beach",   lat: 30.3102, lng: -86.1555, address: "357 Main Park Rd, Santa Rosa Beach",  description: "Worth the $4 entry fee during peak season — way less crowded than free beaches. The hiking loop is genuinely fun for kids. Look for crabs and creatures at the Western Lake outflow. Don't skip this one.", ageRange: "All ages", free: false, hours: "8AM–Sunset",         stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["state park","dune lake","hiking","less crowded"], verified: true },
  { id: 14, name: "Santa Clara Regional Beach",       category: "beach",   lat: 30.2992, lng: -86.0755, address: "Bramble Grove Rd, Seagrove Beach",    description: "Two parking lots, bathrooms, showers, wagon and stroller ramp, ADA accessible, lifeguards seasonal. One of the best-equipped beach accesses on 30A.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["beach access","wagon ramp","ADA","lifeguards"], verified: true },
  { id: 15, name: "Beachwood Villas Beach Access",    category: "beach",   lat: 30.3000, lng: -86.0620, address: "3874 E County Hwy 30A, Seagrove Beach", description: "Parking, bathrooms, showers. Stairs only — no wagon or stroller ramp. Plan accordingly.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: false, parking: true,  bathrooms: true,  shade: false, tags: ["beach access","stairs only","showers"], verified: true },
  { id: 16, name: "Dune Allen Regional Beach Access", category: "beach",   lat: 30.3027, lng: -86.2485, address: "5999 W County Hwy 30A, Santa Rosa Beach", description: "18 parking spots, bathrooms, outdoor showers, lifeguard station, bike racks, golf cart parking. Wagon-friendly ramp. Right across from Stinky's Fish Camp.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["beach access","wagon ramp","lifeguard","showers"], verified: true },
  { id: 17, name: "Fort Panic Beach Access",          category: "beach",   lat: 30.3042, lng: -86.2388, address: "5753 W County Hwy 30A, Santa Rosa Beach", description: "Large parking lot plus street parking, two handicap spots, bathrooms, showers. One of the best parking situations on all of 30A.", ageRange: "All ages", free: true,  hours: "Dawn to dusk",       stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["beach access","great parking","showers","bathrooms"], verified: true },
  { id: 18, name: "Grayton Beach Tram",               category: "beach",   lat: 30.3155, lng: -86.1568, address: "Grayton Central Parking, Santa Rosa Beach", description: "Free tram runs daily 6AM–9:45PM every 15 minutes from Grayton Central parking lot to the beach. Kids absolutely love it. ADA compliant, no parking stress.", ageRange: "All ages", free: true,  hours: "6AM–9:45PM daily",   stroller: true,  parking: true,  bathrooms: false, shade: false, tags: ["tram","free","beach access","ADA"], verified: true },
  { id: 19, name: "Topsail Hill Tram",                category: "beach",   lat: 30.3492, lng: -86.2823, address: "Topsail Hill Preserve, Santa Rosa Beach", description: "Free tram from the 393 municipal parking lot to Topsail Hill Preserve State Park beach. Kids love the ride. Runs seasonally.", ageRange: "All ages", free: true,  hours: "Seasonal hours",     stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["tram","free","state park","beach access"], verified: true },
  { id: 20, name: "Camp Helen State Park",            category: "beach",   lat: 30.2757, lng: -85.9905, address: "23937 Panama City Beach Pkwy, PCB",    description: "Nearly a mile sandy hike in — do NOT bring a wagon. You are a pack mule on a sandy path. Worth every step. Beautiful beach with Lake Powell outflow. Hack: park at Lupine Beach Access and walk down from that beach instead. Still no wagon.", ageRange: "All ages", free: false, hours: "8AM–Sunset",         stroller: false, parking: true,  bathrooms: true,  shade: true,  tags: ["day trip","dune lake","hike in","no wagon","PCB"], verified: true },

  // NATURE & TRAILS
  { id: 21, name: "Alys Beach Nature Trail",          category: "nature",  lat: 30.2888, lng: -86.0293, address: "214 N Charles St, Alys Beach",         description: "Easy boardwalk through pitcher plant bogs and coastal scrub. Hidden gem. Great after a beach morning.", ageRange: "All ages", free: true,  hours: "Always open",        stroller: true,  parking: true,  bathrooms: false, shade: true,  tags: ["boardwalk","easy walk","pitcher plants"], verified: true },
  { id: 22, name: "NatureWalk Lilly Lane Trail",      category: "nature",  lat: 30.3267, lng: -86.1179, address: "27 Lilly Lane, Santa Rosa Beach",      description: "Quick paved trail straight to beach access. Perfect for a morning bike ride with the kids in tow.", ageRange: "All ages", free: true,  hours: "Always open",        stroller: true,  parking: true,  bathrooms: false, shade: true,  tags: ["bike trail","beach access","paved","easy"], verified: true },
  { id: 23, name: "WaterColor and Seaside Trails",    category: "nature",  lat: 30.3140, lng: -86.1620, address: "533 Western Lake Dr, Santa Rosa Beach", description: "8.7-mile loop through WaterColor and Seaside on boardwalks, paved paths, and shaded trails around Western Lake. Easy and flat — great for kids on bikes or in trailers. Stop in Seaside for Airstream Row snacks mid-ride.", ageRange: "All ages", free: true,  hours: "Always open",        stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["bike trail","boardwalk","Western Lake","Seaside"], verified: true },
  { id: 24, name: "Grayton Beach Lake Outflow",       category: "nature",  lat: 30.3088, lng: -86.1562, address: "357 Main Park Rd, Santa Rosa Beach",  description: "Where Western Lake meets the Gulf. Kids find crabs, fish, and all kinds of Gulf creatures. Local secret. Note: water sometimes turns brown from pine needle tannins — totally safe, just stained.", ageRange: "All ages", free: false, hours: "8AM–Sunset",         stroller: false, parking: true,  bathrooms: true,  shade: true,  tags: ["nature","lake outflow","crabs","local favorite"], verified: true },
  { id: 25, name: "E.O. Wilson Biophilia Center",     category: "nature",  lat: 30.4767, lng: -86.0543, address: "4956 State Hwy 20 E, Freeport",       description: "Nature education center in the Longleaf Pine ecosystem — one of the most biodiverse areas in the US. Interactive exhibits, nature trails, Camp Longleaf summer programs, family events. Check calendar before visiting — open select days and special events only.", ageRange: "All ages", free: false, hours: "Check calendar",      stroller: false, parking: true,  bathrooms: true,  shade: true,  tags: ["nature","day trip","Freeport","camps","education"], verified: true },

  // INDOOR PLAY
  { id: 26, name: "The Play Studio",                  category: "indoor",  lat: 30.3748, lng: -86.2321, address: "3214 US-98 Suite 404, Santa Rosa Beach", description: "Indoor play for rainy days. Dress-up, toys, crawling area for babies. Coffee shop next door. A lifesaver on a rainy day.", ageRange: "0–6 years", free: false, hours: "Mon–Sat 9AM–5PM",    stroller: true,  parking: true,  bathrooms: true,  shade: null, tags: ["indoor","rainy day","babies","toddlers"], verified: true },
  { id: 27, name: "Rock Paper Scissors 30A",          category: "indoor",  lat: 30.3085, lng: -86.1548, address: "37 Logan Lane #8, Grayton Beach",     description: "Arts and crafts open studio. Walk-in sessions $5–34. All ages. Perfect rainy day creative outlet. Check their schedule for themed sessions.", ageRange: "All ages", free: false, hours: "Check schedule",      stroller: false, parking: true,  bathrooms: true,  shade: null, tags: ["arts","crafts","indoor","rainy day"], verified: true },
  { id: 28, name: "The Hidden Lantern Bookstore",     category: "indoor",  lat: 30.2762, lng: -86.0005, address: "84 N Barrett Square, Rosemary Beach",  description: "Gorgeous independent bookstore with a wonderful kids corner, stuffed animals paired with books, and story time events. A must on any Rosemary Beach visit.", ageRange: "All ages", free: true,  hours: "Mon–Sun 9AM–6PM",    stroller: false, parking: true,  bathrooms: false, shade: null, tags: ["bookstore","kids corner","story time","Rosemary Beach"], verified: true },
  { id: 29, name: "Emerald Coast Theatre Company",    category: "indoor",  lat: 30.3878, lng: -86.3498, address: "560 Grand Blvd Suite 200, Miramar Beach", description: "Professional theatre with kids shows, youth classes, summer camps, and after-school programs. Walk through the breezeway between Chubbies and Magnolia House, elevator to second floor. Tickets $10–28.", ageRange: "All ages", free: false, hours: "Tue–Fri 10AM–5PM plus showtimes", stroller: false, parking: true, bathrooms: true, shade: null, tags: ["theatre","kids shows","camps","classes"], verified: true },
  { id: 30, name: "Hurricane Lanes Bowling",          category: "indoor",  lat: 30.3892, lng: -86.4698, address: "34876 Emerald Coast Pkwy, Destin",     description: "26 bowling lanes, arcade, pool tables, air hockey, Strikezone Café. Great rainy day option for older kids. The whole family can bowl.", ageRange: "All ages", free: false, hours: "Sun/Tue/Wed 11AM–midnight, Mon/Thu–Sat 11AM–2AM", stroller: false, parking: true, bathrooms: true, shade: null, tags: ["bowling","arcade","rainy day","Destin"], verified: true },

  // CAMPS & PROGRAMS
  { id: 31, name: "US Gold Gymnastics — Open Gym",    category: "camp",    lat: 30.3745, lng: -86.2198, address: "2312 Chat Holley Rd, Santa Rosa Beach", description: "Open gym Fridays 9:30–11:30AM. $20 first child, $15 each sibling, cash only. Trampolines, trapeze, climbing equipment. Supervised free play.", ageRange: "1–5 years", free: false, hours: "Fridays 9:30–11:30AM", stroller: false, parking: true, bathrooms: true, shade: null, tags: ["gymnastics","open gym","Friday","toddlers"], verified: true },
  { id: 32, name: "US Gold — Parents Night Out",      category: "camp",    lat: 30.3745, lng: -86.2198, address: "2312 Chat Holley Rd, Santa Rosa Beach", description: "Friday evenings 6:15–9PM. $30 drop-off, ages 5–10, no parents required to stay. Go have dinner on 30A — you deserve it.", ageRange: "5–10 years", free: false, hours: "Fridays 6:15–9PM",    stroller: false, parking: true, bathrooms: true, shade: null, tags: ["drop-off","Friday night","date night","parents night out"], verified: true },

  // DAY TRIPS
  { id: 33, name: "Gulfarium Marine Adventure Park",  category: "daytrip", lat: 30.3872, lng: -86.6138, address: "1010 Miracle Strip Pkwy SE, Fort Walton Beach", description: "One of the oldest marine parks in the US since 1955. Daily dolphin and sea lion shows included with admission. Also penguins, otters, stingrays, sharks, sea turtles, alligators. Tip: bring your own snacks and save money.", ageRange: "All ages", free: false, hours: "Daily 9AM–5:30PM",    stroller: true,  parking: true,  bathrooms: true,  shade: false, tags: ["marine park","dolphins","day trip","Fort Walton"], verified: true },
  { id: 34, name: "Big Kahuna's Water Park",          category: "daytrip", lat: 30.3890, lng: -86.4716, address: "1007 US Hwy 98 E, Destin",             description: "40+ water attractions, waterslides, flow boarding, mini golf, skycoaster. Full day water park — bring sunscreen and snacks.", ageRange: "All ages", free: false, hours: "Check seasonal schedule", stroller: true, parking: true, bathrooms: true, shade: false, tags: ["water park","slides","Destin","day trip"], verified: true },
  { id: 35, name: "Baytowne Wharf Sandestin",         category: "daytrip", lat: 30.3948, lng: -86.3268, address: "9100 Baytowne Blvd, Sandestin",       description: "Village with shops, restaurants, mini golf, carousel, and tons of outdoor space. Kids can run and explore while parents browse. Great evening option.", ageRange: "All ages", free: true,  hours: "Check schedule",      stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["Sandestin","evening outing","shopping","carousel"], verified: true },

  // KIDS EAT FREE
  { id: 36, name: "Waldo's Chicken & Beer — Kids Eat Free Monday", category: "eats", lat: 30.3832, lng: -86.3572, address: "10562 Emerald Coast Pkwy W, Miramar Beach", description: "Kids eat free on Monday nights (under 12, verify before you go). Scratch-made fried chicken, rotisserie, cheddar biscuits. Open Mon–Sat 11AM–9PM, Sun 10AM–9PM.", ageRange: "Under 12", free: false, hours: "Mondays — kids eat free", stroller: false, parking: true, bathrooms: true, shade: null, tags: ["kids eat free","Monday","Miramar Beach","chicken"], verified: false },
  { id: 37, name: "3 Sons Bar-B-Q — Kids Eat Free Monday", category: "eats", lat: 30.3188, lng: -86.2452, address: "6931 W County Hwy 30A, Santa Rosa Beach", description: "Kids eat free on Monday nights (under 12, verify before you go). Gulf Coast BBQ — brisket, ribs, pulled pork, smoked chicken. Kids menu available. Daily 11AM–9PM.", ageRange: "Under 12", free: false, hours: "Mondays — kids eat free", stroller: false, parking: true, bathrooms: true, shade: null, tags: ["kids eat free","Monday","30A","BBQ"], verified: false },

  // RESTAURANTS WITH KID-FRIENDLY VIBE
  { id: 38, name: "North Beach Social",               category: "eats",    lat: 30.3742, lng: -86.1358, address: "24200 US Hwy 331 S, Santa Rosa Beach", description: "Bayfront bar and restaurant with 700+ seats on white sand beach. Kids run and play in the sand while adults eat. Counter service so it's low stress. Live music almost every night. Dog friendly. Bonfire every night.", ageRange: "All ages", free: false, hours: "Daily 11AM–8PM, brunch Sat–Sun", stroller: true, parking: true, bathrooms: true, shade: false, tags: ["bay front","kids play in sand","live music","dog friendly"], verified: true },
  { id: 39, name: "Old Florida Fish House",           category: "eats",    lat: 30.3165, lng: -86.1082, address: "5235 E Hwy 30A, Seagrove Beach",      description: "Lakeside restaurant on Eastern Lake with kids running the green space while parents eat fresh seafood and sushi. Dueling pianos Thu–Sat 7:30–11PM. Saturday brunch 10AM–2PM plus live music 5–9PM. Valet parking peak times.", ageRange: "All ages", free: false, hours: "Lunch and dinner daily",   stroller: true,  parking: true,  bathrooms: true,  shade: true,  tags: ["lakeside","dueling pianos","live music","green space","sushi"], verified: true },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  return mobile;
}

function CategoryPin({ category, selected }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const size = selected ? 48 : 36;
  return (
    <div style={{
      width: size, height: size * 1.3,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      filter: selected ? "drop-shadow(0 6px 12px rgba(0,0,0,0.4))" : "drop-shadow(0 2px 6px rgba(0,0,0,0.25))",
      transition: "all 0.25s cubic-bezier(.34,1.56,.64,1)",
      cursor: "pointer",
    }}>
      <svg width={size} height={size * 1.3} viewBox="0 0 36 47" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 47 18 47C18 47 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill={cat?.color || "#888"} />
        <circle cx="18" cy="18" r="12" fill="white" fillOpacity="0.2" />
        <circle cx="18" cy="18" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
        <text x="18" y="23" textAnchor="middle" fontSize="12" fill="white">{cat?.icon}</text>
      </svg>
    </div>
  );
}

function SpotCard({ spot, onClose }) {
  const cat = CATEGORIES.find(c => c.id === spot.category);
  const chips = [
    spot.bathrooms && "🚿 Bathrooms",
    spot.parking   && "🅿️ Parking",
    spot.stroller  && "👶 Stroller OK",
    spot.shade     && "🌳 Shade",
  ].filter(Boolean);

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(spot.address)}`;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 2 }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: BRAND.bubblegum }} />
      </div>
      <div style={{
        background: `repeating-linear-gradient(90deg, ${BRAND.stripe} 0px, ${BRAND.stripe} 10px, ${BRAND.cream} 10px, ${BRAND.cream} 20px)`,
        height: 6, margin: "8px 0 0",
      }} />
      <div style={{ padding: "16px 20px 24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: cat?.color + "22",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>{cat?.icon}</div>
          <div style={{ flex: 1, paddingRight: 32 }}>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 17, fontWeight: 700, color: BRAND.driftwood, lineHeight: 1.2 }}>{spot.name}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: cat?.color, textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 3 }}>{cat?.badge}</div>
          </div>
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            background: BRAND.stripe, border: "none", borderRadius: "50%",
            width: 32, height: 32, fontSize: 16, color: BRAND.driftwood,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        <p style={{ fontSize: 13, color: "#5C4A35", lineHeight: 1.65, margin: "0 0 12px" }}>{spot.description}</p>

        {chips.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {chips.map(chip => (
              <span key={chip} style={{
                background: BRAND.kellyGreen + "15", border: `1px solid ${BRAND.kellyGreen}33`,
                borderRadius: 20, padding: "3px 9px", fontSize: 10, color: BRAND.kellyGreen, fontWeight: 600,
              }}>{chip}</span>
            ))}
            {spot.free && <span style={{ background: BRAND.watermelon + "15", border: `1px solid ${BRAND.watermelon}33`, borderRadius: 20, padding: "3px 9px", fontSize: 10, color: BRAND.watermelon, fontWeight: 700 }}>✓ Free</span>}
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
          {spot.tags.map(tag => (
            <span key={tag} style={{ background: BRAND.stripe, borderRadius: 20, padding: "3px 9px", fontSize: 10, color: BRAND.driftwood, fontWeight: 500 }}>{tag}</span>
          ))}
        </div>

        <div style={{ borderTop: `1px dashed ${BRAND.bubblegum}`, paddingTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, color: "#7A6248", marginBottom: 14 }}>
          <div><span style={{ fontWeight: 700 }}>Ages:</span> {spot.ageRange}</div>
          <div><span style={{ fontWeight: 700 }}>Cost:</span> {spot.free ? "Free" : "Paid"}</div>
          <div style={{ gridColumn: "1/-1" }}><span style={{ fontWeight: 700 }}>Hours:</span> {spot.hours}</div>
          <div style={{ gridColumn: "1/-1" }}>📍 {spot.address}</div>
        </div>

        <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          background: `linear-gradient(135deg, ${BRAND.watermelon}, #F4907A)`,
          color: "white", borderRadius: 12, padding: "11px",
          fontSize: 13, fontWeight: 700, textDecoration: "none",
          boxShadow: `0 4px 14px ${BRAND.watermelon}44`,
        }}>
          📍 Get Directions in Google Maps
        </a>

        {spot.verified && (
          <div style={{ marginTop: 10, fontSize: 10, color: BRAND.kellyGreen, fontWeight: 700, letterSpacing: "0.05em", textAlign: "center" }}>
            ✓ VERIFIED BY 30A MOM MAP
          </div>
        )}
      </div>
    </div>
  );
}

function SpotListItem({ spot, isSelected, onClick }) {
  const cat = CATEGORIES.find(c => c.id === spot.category);
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", padding: "13px 16px",
      border: "none", borderBottom: `1px solid ${BRAND.stripe}`,
      background: isSelected ? cat?.color + "12" : "white",
      cursor: "pointer", display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: cat?.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat?.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: BRAND.driftwood, lineHeight: 1.3 }}>{spot.name}</div>
        <div style={{ fontSize: 10, color: "#A08060", marginTop: 1 }}>{spot.address?.split(",")[0]}</div>
        <div style={{ display: "flex", gap: 4, marginTop: 5, flexWrap: "wrap" }}>
          {spot.free && <span style={{ background: BRAND.kellyGreen + "18", color: BRAND.kellyGreen, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>Free</span>}
          {spot.bathrooms && <span style={{ background: BRAND.vintageBlue + "18", color: BRAND.vintageBlue, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 10 }}>🚿</span>}
          {spot.stroller && <span style={{ background: BRAND.bubblegum + "55", color: BRAND.driftwood, fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 10 }}>👶</span>}
          {spot.verified && <span style={{ background: BRAND.kellyGreen + "18", color: BRAND.kellyGreen, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>✓</span>}
        </div>
      </div>
      <div style={{ fontSize: 20, color: BRAND.bubblegum, flexShrink: 0 }}>›</div>
    </button>
  );
}

function SubmitForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({ name: "", category: "park", address: "", description: "", ageRange: "", free: true, hours: "", bathrooms: false, parking: false, stroller: false, shade: false, submittedBy: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = { width: "100%", padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${BRAND.bubblegum}`, fontSize: 14, color: BRAND.driftwood, background: BRAND.sand, outline: "none", boxSizing: "border-box", fontFamily: "inherit", WebkitAppearance: "none" };
  const lbl = { fontSize: 10, fontWeight: 700, color: BRAND.driftwood, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 6 };
  return (
    <div style={{ padding: "0 0 40px" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
        <div style={{ width: 36, height: 4, borderRadius: 4, background: BRAND.bubblegum }} />
      </div>
      <div style={{ background: `repeating-linear-gradient(90deg, ${BRAND.stripe} 0px, ${BRAND.stripe} 10px, ${BRAND.cream} 10px, ${BRAND.cream} 20px)`, height: 6, margin: "8px 0 0" }} />
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, fontWeight: 700, color: BRAND.driftwood }}>Add a Spot</div>
            <div style={{ fontSize: 11, color: "#A08060" }}>Share somewhere your kids love</div>
          </div>
          <button onClick={onClose} style={{ background: BRAND.stripe, border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: 18, color: BRAND.driftwood, cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div><label style={lbl}>Spot Name *</label><input style={inp} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Seaside Splash Pad" /></div>
          <div><label style={lbl}>Category *</label><select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div><label style={lbl}>Address or Area</label><input style={inp} value={form.address} onChange={e => set("address", e.target.value)} placeholder="e.g. Seaside, FL" /></div>
          <div><label style={lbl}>Description *</label><textarea style={{ ...inp, minHeight: 80, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What's great about it? Any tips for moms?" /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div><label style={lbl}>Age Range</label><input style={inp} value={form.ageRange} onChange={e => set("ageRange", e.target.value)} placeholder="e.g. 2–8" /></div>
            <div><label style={lbl}>Hours</label><input style={inp} value={form.hours} onChange={e => set("hours", e.target.value)} placeholder="e.g. Dawn–dusk" /></div>
          </div>
          <div>
            <label style={lbl}>Practical Details</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[{ k: "free", l: "✓ Free" }, { k: "bathrooms", l: "🚿 Bathrooms" }, { k: "parking", l: "🅿️ Parking" }, { k: "stroller", l: "👶 Stroller OK" }, { k: "shade", l: "🌳 Shade" }].map(({ k, l }) => (
                <button key={k} onClick={() => set(k, !form[k])} style={{ padding: "8px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600, border: `1.5px solid ${form[k] ? BRAND.kellyGreen : BRAND.bubblegum}`, background: form[k] ? BRAND.kellyGreen + "18" : "transparent", color: form[k] ? BRAND.kellyGreen : BRAND.driftwood, cursor: "pointer" }}>{l}</button>
              ))}
            </div>
          </div>
          <div><label style={lbl}>Your Name (optional)</label><input style={inp} value={form.submittedBy} onChange={e => set("submittedBy", e.target.value)} placeholder="e.g. Sarah M." /></div>
          <button onClick={() => { if (!form.name || !form.description) return; onSubmit({ ...form, id: Date.now(), lat: 30.32 + Math.random() * 0.08, lng: -86.15 + Math.random() * 0.15, tags: [], verified: false }); }} style={{ background: `linear-gradient(135deg, ${BRAND.watermelon}, #F4907A)`, color: "white", border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 16px ${BRAND.watermelon}44`, fontFamily: "inherit" }}>
            Send it in ♥
          </button>
        </div>
      </div>
    </div>
  );
}

function BottomSheet({ children, isOpen, height = "55vh", onClose }) {
  const startY = useRef(null);
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, height, background: BRAND.cream, borderRadius: "20px 20px 0 0", boxShadow: "0 -8px 40px rgba(106,90,72,0.2)", zIndex: 300, display: "flex", flexDirection: "column", overflow: "hidden" }}
      onTouchStart={e => { startY.current = e.touches[0].clientY; }}
      onTouchEnd={e => { if (startY.current && e.changedTouches[0].clientY - startY.current > 60) onClose?.(); startY.current = null; }}
    >
      <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>{children}</div>
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [spots, setSpots] = useState(SPOTS);
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [activeCategories, setActiveCategories] = useState(CATEGORIES.map(c => c.id));
  const [sheet, setSheet] = useState(null);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [toast, setToast] = useState(null);
  const mapRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = spots.filter(s =>
    activeCategories.includes(s.category) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const handleMarkerClick = useCallback((spot) => {
    setSelectedSpot(spot);
    setSheet("spot");
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [spot.lng, spot.lat - (isMobile ? 0.03 : 0.01)], zoom: 13, duration: 800 });
    }
  }, [isMobile]);

  const handleSubmit = (s) => { setSpots(p => [...p, s]); setSheet(null); showToast("Your spot is in! We'll review it soon."); };

  const mapStyle = {
    position: "relative", width: "100%", height: "100%",
  };

  const MapContent = () => (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: -86.18, latitude: 30.33, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
    >
      <NavigationControl position="bottom-right" />
      {filtered.map(spot => (
        <Marker key={spot.id} longitude={spot.lng} latitude={spot.lat} anchor="bottom" onClick={e => { e.originalEvent.stopPropagation(); handleMarkerClick(spot); }}>
          <CategoryPin category={spot.category} selected={selectedSpot?.id === spot.id} />
        </Marker>
      ))}
    </Map>
  );

  if (isMobile) {
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", height: "100vh", overflow: "hidden", position: "relative" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { display: none; } @keyframes toastPop { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } button:focus { outline: none; } input:focus, textarea:focus, select:focus { border-color: ${BRAND.watermelon} !important; }`}</style>

        {/* Full screen map */}
        <div style={{ position: "absolute", inset: 0 }}><MapContent /></div>

        {/* Top bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "12px 12px 8px", background: "linear-gradient(to bottom, rgba(250,246,240,0.98) 70%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 36, height: 36, border: `2.5px solid ${BRAND.kellyGreen}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: BRAND.cream, padding: "2px 4px" }}>
                <div style={{ fontSize: 7, fontWeight: 800, color: BRAND.kellyGreen, letterSpacing: "0.1em" }}>30A</div>
                <div style={{ fontSize: 8 }}>🌊</div>
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 16, fontWeight: 700, color: BRAND.driftwood, lineHeight: 1 }}>30A Mom Map</div>
                <div style={{ fontSize: 8, color: BRAND.watermelon, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>LOCAL SPOTS · HAPPY KIDS</div>
              </div>
            </div>
            <button onClick={() => { setSheet("submit"); setSelectedSpot(null); }} style={{ background: `linear-gradient(135deg, ${BRAND.watermelon}, #F4907A)`, color: "white", border: "none", borderRadius: 20, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 10px ${BRAND.watermelon}44`, fontFamily: "inherit" }}>+ Add</button>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            <button onClick={() => setActiveCategories(CATEGORIES.map(c => c.id))} style={{ background: activeCategories.length === CATEGORIES.length ? BRAND.driftwood : BRAND.cream, color: activeCategories.length === CATEGORIES.length ? "white" : BRAND.driftwood, border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>All</button>
            {CATEGORIES.map(cat => { const active = activeCategories.includes(cat.id); return (<button key={cat.id} onClick={() => setActiveCategories(p => p.includes(cat.id) ? p.filter(c => c !== cat.id) : [...p, cat.id])} style={{ background: active ? cat.color : BRAND.cream, color: active ? "white" : BRAND.driftwood, border: "none", borderRadius: 20, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: 4 }}><span>{cat.icon}</span><span>{cat.label}</span></button>); })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ position: "absolute", top: 100, left: 12, background: BRAND.cream, borderRadius: 20, padding: "6px 12px", boxShadow: "0 4px 16px rgba(106,90,72,0.15)", fontSize: 11, color: BRAND.driftwood, fontWeight: 600, zIndex: 50 }}>
          <span style={{ color: BRAND.watermelon, fontWeight: 800 }}>{filtered.length}</span> spots
        </div>

        {/* Bottom buttons */}
        {sheet === null && (
          <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 100 }}>
            <button onClick={() => setSheet("list")} style={{ background: BRAND.cream, color: BRAND.driftwood, border: "none", borderRadius: 24, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 20px rgba(106,90,72,0.2)", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit" }}>
              📋 View List ({filtered.length})
            </button>
          </div>
        )}

        {/* Spot sheet */}
        <BottomSheet isOpen={sheet === "spot"} height="65vh" onClose={() => { setSheet(null); setSelectedSpot(null); }}>
          {selectedSpot && <div style={{ position: "relative" }}><SpotCard spot={selectedSpot} onClose={() => { setSheet(null); setSelectedSpot(null); }} /></div>}
        </BottomSheet>

        {/* List sheet */}
        <BottomSheet isOpen={sheet === "list"} height="75vh" onClose={() => setSheet(null)}>
          <div style={{ padding: "0 16px 12px" }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 8 }}><div style={{ width: 36, height: 4, borderRadius: 4, background: BRAND.bubblegum }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: BRAND.driftwood }}>{filtered.length} Spots</div>
              <button onClick={() => setSheet(null)} style={{ background: BRAND.stripe, border: "none", borderRadius: "50%", width: 32, height: 32, fontSize: 16, color: BRAND.driftwood, cursor: "pointer" }}>×</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spots..." style={{ width: "100%", padding: "11px 16px", borderRadius: 20, border: `1.5px solid ${BRAND.bubblegum}`, fontSize: 14, background: BRAND.sand, color: BRAND.driftwood, outline: "none", fontFamily: "inherit", WebkitAppearance: "none" }} />
          </div>
          <div>{filtered.map(spot => <SpotListItem key={spot.id} spot={spot} isSelected={selectedSpot?.id === spot.id} onClick={() => { setSelectedSpot(spot); setSheet("spot"); }} />)}</div>
        </BottomSheet>

        {/* Submit sheet */}
        <BottomSheet isOpen={sheet === "submit"} height="92vh" onClose={() => setSheet(null)}>
          <SubmitForm onSubmit={handleSubmit} onClose={() => setSheet(null)} />
        </BottomSheet>

        {toast && <div style={{ position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)", background: BRAND.driftwood, color: BRAND.cream, borderRadius: 14, padding: "12px 20px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 999, animation: "toastPop 0.3s ease", whiteSpace: "nowrap", fontFamily: "inherit" }}>♥ {toast}</div>}
      </div>
    );
  }

  // DESKTOP
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: BRAND.sand, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${BRAND.bubblegum}; border-radius: 4px; } @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } @keyframes toastPop { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } button:focus { outline: none; } input:focus, textarea:focus, select:focus { border-color: ${BRAND.watermelon} !important; }`}</style>

      {/* Header */}
      <header style={{ background: BRAND.cream, borderBottom: `2px solid ${BRAND.bubblegum}44`, padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(106,90,72,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, border: `2.5px solid ${BRAND.kellyGreen}`, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: BRAND.cream, padding: "3px 5px" }}>
            <div style={{ fontSize: 7, fontWeight: 800, color: BRAND.kellyGreen, letterSpacing: "0.12em" }}>30A</div>
            <div style={{ fontSize: 5, fontWeight: 700, color: BRAND.watermelon, letterSpacing: "0.08em", textTransform: "uppercase" }}>FLORIDA</div>
            <div style={{ fontSize: 9 }}>🌊</div>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18, fontWeight: 700, color: BRAND.driftwood, lineHeight: 1 }}>30A Mom Map</div>
            <div style={{ fontSize: 9, color: BRAND.watermelon, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>LOCAL SPOTS · PRACTICAL DETAILS · HAPPY KIDS</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: BRAND.driftwood, fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>from one local mom to you ♥</div>
          <button onClick={() => { setSheet(s => s === "submit" ? null : "submit"); setSelectedSpot(null); }} style={{ background: `linear-gradient(135deg, ${BRAND.watermelon}, #F4907A)`, color: "white", border: "none", borderRadius: 20, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", boxShadow: `0 3px 10px ${BRAND.watermelon}44`, fontFamily: "inherit" }}>+ Add a Spot</button>
          <button onClick={() => setShowSidebar(s => !s)} style={{ background: BRAND.stripe, border: "none", borderRadius: 10, padding: "7px 12px", fontSize: 11, cursor: "pointer", color: BRAND.driftwood, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>{showSidebar ? "Hide List" : "Show List"}</button>
        </div>
      </header>

      {/* Category filter */}
      <div style={{ background: BRAND.cream, borderBottom: `1px solid ${BRAND.bubblegum}55`, padding: "8px 12px", display: "flex", gap: 4, overflowX: "auto", flexShrink: 0 }}>
        <button onClick={() => setActiveCategories(CATEGORIES.map(c => c.id))} style={{ background: activeCategories.length === CATEGORIES.length ? BRAND.driftwood : BRAND.stripe, color: activeCategories.length === CATEGORIES.length ? "white" : BRAND.driftwood, border: "none", borderRadius: 20, padding: "5px 14px", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>All</button>
        {CATEGORIES.map(cat => { const active = activeCategories.includes(cat.id); return (<button key={cat.id} onClick={() => setActiveCategories(p => p.includes(cat.id) ? p.filter(c => c !== cat.id) : [...p, cat.id])} style={{ background: active ? cat.color + "22" : "transparent", color: active ? cat.color : BRAND.driftwood, border: `1.5px solid ${active ? cat.color + "55" : "transparent"}`, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4 }}><span>{cat.icon}</span><span>{cat.label}</span></button>); })}
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Map */}
        <div style={{ flex: 1, position: "relative" }}>
          <MapContent />

          {/* Stats */}
          <div style={{ position: "absolute", top: 12, left: 12, background: BRAND.cream, borderRadius: 20, padding: "7px 14px", boxShadow: "0 4px 16px rgba(106,90,72,0.15)", fontSize: 11, color: BRAND.driftwood, fontWeight: 600, display: "flex", gap: 8, border: `1px solid ${BRAND.bubblegum}44`, zIndex: 10 }}>
            <span style={{ color: BRAND.watermelon, fontWeight: 800 }}>{filtered.length}</span> shown <span style={{ color: BRAND.bubblegum }}>·</span> <span style={{ color: BRAND.kellyGreen, fontWeight: 800 }}>{spots.length}</span> total
          </div>

          {/* Desktop spot card */}
          {sheet === "spot" && selectedSpot && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: "min(420px, calc(100% - 28px))", zIndex: 50, background: BRAND.cream, borderRadius: 20, boxShadow: "0 24px 64px rgba(106,90,72,0.2)", overflow: "hidden", animation: "slideUp 0.3s cubic-bezier(.34,1.56,.64,1)", position: "relative" }}>
              <SpotCard spot={selectedSpot} onClose={() => { setSheet(null); setSelectedSpot(null); }} />
              <div style={{ background: `repeating-linear-gradient(90deg, ${BRAND.stripe} 0px, ${BRAND.stripe} 10px, ${BRAND.cream} 10px, ${BRAND.cream} 20px)`, height: 6 }} />
            </div>
          )}

          {/* Desktop submit */}
          {sheet === "submit" && (
            <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", width: "min(420px, calc(100% - 28px))", zIndex: 50, background: BRAND.cream, borderRadius: 20, boxShadow: "0 24px 64px rgba(106,90,72,0.2)", overflow: "hidden", animation: "slideUp 0.3s cubic-bezier(.34,1.56,.64,1)", maxHeight: "80vh", overflowY: "auto" }}>
              <SubmitForm onSubmit={handleSubmit} onClose={() => setSheet(null)} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div style={{ width: 290, background: BRAND.cream, borderLeft: `2px solid ${BRAND.bubblegum}44`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "12px 12px 8px", borderBottom: `1px solid ${BRAND.bubblegum}44` }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spots..." style={{ width: "100%", padding: "9px 14px", borderRadius: 20, border: `1.5px solid ${BRAND.bubblegum}`, fontSize: 12, background: BRAND.sand, color: BRAND.driftwood, outline: "none", fontFamily: "inherit" }} />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map(spot => <SpotListItem key={spot.id} spot={spot} isSelected={selectedSpot?.id === spot.id} onClick={() => { setSelectedSpot(spot); setSheet("spot"); if (mapRef.current) mapRef.current.flyTo({ center: [spot.lng, spot.lat], zoom: 13, duration: 800 }); }} />)}
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: BRAND.driftwood }}><div style={{ fontSize: 28, marginBottom: 8 }}>🌊</div><div style={{ fontSize: 13, fontWeight: 700 }}>No spots found</div></div>}
            </div>
            <div style={{ padding: "10px 14px", borderTop: `1px solid ${BRAND.bubblegum}44`, background: `repeating-linear-gradient(90deg, ${BRAND.stripe} 0px, ${BRAND.stripe} 10px, ${BRAND.cream} 10px, ${BRAND.cream} 20px)`, textAlign: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: BRAND.driftwood, letterSpacing: "0.1em", textTransform: "uppercase" }}>30A MOM MAP · FREE FOREVER</div>
            </div>
          </div>
        )}
      </div>

      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: BRAND.driftwood, color: BRAND.cream, borderRadius: 14, padding: "12px 18px", fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", zIndex: 999, animation: "toastPop 0.3s ease", fontFamily: "inherit" }}>♥ {toast}</div>}
    </div>
  );
}
