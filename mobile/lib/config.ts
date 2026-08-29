import Constants from "expo-constants";

type Extra = {
  apiBase: string;
  aeroApiKey: string;
  hylaq: { issuer: string; clientId: string; scopes: string[] };
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

/** Base URL of the deployed Loadit backend (the existing Next.js API).
 *  EXPO_PUBLIC_API_BASE overrides it for local development builds only. */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE || extra.apiBase || "https://loadit.net";

/** Public AERO API key ('demo' works out of the box). */
export const AERO_API_KEY = extra.aeroApiKey || "demo";

/** Hylaq SSO config — issuer + clientId live in app.json → extra.hylaq. */
export const HYLAQ = {
  issuer: extra.hylaq?.issuer || "",
  clientId: extra.hylaq?.clientId || "",
  scopes: extra.hylaq?.scopes || ["read"],
};

/** Founder accounts (Hylaq login email) — gates the Practice Run screen. */
const FOUNDER_EMAILS = ["trudellcolton@gmail.com", "colt@loadit.net"];
export function isFounder(email?: string | null): boolean {
  return Boolean(email && FOUNDER_EMAILS.includes(email.trim().toLowerCase()));
}

/**
 * Rail owner — the ONLY Hylaq account that can see or use the Rail surface.
 * Deliberately narrower than isFounder (colt@loadit.net is excluded). This
 * client check only hides UI; the real gate is enforced server-side on
 * /api/rail against the verified token email (lib/rail/ownerGate.ts).
 */
const RAIL_OWNER_EMAILS = ["trudellcolton@gmail.com"];
export function isRailOwner(email?: string | null): boolean {
  return Boolean(email && RAIL_OWNER_EMAILS.includes(email.trim().toLowerCase()));
}

// Colors live in lib/theme.tsx now — the user picks mode + accent and every
// screen derives its palette from useTheme().
