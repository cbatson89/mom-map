import { useState, useCallback, useRef } from "react";
import { CATEGORIES } from "./data/categories";
import { useIsMobile } from "./hooks/useIsMobile";
import { useSpots } from "./hooks/useSpots";
import MapView from "./components/Map/MapView";
import SpotCard from "./components/SpotCard/SpotCard";
import SpotListItem from "./components/Sidebar/SpotListItem";
import SubmitForm from "./components/SubmitForm/SubmitForm";
import BottomSheet from "./components/BottomSheet";

export default function App() {
  const isMobile = useIsMobile();
  const { spots } = useSpots();
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [activeCategories, setActiveCategories] = useState(CATEGORIES.map(c => c.id));
  const [sheet, setSheet] = useState(null);
  const [search, setSearch] = useState("");
  const [showSidebar, setShowSidebar] = useState(true);
  const [toast, setToast] = useState(null);
  const mapViewRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const allActive = activeCategories.length === CATEGORIES.length;

  const filtered = spots.filter(s =>
    activeCategories.includes(s.category) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const handleMarkerClick = useCallback((spot) => {
    setSelectedSpot(spot);
    setSheet("spot");
  }, []);

  // A submitted spot is saved as pending (hidden until approved), so we don't add
  // it to the visible list — just confirm and close.
  const handleSubmit = () => { setSheet(null); showToast("Your spot is in! We'll review it soon."); };

  if (isMobile) {
    return (
      <div className="font-body h-screen overflow-hidden relative">
        {/* Full screen map */}
        <div className="absolute inset-0">
          <MapView ref={mapViewRef} spots={filtered} selectedSpotId={selectedSpot?.id} isMobile={isMobile} onSelectSpot={handleMarkerClick} />
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 z-[100] pt-3 px-3 pb-2 bg-topbar-fade">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 border-[2.5px] border-kellyGreen rounded-[8px] flex flex-col items-center justify-center bg-cream px-1 py-0.5">
                <div className="text-[7px] font-extrabold text-kellyGreen tracking-[0.1em]">30A</div>
                <div className="text-[8px]">🌊</div>
              </div>
              <div>
                <div className="font-display text-[16px] font-bold text-driftwood leading-none">30A Mom Map</div>
                <div className="text-[8px] text-watermelon font-bold tracking-[0.08em] uppercase">LOCAL SPOTS · HAPPY KIDS</div>
              </div>
            </div>
            <button onClick={() => { setSheet("submit"); setSelectedSpot(null); }} className="bg-watermelon-gradient text-white rounded-pill px-3.5 py-2 text-[13px] font-bold cursor-pointer shadow-watermelon-sm">+ Add</button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button onClick={() => setActiveCategories(CATEGORIES.map(c => c.id))} className={`rounded-pill px-3 py-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-chip ${allActive ? "bg-driftwood text-white" : "bg-cream text-driftwood"}`}>All</button>
            {CATEGORIES.map(cat => { const active = activeCategories.includes(cat.id); return (<button key={cat.id} onClick={() => setActiveCategories(p => p.includes(cat.id) ? p.filter(c => c !== cat.id) : [...p, cat.id])} className={`rounded-pill px-3 py-1.5 text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 shadow-chip flex items-center gap-1 ${active ? "text-white" : "bg-cream text-driftwood"}`} style={active ? { background: cat.color } : undefined}><span>{cat.icon}</span><span>{cat.label}</span></button>); })}
          </div>
        </div>

        {/* Stats */}
        <div className="absolute top-[100px] left-3 bg-cream rounded-pill px-3 py-1.5 shadow-pill text-[11px] text-driftwood font-semibold z-[50]">
          <span className="text-watermelon font-extrabold">{filtered.length}</span> spots
        </div>

        {/* Bottom buttons */}
        {sheet === null && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center z-[100]">
            <button onClick={() => setSheet("list")} className="bg-cream text-driftwood rounded-[24px] px-[22px] py-3 text-[14px] font-bold cursor-pointer shadow-fab flex items-center gap-[7px]">
              📋 View List ({filtered.length})
            </button>
          </div>
        )}

        {/* Spot sheet */}
        <BottomSheet isOpen={sheet === "spot"} height="65vh" onClose={() => { setSheet(null); setSelectedSpot(null); }}>
          {selectedSpot && <div className="relative"><SpotCard spot={selectedSpot} onClose={() => { setSheet(null); setSelectedSpot(null); }} /></div>}
        </BottomSheet>

        {/* List sheet */}
        <BottomSheet isOpen={sheet === "list"} height="75vh" onClose={() => setSheet(null)}>
          <div className="px-4 pb-3">
            <div className="flex justify-center pt-[10px] pb-2"><div className="w-9 h-1 rounded-[4px] bg-bubblegum" /></div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-display text-[18px] font-bold text-driftwood">{filtered.length} Spots</div>
              <button onClick={() => setSheet(null)} className="bg-stripe rounded-full w-8 h-8 text-[16px] text-driftwood cursor-pointer">×</button>
            </div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spots..." className="w-full px-4 py-[11px] rounded-pill border-[1.5px] border-bubblegum text-[14px] bg-sand text-driftwood outline-none appearance-none" />
          </div>
          <div>{filtered.map(spot => <SpotListItem key={spot.id} spot={spot} isSelected={selectedSpot?.id === spot.id} onClick={() => { setSelectedSpot(spot); setSheet("spot"); }} />)}</div>
        </BottomSheet>

        {/* Submit sheet */}
        <BottomSheet isOpen={sheet === "submit"} height="92vh" onClose={() => setSheet(null)}>
          <SubmitForm onSubmit={handleSubmit} onClose={() => setSheet(null)} />
        </BottomSheet>

        {toast && <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 bg-driftwood text-cream rounded-cta px-5 py-3 text-[13px] font-semibold shadow-toast z-[999] animate-toastPop whitespace-nowrap">♥ {toast}</div>}
      </div>
    );
  }

  // DESKTOP
  return (
    <div className="font-body bg-sand h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-cream border-b-2 border-b-bubblegum/[0.267] px-5 h-[58px] flex items-center justify-between shrink-0 z-[100] shadow-header">
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] border-[2.5px] border-kellyGreen rounded-[8px] flex flex-col items-center justify-center bg-cream px-[5px] py-[3px]">
            <div className="text-[7px] font-extrabold text-kellyGreen tracking-[0.12em]">30A</div>
            <div className="text-[5px] font-bold text-watermelon tracking-[0.08em] uppercase">FLORIDA</div>
            <div className="text-[9px]">🌊</div>
          </div>
          <div>
            <div className="font-display text-[18px] font-bold text-driftwood leading-none">30A Mom Map</div>
            <div className="text-[9px] text-watermelon font-bold tracking-[0.1em] uppercase">LOCAL SPOTS · PRACTICAL DETAILS · HAPPY KIDS</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-[11px] text-driftwood italic font-display">from one local mom to you ♥</div>
          <button onClick={() => { setSheet(s => s === "submit" ? null : "submit"); setSelectedSpot(null); }} className="bg-watermelon-gradient text-white rounded-pill px-4 py-[7px] text-[12px] font-bold cursor-pointer shadow-watermelon-sm">+ Add a Spot</button>
          <button onClick={() => setShowSidebar(s => !s)} className="bg-stripe rounded-chip px-3 py-[7px] text-[11px] cursor-pointer text-driftwood font-bold tracking-[0.04em] uppercase">{showSidebar ? "Hide List" : "Show List"}</button>
        </div>
      </header>

      {/* Category filter */}
      <div className="bg-cream border-b border-b-bubblegum/[0.333] px-3 py-2 flex gap-1 overflow-x-auto shrink-0">
        <button onClick={() => setActiveCategories(CATEGORIES.map(c => c.id))} className={`rounded-pill px-3.5 py-[5px] text-[10px] font-bold cursor-pointer whitespace-nowrap tracking-[0.06em] uppercase shrink-0 ${allActive ? "bg-driftwood text-white" : "bg-stripe text-driftwood"}`}>All</button>
        {CATEGORIES.map(cat => { const active = activeCategories.includes(cat.id); return (<button key={cat.id} onClick={() => setActiveCategories(p => p.includes(cat.id) ? p.filter(c => c !== cat.id) : [...p, cat.id])} className={`rounded-pill px-3 py-[5px] text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-all duration-150 ease-[ease] flex items-center gap-1 border-[1.5px] ${active ? "" : "border-transparent text-driftwood"}`} style={active ? { background: cat.color + "22", borderColor: cat.color + "55", color: cat.color } : { background: "transparent" }}><span>{cat.icon}</span><span>{cat.label}</span></button>); })}
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className="flex-1 relative">
          <MapView ref={mapViewRef} spots={filtered} selectedSpotId={selectedSpot?.id} isMobile={isMobile} onSelectSpot={handleMarkerClick} />

          {/* Stats */}
          <div className="absolute top-3 left-3 bg-cream rounded-pill px-3.5 py-[7px] shadow-pill text-[11px] text-driftwood font-semibold flex gap-2 border border-bubblegum/[0.267] z-10">
            <span className="text-watermelon font-extrabold">{filtered.length}</span> shown <span className="text-bubblegum">·</span> <span className="text-kellyGreen font-extrabold">{spots.length}</span> total
          </div>

          {/* Desktop spot card */}
          {sheet === "spot" && selectedSpot && (
            <div className="relative bottom-4 left-1/2 -translate-x-1/2 w-[min(420px,calc(100%-28px))] z-[50] bg-cream rounded-card shadow-card overflow-hidden animate-slideUp">
              <SpotCard spot={selectedSpot} onClose={() => { setSheet(null); setSelectedSpot(null); }} />
              <div className="bg-stripes h-1.5" />
            </div>
          )}

          {/* Desktop submit */}
          {sheet === "submit" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[min(420px,calc(100%-28px))] z-[50] bg-cream rounded-card shadow-card overflow-x-hidden overflow-y-auto animate-slideUp max-h-[80vh]">
              <SubmitForm onSubmit={handleSubmit} onClose={() => setSheet(null)} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-[290px] bg-cream border-l-2 border-l-bubblegum/[0.267] flex flex-col shrink-0">
            <div className="pt-3 px-3 pb-2 border-b border-b-bubblegum/[0.267]">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spots..." className="w-full px-3.5 py-[9px] rounded-pill border-[1.5px] border-bubblegum text-[12px] bg-sand text-driftwood outline-none" />
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(spot => <SpotListItem key={spot.id} spot={spot} isSelected={selectedSpot?.id === spot.id} onClick={() => { setSelectedSpot(spot); setSheet("spot"); mapViewRef.current?.flyToSpot(spot); }} />)}
              {filtered.length === 0 && <div className="text-center px-5 py-10 text-driftwood"><div className="text-[28px] mb-2">🌊</div><div className="text-[13px] font-bold">No spots found</div></div>}
            </div>
            <div className="px-3.5 py-2.5 border-t border-t-bubblegum/[0.267] bg-stripes text-center">
              <div className="text-[9px] font-bold text-driftwood tracking-[0.1em] uppercase">30A MOM MAP · FREE FOREVER</div>
            </div>
          </div>
        )}
      </div>

      {toast && <div className="fixed bottom-6 right-6 bg-driftwood text-cream rounded-cta px-[18px] py-3 text-[13px] font-semibold shadow-toast z-[999] animate-toastPop">♥ {toast}</div>}
    </div>
  );
}
