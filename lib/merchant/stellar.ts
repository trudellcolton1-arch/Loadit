/**
 * USDC-ON-STELLAR SETTLEMENT VERIFICATION
 *
 * Non-custodial by construction: the buyer pays USDC straight to the
 * merchant's own Stellar address with the session id as the transaction memo.
 * Loadit never holds, routes, or forwards the funds — it only reads public
 * Horizon records to confirm that a payment matching the session (right
 * destination, right asset + issuer, enough USDC, right memo) exists on-chain.
 * Horizon only returns operations from successful ledger-closed transactions,
 * so a match IS on-chain confirmation.
 *
 * Test mode uses the Stellar testnet (free test USDC — no real money); live
 * mode uses the public network and Circle's USDC issuer.
 */
import type { MerchantMode } from "./keys";

export interface StellarNetworkConfig {
  horizon: string;
  /** Network label used in API payloads and webhooks. */
  network: "stellar" | "stellar-testnet";
  /** USDC issuer account for this network. */
  usdcIssuer: string;
  /** Block explorer base for humans (tx pages). */
  explorerTx: string;
}

export const STELLAR_NETWORKS: Record<MerchantMode, StellarNetworkConfig> = {
  live: {
    horizon: "https://horizon.stellar.org",
    network: "stellar",
    // Circle's USDC issuer on the Stellar public network.
    usdcIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    explorerTx: "https://stellar.expert/explorer/public/tx/",
  },
  test: {
    horizon: "https://horizon-testnet.stellar.org",
    network: "stellar-testnet",
    // Circle's USDC issuer on the Stellar testnet (same issuer the repo's
    // existing testnet SEP flows use).
    usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    explorerTx: "https://stellar.expert/explorer/testnet/tx/",
  },
};

/** The Horizon payment-record fields we rely on (`join=transactions` adds `transaction`). */
export interface HorizonPaymentRecord {
  type?: string;
  transaction_successful?: boolean;
  to?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  amount?: string;
  transaction_hash?: string;
  created_at?: string;
  transaction?: { memo?: string | null; memo_type?: string | null } | null;
}

export interface PaymentCriteria {
  destination: string;
  /** Exact text memo the payment must carry (the session id). */
  memo: string;
  /** Minimum USDC that must have arrived. */
  minUsdc: number;
  usdcIssuer: string;
}

export interface MatchedPayment {
  txHash: string;
  amount: number;
  paidAt: string;
}

const PAYMENT_TYPES = new Set([
  "payment",
  "path_payment_strict_send",
  "path_payment_strict_receive",
]);

/**
 * Pure matcher: find the first Horizon payment record satisfying the session's
 * criteria. Exported separately so it's unit-testable without the network.
 */
export function matchPayment(
  records: HorizonPaymentRecord[],
  c: PaymentCriteria
): MatchedPayment | null {
  for (const r of records) {
    if (!r || !PAYMENT_TYPES.has(r.type || "")) continue;
    if (r.transaction_successful === false) continue;
    if (r.to !== c.destination) continue;
    if (r.asset_code !== "USDC" || r.asset_issuer !== c.usdcIssuer) continue;
    if ((r.transaction?.memo_type ?? "text") !== "text") continue;
    if ((r.transaction?.memo || "") !== c.memo) continue;
    const amount = Number(r.amount);
    // Guard float dust: accept anything within half a cent of the quote.
    if (!Number.isFinite(amount) || amount < c.minUsdc - 0.005) continue;
    if (!r.transaction_hash) continue;
    return { txHash: r.transaction_hash, amount, paidAt: r.created_at || new Date().toISOString() };
  }
  return null;
}

/**
 * Fetch recent payments into an account from Horizon. A 404 means the account
 * doesn't exist yet (new/unfunded) — treated as "no payments", not an error.
 */
export async function fetchRecentPayments(
  mode: MerchantMode,
  account: string,
  limit = 100
): Promise<{ ok: boolean; records: HorizonPaymentRecord[] }> {
  const net = STELLAR_NETWORKS[mode];
  const url =
    `${net.horizon}/accounts/${encodeURIComponent(account)}/payments` +
    `?order=desc&limit=${limit}&join=transactions`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (res.status === 404) return { ok: true, records: [] };
    if (!res.ok) return { ok: false, records: [] };
    const data = (await res.json()) as { _embedded?: { records?: HorizonPaymentRecord[] } };
    return { ok: true, records: data._embedded?.records ?? [] };
  } catch {
    return { ok: false, records: [] };
  } finally {
    clearTimeout(timer);
  }
}

/** SEP-7 pay URI — one tap opens the buyer's Stellar wallet pre-filled. */
export function sep7PayUri(input: {
  destination: string;
  usdcAmount: string;
  memo: string;
  mode: MerchantMode;
}): string {
  const net = STELLAR_NETWORKS[input.mode];
  const q = new URLSearchParams({
    destination: input.destination,
    asset_code: "USDC",
    asset_issuer: net.usdcIssuer,
    amount: input.usdcAmount,
    memo: input.memo,
    memo_type: "MEMO_TEXT",
  });
  return `web+stellar:pay?${q.toString()}`;
}
