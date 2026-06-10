/**
 * STATELESS SIGNED API KEYS
 *
 * Lets us issue and validate production API keys with no database. A key is a
 * signed token: `lk_<base64url(payload)>.<hmac>`. The payload carries the plan
 * and expiry; validity is proven by an HMAC over it using AERO_SIGNING_SECRET.
 *
 * This is how the Stripe webhook can mint a working key the instant someone
 * subscribes — near-zero infra. Revocation (e.g. on cancel) is handled by
 * listing the key id in the API_KEYS_REVOKED env var, since we can't delete a
 * stateless token. Renewals issue a fresh key each billing cycle.
 */
import crypto from "crypto";

export interface KeyPayload {
  /** Stable key id (also used for revocation). */
  kid: string;
  /** Plan name, e.g. "startup". */
  plan: string;
  /** Customer email, for support/tracing. */
  email?: string;
  /** Issued-at (epoch seconds). */
  iat: number;
  /** Expiry (epoch seconds). */
  exp: number;
}

function secret(): string {
  return process.env.AERO_SIGNING_SECRET || "";
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Mint a signed key. Default validity 35 days (one billing cycle + grace). */
export function signApiKey(
  payload: Omit<KeyPayload, "iat" | "exp"> & { ttlDays?: number }
): string {
  const now = Math.floor(Date.now() / 1000);
  const body: KeyPayload = {
    kid: payload.kid,
    plan: payload.plan,
    email: payload.email,
    iat: now,
    exp: now + (payload.ttlDays ?? 35) * 86400,
  };
  const encoded = b64url(JSON.stringify(body));
  return `lk_${encoded}.${sign(encoded)}`;
}

function revoked(kid: string): boolean {
  return (process.env.API_KEYS_REVOKED || "")
    .split(",")
    .map((s) => s.trim())
    .includes(kid);
}

/** Verify a signed key. Returns the payload if valid, else null. */
export function verifyApiKey(key: string): KeyPayload | null {
  if (!secret() || !key.startsWith("lk_")) return null;
  const rest = key.slice(3);
  const dot = rest.lastIndexOf(".");
  if (dot < 0) return null;
  const encoded = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);

  // Constant-time signature check.
  const expected = sign(encoded);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as KeyPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (revoked(payload.kid)) return null;
    return payload;
  } catch {
    return null;
  }
}
