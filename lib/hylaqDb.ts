/**
 * HYLAQ DATABASE — read-only access to Hylaq's Neon Postgres over its HTTPS SQL
 * endpoint (raw Postgres/5432 isn't reachable from Vercel edge or this env;
 * the HTTP endpoint is the supported serverless path). HYLAQ_DATABASE_URL is a
 * server-only secret — it never reaches a client.
 *
 * We only ever read public-safe columns (handle, receive addresses, theme).
 * The sensitive columns on Handle (encryptedSeed, coinbase/stripe tokens, …)
 * are never selected here.
 */

import { createHash } from "crypto";

interface NeonRow {
  [key: string]: unknown;
}

export function hylaqConfigured(): boolean {
  return Boolean(process.env.HYLAQ_DATABASE_URL);
}

/** Run a parameterized query against Hylaq's DB. Returns rows as objects. */
export async function hylaqQuery<T = NeonRow>(query: string, params: unknown[] = []): Promise<T[]> {
  const conn = process.env.HYLAQ_DATABASE_URL;
  if (!conn) throw new Error("HYLAQ_DATABASE_URL not configured");
  const host = new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: {
        "Neon-Connection-String": conn,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`hylaq db ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as { rows?: T[] };
    return data.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Public-safe shape of a Hylaq handle profile. */
export interface HandleProfile {
  /** Handle DB id — used as fromHandleId when sending from this wallet. */
  id: string;
  handle: string;
  /** Display name from the user's Hylaq profile, if set. */
  displayName: string | null;
  bio: string | null;
  /** Absolute URL to the user's Hylaq profile picture, if they have one. */
  avatarUrl: string | null;
  links: { label: string; url: string }[];
  accountType: string | null;
  profileTheme: string | null;
  preferredReceiveAsset: string | null;
  addresses: {
    solana: string | null;
    evm: string | null;
    bitcoin: string | null;
    usdc: string | null;
  };
}

const HYLAQ_BASE = (process.env.HYLAQ_ISSUER || "https://www.hylaq.com").replace(/\/$/, "");

const PROFILE_SELECT = `
  select h.id, h.handle, h."accountType", h."profileTheme", h."preferredReceiveAsset",
         h."solanaAddress", h."evmAddress", h."bitcoinAddress", h."externalUSDCAddress",
         hr.profile as record_profile
  from "Handle" h
  left join "HandleRecord" hr on hr."handleId" = h.id`;

interface RecordProfile {
  displayName?: string;
  bio?: string;
  avatar?: string;
  links?: { label?: string; url?: string }[];
}

function toProfile(r: Record<string, unknown>): HandleProfile {
  let rec: RecordProfile = {};
  try {
    const raw = r.record_profile;
    if (raw) rec = (typeof raw === "string" ? JSON.parse(raw) : raw) as RecordProfile;
  } catch {
    /* profile blob is optional */
  }
  const avatar = rec.avatar;
  const avatarUrl = avatar ? (/^https?:/.test(avatar) ? avatar : `${HYLAQ_BASE}${avatar}`) : null;

  return {
    id: String(r.id),
    handle: String(r.handle),
    displayName: rec.displayName?.trim() || null,
    bio: rec.bio?.trim() || null,
    avatarUrl,
    links: Array.isArray(rec.links)
      ? rec.links
          .filter((l) => l && l.url)
          .map((l) => ({ label: String(l.label || "").slice(0, 40), url: String(l.url).slice(0, 200) }))
          .slice(0, 6)
      : [],
    accountType: (r.accountType as string) ?? null,
    profileTheme: (r.profileTheme as string) ?? null,
    preferredReceiveAsset: (r.preferredReceiveAsset as string) ?? null,
    addresses: {
      solana: (r.solanaAddress as string) ?? null,
      evm: (r.evmAddress as string) ?? null,
      bitcoin: (r.bitcoinAddress as string) ?? null,
      usdc: (r.externalUSDCAddress as string) ?? null,
    },
  };
}

/**
 * Find a user's handle by the email they own it under (Handle.owner = email).
 * A user can own several handles; we return their earliest one as the primary
 * identity, deterministically.
 */
export async function handleByOwnerEmail(email: string): Promise<HandleProfile | null> {
  const rows = await hylaqQuery<Record<string, unknown>>(
    `${PROFILE_SELECT} where lower(h.owner) = lower($1) order by h."createdAt" asc limit 1`,
    [email]
  );
  return rows.length ? toProfile(rows[0]) : null;
}

/**
 * Authoritative owner email for a Hylaq access token, looked up directly in
 * Hylaq's OAuthAccessToken table (sha256(token) = tokenHash), rejecting revoked
 * or expired tokens. This proves the caller holds the real token without
 * trusting any client-supplied identity. Returns null if not found.
 */
export async function ownerEmailFromAccessToken(token: string): Promise<string | null> {
  const clean = token.trim();
  if (!clean) return null;
  const hash = createHash("sha256").update(clean).digest("hex");
  const rows = await hylaqQuery<Record<string, unknown>>(
    `select "userEmail" from "OAuthAccessToken"
     where "tokenHash" = $1 and "revokedAt" is null and "expiresAt" > now()
     limit 1`,
    [hash]
  );
  return rows.length && rows[0].userEmail ? String(rows[0].userEmail) : null;
}

/** Resolve a public @handle (with or without the leading @). */
export async function handleByName(name: string): Promise<HandleProfile | null> {
  const clean = name.replace(/^@/, "").trim();
  if (!clean) return null;
  const rows = await hylaqQuery<Record<string, unknown>>(
    `${PROFILE_SELECT} where lower(h.handle) = lower($1) limit 1`,
    [clean]
  );
  return rows.length ? toProfile(rows[0]) : null;
}
