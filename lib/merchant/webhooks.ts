/**
 * SIGNED MERCHANT WEBHOOKS
 *
 * Events are POSTed as JSON with an HMAC-SHA256 signature over
 * `${timestamp}.${rawBody}` using the merchant's `whsec_…` secret, in the
 * Stripe-style header:
 *
 *   loadit-signature: t=1712345678,v1=<hex hmac>
 *
 * Merchants verify by recomputing the HMAC over the exact raw body and
 * comparing in constant time, rejecting stale timestamps (replay guard).
 * verifyWebhookSignature below is the reference implementation — the docs
 * tell merchants to copy it verbatim.
 *
 * Delivery is best-effort with in-request retries (serverless has no durable
 * queue here); merchants should treat webhooks as a trigger and GET the
 * session for authoritative state, or poll if a delivery is missed.
 */
import crypto from "crypto";

export const SIGNATURE_HEADER = "loadit-signature";
export const DEFAULT_TOLERANCE_SEC = 300;

export type WebhookEventType = "payment.succeeded" | "payment.failed";

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  created: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

export function newEventId(): string {
  return "evt_" + crypto.randomBytes(9).toString("hex");
}

function hmacHex(secret: string, data: string): string {
  return crypto.createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

/** Build the `loadit-signature` header value for a raw body. */
export function signWebhook(secret: string, rawBody: string, timestampSec: number): string {
  return `t=${timestampSec},v1=${hmacHex(secret, `${timestampSec}.${rawBody}`)}`;
}

/**
 * Verify a `loadit-signature` header against the exact raw request body.
 * Returns false for bad signatures, malformed headers, or stale timestamps.
 */
export function verifyWebhookSignature(
  secret: string,
  signatureHeader: string,
  rawBody: string,
  toleranceSec: number = DEFAULT_TOLERANCE_SEC,
  nowSec: number = Math.floor(Date.now() / 1000)
): boolean {
  if (!secret || !signatureHeader) return false;
  const parts = new Map<string, string>();
  for (const seg of signatureHeader.split(",")) {
    const eq = seg.indexOf("=");
    if (eq > 0) parts.set(seg.slice(0, eq).trim(), seg.slice(eq + 1).trim());
  }
  const t = Number(parts.get("t"));
  const v1 = parts.get("v1") || "";
  if (!Number.isFinite(t) || !/^[0-9a-f]{64}$/.test(v1)) return false;
  if (Math.abs(nowSec - t) > toleranceSec) return false;
  const expected = hmacHex(secret, `${t}.${rawBody}`);
  return crypto.timingSafeEqual(Buffer.from(v1), Buffer.from(expected));
}

export interface DeliveryResult {
  delivered: boolean;
  attempts: number;
  lastStatus: number | null;
}

const RETRY_DELAYS_MS = [0, 2000, 5000];

/** POST a signed event to the merchant's webhook URL, retrying briefly. */
export async function deliverWebhook(
  url: string,
  secret: string,
  event: WebhookEvent
): Promise<DeliveryResult> {
  const rawBody = JSON.stringify(event);
  let lastStatus: number | null = null;

  for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt++) {
    if (RETRY_DELAYS_MS[attempt] > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [SIGNATURE_HEADER]: signWebhook(secret, rawBody, Math.floor(Date.now() / 1000)),
          "loadit-event-id": event.id,
          "User-Agent": "Loadit-Webhooks/1.0",
        },
        body: rawBody,
        signal: controller.signal,
      });
      lastStatus = res.status;
      if (res.ok) return { delivered: true, attempts: attempt + 1, lastStatus };
    } catch {
      lastStatus = null; // network error / timeout
    } finally {
      clearTimeout(timer);
    }
  }
  return { delivered: false, attempts: RETRY_DELAYS_MS.length, lastStatus };
}
