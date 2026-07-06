/** Geography for the HQ globe — origin + selectable destinations. */

export interface Place {
  city: string;
  country: string;
  lat: number;
  lon: number;
}

/** Loadit's settlement origin. */
export const ORIGIN = {
  city: "Austin",
  region: "Texas",
  label: "Loadit · Texas",
  lat: 30.27,
  lon: -97.74,
};

export const CONTINENTS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
] as const;

export type Continent = (typeof CONTINENTS)[number];

export const DESTINATIONS: Record<Continent, Place[]> = {
  "North America": [
    { city: "New York", country: "USA", lat: 40.71, lon: -74.0 },
    { city: "Los Angeles", country: "USA", lat: 34.05, lon: -118.24 },
    { city: "Mexico City", country: "Mexico", lat: 19.43, lon: -99.13 },
    { city: "Toronto", country: "Canada", lat: 43.65, lon: -79.38 },
  ],
  "South America": [
    { city: "São Paulo", country: "Brazil", lat: -23.55, lon: -46.63 },
    { city: "Buenos Aires", country: "Argentina", lat: -34.6, lon: -58.38 },
    { city: "Bogotá", country: "Colombia", lat: 4.71, lon: -74.07 },
    { city: "Lima", country: "Peru", lat: -12.05, lon: -77.04 },
  ],
  Europe: [
    { city: "London", country: "UK", lat: 51.51, lon: -0.13 },
    { city: "Paris", country: "France", lat: 48.86, lon: 2.35 },
    { city: "Berlin", country: "Germany", lat: 52.52, lon: 13.4 },
    { city: "Madrid", country: "Spain", lat: 40.42, lon: -3.7 },
  ],
  Africa: [
    { city: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38 },
    { city: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82 },
    { city: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24 },
    { city: "Johannesburg", country: "South Africa", lat: -26.2, lon: 28.04 },
  ],
  Asia: [
    { city: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82 },
    { city: "Tokyo", country: "Japan", lat: 35.68, lon: 139.65 },
    { city: "Dubai", country: "UAE", lat: 25.2, lon: 55.27 },
    { city: "Mumbai", country: "India", lat: 19.08, lon: 72.88 },
  ],
  Oceania: [
    { city: "Sydney", country: "Australia", lat: -33.87, lon: 151.21 },
    { city: "Auckland", country: "New Zealand", lat: -36.85, lon: 174.76 },
    { city: "Manila", country: "Philippines", lat: 14.6, lon: 120.98 },
  ],
};

/** Ambient global traffic pool — [lat, lon] of major financial hubs. */
export const WORLD_CITIES: [number, number][] = [
  [40.71, -74.0], [34.05, -118.24], [41.88, -87.63], [43.65, -79.38],
  [19.43, -99.13], [25.76, -80.19], [49.28, -123.12], [30.27, -97.74],
  [39.74, -104.99], [-23.55, -46.63], [-34.6, -58.38], [4.71, -74.07],
  [-12.05, -77.04], [-33.45, -70.67], [-22.91, -43.17], [51.51, -0.13],
  [48.86, 2.35], [52.52, 13.4], [40.42, -3.7], [41.9, 12.5],
  [52.37, 4.9], [47.37, 8.54], [59.33, 18.07], [38.72, -9.14],
  [52.23, 21.01], [41.01, 28.98], [6.52, 3.38], [-1.29, 36.82],
  [30.04, 31.24], [-26.2, 28.04], [33.57, -7.59], [5.6, -0.19],
  [9.03, 38.74], [25.2, 55.27], [24.71, 46.68], [32.08, 34.78],
  [25.29, 51.53], [1.35, 103.82], [35.68, 139.65], [22.32, 114.17],
  [31.23, 121.47], [19.08, 72.88], [28.61, 77.21], [37.57, 126.98],
  [13.76, 100.5], [-6.21, 106.85], [14.6, 120.98], [24.86, 67.0],
  [12.97, 77.59], [-33.87, 151.21], [-37.81, 144.96], [-36.85, 174.76],
];

