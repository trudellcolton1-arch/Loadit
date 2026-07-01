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

/** Hylaq SSO config — fill issuer + clientId in app.json → extra.hylaq. */
export const HYLAQ = {
  issuer: extra.hylaq?.issuer || "",
  clientId: extra.hylaq?.clientId || "",
  scopes: extra.hylaq?.scopes || ["openid", "profile", "email"],
};

export const BRAND = {
  bg: "#04060B",
  surface: "#0B0F1A",
  card: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.10)",
  rail: "#22A95C",
  railLight: "#34D17A",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.55)",
  faint: "rgba(255,255,255,0.35)",
  amber: "#FBBF24",
};
