import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { API_BASE, HYLAQ } from "./config";

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = "loadit_session";

/* SecureStore has no web implementation — fall back to localStorage so the
 * Expo web build (dev/testing) keeps a session too. Native uses SecureStore. */
async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* session just won't persist */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function storageDelete(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* nothing to remove */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface Session {
  kind: "hylaq" | "guest";
  accessToken?: string;
  idToken?: string;
  name?: string;
  email?: string;
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await storageGet(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function saveSession(s: Session) {
  await storageSet(SESSION_KEY, JSON.stringify(s));
}

export async function signOut() {
  await storageDelete(SESSION_KEY);
}

/** Whether Hylaq SSO has been configured (issuer + clientId set in app.json). */
export function hylaqConfigured(): boolean {
  return Boolean(HYLAQ.issuer && HYLAQ.clientId);
}

/**
 * Login with Hylaq — Authorization Code + PKCE (public client, no secret in
 * the app; the client secret lives only on the Loadit backend). Hylaq doesn't
 * publish an OIDC discovery document, so the endpoints are pinned to its
 * OAuth routes under the issuer (https://www.hylaq.com/api/oauth/*).
 */
function hylaqDiscovery(): AuthSession.DiscoveryDocument {
  const base = HYLAQ.issuer.replace(/\/$/, "");
  return {
    authorizationEndpoint: `${base}/api/oauth/authorize`,
    tokenEndpoint: `${base}/api/oauth/token`,
    userInfoEndpoint: `${base}/api/oauth/userinfo`,
  };
}

export async function signInWithHylaq(): Promise<Session> {
  if (!hylaqConfigured()) {
    throw new Error("Hylaq SSO isn't configured yet. Add issuer + clientId in app.json.");
  }
  const discovery = hylaqDiscovery();
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "loadit", path: "redirect" });

  const request = new AuthSession.AuthRequest({
    clientId: HYLAQ.clientId,
    scopes: HYLAQ.scopes,
    redirectUri,
    usePKCE: true,
    responseType: AuthSession.ResponseType.Code,
  });
  await request.makeAuthUrlAsync(discovery);
  const result = await request.promptAsync(discovery);

  if (result.type !== "success" || !result.params.code) {
    // Surface WHAT failed, not just that it failed — "dismiss" means the
    // browser closed before the loadit:// redirect returned (deep-link issue),
    // "error" carries the OAuth server's own error code.
    const p = result.type === "error" ? result.params : undefined;
    throw new Error(
      `Login didn't complete (${result.type}${p?.error ? `: ${p.error}` : ""}${p?.error_description ? ` — ${p.error_description}` : ""}). ` +
      `Redirect used: ${redirectUri}`
    );
  }

  // Exchange the code via the Loadit backend — Hylaq's token endpoint requires
  // the client secret, which lives ONLY on the server, never in this app.
  const exch = await fetch(`${API_BASE}/api/auth/hylaq/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: result.params.code,
      redirect_uri: redirectUri,
      code_verifier: request.codeVerifier || undefined,
    }),
  });
  const token = (await exch.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    detail?: string;
    error_description?: string;
  };
  if (!exch.ok || !token.access_token) {
    throw new Error(token.error_description || token.detail || token.error || "Sign-in failed at token exchange.");
  }

  const session: Session = {
    kind: "hylaq",
    accessToken: token.access_token,
    idToken: token.id_token,
  };

  // Best-effort profile fetch — login still succeeds if userinfo is unavailable.
  if (token.access_token && discovery.userInfoEndpoint) {
    try {
      const res = await fetch(discovery.userInfoEndpoint, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (res.ok) {
        const info = (await res.json()) as { name?: string; email?: string };
        session.name = info.name;
        session.email = info.email;
      }
    } catch {
      /* profile is optional */
    }
  }

  await saveSession(session);
  return session;
}

/** Continue without Hylaq (lets users route + buy before SSO is wired). */
export async function signInGuest(): Promise<Session> {
  const session: Session = { kind: "guest" };
  await saveSession(session);
  return session;
}

/**
 * What the backend says a stored Hylaq session really is:
 *
 * - "linked":   token verified AND an @handle is linked — the only state that
 *               may show gated surfaces (Rail, Practice run).
 * - "unlinked": token verified but no @handle — signed in, but gated surfaces
 *               stay hidden and the profile offers sign-in / create-account.
 * - "dead":     the backend explicitly says the token resolves to no Hylaq
 *               account (logged out of Hylaq / revoked / expired) — the stale
 *               session must be cleared.
 * - "unknown":  network or server trouble — never sign anyone out over a
 *               flaky connection, but gated surfaces stay hidden (fail closed).
 */
export type HylaqProbe = "linked" | "unlinked" | "dead" | "unknown";

export async function probeHylaqSession(s: Session): Promise<HylaqProbe> {
  if (s.kind !== "hylaq" || !s.accessToken) return "dead";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_BASE}/api/handle/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: s.accessToken }),
        signal: controller.signal,
      });
      if (!res.ok) return "unknown"; // backend hiccup ≠ signed out
      const r = (await res.json()) as { ok?: boolean; linked?: boolean; reason?: string };
      if (r.ok === true && r.linked === true) return "linked";
      if (r.ok === true && r.linked === false) {
        // "no_handle" = alive token, verified email, just no @handle yet.
        if (r.reason === "no_handle") return "unlinked";
        // "unverified"/"no_token" = token resolves to no Hylaq account.
        if (r.reason === "unverified" || r.reason === "no_token") return "dead";
      }
      return "unknown";
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return "unknown";
  }
}
