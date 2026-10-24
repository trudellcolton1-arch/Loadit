/**
 * MERCHANT API KEYS & WEBHOOK SECRETS
 *
 * Merchant keys reuse the stateless signed-key scheme in lib/apiKeys (an
 * `lk_` HMAC token over AERO_SIGNING_SECRET) with extra payload fields: the
 * merchant's display name, their settlement address(es) — Stellar and/or
 * Solana — and the mode ("test" → Stellar testnet / Solana devnet, "live" →
 * the public networks). No database row is needed per merchant; the key IS
 * the merchant record. Revocation works exactly like other keys: list the
 * kid in API_KEYS_REVOKED.
 *
 * The per-merchant webhook secret is likewise stateless — derived with an
 * HMAC over the key id — so Loadit can re-derive it any time a webhook needs
 * signing and the operator can re-issue it to the merchant on request.
 */
import crypto from "crypto";
import { signApiKey, verifyApiKey, type KeyPayload } from "../apiKeys";
import { isValidSolanaAddress } from "./solana";

export type MerchantMode = "test" | "live";

export const MERCHANT_PLAN = "merchant";

/** Shape every verified merchant key resolves to. */
export interface Merchant {
  kid: string;
  name: string;
  email?: string;
  /** Merchant's own Stellar address (USDC on Stellar settles here), if set. */
  address?: string;
  /** Merchant's own Solana address (USDC on Solana settles here), if set. */
  solanaAddress?: string;
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

/** Mint a merchant key (+ its webhook secret). Default validity one year.
 *  At least one settlement address (Stellar and/or Solana) is required. */
export function mintMerchantKey(input: {
  name: string;
  email?: string;
  address?: string;
  solanaAddress?: string;
  mode: MerchantMode;
  ttlDays?: number;
}): { kid: string; apiKey: string; webhookSecret: string } {
  if (input.address && !isValidStellarAddressShape(input.address)) {
    throw new Error("invalid_stellar_address");
  }
  if (input.solanaAddress && !isValidSolanaAddress(input.solanaAddress)) {
    throw new Error("invalid_solana_address");
  }
  if (!input.address && !input.solanaAddress) {
    throw new Error("missing_settlement_address");
  }
  const kid = "m_" + crypto.randomBytes(5).toString("hex");
  const apiKey = signApiKey({
    kid,
    plan: MERCHANT_PLAN,
    email: input.email,
    name: input.name.slice(0, 80),
    addr: input.address,
    sol: input.solanaAddress,
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
  const address = p.addr && isValidStellarAddressShape(p.addr) ? p.addr : undefined;
  const solanaAddress = p.sol && isValidSolanaAddress(p.sol) ? p.sol : undefined;
  if (!address && !solanaAddress) return null;
  return {
    kid: p.kid,
    name: p.name || "Merchant",
    email: p.email,
    address,
    solanaAddress,
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
