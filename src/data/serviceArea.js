// Rough box around South Walton / 30A, generous enough for Fort Walton Beach–
// Panama City Beach. Shared by the submit form (to reject mistyped GPS
// coordinates) and scripts/audit-spots.mjs (to flag misplaced pins).
export const SERVICE_AREA = { minLat: 30.15, maxLat: 30.55, minLng: -86.75, maxLng: -85.75 };

export const inServiceArea = ({ lat, lng }) =>
  lat >= SERVICE_AREA.minLat && lat <= SERVICE_AREA.maxLat &&
  lng >= SERVICE_AREA.minLng && lng <= SERVICE_AREA.maxLng;
