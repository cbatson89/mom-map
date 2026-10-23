import { useState } from "react";
import { CATEGORIES } from "../../data/categories";
import { submitSpot } from "../../lib/spots.api";

const inputCls = "w-full px-3.5 py-[11px] rounded-field border-[1.5px] border-bubblegum text-[14px] text-driftwood bg-sand outline-none box-border appearance-none";
const labelCls = "block text-[10px] font-bold text-driftwood uppercase tracking-[0.08em] mb-1.5";

export default function SubmitForm({ onSubmit, onClose }) {
  const [form, setForm] = useState({ name: "", category: "park", locationMode: "address", address: "", coordinates: "", description: "", ageRange: "", free: true, hours: "", bathrooms: false, parking: false, stroller: false, shade: false, submittedBy: "" });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSend = async () => {
    setError(null);
    const usingCoords = form.locationMode === "coords";
    const location = usingCoords ? form.coordinates : form.address;
    if (!form.name.trim() || !form.description.trim() || !location.trim()) {
      setError(`Please fill in the required fields: name, ${usingCoords ? "GPS coordinates" : "address"}, and description.`);
      return;
    }
    setSubmitting(true);
    try {
      await submitSpot(form);
      onSubmit(); // parent shows the success toast and closes the sheet
    } catch (e) {
      if (e.code === "GEOCODE_FAILED") {
        setError("We couldn't find that address — try adding more detail, or switch to GPS");
      } else if (e.code === "BAD_COORDINATES") {
        setError("Enter coordinates as latitude, longitude — e.g. 30.3243, -86.1514");
      } else if (e.code === "OUT_OF_AREA") {
        setError("Those coordinates aren't on 30A — double-check the numbers");
      } else {
        setError("Something went wrong sending your spot. Please try again.");
      }
      setSubmitting(false);
    }
  };
  return (
    <div className="pb-10">
      <div className="flex justify-center pt-[10px] pb-1">
        <div className="w-9 h-1 rounded-[4px] bg-bubblegum" />
      </div>
      <div className="bg-stripes h-1.5 mt-2" />
      <div className="pt-4 px-5">
        <div className="flex justify-between items-center mb-[18px]">
          <div>
            <div className="font-display text-[20px] font-bold text-driftwood">Add a Spot</div>
            <div className="text-[11px] text-sandstone">Share somewhere your kids love</div>
          </div>
          <button onClick={onClose} className="bg-stripe rounded-full w-9 h-9 text-[18px] text-driftwood cursor-pointer">×</button>
        </div>
        <div className="flex flex-col gap-3.5">
          <div><label className={labelCls}>Spot Name *</label><input className={inputCls} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Seaside Splash Pad" /></div>
          <div><label className={labelCls}>Category *</label><select className={inputCls} value={form.category} onChange={e => set("category", e.target.value)}>{CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}</select></div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls.replace("mb-1.5", "")}>{form.locationMode === "coords" ? "GPS Coordinates *" : "Address *"}</label>
              {/* No street address (e.g. a beach access)? Switch to pasting coordinates. */}
              <div className="flex gap-1">
                {[{ k: "address", l: "Address" }, { k: "coords", l: "GPS" }].map(({ k, l }) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => set("locationMode", k)}
                    className={`px-2.5 py-[3px] rounded-pill text-[11px] font-semibold border-[1.5px] cursor-pointer ${form.locationMode === k ? "border-kellyGreen bg-kellyGreen/[0.094] text-kellyGreen" : "border-bubblegum bg-transparent text-driftwood"}`}
                  >{l}</button>
                ))}
              </div>
            </div>
            {form.locationMode === "coords" ? (
              <>
                <input className={inputCls} value={form.coordinates} onChange={e => set("coordinates", e.target.value)} placeholder="e.g. 30.3243, -86.1514" inputMode="decimal" />
                <div className="text-[11px] text-sandstone mt-1">In Google Maps, press and hold the spot, then copy the numbers that appear.</div>
              </>
            ) : (
              <input className={inputCls} value={form.address} onChange={e => set("address", e.target.value)} placeholder="e.g. 810 J D Miller Rd, Santa Rosa Beach" />
            )}
          </div>
          <div><label className={labelCls}>Description *</label><textarea className={`${inputCls} min-h-[80px] resize-y`} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What's great about it? Any tips for moms?" /></div>
          <div className="grid grid-cols-2 gap-2.5">
            <div><label className={labelCls}>Age Range</label><input className={inputCls} value={form.ageRange} onChange={e => set("ageRange", e.target.value)} placeholder="e.g. 2–8" /></div>
            <div><label className={labelCls}>Hours</label><input className={inputCls} value={form.hours} onChange={e => set("hours", e.target.value)} placeholder="e.g. Dawn–dusk" /></div>
          </div>
          <div>
            <label className={labelCls}>Practical Details</label>
            <div className="flex flex-wrap gap-2">
              {[{ k: "free", l: "✓ Free" }, { k: "bathrooms", l: "🚿 Bathrooms" }, { k: "parking", l: "🅿️ Parking" }, { k: "stroller", l: "👶 Stroller OK" }, { k: "shade", l: "🌳 Shade" }].map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => set(k, !form[k])}
                  className={`px-3.5 py-2 rounded-pill text-[13px] font-semibold border-[1.5px] cursor-pointer ${form[k] ? "border-kellyGreen bg-kellyGreen/[0.094] text-kellyGreen" : "border-bubblegum bg-transparent text-driftwood"}`}
                >{l}</button>
              ))}
            </div>
          </div>
          <div><label className={labelCls}>Your Name (optional)</label><input className={inputCls} value={form.submittedBy} onChange={e => set("submittedBy", e.target.value)} placeholder="e.g. Sarah M." /></div>
          {error && <div className="text-[12px] font-semibold text-watermelon">{error}</div>}
          <button
            onClick={handleSend}
            disabled={submitting}
            className="bg-watermelon-gradient text-white rounded-cta p-4 text-[16px] font-bold cursor-pointer shadow-watermelon-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Sending…" : "Send it in ♥"}
          </button>
        </div>
      </div>
    </div>
  );
}
