/**
 * CHECKOUT SESSION — pure types, validation, and quoting.
 *
 * Everything here is side-effect free so the economics and input rules are
 * unit-testable. The fee is Loadit's standard convenience fee (0.75%, $1
 * minimum — lib/aero's calcLoaditFee). Because settlement is non-custodial
 * (buyer pays the merchant's address directly), the fee can't be deducted in
 * flight: it's recorded on every session and billed to the merchant.
 */
import crypto from "crypto";
import { calcLoaditFee, LOADIT_FEE_PCT, LOADIT_FEE_MIN_USD } from "../aero";

export type SessionStatus = "pending" | "succeeded" | "expired";

export interface CheckoutItem {
  name: string;
  sku?: string;
  image_url?: string;
}

export interface CreateSessionInput {
  amountUsd: number;
  orderId: string;
  item: CheckoutItem;
  successUrl: string;
  cancelUrl: string;
  webhookUrl?: string;
  metadata?: Record<string, string>;
  expiresInMinutes: number;
}

export const MIN_AMOUNT_USD = 0.5;
export const MAX_AMOUNT_USD = 50_000;
export const DEFAULT_EXPIRES_MINUTES = 60;
export const MIN_EXPIRES_MINUTES = 5;
export const MAX_EXPIRES_MINUTES = 1440;

/** Stellar text memos are capped at 28 bytes — session ids must always fit. */
export const MEMO_MAX_BYTES = 28;

export type ValidationResult =
  | { ok: true; input: CreateSessionInput }
  | { ok: false; reason: string; message: string };

const ORDER_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;

function err(reason: string, message: string): ValidationResult {
  return { ok: false, reason, message };
}

function validUrl(raw: unknown, { allowHttpLocalhost }: { allowHttpLocalhost: boolean }): string | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 500) return null;
  try {
    const u = new URL(raw);
    if (u.protocol === "https:") return u.toString();
    if (
      u.protocol === "http:" &&
      allowHttpLocalhost &&
      (u.hostname === "localhost" || u.hostname === "127.0.0.1")
    ) {
      return u.toString();
    }
    return null;
  } catch {
    return null;
  }
}

/** Validate + normalize a raw create-session request body. */
export function validateCreateSession(
  raw: Record<string, unknown>,
  opts: { allowHttpLocalhost: boolean }
): ValidationResult {
  const amountUsd = Number(raw.amount_usd ?? raw.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd < MIN_AMOUNT_USD || amountUsd > MAX_AMOUNT_USD) {
    return err(
      "invalid_amount",
      `amount_usd must be a number between ${MIN_AMOUNT_USD} and ${MAX_AMOUNT_USD}.`
    );
  }

  const orderId = String(raw.order_id ?? raw.orderId ?? "").trim();
  if (!ORDER_ID.test(orderId)) {
    return err(
      "invalid_order_id",
      "order_id is required: 1-64 chars of letters, digits, '_', '.', ':' or '-'."
    );
  }

  const rawItem = (raw.item ?? {}) as Record<string, unknown>;
  const itemName = String(rawItem.name ?? "").trim();
  if (!itemName || itemName.length > 80) {
    return err("invalid_item", "item.name is required (max 80 chars).");
  }
  const item: CheckoutItem = { name: itemName };
  if (typeof rawItem.sku === "string" && rawItem.sku.trim()) {
    item.sku = rawItem.sku.trim().slice(0, 64);
  }
  if (rawItem.image_url !== undefined) {
    const img = validUrl(rawItem.image_url, { allowHttpLocalhost: false });
    if (!img) return err("invalid_item_image", "item.image_url must be a valid https URL.");
    item.image_url = img;
  }

  const successUrl = validUrl(raw.success_url ?? raw.successUrl, opts);
  if (!successUrl) return err("invalid_success_url", "success_url must be a valid https URL.");
  const cancelUrl = validUrl(raw.cancel_url ?? raw.cancelUrl, opts);
  if (!cancelUrl) return err("invalid_cancel_url", "cancel_url must be a valid https URL.");

  let webhookUrl: string | undefined;
  if (raw.webhook_url !== undefined && raw.webhook_url !== null && raw.webhook_url !== "") {
    const wh = validUrl(raw.webhook_url, opts);
    if (!wh) return err("invalid_webhook_url", "webhook_url must be a valid https URL.");
    webhookUrl = wh;
  }

  let metadata: Record<string, string> | undefined;
  if (raw.metadata !== undefined && raw.metadata !== null) {
    if (typeof raw.metadata !== "object" || Array.isArray(raw.metadata)) {
      return err("invalid_metadata", "metadata must be an object of string values.");
    }
    const entries = Object.entries(raw.metadata as Record<string, unknown>);
    if (entries.length > 20) return err("invalid_metadata", "metadata is limited to 20 keys.");
    metadata = {};
    for (const [k, v] of entries) {
      if (k.length > 40 || typeof v !== "string" || v.length > 200) {
        return err(
          "invalid_metadata",
          "metadata keys are limited to 40 chars and values to 200-char strings."
        );
      }
      metadata[k] = v;
    }
    if (JSON.stringify(metadata).length > 2000) {
      return err("invalid_metadata", "metadata is limited to 2000 serialized chars.");
    }
  }

  let expiresInMinutes = DEFAULT_EXPIRES_MINUTES;
  if (raw.expires_in_minutes !== undefined) {
    const m = Number(raw.expires_in_minutes);
    if (!Number.isFinite(m) || m < MIN_EXPIRES_MINUTES || m > MAX_EXPIRES_MINUTES) {
      return err(
        "invalid_expires",
        `expires_in_minutes must be between ${MIN_EXPIRES_MINUTES} and ${MAX_EXPIRES_MINUTES}.`
      );
    }
    expiresInMinutes = Math.round(m);
  }

  return {
    ok: true,
    input: {
      amountUsd: Math.round(amountUsd * 100) / 100,
      orderId,
      item,
      successUrl,
      cancelUrl,
      webhookUrl,
      metadata,
      expiresInMinutes,
    },
  };
}

/** New session id — doubles as the on-chain memo, so it must fit 28 bytes. */
export function newSessionId(): string {
  return "lp_" + crypto.randomBytes(8).toString("hex"); // 19 ASCII chars
}

export function isValidSessionId(id: string): boolean {
  return /^lp_[0-9a-f]{16}$/.test(id);
}

/** The session's quote: fee applied + the exact USDC the buyer must send. */
export interface SessionQuote {
  amountUsd: number;
  /** Loadit's convenience fee (0.75%, $1 min) — recorded, billed to merchant. */
  feeUsd: number;
  feePct: number;
  feeMinUsd: number;
  /** USDC the buyer sends (1 USDC = $1): the item amount, to the cent. */
  usdcAmount: string;
}

export function quoteSession(amountUsd: number): SessionQuote {
  return {
    amountUsd,
    feeUsd: calcLoaditFee(amountUsd),
    feePct: LOADIT_FEE_PCT,
    feeMinUsd: LOADIT_FEE_MIN_USD,
    usdcAmount: amountUsd.toFixed(2),
  };
}
