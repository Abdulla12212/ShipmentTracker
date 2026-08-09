import type { Hub } from "@/lib/types";

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 330;

const CELL = 10;
const GRID_COLS = 80;
const GRID_ROWS = 33;
const DEG_PER_COL = 360 / GRID_COLS;
const DEG_PER_ROW = 4.5;

/**
 * Coarse equirectangular landmask expressed as inclusive column ranges per row.
 * Row 0 starts at 90N, each row spans 4.5 degrees of latitude, each column
 * spans 4.5 degrees of longitude starting at 180W. Antarctica is intentionally
 * omitted, which is conventional for logistics maps.
 */
const LAND_SEGMENTS: ReadonlyArray<readonly [number, number, number]> = [
  [1, 17, 24], [1, 31, 35],
  [2, 13, 24], [2, 26, 35], [2, 43, 43],
  [3, 12, 25], [3, 27, 35], [3, 44, 48], [3, 53, 64],
  [4, 3, 8], [4, 10, 25], [4, 28, 35], [4, 42, 79],
  [5, 2, 26], [5, 28, 34], [5, 35, 36], [5, 41, 79],
  [6, 2, 27], [6, 28, 30], [6, 34, 37], [6, 41, 79],
  [7, 3, 6], [7, 10, 27], [7, 38, 39], [7, 41, 79],
  [8, 11, 27], [8, 37, 79],
  [9, 12, 26], [9, 38, 72],
  [10, 12, 24], [10, 38, 72],
  [11, 12, 23], [11, 38, 71],
  [12, 13, 23], [12, 38, 42], [12, 47, 71],
  [13, 13, 22], [13, 37, 47], [13, 47, 69],
  [14, 15, 18], [14, 21, 23], [14, 36, 52], [14, 55, 66],
  [15, 16, 20], [15, 21, 24], [15, 36, 52], [15, 55, 64], [15, 66, 66],
  [16, 18, 21], [16, 24, 26], [16, 36, 51], [16, 56, 64], [16, 66, 67],
  [17, 20, 26], [17, 36, 50], [17, 56, 57], [17, 61, 64], [17, 66, 68],
  [18, 21, 28], [18, 37, 50], [18, 57, 57], [18, 62, 63], [18, 66, 68],
  [19, 22, 28], [19, 37, 50], [19, 61, 66],
  [20, 22, 30], [20, 38, 49], [20, 62, 67],
  [21, 22, 32], [21, 42, 48], [21, 62, 73],
  [22, 22, 32], [22, 42, 48], [22, 50, 50], [22, 66, 73],
  [23, 23, 31], [23, 42, 48], [23, 49, 51], [23, 67, 71],
  [24, 24, 31], [24, 42, 48], [24, 49, 50], [24, 65, 72],
  [25, 24, 30], [25, 43, 47], [25, 49, 50], [25, 65, 73],
  [26, 24, 29], [26, 43, 47], [26, 65, 73],
  [27, 23, 28], [27, 43, 45], [27, 65, 73],
  [28, 23, 27], [28, 70, 73], [28, 78, 78],
  [29, 23, 26], [29, 72, 72], [29, 77, 78],
  [30, 23, 25], [30, 76, 77],
  [31, 23, 24],
  [32, 24, 24],
];

export interface MapDot {
  x: number;
  y: number;
}

function buildLandDots(): MapDot[] {
  const seen = new Set<number>();
  const dots: MapDot[] = [];
  for (const [row, start, end] of LAND_SEGMENTS) {
    if (row < 0 || row >= GRID_ROWS) continue;
    for (let col = start; col <= end; col += 1) {
      if (col < 0 || col >= GRID_COLS) continue;
      const key = row * GRID_COLS + col;
      if (seen.has(key)) continue;
      seen.add(key);
      dots.push({ x: (col + 0.5) * CELL, y: (row + 0.5) * CELL });
    }
  }
  return dots;
}

export const LAND_DOTS: MapDot[] = buildLandDots();

export function project(lat: number, lng: number): MapDot {
  return {
    x: ((lng + 180) / DEG_PER_COL) * CELL,
    y: ((90 - lat) / DEG_PER_ROW) * CELL,
  };
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Great-circle interpolation, returning a geographic point at fraction t. */
export function interpolateGreatCircle(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  t: number,
): { lat: number; lng: number } {
  const lat1 = toRad(a.lat);
  const lng1 = toRad(a.lng);
  const lat2 = toRad(b.lat);
  const lng2 = toRad(b.lng);

  const d =
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin((lat2 - lat1) / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
        ),
      ),
    );

  if (d === 0) return { lat: a.lat, lng: a.lng };

  const A = Math.sin((1 - t) * d) / Math.sin(d);
  const B = Math.sin(t * d) / Math.sin(d);
  const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
  const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
  const z = A * Math.sin(lat1) + B * Math.sin(lat2);

  return {
    lat: toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lng: toDeg(Math.atan2(y, x)),
  };
}

/**
 * Great-circle polyline split into subpaths wherever it crosses the
 * antimeridian, so a Tokyo to Los Angeles leg hops the edge instead of
 * smearing back across the entire map.
 */
export function routeSubpaths(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  steps = 72,
): MapDot[][] {
  const subpaths: MapDot[][] = [];
  let current: MapDot[] = [];
  let previous: MapDot | null = null;

  for (let i = 0; i <= steps; i += 1) {
    const point = interpolateGreatCircle(a, b, i / steps);
    const projected = project(point.lat, point.lng);
    if (previous && Math.abs(projected.x - previous.x) > MAP_WIDTH / 2) {
      subpaths.push(current);
      current = [];
    }
    current.push(projected);
    previous = projected;
  }
  if (current.length > 1) subpaths.push(current);
  return subpaths.filter((path) => path.length > 1);
}

export function toSvgPath(points: MapDot[]): string {
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
}

export const HUBS: Hub[] = [
  { id: "hub-lax", code: "LAX", city: "Los Angeles", country: "United States", countryCode: "US", lat: 33.94, lng: -118.41, region: "North America", capacity: 4200 },
  { id: "hub-ord", code: "ORD", city: "Chicago", country: "United States", countryCode: "US", lat: 41.98, lng: -87.9, region: "North America", capacity: 3800 },
  { id: "hub-jfk", code: "JFK", city: "New York", country: "United States", countryCode: "US", lat: 40.64, lng: -73.78, region: "North America", capacity: 4600 },
  { id: "hub-yyz", code: "YYZ", city: "Toronto", country: "Canada", countryCode: "CA", lat: 43.68, lng: -79.63, region: "North America", capacity: 2400 },
  { id: "hub-mex", code: "MEX", city: "Mexico City", country: "Mexico", countryCode: "MX", lat: 19.44, lng: -99.07, region: "North America", capacity: 2100 },
  { id: "hub-gru", code: "GRU", city: "Sao Paulo", country: "Brazil", countryCode: "BR", lat: -23.43, lng: -46.47, region: "South America", capacity: 2600 },
  { id: "hub-scl", code: "SCL", city: "Santiago", country: "Chile", countryCode: "CL", lat: -33.39, lng: -70.79, region: "South America", capacity: 1300 },
  { id: "hub-lhr", code: "LHR", city: "London", country: "United Kingdom", countryCode: "GB", lat: 51.47, lng: -0.45, region: "Europe", capacity: 4400 },
  { id: "hub-ams", code: "AMS", city: "Rotterdam", country: "Netherlands", countryCode: "NL", lat: 51.92, lng: 4.48, region: "Europe", capacity: 5200 },
  { id: "hub-fra", code: "FRA", city: "Frankfurt", country: "Germany", countryCode: "DE", lat: 50.03, lng: 8.56, region: "Europe", capacity: 4900 },
  { id: "hub-dxb", code: "DXB", city: "Dubai", country: "United Arab Emirates", countryCode: "AE", lat: 25.25, lng: 55.36, region: "Middle East", capacity: 4700 },
  { id: "hub-jnb", code: "JNB", city: "Johannesburg", country: "South Africa", countryCode: "ZA", lat: -26.13, lng: 28.24, region: "Africa", capacity: 1500 },
  { id: "hub-bom", code: "BOM", city: "Mumbai", country: "India", countryCode: "IN", lat: 19.09, lng: 72.87, region: "Asia Pacific", capacity: 3300 },
  { id: "hub-sin", code: "SIN", city: "Singapore", country: "Singapore", countryCode: "SG", lat: 1.36, lng: 103.99, region: "Asia Pacific", capacity: 5400 },
  { id: "hub-hkg", code: "HKG", city: "Hong Kong", country: "China", countryCode: "HK", lat: 22.31, lng: 113.91, region: "Asia Pacific", capacity: 5100 },
  { id: "hub-pvg", code: "PVG", city: "Shanghai", country: "China", countryCode: "CN", lat: 31.14, lng: 121.81, region: "Asia Pacific", capacity: 5600 },
  { id: "hub-nrt", code: "NRT", city: "Tokyo", country: "Japan", countryCode: "JP", lat: 35.77, lng: 140.39, region: "Asia Pacific", capacity: 3900 },
  { id: "hub-syd", code: "SYD", city: "Sydney", country: "Australia", countryCode: "AU", lat: -33.94, lng: 151.18, region: "Asia Pacific", capacity: 2000 },
];

export const HUB_BY_ID = new Map(HUBS.map((hub) => [hub.id, hub]));

export function hubById(id: string): Hub {
  const hub = HUB_BY_ID.get(id);
  if (!hub) throw new Error(`Unknown hub: ${id}`);
  return hub;
}

export function hubLabel(id: string): string {
  const hub = HUB_BY_ID.get(id);
  return hub ? `${hub.city} (${hub.code})` : "Unknown";
}

/** Current geographic position of a shipment given its route progress. */
export function positionAlongRoute(
  originId: string,
  destinationId: string,
  progress: number,
): { lat: number; lng: number } {
  return interpolateGreatCircle(
    hubById(originId),
    hubById(destinationId),
    Math.min(1, Math.max(0, progress)),
  );
}
