import { forwardRef, useImperativeHandle, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import CategoryPin from "./CategoryPin";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// MapView is the ONLY place that touches Mapbox-specific APIs (mapboxAccessToken,
// mapStyle strings, NavigationControl, the imperative flyTo method, etc.). Anything
// outside this file talks to the map through the library-agnostic ref handle below,
// so a future swap to another provider is contained to this component.
const MapView = forwardRef(function MapView({ spots, selectedSpotId, isMobile, onSelectSpot }, ref) {
  const mapRef = useRef(null);

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
          <CategoryPin category={spot.category} selected={selectedSpotId === spot.id} />
        </Marker>
      ))}
    </Map>
  );
});

export default MapView;
