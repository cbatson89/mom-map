import { useState, useEffect } from "react";
import { fetchSpots } from "../lib/spots.api";

// Loads spots from the backend on mount. Exposes setSpots so the (still
// local-state-only) submit flow can append optimistically in this phase;
// Phase 4 replaces that with a real write path.
export function useSpots() {
  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchSpots()
      .then(data => { if (active) setSpots(data); })
      .catch(err => { if (active) setError(err); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { spots, setSpots, loading, error };
}
