import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CategoryPin from "./CategoryPin";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// MapView is the ONLY place that touches Mapbox-specific APIs (mapboxAccessToken,
// mapStyle strings, NavigationControl, the imperative flyTo method, etc.). Anything
// outside this file talks to the map through the library-agnostic ref handle below,
// so a future swap to another provider is contained to this component.
const MapView = forwardRef(function MapView({ spots, selectedSpotId, isMobile, onSelectSpot }, ref) {
  const mapRef = useRef(null);
  // Desktop-only hover preview; purely visual, so it stays local to the map.
  const [hoveredSpotId, setHoveredSpotId] = useState(null);
  const hoveredSpot = isMobile ? null : spots.find(s => s.id === hoveredSpotId);

  const flyToSpot = (spot, { offset = 0 } = {}) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [spot.lng, spot.lat - offset], zoom: 13, duration: 800 });
    }
  };

  useImperativeHandle(ref, () => ({ flyToSpot }), []);

  const handleMarkerClick = (spot) => {
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
            onMouseEnter={isMobile ? undefined : () => setHoveredSpotId(spot.id)}
            onMouseLeave={isMobile ? undefined : () => setHoveredSpotId(null)}
          >
            <CategoryPin category={spot.category} selected={selectedSpotId === spot.id} />
          </div>
        </Marker>
      ))}
      {hoveredSpot && (
        <Popup
          longitude={hoveredSpot.lng}
          latitude={hoveredSpot.lat}
          anchor="bottom"
          // Clear the pin (36px wide, 1.3x tall; 48px when selected) plus a small gap.
          offset={(selectedSpotId === hoveredSpot.id ? 48 : 36) * 1.3 + 6}
          closeButton={false}
          closeOnClick={false}
          maxWidth="260px"
          className="spot-popover"
        >
          <div className="font-display text-[14px] font-bold text-driftwood leading-[1.2]">{hoveredSpot.name}</div>
          <div className="text-[11px] text-sandstone mt-[3px]">{hoveredSpot.address}</div>
          <p className="text-[12px] text-cocoa leading-[1.5] mt-1.5 line-clamp-2">{hoveredSpot.description}</p>
        </Popup>
      )}
    </Map>
  );
});

export default MapView;
