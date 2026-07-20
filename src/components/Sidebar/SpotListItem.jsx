import { CATEGORIES } from "../../data/categories";

export default function SpotListItem({ spot, isSelected, onClick }) {
  const cat = CATEGORIES.find(c => c.id === spot.category);
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-[13px] border-b border-b-stripe cursor-pointer flex gap-3 items-start"
      style={{ background: isSelected ? cat?.color + "12" : "white" }}
    >
      <div
        className="w-[38px] h-[38px] rounded-chip shrink-0 flex items-center justify-center text-[18px]"
        style={{ background: cat?.color + "22" }}
      >{cat?.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-[13px] text-driftwood leading-[1.3]">{spot.name}</div>
        <div className="text-[10px] text-sandstone mt-px">{spot.address?.split(",")[0]}</div>
        <div className="flex gap-1 mt-[5px] flex-wrap">
          {spot.free && <span className="bg-kellyGreen/[0.094] text-kellyGreen text-[9px] font-bold px-1.5 py-0.5 rounded-chip">Free</span>}
          {spot.bathrooms && <span className="bg-vintageBlue/[0.094] text-vintageBlue text-[9px] font-semibold px-1.5 py-0.5 rounded-chip">🚿</span>}
          {spot.stroller && <span className="bg-bubblegum/[0.333] text-driftwood text-[9px] font-semibold px-1.5 py-0.5 rounded-chip">👶</span>}
          {spot.verified && <span className="bg-kellyGreen/[0.094] text-kellyGreen text-[9px] font-bold px-1.5 py-0.5 rounded-chip">✓</span>}
        </div>
      </div>
      <div className="text-[20px] text-bubblegum shrink-0">›</div>
    </button>
  );
}
