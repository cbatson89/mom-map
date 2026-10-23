import { useEffect, useState } from "react";
import { CATEGORIES } from "../../data/categories";
import { BRAND } from "../../data/brand";

const TOWN_ALIASES = { PCB: "Panama City Beach" };

// "810 J D Miller Rd, Santa Rosa Beach" -> { street: "810 J D Miller Rd", town: "Santa Rosa Beach" }.
// Trailing state/zip segments ("FL 32459") are dropped. When there's only one
// segment left (e.g. "Seaside, FL 32459") it's the town and the full address is
// shown as the street line. Bare "lat, lng" addresses (GPS submissions with no
// nearby address) have no town.
function splitAddress(address = "") {
  if (/^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(address)) return { street: address, town: null };
  const parts = address.split(",").map(p => p.trim()).filter(Boolean);
  while (parts.length && /^(FL|Florida)?\s*\d{5}$|^(FL|Florida)$/i.test(parts[parts.length - 1])) parts.pop();
  if (!parts.length) return { street: address, town: null };
  const town = parts[parts.length - 1];
  return {
    street: parts.length > 1 ? parts.slice(0, -1).join(", ") : address,
    town: TOWN_ALIASES[town] ?? town,
  };
}

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const CopyIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

// Quick-preview card shown in the map's hover popover. Library-agnostic: MapView
// wraps it in the Mapbox <Popup>.
export default function SpotPreviewCard({ spot }) {
  const cat = CATEGORIES.find(c => c.id === spot.category);
  const { street, town } = splitAddress(spot.address);
  const [copyState, setCopyState] = useState(null); // null | "copied" | "failed"

  const chips = [
    spot.free      && "Free",
    spot.bathrooms && "Restrooms",
    spot.stroller  && "Stroller friendly",
    spot.parking   && "Parking",
    spot.shade     && "Shade",
  ].filter(Boolean);

  useEffect(() => {
    if (!copyState) return;
    const t = setTimeout(() => setCopyState(null), 2000);
    return () => clearTimeout(t);
  }, [copyState]);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(spot.address);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  return (
    <div className="w-[320px] font-body bg-cream">
      <div className="flex h-1.5">
        <div className="flex-1 bg-watermelon" />
        <div className="flex-1 bg-butter" />
        <div className="flex-1 bg-kellyGreen" />
      </div>

      <div className="px-5 pt-4 pb-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] shrink-0"
            style={{ background: cat?.color + "33" }}
          >{cat?.icon}</div>
          {/* Several category colors (sea glass, bubblegum, butter) are too pale for
              text, so the label uses a deeper mix of the color with driftwood. */}
          <div
            className="text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: `color-mix(in srgb, ${cat?.color} 55%, ${BRAND.driftwood})` }}
          >{cat?.badge}</div>
        </div>

        {town && <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-watermelon mb-1">{town}</div>}
        <div className="font-display text-[24px] font-medium text-driftwood leading-[1.15] mb-2">{spot.name}</div>
        <p className="text-[13px] text-taupe leading-[1.6] line-clamp-3">{spot.description}</p>

        <div className="border-t border-stripe mt-3.5 pt-3 flex flex-col gap-2 text-[13px] text-cocoa">
          <div className="flex items-start gap-2.5">
            <span className="text-driftwood mt-px shrink-0"><PinIcon /></span>
            <span>{street}</span>
          </div>
          {spot.hours && (
            <div className="flex items-start gap-2.5">
              <span className="text-driftwood mt-px shrink-0"><ClockIcon /></span>
              <span>{spot.hours}</span>
            </div>
          )}
        </div>

        {chips.length > 0 && (
          <div className="border-t border-stripe mt-3 pt-3 flex flex-wrap gap-1.5">
            {chips.map(chip => (
              <span key={chip} className="bg-kellyGreen/[0.16] border border-kellyGreen/[0.28] rounded-pill px-3 py-1 text-[11px] font-semibold text-kellyGreen">{chip}</span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-sand px-4 py-3">
        <button
          type="button"
          onClick={copyAddress}
          className="w-full flex items-center justify-center gap-2 bg-watermelon text-white rounded-pill py-2.5 text-[14px] font-bold cursor-pointer shadow-watermelon-md"
        >
          {copyState === "copied" ? "Copied!" : copyState === "failed" ? "Couldn't copy" : <>Copy address <CopyIcon /></>}
        </button>
      </div>
    </div>
  );
}
