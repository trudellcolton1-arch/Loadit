import { Keypair, Transaction, Networks } from "@stellar/stellar-sdk";
import { mgAnchor } from "./anchor";
import { decodeSep10JwtClaims, type Sep10JwtClaims } from "./sep10Claims";

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

function clientDomain(): string {
  return process.env.LOADIT_CLIENT_DOMAIN || "loadit.net";
}

function domainKeypair(): Keypair | null {
  try {
    return process.env.STELLAR_SIGNING_SECRET
      ? Keypair.fromSecret(process.env.STELLAR_SIGNING_SECRET)
      : null;
  } catch {
    return null;
  }
}

/** Public attribution we publish — not JWT claims. */
export function publishedWalletAttribution() {
  const kp = domainKeypair();
  return {
    client_domain: clientDomain(),
    /** stellar.toml DOCUMENTATION.ORG_NAME — not a SEP-10 JWT field. */
    client_name: "Loadit",
    signing_key: kp ? kp.publicKey() : "GCNLOGNOEEROESV4RD6NRJZWYF7W4GHFJE7H2R4W35OYWY6QQ4SIF4CC",
  };
}

export interface Sep10Handshake {
  auth_url: string;
  auth_endpoint: string;
  query_params: Record<string, string>;
  challenge: string;
  signed_challenge: string;
  network_passphrase: string;
  client_domain_requested: boolean;
  client_domain_used: boolean;
  jwt_claims: Sep10JwtClaims;
}

export interface MgRecordedRun {
  id: string;
  /** SEP-24 interactive_url as returned by the anchor. */
  interactive_url: string;
  /** URL after the Ramps-path rewrite the practice console opens. */
  interactive_url_fixed: string;
  account: string;
  anchor: string;
  amountUsd: number;
  recorded_at: string;
  sep10: Sep10Handshake;
}

/** In-memory latest practice run (per warm instance). POST and start=1 write here. */
let latestRun: MgRecordedRun | null = null;

export function rememberLatestSandboxRun(run: MgRecordedRun): void {
  latestRun = run;
}

export function readLatestSandboxRun(): MgRecordedRun | null {
  return latestRun;
}

export function clearLatestSandboxRun(): void {
  latestRun = null;
}

/** SEP-10: challenge → sign with the practice keypair → JWT.
 *  When STELLAR_SIGNING_SECRET is set, requests client_domain attribution
 *  (loadit.net) and co-signs — MoneyGram's whitelist recognizes the wallet
 *  by the SIGNING_KEY published in loadit.net/.well-known/stellar.toml. */
async function sep10Session(): Promise<{ token: string; handshake: Sep10Handshake }> {
  if (!isTestnet()) throw new Error("sandbox only");
  const kp = practiceKeypair();
  if (!kp) throw new Error("not configured");
  const anchor = mgAnchor();

  let domainKp = domainKeypair();
  const requested = Boolean(domainKp);
  const params = new URLSearchParams({ account: kp.publicKey() });
  if (domainKp) params.set("client_domain", clientDomain());

  let usedParams = params;
  let chRes = await fetch(`${anchor.webAuth}?${params}`, { cache: "no-store" });
  if (!chRes.ok && domainKp) {
    // Anchor may not support client_domain yet — retry without it.
    usedParams = new URLSearchParams({ account: kp.publicKey() });
    chRes = await fetch(`${anchor.webAuth}?${usedParams}`, { cache: "no-store" });
    domainKp = null;
  }
  if (!chRes.ok) throw new Error(`sep10 challenge ${chRes.status}`);
  const ch = (await chRes.json()) as { transaction?: string; network_passphrase?: string };
  if (!ch.transaction) throw new Error("sep10 no challenge");

  const networkPassphrase = ch.network_passphrase || Networks.TESTNET;
  const tx = new Transaction(ch.transaction, networkPassphrase);
  tx.sign(kp);
  if (domainKp) tx.sign(domainKp); // client_domain attestation co-signature
  const signedChallenge = tx.toEnvelope().toXDR("base64");

  const tokRes = await fetch(anchor.webAuth, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction: signedChallenge }),
    cache: "no-store",
  });
  if (!tokRes.ok) throw new Error(`sep10 token ${tokRes.status}`);
  const tok = (await tokRes.json()) as { token?: string };
  if (!tok.token) throw new Error("sep10 no token");

  const queryParams = Object.fromEntries(usedParams.entries());
  const handshake: Sep10Handshake = {
    auth_url: `${anchor.webAuth}?${usedParams}`,
    auth_endpoint: anchor.webAuth,
    query_params: queryParams,
    challenge: ch.transaction,
    signed_challenge: signedChallenge,
    network_passphrase: networkPassphrase,
    client_domain_requested: requested,
    client_domain_used: usedParams.has("client_domain"),
    jwt_claims: decodeSep10JwtClaims(tok.token),
  };
  return { token: tok.token, handshake };
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
  const { token, handshake } = await sep10Session();

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
  const fixed = fixRampsUrl(dep.url, amountUsd);
  rememberLatestSandboxRun({
    id: dep.id,
    interactive_url: dep.url,
    interactive_url_fixed: fixed,
    account: kp.publicKey(),
    anchor: anchor.homeDomain,
    amountUsd,
    recorded_at: new Date().toISOString(),
    sep10: handshake,
  });
  return {
    url: fixed,
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

function statusFromTx(t: Record<string, unknown>, fallbackId: string): MgSandboxStatus {
  return {
    id: String(t.id ?? fallbackId),
    status: String(t.status ?? "unknown"),
    kind: t.kind ? String(t.kind) : undefined,
    amountIn: t.amount_in ? String(t.amount_in) : undefined,
    amountOut: t.amount_out ? String(t.amount_out) : undefined,
    moreInfoUrl: t.more_info_url ? String(t.more_info_url) : undefined,
    startedAt: t.started_at ? String(t.started_at) : undefined,
    message: t.message ? String(t.message) : undefined,
  };
}

async function transactionStatus(id: string, token: string): Promise<MgSandboxStatus | null> {
  const anchor = mgAnchor();
  const res = await fetch(`${anchor.sep24}/transaction?id=${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { transaction?: Record<string, unknown> };
  const t = data.transaction;
  if (!t) return null;
  return statusFromTx(t, id);
}

/** SEP-24 transaction status at the anchor (re-auths each call — stateless). */
export async function sandboxDepositStatus(id: string): Promise<MgSandboxStatus | null> {
  const { token } = await sep10Session();
  return transactionStatus(id, token);
}

async function latestListedDeposit(token: string): Promise<MgSandboxStatus | null> {
  const anchor = mgAnchor();
  const res = await fetch(`${anchor.sep24}/transactions?asset_code=USDC&kind=deposit`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { transactions?: Record<string, unknown>[] };
  const list = Array.isArray(data.transactions) ? data.transactions : [];
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => {
    const at = String(a.started_at || a.updated_at || "");
    const bt = String(b.started_at || b.updated_at || "");
    return bt.localeCompare(at);
  });
  return statusFromTx(sorted[0], String(sorted[0].id || ""));
}

export type MgRunSource = "recorded" | "anchor_list" | "started_now" | "none";

export interface MgLatestReport {
  ok: boolean;
  empty: boolean;
  mode: "sandbox";
  network: "testnet" | "public";
  reason?: string;
  message: string;
  run_source: MgRunSource;
  id: string | null;
  status: string | null;
  kind: string | null;
  amount_in: string | null;
  amount_out: string | null;
  interactive_url: string | null;
  interactive_url_fixed: string | null;
  more_info_url: string | null;
  account: string | null;
  anchor: string | null;
  sep10: Sep10Handshake | null;
  published: ReturnType<typeof publishedWalletAttribution>;
  timestamps: {
    checked_at: string;
    recorded_at: string | null;
    started_at: string | null;
  };
  note: string;
}

const TESTNET_NOTE =
  "Testnet practice run against extstellar (stellaradapterservice). Production MoneyGram uses /stellarsepservice/auth — this endpoint never calls production and never moves customer funds.";

function baseReport(checkedAt: string, network: "testnet" | "public"): Omit<MgLatestReport, "ok" | "empty" | "reason" | "message" | "run_source"> {
  return {
    mode: "sandbox",
    network,
    id: null,
    status: null,
    kind: null,
    amount_in: null,
    amount_out: null,
    interactive_url: null,
    interactive_url_fixed: null,
    more_info_url: null,
    account: null,
    anchor: null,
    sep10: null,
    published: publishedWalletAttribution(),
    timestamps: { checked_at: checkedAt, recorded_at: null, started_at: null },
    note: TESTNET_NOTE,
  };
}

function fillFromRecorded(report: MgLatestReport, recorded: MgRecordedRun): void {
  report.id = recorded.id;
  report.interactive_url = recorded.interactive_url;
  report.interactive_url_fixed = recorded.interactive_url_fixed;
  report.account = recorded.account;
  report.anchor = recorded.anchor;
  report.sep10 = recorded.sep10;
  report.timestamps.recorded_at = recorded.recorded_at;
}

function fillFromStatus(report: MgLatestReport, st: MgSandboxStatus): void {
  report.id = st.id;
  report.status = st.status;
  report.kind = st.kind ?? null;
  report.amount_in = st.amountIn ?? null;
  report.amount_out = st.amountOut ?? null;
  report.more_info_url = st.moreInfoUrl ?? null;
  report.timestamps.started_at = st.startedAt ?? null;
}

/** Read-only snapshot of the latest practice/sandbox MoneyGram run for Gunna. */
export async function latestSandboxReport(opts?: {
  start?: boolean;
  amountUsd?: number;
}): Promise<MgLatestReport> {
  const checkedAt = new Date().toISOString();
  const network: "testnet" | "public" = isTestnet() ? "testnet" : "public";

  if (!isTestnet()) {
    return {
      ...baseReport(checkedAt, "public"),
      ok: false,
      empty: true,
      reason: "public_network",
      run_source: "none",
      message:
        "Refusing to read or start a MoneyGram run: STELLAR_NETWORK=public. This endpoint is testnet-only.",
    };
  }

  if (opts?.start) {
    if (!mgSandboxConfigured()) {
      return {
        ...baseReport(checkedAt, "testnet"),
        ok: false,
        empty: true,
        reason: "not_configured",
        run_source: "none",
        message:
          "Cannot start a sandbox run: MG_TEST_STELLAR_SECRET is missing (testnet practice wallet not configured).",
      };
    }
    await startSandboxDeposit(opts.amountUsd ?? 20);
  }

  const recorded = readLatestSandboxRun();

  if (!mgSandboxConfigured()) {
    if (recorded) {
      const report: MgLatestReport = {
        ...baseReport(checkedAt, "testnet"),
        ok: true,
        empty: false,
        run_source: "recorded",
        message: "Latest recorded practice run. Live anchor refresh skipped (sandbox wallet not configured on this instance).",
      };
      fillFromRecorded(report, recorded);
      return report;
    }
    return {
      ...baseReport(checkedAt, "testnet"),
      ok: false,
      empty: true,
      reason: "not_configured",
      run_source: "none",
      message:
        "No practice/sandbox MoneyGram run is available: the testnet practice wallet is not configured on this environment.",
    };
  }

  let handshake: Sep10Handshake | null = null;
  let token: string | null = null;
  try {
    const session = await sep10Session();
    handshake = session.handshake;
    token = session.token;
  } catch {
    if (recorded) {
      const report: MgLatestReport = {
        ...baseReport(checkedAt, "testnet"),
        ok: true,
        empty: false,
        run_source: "recorded",
        message: "Latest recorded practice run. MoneyGram's testnet anchor was unreachable for a live status refresh.",
      };
      fillFromRecorded(report, recorded);
      return report;
    }
    return {
      ...baseReport(checkedAt, "testnet"),
      ok: false,
      empty: true,
      reason: "anchor_unavailable",
      run_source: "none",
      message: "MoneyGram's testnet anchor did not complete SEP-10, and no practice run is on record.",
    };
  }

  let live: MgSandboxStatus | null = null;
  if (recorded?.id) {
    live = await transactionStatus(recorded.id, token);
  }
  if (!live) {
    live = await latestListedDeposit(token);
  }

  if (recorded) {
    const report: MgLatestReport = {
      ...baseReport(checkedAt, "testnet"),
      ok: true,
      empty: false,
      run_source: opts?.start ? "started_now" : "recorded",
      message: opts?.start
        ? "Started a new testnet SEP-24 deposit and recorded SEP-10 diagnostics for Gunna."
        : "Latest recorded practice/sandbox MoneyGram run (live status refreshed from the testnet anchor when available).",
      sep10: recorded.sep10,
    };
    fillFromRecorded(report, recorded);
    if (live) fillFromStatus(report, live);
    return report;
  }

  if (live) {
    const report: MgLatestReport = {
      ...baseReport(checkedAt, "testnet"),
      ok: true,
      empty: false,
      run_source: "anchor_list",
      message:
        "No run was stored on this instance. This is the latest SEP-24 deposit the testnet anchor lists for the practice account. interactive_url is only captured when Loadit starts the deposit; more_info_url is what the anchor still has. SEP-10 fields are from a live handshake (same practice wallet), not the original deposit.",
      sep10: handshake,
    };
    fillFromStatus(report, live);
    const kp = practiceKeypair();
    report.account = kp ? kp.publicKey() : null;
    report.anchor = mgAnchor().homeDomain;
    return report;
  }

  return {
    ...baseReport(checkedAt, "testnet"),
    ok: false,
    empty: true,
    reason: "no_run",
    run_source: "none",
    message:
      "No practice/sandbox MoneyGram run is on record, and the testnet anchor listed no deposits for the practice account. Pass start=1 (default is false) to start a new testnet-only SEP-24 deposit.",
    sep10: handshake,
  };
}
