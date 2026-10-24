/**
 * MERCHANT API KEYS & WEBHOOK SECRETS
 *
 * Merchant keys reuse the stateless signed-key scheme in lib/apiKeys (an
 * `lk_` HMAC token over AERO_SIGNING_SECRET) with three extra payload fields:
 * the merchant's display name, their own Stellar settlement address, and the
 * mode ("test" → Stellar testnet, "live" → public network). No database row
 * is needed per merchant; the key IS the merchant record. Revocation works
 * exactly like other keys: list the kid in API_KEYS_REVOKED.
 *
 * The per-merchant webhook secret is likewise stateless — derived with an
 * HMAC over the key id — so Loadit can re-derive it any time a webhook needs
 * signing and the operator can re-issue it to the merchant on request.
 */
import crypto from "crypto";
import { signApiKey, verifyApiKey, type KeyPayload } from "../apiKeys";

export type MerchantMode = "test" | "live";

export const MERCHANT_PLAN = "merchant";

/** Shape every verified merchant key resolves to. */
export interface Merchant {
  kid: string;
  name: string;
  email?: string;
  /** The merchant's own Stellar address — USDC settles here, never to Loadit. */
  address: string;
  mode: MerchantMode;
}

/**
 * Cheap shape check for a Stellar ed25519 public key (G + 55 base32 chars).
 * The admin key-mint route additionally runs the SDK's full checksum
 * validation so a typo'd settlement address can never be baked into a key.
 */
const STELLAR_ADDR = /^G[A-Z2-7]{55}$/;
export function isValidStellarAddressShape(addr: string): boolean {
  return STELLAR_ADDR.test(addr);
}

/** Mint a merchant key (+ its webhook secret). Default validity one year. */
export function mintMerchantKey(input: {
  name: string;
  email?: string;
  address: string;
  mode: MerchantMode;
  ttlDays?: number;
}): { kid: string; apiKey: string; webhookSecret: string } {
  if (!isValidStellarAddressShape(input.address)) {
    throw new Error("invalid_stellar_address");
  }
  const kid = "m_" + crypto.randomBytes(5).toString("hex");
  const apiKey = signApiKey({
    kid,
    plan: MERCHANT_PLAN,
    email: input.email,
    name: input.name.slice(0, 80),
    addr: input.address,
    mode: input.mode,
    ttlDays: input.ttlDays ?? 365,
  });
  return { kid, apiKey, webhookSecret: webhookSecret(kid) };
}

/**
 * Verify a merchant API key. Returns the merchant it represents, or null for
 * anything invalid, expired, revoked, or not a merchant-plan key.
 */
export function verifyMerchantKey(key: string): Merchant | null {
  const p: KeyPayload | null = verifyApiKey((key || "").trim());
  if (!p || p.plan !== MERCHANT_PLAN) return null;
  if (!p.addr || !isValidStellarAddressShape(p.addr)) return null;
  return {
    kid: p.kid,
    name: p.name || "Merchant",
    email: p.email,
    address: p.addr,
    mode: p.mode === "live" ? "live" : "test",
  };
}

/** Deterministic per-merchant webhook signing secret (`whsec_…`). */
export function webhookSecret(kid: string): string {
  const secret = process.env.AERO_SIGNING_SECRET || "";
  return (
    "whsec_" +
    crypto.createHmac("sha256", secret).update(`merchant-webhook:${kid}`).digest("base64url")
  );
}
