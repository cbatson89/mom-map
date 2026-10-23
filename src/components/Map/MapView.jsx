import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CategoryPin from "./CategoryPin";
import SpotPreviewCard from "./SpotPreviewCard";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Grace period before the hover card closes, so the mouse can travel from the
// pin onto the card (to reach "Copy address") without it disappearing.
const HOVER_CLOSE_DELAY_MS = 200;
const GAP = 6;

// Popup offsets per anchor so the card clears the pin (36px wide, 1.3x tall;
// 48px when selected). The pin's tip sits on the coordinate, so its body is above it.
// Mapbox picks whichever anchor fits on screen.
function popupOffsets(selected) {
  const w = selected ? 48 : 36;
  const h = w * 1.3;
  const side = w / 2 + GAP;
  return {
    bottom: [0, -(h + GAP)],
    top: [0, GAP],
    left: [side, -h / 2],
    right: [-side, -h / 2],
    "top-left": [side, -h / 2],
    "top-right": [-side, -h / 2],
    "bottom-left": [side, -h / 2],
    "bottom-right": [-side, -h / 2],
  };
}

// MapView is the ONLY place that touches Mapbox-specific APIs (mapboxAccessToken,
// mapStyle strings, NavigationControl, the imperative flyTo method, etc.). Anything
// outside this file talks to the map through the library-agnostic ref handle below,
// so a future swap to another provider is contained to this component.
const MapView = forwardRef(function MapView({ spots, selectedSpotId, isMobile, onSelectSpot }, ref) {
  const mapRef = useRef(null);
  // Desktop-only hover preview; purely visual, so it stays local to the map.
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const hoveredSpot = isMobile ? null : spots.find(s => s.id === hoveredSpotId);
  const closeTimer = useRef(null);

  const cancelClose = () => clearTimeout(closeTimer.current);
  const openHover = (id) => { cancelClose(); setHoveredSpotId(id); };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setHoveredSpotId(null), HOVER_CLOSE_DELAY_MS);
  };
  useEffect(() => cancelClose, []);

  const flyToSpot = (spot, { offset = 0 } = {}) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [spot.lng, spot.lat - offset], zoom: 13, duration: 800 });
    }
  };

  useImperativeHandle(ref, () => ({ flyToSpot }), []);

  const handleMarkerClick = (spot) => {
    // The full SpotCard is opening, so the preview would just duplicate it.
    cancelClose();
    setHoveredSpotId(null);
    onSelectSpot?.(spot);
    flyToSpot(spot, { offset: isMobile ? 0.03 : 0.01 });
  };

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={MAPBOX_TOKEN}
      initialViewState={{ longitude: -86.18, latitude: 30.33, zoom: 10 }}
      style={{ width: "100%", height: "100%" }}
      mapStyle="mapbox://styles/mapbox/outdoors-v12"
    >
      <NavigationControl position="bottom-right" />
      {spots.map(spot => (
        <Marker key={spot.id} longitude={spot.lng} latitude={spot.lat} anchor="bottom" onClick={e => { e.originalEvent.stopPropagation(); handleMarkerClick(spot); }}>
          <div
            onMouseEnter={isMobile ? undefined : () => openHover(spot.id)}
            onMouseLeave={isMobile ? undefined : scheduleClose}
          >
            <CategoryPin category={spot.category} selected={selectedSpotId === spot.id} />
          </div>
        </Marker>
      ))}
      {hoveredSpot && (
        <Popup
          longitude={hoveredSpot.lng}
          latitude={hoveredSpot.lat}
          offset={popupOffsets(selectedSpotId === hoveredSpot.id)}
          closeButton={false}
          closeOnClick={false}
          maxWidth="none"
          className="spot-popover"
        >
          <div onMouseEnter={cancelClose} onMouseLeave={scheduleClose}>
            <SpotPreviewCard key={hoveredSpot.id} spot={hoveredSpot} />
          </div>
        </Popup>
      )}
    </Map>
  );
});

export default MapView;
