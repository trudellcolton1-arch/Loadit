/**
 * LOADIT RAIL RUNTIME — core types.
 *
 * One machine, not four products: a payment intent goes in, HQ scores the
 * candidate routes, a door takes the money in, HQ converts, and the outcome
 * lands in a wallet the merchant controls. Loadit orchestrates every hop and
 * custodies none of them — there is deliberately no field anywhere in these
 * types for a private key, a seed, or a custodial balance.
 *
 * There is also deliberately NO chain/network field on the intent. The
 * customer says what they have and what the merchant should receive; HQ
 * decides how it moves. `parsePaymentIntent` rejects any attempt to smuggle
 * a chain picker back in.
 */
import type { SwapAsset } from "../swap";

export type { SwapAsset };

/** What the merchant should receive — the outcome, not the mechanism. */
export interface PaymentOutcome {
  /** Asset the merchant receives (HQ picks the settlement path for it). */
  asset: SwapAsset;
  /** Destination the merchant controls. Loadit never holds keys to it. */
  wallet: string;
}

/** Optional guardrails the payer/merchant can put on the route. */
export interface PaymentConstraints {
  /** Cap on the all-in fee, USD. Routes above it are discarded. */
  maxFeeUsd?: number;
  /** Cap on expected end-to-end time, seconds. */
  maxEtaSeconds?: number;
  /** Discard doors whose risk score exceeds this (0..1, higher = riskier). */
  maxRisk?: number;
}

/**
 * A payment intent: amount, outcome, constraints. Nothing else.
 * No chain picker — that is HQ's job.
 */
export interface PaymentIntent {
  amountUsd: number;
  outcome: PaymentOutcome;
  constraints?: PaymentConstraints;
}

/** Keys that would turn the intent back into a chain picker. Rejected. */
const FORBIDDEN_INTENT_KEYS = [
  "chain",
  "network",
  "preferredNetwork",
  "preferred",
  "rail",
] as const;

export class InvalidIntentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidIntentError";
  }
}

/**
 * Validate a raw intent object. Throws when the intent carries a
 * customer-facing chain/network selection or is structurally invalid.
 */
export function parsePaymentIntent(raw: unknown): PaymentIntent {
  if (typeof raw !== "object" || raw === null) {
    throw new InvalidIntentError("intent must be an object");
  }
  const obj = raw as Record<string, unknown>;
  const outcome = obj.outcome as Record<string, unknown> | undefined;
  for (const key of FORBIDDEN_INTENT_KEYS) {
    if (key in obj || (outcome && typeof outcome === "object" && key in outcome)) {
      throw new InvalidIntentError(
        `intent must not carry a "${key}" field — HQ picks the route; there is no customer-facing chain picker`
      );
    }
  }
  const amountUsd = Number(obj.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new InvalidIntentError("intent.amountUsd must be a positive number");
  }
  if (!outcome || typeof outcome !== "object") {
    throw new InvalidIntentError("intent.outcome is required");
  }
  const asset = outcome.asset as SwapAsset;
  const wallet = outcome.wallet;
  if (typeof asset !== "string" || !asset) {
    throw new InvalidIntentError("intent.outcome.asset is required");
  }
  if (typeof wallet !== "string" || !wallet) {
    throw new InvalidIntentError("intent.outcome.wallet is required (merchant-controlled destination)");
  }
  const constraints = (obj.constraints ?? undefined) as PaymentConstraints | undefined;
  return { amountUsd, outcome: { asset, wallet }, constraints };
}

/** The funding doors a payment can enter through. */
export type DoorKind = "cash" | "card" | "bank" | "cash_network";

/**
 * Certification status of a door. `IN_FLIGHT` is the default everywhere:
 * a door must be explicitly flipped to `CLEARED` by the owner before it may
 * confirm real customer money.
 */
export type CertificationStatus = "CLEARED" | "IN_FLIGHT";

/** A door's bid for an intent — the raw material HQ scores. */
export interface DoorCandidate {
  doorId: string;
  kind: DoorKind;
  label: string;
  /** All-in intake fee for this door, USD. */
  feeUsd: number;
  /** Expected end-to-end seconds through this door. */
  etaSeconds: number;
  /** Liquidity depth, 0..1 (higher = deeper). */
  liquidity: number;
  /** Risk, 0..1 (higher = riskier). */
  risk: number;
  certification: CertificationStatus;
  /** True for doors that exist behind the interface but are not wired yet. */
  stub?: boolean;
}

export type RouteLegKind = "intake" | "convert" | "payout";

export interface RouteLeg {
  kind: RouteLegKind;
  via: string;
  detail: string;
}

/** One candidate route after HQ scored it. */
export interface ScoredRoute {
  routeId: string;
  doorId: string;
  doorLabel: string;
  legs: RouteLeg[];
  feeUsd: number;
  etaSeconds: number;
  /** Blended 0..100 score (higher wins). */
  score: number;
  breakdown: {
    fee: number;
    time: number;
    liquidity: number;
    risk: number;
    certification: number;
  };
  /** True only when the door is CLEARED to confirm real customer money. */
  confirmable: boolean;
  settlement: "non_custodial";
}

/** A quote HQ locked for a payment. Expires at `expiresAt`. */
export interface LockedQuote {
  quoteId: string;
  paymentId: string;
  route: ScoredRoute;
  amountUsd: number;
  /** Loadit's convenience fee on the conversion (0.75%, $1 min). */
  loaditFeeUsd: number;
  ttlMs: number;
  lockedAt: number;
  expiresAt: number;
  /** Set on quotes minted by a heal — the payment id never changes. */
  healed?: boolean;
}

export type DoorIntakeStatus = "pending" | "confirmed" | "cancelled" | "failed";

/**
 * A door intake record. `internalRef` is a Loadit-internal reference
 * (prefix `ldi_`) — it is NOT a partner transaction id and must never be
 * presented as one. `partnerTxId` is null until a real partner webhook
 * supplies one; no code in this runtime may synthesize it.
 */
export interface DoorIntake {
  internalRef: string;
  doorId: string;
  paymentId: string;
  amountUsd: number;
  status: DoorIntakeStatus;
  /** Partner/anchor transaction id — only ever set from a partner webhook. */
  partnerTxId: string | null;
  createdAt: string;
  instructions?: string;
}

export interface DoorWebhookEvent {
  internalRef: string;
  type: "intake_confirmed" | "intake_failed";
  /** Present only when the partner's system sent one. Never invented. */
  partnerTxId?: string;
  raw?: unknown;
}

export interface DoorCreateRequest {
  paymentId: string;
  amountUsd: number;
  asset: SwapAsset;
  /** Retries with the same key must return the same intake — never a second charge. */
  idempotencyKey: string;
}

/**
 * The door adapter contract. Every funding door — MoneyGram cash first,
 * card/bank/next-cash-network behind the same interface — implements this.
 */
export interface DoorAdapter {
  readonly id: string;
  readonly kind: DoorKind;
  readonly label: string;
  certification(): CertificationStatus;
  /** Bid on an intent, or null when the door cannot serve it. */
  candidate(intent: PaymentIntent): DoorCandidate | null;
  create(req: DoorCreateRequest): Promise<DoorIntake>;
  status(internalRef: string): Promise<DoorIntake>;
  webhook(event: DoorWebhookEvent): Promise<DoorIntake>;
  cancel(internalRef: string): Promise<DoorIntake>;
}

/** Receipt for a completed payout. `replayed` marks an idempotent replay. */
export interface PayoutReceipt {
  /** Loadit-internal receipt ref (`ldi_…`) — not a partner/production tx id. */
  receiptRef: string;
  idempotencyKey: string;
  paymentId: string;
  routeId: string;
  amountUsd: number;
  deliveredTo: string;
  at: string;
  replayed: boolean;
}

/**
 * Executes the payout leg (liquidity provider / delivery to the merchant's
 * wallet). Implementations MUST be idempotent on `idempotencyKey`: a retry
 * with the same key returns the original receipt and never pays twice.
 */
export interface PayoutExecutor {
  payout(req: {
    idempotencyKey: string;
    paymentId: string;
    routeId: string;
    amountUsd: number;
    wallet: string;
  }): Promise<PayoutReceipt>;
}

/** Executes the convert leg (e.g. USDC → outcome asset). */
export interface ConvertExecutor {
  convert(req: {
    idempotencyKey: string;
    paymentId: string;
    routeId: string;
    amountUsd: number;
    asset: SwapAsset;
  }): Promise<void>;
}
