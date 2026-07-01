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
 * Login with Hylaq — standard OIDC Authorization Code + PKCE (public client,
 * no secret in the app). Fill HYLAQ.issuer + clientId in app.json → extra.hylaq
 * once hylaq.com sends OAuth details. Discovery is auto-fetched from the issuer.
 */
export async function signInWithHylaq(): Promise<Session> {
  if (!hylaqConfigured()) {
    throw new Error("Hylaq SSO isn't configured yet. Add issuer + clientId in app.json.");
  }
  const discovery = await AuthSession.fetchDiscoveryAsync(HYLAQ.issuer);
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
  await saveSession(session);
  return session;
}

/** Continue without Hylaq (lets users route + buy before SSO is wired). */
export async function signInGuest(): Promise<Session> {
  const session: Session = { kind: "guest" };
  await saveSession(session);
  return session;
}
