/**
 * MERCHANT PAYMENTS — orchestration shared by the API routes and the hosted
 * checkout: create sessions, lazily expire them, verify settlement on-chain
 * (Stellar and/or Solana — whichever networks the merchant key carries), and
 * fire the signed webhook exactly once per terminal transition (the store
 * guarantees a single winner for each pending → terminal update).
 */
import { SITE } from "../constants";
import type { Merchant } from "./keys";
import { webhookSecret } from "./keys";
import {
  quoteSession,
  newSessionId,
  type CreateSessionInput,
} from "./session";
import {
  insertSession,
  getSession,
  markSucceeded,
  markExpired,
  recordWebhookResult,
  type SessionRow,
} from "./store";
import { STELLAR_NETWORKS, fetchRecentPayments, matchPayment, sep7PayUri } from "./stellar";
import {
  SOLANA_NETWORKS,
  solanaUsdcMint,
  solanaPayUri,
  newSolanaReference,
  findSolanaPayment,
} from "./solana";
import { deliverWebhook, newEventId, type WebhookEventType } from "./webhooks";

export function checkoutUrl(id: string): string {
  return `${SITE.url}/checkout/${id}`;
}

/** The settlement networks a session offers (from the merchant's key). */
function settlementOptions(s: SessionRow): Record<string, unknown>[] {
  const options: Record<string, unknown>[] = [];
  if (s.destination && s.memo) {
    options.push({
      network: STELLAR_NETWORKS[s.mode].network,
      destination: s.destination,
      memo: s.memo,
      usdc_issuer: STELLAR_NETWORKS[s.mode].usdcIssuer,
    });
  }
  if (s.solDestination && s.solReference) {
    options.push({
      network: SOLANA_NETWORKS[s.mode].network,
      destination: s.solDestination,
      reference: s.solReference,
      usdc_mint: solanaUsdcMint(s.mode),
    });
  }
  return options;
}

function explorerTxUrl(s: SessionRow): string | null {
  if (!s.txHash) return null;
  if (s.paidNetwork === "solana") return SOLANA_NETWORKS[s.mode].explorerTx(s.txHash);
  return `${STELLAR_NETWORKS[s.mode].explorerTx}${s.txHash}`;
}

/** Full session view for the merchant API (and webhook payloads). */
export function merchantView(s: SessionRow): Record<string, unknown> {
  return {
    id: s.id,
    object: "checkout.session",
    url: checkoutUrl(s.id),
    mode: s.mode,
    livemode: s.mode === "live",
    status: s.status,
    order_id: s.orderId,
    amount_usd: s.amountUsd,
    fee_usd: s.feeUsd,
    fee: { percent: 0.75, min_usd: 1, billed_to: "merchant" },
    usdc_amount: s.usdcAmount,
    settlement: {
      asset: "USDC",
      non_custodial: true,
      options: settlementOptions(s),
    },
    item: s.item,
    metadata: s.metadata ?? {},
    paid_network: s.paidNetwork,
    tx_hash: s.txHash,
    paid_at: s.paidAt,
    failure_reason: s.failureReason,
    created_at: s.createdAt,
    expires_at: s.expiresAt,
  };
}

/** Public-safe view for the hosted checkout page (no webhook URL, no kid). */
export function publicView(s: SessionRow): Record<string, unknown> {
  const options: Record<string, unknown>[] = [];
  if (s.destination && s.memo) {
    const net = STELLAR_NETWORKS[s.mode];
    options.push({
      network: net.network,
      chain: "stellar",
      destination: s.destination,
      memo: s.memo,
      pay_uri: sep7PayUri({
        destination: s.destination,
        usdcAmount: s.usdcAmount,
        memo: s.memo,
        mode: s.mode,
      }),
    });
  }
  if (s.solDestination && s.solReference) {
    const net = SOLANA_NETWORKS[s.mode];
    options.push({
      network: net.network,
      chain: "solana",
      destination: s.solDestination,
      reference: s.solReference,
      pay_uri: solanaPayUri({
        recipient: s.solDestination,
        usdcAmount: s.usdcAmount,
        mint: solanaUsdcMint(s.mode),
        reference: s.solReference,
        label: s.merchantName,
        message: s.item.name,
        memo: s.id,
      }),
    });
  }
  return {
    id: s.id,
    status: s.status,
    mode: s.mode,
    merchant_name: s.merchantName,
    item: s.item,
    amount_usd: s.amountUsd,
    usdc_amount: s.usdcAmount,
    settlement_options: options,
    paid_network: s.paidNetwork,
    tx_hash: s.txHash,
    explorer_tx_url: explorerTxUrl(s),
    success_url: s.successUrl,
    cancel_url: s.cancelUrl,
    created_at: s.createdAt,
    expires_at: s.expiresAt,
  };
}

/** Create a session for a merchant (idempotent on order_id). */
export async function createSession(
  merchant: Merchant,
  input: CreateSessionInput
): Promise<{ session: SessionRow; replayed: boolean }> {
  const quote = quoteSession(input.amountUsd);
  const id = newSessionId();
  return insertSession({
    id,
    merchantKid: merchant.kid,
    merchantName: merchant.name,
    mode: merchant.mode,
    orderId: input.orderId,
    amountUsd: quote.amountUsd,
    feeUsd: quote.feeUsd,
    usdcAmount: quote.usdcAmount,
    destination: merchant.address,
    memo: merchant.address ? id : undefined,
    solDestination: merchant.solanaAddress,
    solReference: merchant.solanaAddress ? newSolanaReference() : undefined,
    item: input.item,
    metadata: input.metadata,
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    webhookUrl: input.webhookUrl,
    expiresInMinutes: input.expiresInMinutes,
  });
}

/** Fire the signed webhook for a terminal transition (best-effort). */
async function fireWebhook(s: SessionRow, type: WebhookEventType): Promise<void> {
  if (!s.webhookUrl) return;
  try {
    const event = {
      id: newEventId(),
      type,
      created: new Date().toISOString(),
      livemode: s.mode === "live",
      data: { object: merchantView(s) },
    };
    const result = await deliverWebhook(s.webhookUrl, webhookSecret(s.merchantKid), event);
    await recordWebhookResult(s.id, result.attempts, result.lastStatus);
  } catch {
    /* webhooks never break the payment flow; merchants can poll GET */
  }
}

function isPastExpiry(s: SessionRow): boolean {
  const t = Date.parse(s.expiresAt);
  return Number.isFinite(t) && t < Date.now();
}

/** Check Stellar for a settling payment. Returns a tx hash + time, or null. */
async function checkStellar(s: SessionRow): Promise<{ txHash: string; paidAt: string } | null> {
  if (!s.destination || !s.memo) return null;
  const net = STELLAR_NETWORKS[s.mode];
  const { ok, records } = await fetchRecentPayments(s.mode, s.destination);
  if (!ok) return null;
  const match = matchPayment(records, {
    destination: s.destination,
    memo: s.memo,
    minUsdc: Number(s.usdcAmount),
    usdcIssuer: net.usdcIssuer,
  });
  return match ? { txHash: match.txHash, paidAt: match.paidAt } : null;
}

/** Check Solana for a settling payment. Returns a signature + time, or null. */
async function checkSolana(s: SessionRow): Promise<{ txHash: string; paidAt: string } | null> {
  if (!s.solDestination || !s.solReference) return null;
  const { match } = await findSolanaPayment(s.mode, s.solReference, {
    recipient: s.solDestination,
    minUsdc: Number(s.usdcAmount),
  });
  return match ? { txHash: match.signature, paidAt: match.paidAt } : null;
}

/**
 * Bring a session up to date:
 *  - pending + past expiry  → mark expired (winner fires payment.failed)
 *  - pending + verify=true  → check every offered network; a matching
 *    on-chain payment marks it succeeded (winner fires payment.succeeded)
 * Returns the freshest row.
 */
export async function syncSession(
  s: SessionRow,
  opts: { verify: boolean }
): Promise<SessionRow> {
  if (s.status !== "pending") return s;

  if (isPastExpiry(s)) {
    const won = await markExpired(s.id);
    const fresh = (await getSession(s.id)) ?? s;
    if (won) await fireWebhook(fresh, "payment.failed");
    return fresh;
  }

  if (!opts.verify) return s;

  let network: "stellar" | "solana" | null = null;
  let settled: { txHash: string; paidAt: string } | null = await checkStellar(s);
  if (settled) {
    network = "stellar";
  } else {
    settled = await checkSolana(s);
    if (settled) network = "solana";
  }
  if (!settled || !network) return s;

  const won = await markSucceeded(s.id, settled.txHash, settled.paidAt, network);
  const fresh = (await getSession(s.id)) ?? s;
  if (won) await fireWebhook(fresh, "payment.succeeded");
  return fresh;
}
