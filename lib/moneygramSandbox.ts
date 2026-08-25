import { Keypair, Transaction, Networks } from "@stellar/stellar-sdk";
import { mgAnchor } from "./anchor";

/**
 * MONEYGRAM SANDBOX — founder practice runs against MoneyGram's real testnet
 * anchor (SEP-10 auth + SEP-24 interactive deposit on the Stellar TEST
 * network, test USDC, no real money).
 *
 * Testnet-only by construction: every function refuses to run when
 * STELLAR_NETWORK=public. The practice wallet is a server-held TESTNET
 * keypair (MG_TEST_STELLAR_SECRET) — holding it server-side is fine because
 * it can never touch real funds; the production flow stays non-custodial
 * with the user's own wallet signing.
 */

function isTestnet(): boolean {
  return (process.env.STELLAR_NETWORK || "testnet").toLowerCase() !== "public";
}

function practiceKeypair(): Keypair | null {
  const secret = process.env.MG_TEST_STELLAR_SECRET;
  if (!secret) return null;
  try {
    return Keypair.fromSecret(secret);
  } catch {
    return null;
  }
}

export function mgSandboxConfigured(): boolean {
  return isTestnet() && Boolean(practiceKeypair());
}

/** SEP-10: challenge → sign with the practice keypair → JWT.
 *  When STELLAR_SIGNING_SECRET is set, requests client_domain attribution
 *  (loadit.net) and co-signs — MoneyGram's whitelist recognizes the wallet
 *  by the SIGNING_KEY published in loadit.net/.well-known/stellar.toml. */
async function sep10Token(): Promise<string> {
  if (!isTestnet()) throw new Error("sandbox only");
  const kp = practiceKeypair();
  if (!kp) throw new Error("not configured");
  const anchor = mgAnchor();

  const clientDomain = process.env.LOADIT_CLIENT_DOMAIN || "loadit.net";
  let domainKp: Keypair | null = null;
  try {
    domainKp = process.env.STELLAR_SIGNING_SECRET
      ? Keypair.fromSecret(process.env.STELLAR_SIGNING_SECRET)
      : null;
  } catch {
    domainKp = null;
  }

  const params = new URLSearchParams({ account: kp.publicKey() });
  if (domainKp) params.set("client_domain", clientDomain);
  let chRes = await fetch(`${anchor.webAuth}?${params}`, { cache: "no-store" });
  if (!chRes.ok && domainKp) {
    // Anchor may not support client_domain yet — retry without it.
    chRes = await fetch(`${anchor.webAuth}?account=${kp.publicKey()}`, { cache: "no-store" });
    domainKp = null;
  }
  if (!chRes.ok) throw new Error(`sep10 challenge ${chRes.status}`);
  const ch = (await chRes.json()) as { transaction?: string; network_passphrase?: string };
  if (!ch.transaction) throw new Error("sep10 no challenge");

  const tx = new Transaction(ch.transaction, ch.network_passphrase || Networks.TESTNET);
  tx.sign(kp);
  if (domainKp) tx.sign(domainKp); // client_domain attestation co-signature

  const tokRes = await fetch(anchor.webAuth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: tx.toEnvelope().toXDR("base64") }),
    cache: "no-store",
  });
  if (!tokRes.ok) throw new Error(`sep10 token ${tokRes.status}`);
  const tok = (await tokRes.json()) as { token?: string };
  if (!tok.token) throw new Error("sep10 no token");
  return tok.token;
}

export interface MgSandboxDeposit {
  /** MoneyGram-hosted interactive deposit URL (their sandbox UI). */
  url: string;
  /** SEP-24 transaction id at the anchor — quotable, checkable. */
  id: string;
  account: string;
  anchor: string;
}

/** Start a SEP-24 interactive deposit at MoneyGram's testnet anchor. */
export async function startSandboxDeposit(amountUsd: number): Promise<MgSandboxDeposit> {
  const kp = practiceKeypair()!;
  const anchor = mgAnchor();
  const token = await sep10Token();

  const res = await fetch(`${anchor.sep24}/transactions/deposit/interactive`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      asset_code: "USDC",
      account: kp.publicKey(),
      amount: String(amountUsd),
      lang: "en",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`sep24 deposit ${res.status}`);
  const dep = (await res.json()) as { url?: string; id?: string };
  if (!dep.url || !dep.id) throw new Error("sep24 no url");
  return {
    url: fixRampsUrl(dep.url, amountUsd),
    id: dep.id,
    account: kp.publicKey(),
    anchor: anchor.homeDomain,
  };
}

/**
 * MoneyGram's rebuilt Ramps UI (extramps/ramps.moneygram.com) routes deposits
 * at /ramps/deposit and defaults `operation` to WITHDRAW when absent — but
 * their anchor still hands out bare root URLs (?transaction_id&token), which
 * render a blank page in the new portal. Rewrite to the shape the new UI
 * expects; leave any non-Ramps URL untouched.
 */
function fixRampsUrl(raw: string, amountUsd: number): string {
  try {
    const u = new URL(raw);
    if (!/(^|\.)ramps\.(aws\.)?moneygram\.com$/.test(u.hostname) && !/^(ext)?ramps\.moneygram\.com$/.test(u.hostname)) {
      return raw;
    }
    if (u.pathname !== "/" && u.pathname !== "") return raw; // already routed
    u.pathname = "/ramps/deposit";
    if (!u.searchParams.get("operation")) u.searchParams.set("operation", "deposit");
    if (!u.searchParams.get("asset_code")) u.searchParams.set("asset_code", "USDC");
    if (!u.searchParams.get("lang")) u.searchParams.set("lang", "en");
    if (!u.searchParams.get("amount")) u.searchParams.set("amount", String(amountUsd));
    return u.toString();
  } catch {
    return raw;
  }
}

export interface MgSandboxStatus {
  id: string;
  status: string;
  kind?: string;
  amountIn?: string;
  amountOut?: string;
  moreInfoUrl?: string;
  startedAt?: string;
  message?: string;
}

/** SEP-24 transaction status at the anchor (re-auths each call — stateless). */
export async function sandboxDepositStatus(id: string): Promise<MgSandboxStatus | null> {
  const anchor = mgAnchor();
  const token = await sep10Token();
  const res = await fetch(`${anchor.sep24}/transaction?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { transaction?: Record<string, unknown> };
  const t = data.transaction;
  if (!t) return null;
  return {
    id: String(t.id ?? id),
    status: String(t.status ?? "unknown"),
    kind: t.kind ? String(t.kind) : undefined,
    amountIn: t.amount_in ? String(t.amount_in) : undefined,
    amountOut: t.amount_out ? String(t.amount_out) : undefined,
    moreInfoUrl: t.more_info_url ? String(t.more_info_url) : undefined,
    startedAt: t.started_at ? String(t.started_at) : undefined,
    message: t.message ? String(t.message) : undefined,
  };
}
