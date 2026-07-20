import { useState } from "react";

export function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  return mobile;
}
