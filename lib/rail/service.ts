/**
 * RAIL SERVICE — the lib/rail machine behind the authenticated /api/rail
 * route the Loadit app talks to. One process-wide runtime per mode (the same
 * warm-instance pattern lib/moneygramSandbox.ts uses for practice runs).
 *
 * Two modes, labeled honestly everywhere:
 *
 *  - "live":  MoneyGram cash is door one (card/bank/next-cash-network stubs
 *             bid behind the same interface). MoneyGram cash-in is NOT live —
 *             certification is in flight — so a cash confirm is REFUSED until
 *             the owner sets MONEYGRAM_CASH_IN_CERT=CLEARED. Nothing past
 *             intake can happen in this mode today, and that is the point.
 *
 *  - "sim":   fixture doors + fixture executors, simulated money, so the full
 *             machine (confirm → convert → payout, dead pipes, heal under the
 *             same payment id, idempotent payout) can be exercised end to end.
 *             Every response says it is simulated.
 *
 * Non-custodial in both modes: no keys, no balances, delivery only to the
 * wallet in the intent.
 */
import { RailRuntime, type PaymentRecord } from "./runtime";
import { MoneyGramDoor, moneygramCertification } from "./doors/moneygram";
import { cardDoorStub, bankDoorStub, nextCashNetworkDoorStub } from "./doors/stubs";
import { FixtureDoor } from "./doors/fixture";
import { FixturePayoutExecutor, FixtureConvertExecutor } from "./executors";
import {
  CertificationGateError,
  HealRefusedError,
  IllegalTransitionError,
  NoViableRouteError,
  QuoteExpiredError,
  StubDoorError,
} from "./errors";
import { InvalidIntentError } from "./types";

export type RailMode = "live" | "sim";

interface ModeRig {
  runtime: RailRuntime;
  payout: FixturePayoutExecutor;
  convert: FixtureConvertExecutor;
  simulated: boolean;
}

function buildLiveRig(): ModeRig {
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({
    doors: [new MoneyGramDoor(), cardDoorStub(), bankDoorStub(), nextCashNetworkDoorStub()],
    payout,
    convert,
  });
  return { runtime, payout, convert, simulated: false };
}

function buildSimRig(): ModeRig {
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({
    doors: [
      new FixtureDoor({
        id: "sim_cash_door",
        kind: "cash",
        label: "Simulated cash door (test money)",
        certification: "CLEARED",
        feeUsd: 1.2,
        etaSeconds: 420,
        liquidity: 0.85,
        risk: 0.15,
      }),
      new FixtureDoor({
        id: "sim_bank_door",
        kind: "bank",
        label: "Simulated bank door (test money)",
        certification: "CLEARED",
        feeUsd: 0.9,
        etaSeconds: 3600,
        liquidity: 0.95,
        risk: 0.1,
      }),
    ],
    payout,
    convert,
  });
  return { runtime, payout, convert, simulated: true };
}

interface ServiceState {
  live: ModeRig;
  sim: ModeRig;
}

/** Survives Next.js dev HMR and per-request module contexts on a warm instance. */
function serviceState(): ServiceState {
  const g = globalThis as { __loaditRailService?: ServiceState };
  if (!g.__loaditRailService) {
    g.__loaditRailService = { live: buildLiveRig(), sim: buildSimRig() };
  }
  return g.__loaditRailService;
}

function rigFor(mode: RailMode): ModeRig {
  return serviceState()[mode];
}

/** Test-only: rebuild both rigs so tests do not share state. */
export function resetRailServiceForTests(): void {
  (globalThis as { __loaditRailService?: ServiceState }).__loaditRailService = undefined;
}

const LIVE_NOTICE =
  "MoneyGram cash-in is NOT live — certification is in flight with MoneyGram. Cash confirms are refused until the owner clears certification.";
const SIM_NOTICE = "Simulated doors and simulated money — nothing real moves in this mode.";

/** Wire-safe view of a payment (already plain data; picked explicitly). */
export function serializePayment(p: PaymentRecord) {
  return {
    id: p.id,
    state: p.state,
    healCount: p.healCount,
    lastError: p.lastError,
    intent: p.intent,
    quote: {
      quoteId: p.quote.quoteId,
      amountUsd: p.quote.amountUsd,
      loaditFeeUsd: p.quote.loaditFeeUsd,
      ttlMs: p.quote.ttlMs,
      lockedAt: p.quote.lockedAt,
      expiresAt: p.quote.expiresAt,
      healed: Boolean(p.quote.healed),
      route: {
        routeId: p.quote.route.routeId,
        doorId: p.quote.route.doorId,
        doorLabel: p.quote.route.doorLabel,
        score: p.quote.route.score,
        feeUsd: p.quote.route.feeUsd,
        etaSeconds: p.quote.route.etaSeconds,
        confirmable: p.quote.route.confirmable,
        settlement: p.quote.route.settlement,
        legs: p.quote.route.legs,
      },
    },
    quoteCount: p.quotes.length,
    intake: p.intake
      ? {
          internalRef: p.intake.internalRef,
          doorId: p.intake.doorId,
          status: p.intake.status,
          partnerTxId: p.intake.partnerTxId,
          instructions: p.intake.instructions ?? null,
        }
      : null,
    receipt: p.receipt
      ? {
          receiptRef: p.receipt.receiptRef,
          amountUsd: p.receipt.amountUsd,
          deliveredTo: p.receipt.deliveredTo,
          replayed: p.receipt.replayed,
          at: p.receipt.at,
        }
      : null,
    history: p.history,
  };
}

export interface RailActionRequest {
  action?: string;
  mode?: string;
  paymentId?: string;
  intent?: unknown;
  pipe?: string;
}

export interface RailActionResult {
  status: number;
  payload: Record<string, unknown>;
}

function meta(mode: RailMode, rig: ModeRig) {
  return {
    mode,
    simulated: rig.simulated,
    moneygram_certification: moneygramCertification(),
    notice: rig.simulated ? SIM_NOTICE : LIVE_NOTICE,
    payouts_recorded: rig.payout.ledger.length,
    settlement: "non_custodial" as const,
  };
}

function errorResult(
  mode: RailMode,
  rig: ModeRig,
  err: unknown,
  payment?: PaymentRecord
): RailActionResult {
  const message = err instanceof Error ? err.message : String(err);
  const withPayment = payment ? { payment: serializePayment(payment) } : {};
  if (err instanceof HealRefusedError) {
    return {
      status: 409,
      payload: {
        ok: false,
        reason: err.refusal,
        message,
        ...withPayment,
        ...meta(mode, rig),
      },
    };
  }
  if (err instanceof CertificationGateError) {
    return {
      status: 409,
      payload: {
        ok: false,
        reason: "certification_gate",
        message,
        ...withPayment,
        ...meta(mode, rig),
      },
    };
  }
  if (err instanceof InvalidIntentError) {
    return { status: 400, payload: { ok: false, reason: "invalid_intent", message, ...meta(mode, rig) } };
  }
  if (err instanceof QuoteExpiredError) {
    return { status: 409, payload: { ok: false, reason: "quote_expired", message, ...withPayment, ...meta(mode, rig) } };
  }
  if (err instanceof IllegalTransitionError) {
    return { status: 409, payload: { ok: false, reason: "illegal_transition", message, ...withPayment, ...meta(mode, rig) } };
  }
  if (err instanceof NoViableRouteError) {
    return { status: 422, payload: { ok: false, reason: "no_viable_route", message, ...withPayment, ...meta(mode, rig) } };
  }
  if (err instanceof StubDoorError) {
    return { status: 409, payload: { ok: false, reason: "stub_door", message, ...withPayment, ...meta(mode, rig) } };
  }
  if (/^unknown payment /.test(message)) {
    return { status: 404, payload: { ok: false, reason: "unknown_payment", message, ...meta(mode, rig) } };
  }
  console.error("[rail] action failed:", message);
  return { status: 500, payload: { ok: false, reason: "internal", message: "rail action failed", ...meta(mode, rig) } };
}

/**
 * Execute one rail action for an ALREADY-AUTHORIZED owner request.
 * (Authorization lives in ownerGate.ts and the route handler — this function
 * must never be reachable without it.)
 */
export async function handleRailAction(body: RailActionRequest): Promise<RailActionResult> {
  const mode: RailMode = body.mode === "sim" ? "sim" : "live";
  const rig = rigFor(mode);
  const { runtime } = rig;

  const ok = (payment: PaymentRecord, extra: Record<string, unknown> = {}): RailActionResult => ({
    status: 200,
    payload: { ok: true, payment: serializePayment(payment), ...meta(mode, rig), ...extra },
  });

  try {
    switch (body.action) {
      case "create": {
        const payment = runtime.createPayment(body.intent);
        return ok(payment);
      }
      case "get": {
        return ok(runtime.getPayment(String(body.paymentId || "")));
      }
      case "intake": {
        const payment = await runtime.beginIntake(String(body.paymentId || ""));
        return ok(payment);
      }
      case "confirm": {
        // Simulated webhook trigger (a real anchor would call the webhook
        // itself). The door's certification gate decides — in live mode the
        // MoneyGram door refuses while certification is IN FLIGHT.
        const payment = runtime.getPayment(String(body.paymentId || ""));
        if (!payment.intake) {
          return {
            status: 409,
            payload: { ok: false, reason: "no_intake", message: "no intake to confirm — begin intake first", ...meta(mode, rig) },
          };
        }
        const updated = await runtime.handleWebhook(payment.intake.doorId, {
          internalRef: payment.intake.internalRef,
          type: "intake_confirmed",
        });
        return ok(updated);
      }
      case "settle": {
        const payment = await runtime.settle(String(body.paymentId || ""));
        return ok(payment);
      }
      case "heal": {
        const payment = await runtime.heal(String(body.paymentId || ""));
        return ok(payment);
      }
      case "kill_pipe": {
        // Sabotage is a test affordance — simulated mode only, so the "live"
        // surface can never be wired to fake failures (or fake successes).
        if (!rig.simulated) {
          return {
            status: 400,
            payload: { ok: false, reason: "sim_only", message: "kill_pipe is only available in simulated mode", ...meta(mode, rig) },
          };
        }
        const pipe = body.pipe === "convert" ? "convert" : "payout";
        if (pipe === "convert") rig.convert.killNext("simulated: convert pipe killed");
        else rig.payout.killNext("before", "simulated: payout pipe killed mid-pay");
        const payment = runtime.getPayment(String(body.paymentId || ""));
        return ok(payment, { pipe_killed: pipe });
      }
      default:
        return {
          status: 400,
          payload: { ok: false, reason: "unknown_action", message: `unknown action "${String(body.action)}"`, ...meta(mode, rig) },
        };
    }
  } catch (err) {
    let payment: PaymentRecord | undefined;
    try {
      if (body.paymentId) payment = runtime.getPayment(String(body.paymentId));
    } catch {
      /* unknown payment — leave it off the error body */
    }
    return errorResult(mode, rig, err, payment);
  }
}
