/**
 * MERCHANT PAYMENT STORE — Loadit-owned table over Neon's HTTPS SQL endpoint,
 * the same serverless persistence pattern lib/quantum.ts uses for receipts
 * (raw Postgres/5432 isn't reachable from Vercel; the HTTP endpoint is the
 * supported path). Connection resolves from MERCHANT_DATABASE_URL, falling
 * back to the database the quantum receipts already live in.
 *
 * The table is created lazily on first use (`create table if not exists`), so
 * no migration step is required to deploy. The unique (merchant_kid, order_id)
 * index is what makes session creation idempotent per merchant order, and
 * the guarded `update … where status='pending'` transitions are what make
 * settle/expire race-safe (exactly one caller wins, so exactly one webhook).
 */
import type { CheckoutItem, SessionStatus } from "./session";
import type { MerchantMode } from "./keys";

export interface SessionRow {
  id: string;
  merchantKid: string;
  merchantName: string;
  mode: MerchantMode;
  orderId: string;
  amountUsd: number;
  feeUsd: number;
  usdcAmount: string;
  /** Merchant's own Stellar address — where the buyer's USDC lands. */
  destination: string;
  /** On-chain text memo that ties the payment to this session (= id). */
  memo: string;
  item: CheckoutItem;
  metadata: Record<string, string> | null;
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string | null;
  status: SessionStatus;
  txHash: string | null;
  paidAt: string | null;
  failureReason: string | null;
  webhookAttempts: number;
  webhookLastStatus: number | null;
  createdAt: string;
  expiresAt: string;
}

function dbUrl(): string | undefined {
  return (
    process.env.MERCHANT_DATABASE_URL ||
    process.env.HQ_CONTENT_DATABASE_URL ||
    process.env.HYLAQ_DATABASE_URL
  );
}

export function merchantStoreConfigured(): boolean {
  return Boolean(dbUrl());
}

async function dbQuery<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const conn = dbUrl();
  if (!conn) throw new Error("merchant store not configured");
  const host = new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`merchant db ${res.status}`);
    const data = (await res.json()) as { rows?: T[] };
    return data.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

let ensured: Promise<void> | null = null;

/** Create the table + indexes once per warm instance. */
function ensureTable(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      await dbQuery(`
        create table if not exists loadit_merchant_payment (
          id text primary key,
          merchant_kid text not null,
          merchant_name text not null,
          mode text not null,
          order_id text not null,
          amount_usd numeric(12,2) not null,
          fee_usd numeric(12,2) not null,
          usdc_amount text not null,
          destination text not null,
          memo text not null,
          item text not null,
          metadata text,
          success_url text not null,
          cancel_url text not null,
          webhook_url text,
          status text not null default 'pending',
          tx_hash text,
          paid_at timestamptz,
          failure_reason text,
          webhook_attempts int not null default 0,
          webhook_last_status int,
          created_at timestamptz not null default now(),
          expires_at timestamptz not null
        )`);
      await dbQuery(
        `create unique index if not exists loadit_merchant_payment_order
         on loadit_merchant_payment (merchant_kid, order_id)`
      );
    })().catch((e) => {
      ensured = null; // let the next call retry
      throw e;
    });
  }
  return ensured;
}

function toRow(r: Record<string, unknown>): SessionRow {
  let item: CheckoutItem = { name: "" };
  let metadata: Record<string, string> | null = null;
  try {
    item = JSON.parse(String(r.item)) as CheckoutItem;
  } catch {
    /* unreadable item blob — keep placeholder */
  }
  try {
    if (r.metadata) metadata = JSON.parse(String(r.metadata)) as Record<string, string>;
  } catch {
    /* metadata is optional */
  }
  return {
    id: String(r.id),
    merchantKid: String(r.merchant_kid),
    merchantName: String(r.merchant_name),
    mode: r.mode === "live" ? "live" : "test",
    orderId: String(r.order_id),
    amountUsd: Number(r.amount_usd),
    feeUsd: Number(r.fee_usd),
    usdcAmount: String(r.usdc_amount),
    destination: String(r.destination),
    memo: String(r.memo),
    item,
    metadata,
    successUrl: String(r.success_url),
    cancelUrl: String(r.cancel_url),
    webhookUrl: r.webhook_url ? String(r.webhook_url) : null,
    status: (["pending", "succeeded", "expired"].includes(String(r.status))
      ? String(r.status)
      : "pending") as SessionStatus,
    txHash: r.tx_hash ? String(r.tx_hash) : null,
    paidAt: r.paid_at ? String(r.paid_at) : null,
    failureReason: r.failure_reason ? String(r.failure_reason) : null,
    webhookAttempts: Number(r.webhook_attempts ?? 0),
    webhookLastStatus: r.webhook_last_status === null || r.webhook_last_status === undefined
      ? null
      : Number(r.webhook_last_status),
    createdAt: String(r.created_at),
    expiresAt: String(r.expires_at),
  };
}

const COLS = `id, merchant_kid, merchant_name, mode, order_id, amount_usd, fee_usd,
  usdc_amount, destination, memo, item, metadata, success_url, cancel_url,
  webhook_url, status, tx_hash, paid_at, failure_reason, webhook_attempts,
  webhook_last_status, created_at, expires_at`;

/**
 * Insert a session. If the merchant already created one for this order_id
 * (idempotent retry), the existing row is returned with `replayed: true`.
 */
export async function insertSession(input: {
  id: string;
  merchantKid: string;
  merchantName: string;
  mode: MerchantMode;
  orderId: string;
  amountUsd: number;
  feeUsd: number;
  usdcAmount: string;
  destination: string;
  memo: string;
  item: CheckoutItem;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
  expiresInMinutes: number;
}): Promise<{ session: SessionRow; replayed: boolean }> {
  await ensureTable();
  const inserted = await dbQuery<Record<string, unknown>>(
    `insert into loadit_merchant_payment
       (id, merchant_kid, merchant_name, mode, order_id, amount_usd, fee_usd,
        usdc_amount, destination, memo, item, metadata, success_url, cancel_url,
        webhook_url, status, expires_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'pending',
             now() + ($16 || ' minutes')::interval)
     on conflict (merchant_kid, order_id) do nothing
     returning ${COLS}`,
    [
      input.id,
      input.merchantKid,
      input.merchantName,
      input.mode,
      input.orderId,
      input.amountUsd,
      input.feeUsd,
      input.usdcAmount,
      input.destination,
      input.memo,
      JSON.stringify(input.item),
      input.metadata ? JSON.stringify(input.metadata) : null,
      input.successUrl,
      input.cancelUrl,
      input.webhookUrl ?? null,
      String(input.expiresInMinutes),
    ]
  );
  if (inserted.length) return { session: toRow(inserted[0]), replayed: false };

  // Conflict → idempotent replay of an existing order.
  const existing = await dbQuery<Record<string, unknown>>(
    `select ${COLS} from loadit_merchant_payment
     where merchant_kid = $1 and order_id = $2 limit 1`,
    [input.merchantKid, input.orderId]
  );
  if (!existing.length) throw new Error("insert conflict but row not found");
  return { session: toRow(existing[0]), replayed: true };
}

export async function getSession(id: string): Promise<SessionRow | null> {
  await ensureTable();
  const rows = await dbQuery<Record<string, unknown>>(
    `select ${COLS} from loadit_merchant_payment where id = $1 limit 1`,
    [id]
  );
  return rows.length ? toRow(rows[0]) : null;
}

/**
 * Transition pending → succeeded. Returns true only for the caller that won
 * the transition (guards double webhooks under concurrent verification).
 */
export async function markSucceeded(
  id: string,
  txHash: string,
  paidAt: string
): Promise<boolean> {
  await ensureTable();
  const rows = await dbQuery<{ id: string }>(
    `update loadit_merchant_payment
     set status = 'succeeded', tx_hash = $2, paid_at = $3
     where id = $1 and status = 'pending'
     returning id`,
    [id, txHash, paidAt]
  );
  return rows.length > 0;
}

/** Transition pending → expired (only if actually past expires_at). */
export async function markExpired(id: string): Promise<boolean> {
  await ensureTable();
  const rows = await dbQuery<{ id: string }>(
    `update loadit_merchant_payment
     set status = 'expired', failure_reason = 'expired'
     where id = $1 and status = 'pending' and expires_at < now()
     returning id`,
    [id]
  );
  return rows.length > 0;
}

/** Record the outcome of a webhook delivery attempt batch. */
export async function recordWebhookResult(
  id: string,
  attempts: number,
  lastStatus: number | null
): Promise<void> {
  await ensureTable();
  await dbQuery(
    `update loadit_merchant_payment
     set webhook_attempts = webhook_attempts + $2, webhook_last_status = $3
     where id = $1`,
    [id, attempts, lastStatus]
  );
}
