/**
 * RAIL OWNER GATE — the rail surface belongs to ONE Hylaq account.
 *
 * Server-side enforcement, not just UI: every /api/rail call must present a
 * Hylaq access token, the token is resolved to an email AUTHORITATIVELY
 * (Hylaq's OAuthAccessToken table via sha256(token), falling back to Hylaq's
 * userinfo endpoint — the same trust chain /api/handle/me uses), and that
 * email must be exactly the rail owner's. A client-supplied email is never
 * read. Everyone else gets 401/403 and never touches the machine.
 *
 * NOTE: this allowlist is deliberately NARROWER than the app's isFounder list
 * (which also includes colt@loadit.net). The rail surface is gated to the
 * owner's Hylaq login only.
 */
import { hylaqConfigured, ownerEmailFromAccessToken } from "../hylaqDb";

/** The only account allowed through the rail gate. */
export const RAIL_OWNER_EMAILS = ["trudellcolton@gmail.com"] as const;

export function isRailOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (RAIL_OWNER_EMAILS as readonly string[]).includes(clean);
}

/** Bearer token from the Authorization header. Nothing else is trusted. */
export function extractBearerToken(req: Request): string {
  const header = req.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export type EmailResolver = (token: string) => Promise<string | null>;

/**
 * LOCAL-DEV SEAM ONLY: `RAIL_DEV_TOKEN_EMAILS` is a JSON map of
 * {"<token>":"<email>"} the deployer may set to test the gate without live
 * Hylaq credentials. Unset (the default everywhere) it does nothing. Setting
 * it is an explicit owner/deployer act — never set it in production.
 */
function devSeamEmail(token: string): string | null {
  const raw = process.env.RAIL_DEV_TOKEN_EMAILS;
  if (!raw) return null;
  try {
    const map = JSON.parse(raw) as Record<string, string>;
    const email = map[token];
    return typeof email === "string" && email ? email : null;
  } catch {
    return null;
  }
}

/**
 * Resolve a Hylaq access token to its owner email.
 * Order: Hylaq token store (authoritative) → Hylaq userinfo → local dev seam.
 */
export async function resolveEmailFromToken(token: string): Promise<string | null> {
  if (!token) return null;

  if (hylaqConfigured()) {
    try {
      const email = await ownerEmailFromAccessToken(token);
      if (email) return email;
    } catch (e) {
      console.error("[rail] token store lookup failed:", String(e));
    }
  }

  const issuer = (process.env.HYLAQ_ISSUER || "https://www.hylaq.com").replace(/\/$/, "");
  try {
    const res = await fetch(`${issuer}/api/oauth/userinfo`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const info = (await res.json()) as { email?: string };
      if (info.email) return info.email;
    }
  } catch (e) {
    console.error("[rail] userinfo failed:", String(e));
  }

  return devSeamEmail(token);
}

export type RailAuth =
  | { ok: true; email: string }
  | { ok: false; status: 401 | 403; reason: "missing_token" | "unverified_token" | "not_rail_owner" };

/**
 * Authorize a rail request. Fails closed: no token, an unverifiable token,
 * or a verified email that is not the rail owner's are all refused.
 */
export async function authorizeRailOwner(
  req: Request,
  resolveEmail: EmailResolver = resolveEmailFromToken
): Promise<RailAuth> {
  const token = extractBearerToken(req);
  if (!token) return { ok: false, status: 401, reason: "missing_token" };

  let email: string | null = null;
  try {
    email = await resolveEmail(token);
  } catch {
    email = null;
  }
  if (!email) return { ok: false, status: 401, reason: "unverified_token" };
  if (!isRailOwnerEmail(email)) return { ok: false, status: 403, reason: "not_rail_owner" };
  return { ok: true, email: email.trim().toLowerCase() };
}
