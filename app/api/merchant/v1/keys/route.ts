import { NextResponse } from "next/server";
import crypto from "crypto";
import { StrKey } from "@stellar/stellar-sdk";
import { mintMerchantKey, type MerchantMode } from "@/lib/merchant/keys";
import { isValidSolanaAddress } from "@/lib/merchant/solana";
import { limit } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OPERATOR-ONLY merchant key minting.
 *
 * POST { name, email?, stellar_address?, solana_address?, mode } with
 * `Authorization: Bearer <MERCHANT_ADMIN_TOKEN>` → a merchant API key
 * (lk_…, stateless/signed) plus its webhook signing secret (whsec_…).
 * At least one settlement address is required; a merchant with both offers
 * the buyer a network choice on the hosted checkout. Keys are not stored
 * anywhere — deliver both secrets to the merchant over a secure channel.
 * Revoke by adding the returned merchant_id to API_KEYS_REVOKED.
 *
 * Settlement addresses get full validation here (Stellar StrKey checksum;
 * Solana base58 → exactly 32 bytes): a typo'd address baked into a key would
 * send buyers' USDC into the void.
 */
export async function POST(req: Request) {
  const limited = limit(req, "merchant-keys", 10);
  if (limited) return limited;

  const admin = process.env.MERCHANT_ADMIN_TOKEN || "";
  const provided = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!admin || !process.env.AERO_SIGNING_SECRET) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(admin);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    email?: string;
    stellar_address?: string;
    solana_address?: string;
    mode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad_request" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  if (!name || name.length > 80) {
    return NextResponse.json(
      { ok: false, reason: "invalid_name", message: "name is required (max 80 chars)." },
      { status: 422 }
    );
  }
  const address = String(body.stellar_address || "").trim() || undefined;
  if (address && !StrKey.isValidEd25519PublicKey(address)) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_stellar_address",
        message: "stellar_address must be a valid Stellar public key (G…, 56 chars).",
      },
      { status: 422 }
    );
  }
  const solanaAddress = String(body.solana_address || "").trim() || undefined;
  if (solanaAddress && !isValidSolanaAddress(solanaAddress)) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_solana_address",
        message: "solana_address must be a valid Solana public key (base58, 32 bytes).",
      },
      { status: 422 }
    );
  }
  if (!address && !solanaAddress) {
    return NextResponse.json(
      {
        ok: false,
        reason: "missing_settlement_address",
        message: "Provide stellar_address, solana_address, or both.",
      },
      { status: 422 }
    );
  }
  const mode: MerchantMode = body.mode === "live" ? "live" : "test";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 120) : undefined;

  const minted = mintMerchantKey({ name, email, address, solanaAddress, mode });
  return NextResponse.json({
    ok: true,
    merchant_id: minted.kid,
    mode,
    settlement: { stellar: address ?? null, solana: solanaAddress ?? null },
    api_key: minted.apiKey,
    webhook_secret: minted.webhookSecret,
    note:
      "Store both secrets now — they are stateless and not persisted by Loadit. " +
      "Revoke by adding merchant_id to API_KEYS_REVOKED.",
  });
}
