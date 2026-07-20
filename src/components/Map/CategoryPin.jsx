import { CATEGORIES } from "../../data/categories";

export default function CategoryPin({ category, selected }) {
  const cat = CATEGORIES.find(c => c.id === category);
  const size = selected ? 48 : 36;
  return (
    <div
      className={`flex items-start justify-center cursor-pointer transition-all duration-[250ms] ease-spring ${selected ? "drop-shadow-pin-selected" : "drop-shadow-pin"}`}
      style={{ width: size, height: size * 1.3 }}
    >
      <svg width={size} height={size * 1.3} viewBox="0 0 36 47" fill="none">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 47 18 47C18 47 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill={cat?.color || "#888"} />
        <circle cx="18" cy="18" r="12" fill="white" fillOpacity="0.2" />
        <circle cx="18" cy="18" r="10" stroke="white" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
        <text x="18" y="23" textAnchor="middle" fontSize="12" fill="white">{cat?.icon}</text>
      </svg>
    </div>
  );
}
