import { NextResponse } from "next/server";
import { Asset, BASE_FEE, Keypair, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { limit } from "@/lib/ratelimit";
import { HORIZON, NETWORK_PASSPHRASE, stellarNetwork } from "@/lib/anchor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Activate a brand-new Stellar account for the browser wallet.
 *
 * A Stellar account only exists once someone sends it the base reserve. On
 * testnet we ask Friendbot. On the public network a Loadit-held funding
 * account (STELLAR_FUNDING_SECRET) sends the starting balance — a few cents
 * of XLM that covers the reserve for the account and one USDC trustline, plus
 * transaction fees. The user's key is never involved here; nothing but XLM
 * reserve moves, and the account is theirs alone.
 *
 * Idempotent: if the account already exists we say so and send nothing.
 */

/** Starting balance on the public network: 1 XLM reserve + 0.5 XLM trustline reserve + fee headroom. */
const STARTING_BALANCE_XLM = "2";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

async function accountExists(horizon: string, id: string): Promise<boolean | null> {
  try {
    const res = await fetch(`${horizon}/accounts/${id}`, { cache: "no-store" });
    if (res.status === 200) return true;
    if (res.status === 404) return false;
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const limited = limit(req, "wallet-activate", 5);
  if (limited) return limited;

  let body: { account?: string };
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  const account = (body.account || "").trim();
  if (!StrKey.isValidEd25519PublicKey(account)) return json({ ok: false, reason: "invalid_account" }, 422);

  const net = stellarNetwork();
  const horizon = HORIZON[net];

  const exists = await accountExists(horizon, account);
  if (exists === null) return json({ ok: false, reason: "horizon_unavailable" }, 502);
  if (exists) return json({ ok: true, already: true, network: net });

  if (net === "testnet") {
    try {
      const res = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(account)}`, { cache: "no-store" });
      if (!res.ok) return json({ ok: false, reason: "friendbot_failed", status: res.status }, 502);
      return json({ ok: true, already: false, network: net, funder: "friendbot" });
    } catch {
      return json({ ok: false, reason: "friendbot_failed" }, 502);
    }
  }

  const secret = process.env.STELLAR_FUNDING_SECRET;
  if (!secret) {
    return json(
      { ok: false, reason: "not_configured", message: "Account activation is not enabled on this network yet." },
      503
    );
  }
  let funder: Keypair;
  try {
    funder = Keypair.fromSecret(secret);
  } catch {
    return json({ ok: false, reason: "not_configured" }, 503);
  }

  try {
    const srcRes = await fetch(`${horizon}/accounts/${funder.publicKey()}`, { cache: "no-store" });
    if (!srcRes.ok) return json({ ok: false, reason: "funder_unavailable" }, 502);
    const src = (await srcRes.json()) as { sequence: string; balances: { asset_type: string; balance: string }[] };
    const xlm = Number(src.balances.find((b) => b.asset_type === "native")?.balance || "0");
    if (xlm < Number(STARTING_BALANCE_XLM) + 2) return json({ ok: false, reason: "funder_empty" }, 503);

    const { Account } = await import("@stellar/stellar-sdk");
    const tx = new TransactionBuilder(new Account(funder.publicKey(), src.sequence), {
      fee: String(Number(BASE_FEE) * 10),
      networkPassphrase: NETWORK_PASSPHRASE[net],
    })
      .addOperation(Operation.createAccount({ destination: account, startingBalance: STARTING_BALANCE_XLM }))
      .setTimeout(60)
      .build();
    tx.sign(funder);
    void Asset; // keep the import list honest for future trustline sponsorship

    const submit = await fetch(`${horizon}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ tx: tx.toEnvelope().toXDR("base64") }),
      cache: "no-store",
    });
    const result = (await submit.json().catch(() => ({}))) as { hash?: string; extras?: { result_codes?: unknown } };
    if (!submit.ok || !result.hash) {
      return json({ ok: false, reason: "submit_failed", codes: result.extras?.result_codes ?? null }, 502);
    }
    return json({ ok: true, already: false, network: net, funder: "loadit", hash: result.hash });
  } catch {
    return json({ ok: false, reason: "submit_failed" }, 502);
  }
}
