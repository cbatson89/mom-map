import { useRef } from "react";

export default function BottomSheet({ children, isOpen, height = "55vh", onClose }) {
  const startY = useRef(null);
  if (!isOpen) return null;
  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-cream rounded-sheet shadow-sheet z-[300] flex flex-col overflow-hidden"
      style={{ height }}
      onTouchStart={e => { startY.current = e.touches[0].clientY; }}
      onTouchEnd={e => { if (startY.current && e.changedTouches[0].clientY - startY.current > 60) onClose?.(); startY.current = null; }}
    >
      <div className="flex-1 overflow-y-auto [-webkit-overflow-scrolling:touch]">{children}</div>
    </div>
  );
}
