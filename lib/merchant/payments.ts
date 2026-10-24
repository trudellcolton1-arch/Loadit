/**
 * MERCHANT PAYMENTS — orchestration shared by the API routes and the hosted
 * checkout: create sessions, lazily expire them, verify settlement on-chain,
 * and fire the signed webhook exactly once per terminal transition (the store
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
import { deliverWebhook, newEventId, type WebhookEventType } from "./webhooks";

export function checkoutUrl(id: string): string {
  return `${SITE.url}/checkout/${id}`;
}

/** Full session view for the merchant API (and webhook payloads). */
export function merchantView(s: SessionRow): Record<string, unknown> {
  const net = STELLAR_NETWORKS[s.mode];
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
      network: net.network,
      destination: s.destination,
      memo: s.memo,
      non_custodial: true,
    },
    item: s.item,
    metadata: s.metadata ?? {},
    tx_hash: s.txHash,
    paid_at: s.paidAt,
    failure_reason: s.failureReason,
    created_at: s.createdAt,
    expires_at: s.expiresAt,
  };
}

/** Public-safe view for the hosted checkout page (no webhook URL, no kid). */
export function publicView(s: SessionRow): Record<string, unknown> {
  const net = STELLAR_NETWORKS[s.mode];
  return {
    id: s.id,
    status: s.status,
    mode: s.mode,
    merchant_name: s.merchantName,
    item: s.item,
    amount_usd: s.amountUsd,
    usdc_amount: s.usdcAmount,
    network: net.network,
    usdc_issuer: net.usdcIssuer,
    destination: s.destination,
    memo: s.memo,
    sep7_uri: sep7PayUri({
      destination: s.destination,
      usdcAmount: s.usdcAmount,
      memo: s.memo,
      mode: s.mode,
    }),
    tx_hash: s.txHash,
    explorer_tx_url: s.txHash ? `${net.explorerTx}${s.txHash}` : null,
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
    memo: id,
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

/**
 * Bring a session up to date:
 *  - pending + past expiry  → mark expired (winner fires payment.failed)
 *  - pending + verify=true  → check Horizon; a matching on-chain payment
 *    marks it succeeded (winner fires payment.succeeded)
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

  const net = STELLAR_NETWORKS[s.mode];
  const { ok, records } = await fetchRecentPayments(s.mode, s.destination);
  if (!ok) return s; // Horizon hiccup — stay pending, caller can retry

  const match = matchPayment(records, {
    destination: s.destination,
    memo: s.memo,
    minUsdc: Number(s.usdcAmount),
    usdcIssuer: net.usdcIssuer,
  });
  if (!match) return s;

  const won = await markSucceeded(s.id, match.txHash, match.paidAt);
  const fresh = (await getSession(s.id)) ?? s;
  if (won) await fireWebhook(fresh, "payment.succeeded");
  return fresh;
}
