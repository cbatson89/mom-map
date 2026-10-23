import { CATEGORIES } from "../../data/categories";

export default function SpotCard({ spot, onClose }) {
  const cat = CATEGORIES.find(c => c.id === spot.category);
  const chips = [
    spot.bathrooms && "🚿 Bathrooms",
    spot.parking   && "🅿️ Parking",
    spot.stroller  && "👶 Stroller OK",
    spot.shade     && "🌳 Shade",
  ].filter(Boolean);

  // Route to the pin itself, not the address text — GPS-submitted spots (e.g. a
  // beach access) only have an approximate "Near …" address.
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

  return (
    <div className="font-body">
      <div className="flex justify-center pt-[10px] pb-[2px]">
        <div className="w-9 h-1 rounded-[4px] bg-bubblegum" />
      </div>
      <div className="bg-stripes h-1.5 mt-2" />
      <div className="pt-4 px-5 pb-6">
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-cta shrink-0 flex items-center justify-center text-[24px]"
            style={{ background: cat?.color + "22" }}
          >{cat?.icon}</div>
          <div className="flex-1 pr-8">
            <div className="font-display text-[17px] font-bold text-driftwood leading-[1.2]">{spot.name}</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.1em] mt-[3px]" style={{ color: cat?.color }}>{cat?.badge}</div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-stripe rounded-full w-8 h-8 text-[16px] text-driftwood cursor-pointer flex items-center justify-center"
          >×</button>
        </div>

        <p className="text-[13px] text-cocoa leading-[1.65] mb-3">{spot.description}</p>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-[5px] mb-2.5">
            {chips.map(chip => (
              <span key={chip} className="bg-kellyGreen/[0.082] border border-kellyGreen/[0.2] rounded-pill px-[9px] py-[3px] text-[10px] text-kellyGreen font-semibold">{chip}</span>
            ))}
            {spot.free && <span className="bg-watermelon/[0.082] border border-watermelon/[0.2] rounded-pill px-[9px] py-[3px] text-[10px] text-watermelon font-bold">✓ Free</span>}
          </div>
        )}

        <div className="flex flex-wrap gap-1 mb-3">
          {spot.tags.map(tag => (
            <span key={tag} className="bg-stripe rounded-pill px-[9px] py-[3px] text-[10px] text-driftwood font-medium">{tag}</span>
          ))}
        </div>

        <div className="border-t border-dashed border-bubblegum pt-2.5 grid grid-cols-2 gap-1 text-[11px] text-taupe mb-3.5">
          <div><span className="font-bold">Ages:</span> {spot.ageRange}</div>
          <div><span className="font-bold">Cost:</span> {spot.free ? "Free" : "Paid"}</div>
          <div className="col-span-2"><span className="font-bold">Hours:</span> {spot.hours}</div>
          <div className="col-span-2">📍 {spot.address}</div>
        </div>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 bg-watermelon-gradient text-white rounded-field p-[11px] text-[13px] font-bold no-underline shadow-watermelon-md"
        >
          📍 Get Directions in Google Maps
        </a>

        {spot.verified && (
          <div className="mt-2.5 text-[10px] text-kellyGreen font-bold tracking-[0.05em] text-center">
            ✓ VERIFIED BY 30A MOM MAP
          </div>
        )}
      </div>
    </div>
  );
}
