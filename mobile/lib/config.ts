import Constants from "expo-constants";

type Extra = {
  apiBase: string;
  aeroApiKey: string;
  hylaq: { issuer: string; clientId: string; scopes: string[] };
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

/** Base URL of the deployed Loadit backend (the existing Next.js API). */
export const API_BASE = extra.apiBase || "https://loadit.net";

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

// Colors live in lib/theme.tsx now — the user picks mode + accent and every
// screen derives its palette from useTheme().
