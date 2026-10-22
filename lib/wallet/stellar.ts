"use client";

import type { WalletNetworkConfig } from "@/lib/anchor";

/**
 * Browser-side Stellar helpers for the wallet. Reads go straight to Horizon
 * (CORS-enabled). Signing happens here with the user's in-memory keypair and
 * never leaves the device. The SDK is loaded lazily so the app shell stays
 * light until a wallet actually exists.
 */

export type Sdk = typeof import("@stellar/stellar-sdk");
let sdkPromise: Promise<Sdk> | null = null;
export function sdk(): Promise<Sdk> {
  if (!sdkPromise) sdkPromise = import("@stellar/stellar-sdk");
  return sdkPromise;
}

export interface HorizonBalance {
  asset_type: string;
  asset_code?: string;
  asset_issuer?: string;
  balance: string;
  limit?: string;
}

export interface HorizonAccount {
  id: string;
  sequence: string;
  balances: HorizonBalance[];
  subentry_count: number;
}

export async function fetchAccount(horizon: string, id: string): Promise<HorizonAccount | null> {
  const res = await fetch(`${horizon}/accounts/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`horizon ${res.status}`);
  return (await res.json()) as HorizonAccount;
}

export function xlmBalance(a: HorizonAccount | null): string {
  return a?.balances.find((b) => b.asset_type === "native")?.balance ?? "0";
}

export function usdcLine(a: HorizonAccount | null, issuer: string): HorizonBalance | null {
  return a?.balances.find((b) => b.asset_code === "USDC" && b.asset_issuer === issuer) ?? null;
}

export function usdcBalance(a: HorizonAccount | null, issuer: string): string {
  return usdcLine(a, issuer)?.balance ?? "0";
}

/** Spendable XLM after the account's own minimum balance. */
export function spareXlm(a: HorizonAccount | null): number {
  if (!a) return 0;
  const min = (2 + (a.subentry_count || 0)) * 0.5;
  return Math.max(0, Number(xlmBalance(a)) - min);
}

export interface SubmitResult {
  hash: string;
}

export async function submitXdr(horizon: string, xdr: string): Promise<SubmitResult> {
  const res = await fetch(`${horizon}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ tx: xdr }),
  });
  const data = (await res.json().catch(() => ({}))) as { hash?: string; extras?: { result_codes?: { transaction?: string; operations?: string[] } } };
  if (!res.ok || !data.hash) {
    const codes = data.extras?.result_codes;
    const detail = codes ? [codes.transaction, ...(codes.operations || [])].filter(Boolean).join(", ") : `http ${res.status}`;
    throw new Error(`submit_failed: ${detail}`);
  }
  return { hash: data.hash };
}

/** Add the USDC trustline (signed locally). Requires the account to exist with spare XLM. */
export async function addUsdcTrustline(cfg: WalletNetworkConfig, secret: string): Promise<SubmitResult> {
  const S = await sdk();
  const kp = S.Keypair.fromSecret(secret);
  const acct = await fetchAccount(cfg.horizon, kp.publicKey());
  if (!acct) throw new Error("account_missing");
  const tx = new S.TransactionBuilder(new S.Account(acct.id, acct.sequence), { fee: String(Number(S.BASE_FEE) * 10), networkPassphrase: cfg.passphrase })
    .addOperation(S.Operation.changeTrust({ asset: new S.Asset("USDC", cfg.usdcIssuer) }))
    .setTimeout(60)
    .build();
  tx.sign(kp);
  return submitXdr(cfg.horizon, tx.toEnvelope().toXDR("base64"));
}

export interface PaymentArgs {
  destination: string;
  amount: string; // decimal string, up to 7 dp
  memo?: { type: string; value: string } | null;
}

/** Send USDC to an address (used to fund a cash-out at the anchor, or to pay anyone on Stellar). */
export async function sendUsdc(cfg: WalletNetworkConfig, secret: string, args: PaymentArgs): Promise<SubmitResult> {
  const S = await sdk();
  const kp = S.Keypair.fromSecret(secret);
  const acct = await fetchAccount(cfg.horizon, kp.publicKey());
  if (!acct) throw new Error("account_missing");
  const builder = new S.TransactionBuilder(new S.Account(acct.id, acct.sequence), { fee: String(Number(S.BASE_FEE) * 10), networkPassphrase: cfg.passphrase })
    .addOperation(S.Operation.payment({ destination: args.destination, asset: new S.Asset("USDC", cfg.usdcIssuer), amount: normalizeAmount(args.amount) }))
    .setTimeout(120);
  if (args.memo?.value) {
    const t = (args.memo.type || "text").toLowerCase();
    if (t === "text") builder.addMemo(S.Memo.text(args.memo.value));
    else if (t === "id") builder.addMemo(S.Memo.id(args.memo.value));
    else if (t === "hash") builder.addMemo(S.Memo.hash(b64ToHex(args.memo.value)));
    else builder.addMemo(S.Memo.text(args.memo.value));
  }
  const tx = builder.build();
  tx.sign(kp);
  return submitXdr(cfg.horizon, tx.toEnvelope().toXDR("base64"));
}

/** Sign a SEP-10 challenge with the user's key (the server adds the client_domain signature). */
export async function signChallenge(xdr: string, passphrase: string, secret: string): Promise<string> {
  const S = await sdk();
  const tx = new S.Transaction(xdr, passphrase);
  if (tx.sequence !== "0") throw new Error("not_a_challenge");
  tx.sign(S.Keypair.fromSecret(secret));
  return tx.toEnvelope().toXDR("base64");
}

function b64ToHex(b64: string): string {
  if (/^[0-9a-f]{64}$/i.test(b64)) return b64; // already hex
  const bin = atob(b64);
  let hex = "";
  for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, "0");
  return hex;
}

/** Stellar amounts: max 7 decimals, no exponent, strip trailing zeros. */
export function normalizeAmount(v: string | number): string {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) throw new Error("invalid_amount");
  return n.toFixed(7).replace(/0+$/, "").replace(/\.$/, "");
}

export function shortAddr(a: string): string {
  return a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a;
}

export function fmtUsd(v: string | number): string {
  const n = typeof v === "number" ? v : Number(v);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
