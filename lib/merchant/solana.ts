/**
 * USDC-ON-SOLANA SETTLEMENT VERIFICATION
 *
 * Mirrors lib/merchant/stellar.ts for the second settlement network. Same
 * non-custodial construction: the buyer pays USDC straight to the merchant's
 * own Solana wallet via a Solana Pay transfer request that carries a unique
 * per-session *reference* pubkey. Loadit never holds keys or funds — it only
 * reads public RPC data to confirm:
 *
 *   1. getSignaturesForAddress(reference) finds the candidate transaction
 *      (wallets include every `reference` from the pay URI as a read-only
 *      account on the transfer instruction, which is exactly what makes it
 *      discoverable — this is the standard Solana Pay findReference flow).
 *   2. getTransaction(sig, jsonParsed) + validation: the transaction
 *      succeeded and the merchant's USDC balance (owner + official mint in
 *      pre/postTokenBalances) increased by at least the quoted amount. Using
 *      balance deltas validates recipient-ATA + mint + amount in one step,
 *      with no instruction-shape or ATA-derivation fragility.
 *
 * Test mode = devnet (free test USDC, no real money); live = mainnet with
 * Circle's official USDC mint. Implemented over raw JSON-RPC fetch — the same
 * dependency-light pattern lib/liveFees.ts uses for EVM chains.
 */
import crypto from "crypto";
import type { MerchantMode } from "./keys";

/* ---------- base58 (Bitcoin alphabet — what Solana uses) ---------- */

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const B58_MAP = new Map([...B58].map((c, i) => [c, i]));

export function base58Encode(bytes: Uint8Array): string {
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
  const digits: number[] = [];
  for (const byte of bytes) {
    let carry = byte;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  return "1".repeat(zeros) + digits.reverse().map((d) => B58[d]).join("");
}

export function base58Decode(s: string): Uint8Array | null {
  if (!s) return null;
  let zeros = 0;
  while (zeros < s.length && s[zeros] === "1") zeros++;
  const bytes: number[] = [];
  for (const c of s) {
    const v = B58_MAP.get(c);
    if (v === undefined) return null;
    let carry = v;
    for (let i = 0; i < bytes.length; i++) {
      carry += bytes[i] * 58;
      bytes[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  return Uint8Array.from([...Array(zeros).fill(0), ...bytes.reverse()]);
}

/** A Solana address is exactly 32 base58-decoded bytes. */
export function isValidSolanaAddress(addr: string): boolean {
  if (typeof addr !== "string" || addr.length < 32 || addr.length > 44) return false;
  const bytes = base58Decode(addr);
  return bytes !== null && bytes.length === 32;
}

/** Unique per-session reference pubkey (32 random bytes, base58). */
export function newSolanaReference(): string {
  return base58Encode(crypto.randomBytes(32));
}

/* ---------- network config ---------- */

export const USDC_DECIMALS = 6;

export interface SolanaNetworkConfig {
  /** Network label used in API payloads and webhooks. */
  network: "solana" | "solana-devnet";
  defaultRpc: string;
  /** Circle's official USDC mint for this cluster (env-overridable). */
  defaultUsdcMint: string;
  explorerTx: (sig: string) => string;
}

export const SOLANA_NETWORKS: Record<MerchantMode, SolanaNetworkConfig> = {
  live: {
    network: "solana",
    defaultRpc: "https://api.mainnet-beta.solana.com",
    defaultUsdcMint: "EPjFWdd5AufqSSqeM2qN1xQ1xvH8gKjXK8Wb3Bf7z7vZ",
    explorerTx: (sig) => `https://explorer.solana.com/tx/${sig}`,
  },
  test: {
    network: "solana-devnet",
    defaultRpc: "https://api.devnet.solana.com",
    defaultUsdcMint: "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    explorerTx: (sig) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`,
  },
};

export function solanaRpcUrl(mode: MerchantMode): string {
  return mode === "live"
    ? process.env.SOLANA_RPC_URL || SOLANA_NETWORKS.live.defaultRpc
    : process.env.SOLANA_DEVNET_RPC_URL || SOLANA_NETWORKS.test.defaultRpc;
}

export function solanaUsdcMint(mode: MerchantMode): string {
  return mode === "live"
    ? process.env.SOLANA_USDC_MINT || SOLANA_NETWORKS.live.defaultUsdcMint
    : process.env.SOLANA_DEVNET_USDC_MINT || SOLANA_NETWORKS.test.defaultUsdcMint;
}

/* ---------- Solana Pay transfer-request URI ---------- */

/** `solana:<recipient>?...` — Phantom, Solflare, and every Solana Pay wallet
 *  scans this from a QR or opens it as a link. */
export function solanaPayUri(input: {
  recipient: string;
  usdcAmount: string;
  mint: string;
  reference: string;
  label: string;
  message: string;
  memo: string;
}): string {
  const q = new URLSearchParams({
    amount: input.usdcAmount,
    "spl-token": input.mint,
    reference: input.reference,
    label: input.label.slice(0, 64),
    message: input.message.slice(0, 120),
    memo: input.memo,
  });
  return `solana:${input.recipient}?${q.toString()}`;
}

/* ---------- transaction validation (pure, unit-testable) ---------- */

interface TokenBalance {
  mint?: string;
  owner?: string;
  uiTokenAmount?: { amount?: string };
}

/** The slice of a jsonParsed getTransaction response we rely on. */
export interface SolanaTransaction {
  blockTime?: number | null;
  meta?: {
    err?: unknown;
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  } | null;
}

export interface SolanaPaymentCriteria {
  /** Merchant wallet (token-account owner) the USDC must land with. */
  recipient: string;
  mint: string;
  /** Minimum USDC (UI units) that must have arrived. */
  minUsdc: number;
}

function ownerMintTotal(balances: TokenBalance[] | undefined, c: SolanaPaymentCriteria): bigint {
  let total = 0n;
  for (const b of balances ?? []) {
    if (b.owner === c.recipient && b.mint === c.mint) {
      try {
        total += BigInt(b.uiTokenAmount?.amount ?? "0");
      } catch {
        /* non-numeric amount — ignore the entry */
      }
    }
  }
  return total;
}

/**
 * Did this transaction settle the session? True iff it succeeded and the
 * merchant's USDC balance grew by at least the quoted amount (raw units).
 */
export function matchSolanaTransaction(
  tx: SolanaTransaction,
  c: SolanaPaymentCriteria
): boolean {
  if (!tx?.meta || tx.meta.err !== null) return false;
  const pre = ownerMintTotal(tx.meta.preTokenBalances, c);
  const post = ownerMintTotal(tx.meta.postTokenBalances, c);
  // Half-cent tolerance, mirroring the Stellar matcher.
  const minRaw = BigInt(Math.round((c.minUsdc - 0.005) * 10 ** USDC_DECIMALS));
  return post - pre >= minRaw;
}

/* ---------- RPC discovery ---------- */

async function rpcCall<T>(url: string, method: string, params: unknown[]): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export interface MatchedSolanaPayment {
  signature: string;
  paidAt: string;
}

/**
 * Find a settled Solana Pay transfer for a session: look up signatures that
 * mention the session's reference key, then validate each transaction.
 * Returns `ok:false` only on RPC failure (caller stays pending and retries).
 */
export async function findSolanaPayment(
  mode: MerchantMode,
  reference: string,
  criteria: Omit<SolanaPaymentCriteria, "mint"> & { mint?: string }
): Promise<{ ok: boolean; match: MatchedSolanaPayment | null }> {
  const url = solanaRpcUrl(mode);
  const mint = criteria.mint ?? solanaUsdcMint(mode);

  const sigs = await rpcCall<{ signature: string; err: unknown }[]>(
    url,
    "getSignaturesForAddress",
    [reference, { limit: 10, commitment: "confirmed" }]
  );
  if (sigs === null) return { ok: false, match: null };

  for (const s of sigs) {
    if (!s?.signature || s.err !== null) continue;
    const tx = await rpcCall<SolanaTransaction>(url, "getTransaction", [
      s.signature,
      { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx) continue;
    if (matchSolanaTransaction(tx, { ...criteria, mint })) {
      const paidAt = tx.blockTime
        ? new Date(tx.blockTime * 1000).toISOString()
        : new Date().toISOString();
      return { ok: true, match: { signature: s.signature, paidAt } };
    }
  }
  return { ok: true, match: null };
}
