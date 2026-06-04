/** Geography for the AERO globe — origin + selectable destinations. */

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
