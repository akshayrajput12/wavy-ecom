/** Circle of `radius` metres around a point as a 64-gon (equirectangular; fine for the < 10 km GPS rings drawn). */
export function accuracyRing(lat: number, lng: number, radius: number, steps = 64): GeoJSON.Feature<GeoJSON.Polygon> {
  const dLat = radius / 111_320;
  const dLng = radius / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * 2 * Math.PI;
    return [lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)];
  });
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } };
}

/** 1-4 "signal" bars from GPS accuracy in metres: GPS-grade, good, Wi-Fi-grade, network/IP. */
export const signalBars = (accuracy: number) => (accuracy <= 20 ? 4 : accuracy <= 100 ? 3 : accuracy <= 1000 ? 2 : 1);

/** Map zoom that fits the accuracy ring. */
export const zoomFor = (accuracy: number) => (accuracy < 50 ? 18 : accuracy < 300 ? 16 : accuracy < 2000 ? 14 : 12);
