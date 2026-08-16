import type { Coordinate } from "./types";

// Decodes a Google encoded polyline (the standard algorithm, precision 5)
// into an array of lat/lng points.
export function decodePolyline(encoded: string): Coordinate[] {
  const points: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

// Simplifies a decoded path for geospatial queries by taking every Nth
// point (plus the endpoints) — keeps the corridor query cheap on long routes
// without materially changing which restrictions fall within the buffer.
export function simplifyPath(path: Coordinate[], maxPoints = 200): Coordinate[] {
  if (path.length <= maxPoints) return path;
  const step = Math.ceil(path.length / maxPoints);
  const simplified: Coordinate[] = [];
  for (let i = 0; i < path.length; i += step) {
    simplified.push(path[i]);
  }
  const last = path[path.length - 1];
  if (simplified[simplified.length - 1] !== last) simplified.push(last);
  return simplified;
}
