import * as SecureStore from "expo-secure-store";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { HYLAQ } from "./config";

WebBrowser.maybeCompleteAuthSession();

const SESSION_KEY = "loadit_session";

export interface Session {
  kind: "hylaq" | "guest";
  accessToken?: string;
  idToken?: string;
  name?: string;
  email?: string;
}

export async function loadSession(): Promise<Session | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function saveSession(s: Session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(s));
}

export async function signOut() {
  await SecureStore.deleteItemAsync(SESSION_KEY);
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
    throw new Error("Login was cancelled.");
  }

  const token = await AuthSession.exchangeCodeAsync(
    {
      clientId: HYLAQ.clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier ? { code_verifier: request.codeVerifier } : {},
    },
    discovery
  );

  const session: Session = {
    kind: "hylaq",
    accessToken: token.accessToken,
    idToken: token.idToken,
  };

  // Best-effort profile fetch — login still succeeds if userinfo is unavailable.
  if (token.accessToken && discovery.userInfoEndpoint) {
    try {
      const res = await fetch(discovery.userInfoEndpoint, {
        headers: { Authorization: `Bearer ${token.accessToken}` },
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
