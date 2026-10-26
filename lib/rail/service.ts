/**
 * RAIL SERVICE — the lib/rail machine behind the authenticated /api/rail
 * route the Loadit app talks to. One process-wide runtime per mode (the same
 * warm-instance pattern lib/moneygramSandbox.ts uses for practice runs).
 *
 * Two modes, labeled honestly everywhere:
 *
 *  - "live":  MoneyGram cash is door one (card/bank/next-cash-network stubs
 *             bid behind the same interface). Certification is complete (5/5),
 *             but consumer cash-in is not live yet — it launches with the
 *             production build — so a cash confirm is REFUSED until the owner
 *             sets MONEYGRAM_CASH_IN_CERT=CLEARED in the production runtime.
 *             Nothing past intake can happen in this mode today.
 *
 *  - "sim":   fixture doors + fixture executors, simulated money, so the full
 *             machine (confirm → convert → payout, dead pipes, heal under the
 *             same payment id, idempotent payout) can be exercised end to end.
 *             Every response says it is simulated.
 *
 * Non-custodial in both modes: no keys, delivery only to the wallet in the
 * intent. The audit ledger (lib/rail/ledger.ts) records pipeline position
 * in integer minor units; it is not a custodial balance.
 */
import { RailRuntime, type PaymentRecord } from "./runtime";
import { CASH_CERT_NOTICE } from "./copy";
import { MoneyGramDoor, moneygramCertification } from "./doors/moneygram";
import { cardDoorStub, bankDoorStub, nextCashNetworkDoorStub } from "./doors/stubs";
import { FixtureDoor } from "./doors/fixture";
import { FixturePayoutExecutor, FixtureConvertExecutor } from "./executors";
import {
  CertificationGateError,
  IllegalTransitionError,
  NoViableRouteError,
  QuoteExpiredError,
  RefundNotAllowedError,
  StubDoorError,
} from "./errors";
import { InvalidIntentError, type DoorAdapter } from "./types";
import { publicTransferStatus } from "./ledger";
import { MemoryTransferStore, toTransferView, type TransferStore, type TransferView } from "./store";
import { PgTransferStore } from "./pgStore";
import { railConfigured } from "../railDb";
import type { AccountBalance } from "./ledger";

export type RailMode = "live" | "sim";

interface ModeRig {
  runtime: RailRuntime;
  payout: FixturePayoutExecutor;
  convert: FixtureConvertExecutor;
  simulated: boolean;
  store: TransferStore;
}

function bindStore(doors: DoorAdapter[], payout: FixturePayoutExecutor, convert: FixtureConvertExecutor, store: TransferStore) {
  for (const door of doors) {
    if ("setStepCache" in door && typeof (door as { setStepCache?: (s: TransferStore) => void }).setStepCache === "function") {
      (door as { setStepCache: (s: TransferStore) => void }).setStepCache(store);
    }
  }
  payout.setStepCache(store);
  convert.setStepCache(store);
}

function buildLiveRig(store: TransferStore): ModeRig {
  const payout = new FixturePayoutExecutor({ steps: store });
  const convert = new FixtureConvertExecutor({ steps: store });
  const doors = [new MoneyGramDoor(), cardDoorStub(), bankDoorStub(), nextCashNetworkDoorStub()];
  bindStore(doors, payout, convert, store);
  const runtime = new RailRuntime({ doors, payout, convert });
  return { runtime, payout, convert, simulated: false, store };
}

function buildSimRig(store: TransferStore): ModeRig {
  const payout = new FixturePayoutExecutor({ steps: store });
  const convert = new FixtureConvertExecutor({ steps: store });
  const doors: DoorAdapter[] = [
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
  ];
  bindStore(doors, payout, convert, store);
  const runtime = new RailRuntime({ doors, payout, convert });
  return { runtime, payout, convert, simulated: true, store };
}

interface ServiceState {
  live: ModeRig;
  sim: ModeRig;
  store: TransferStore;
}

function createStore(): TransferStore {
  if (railConfigured()) return new PgTransferStore();
  const g = globalThis as { __loaditRailStore?: TransferStore };
  if (!g.__loaditRailStore) g.__loaditRailStore = new MemoryTransferStore();
  return g.__loaditRailStore;
}

/** Survives Next.js dev HMR and per-request module contexts on a warm instance. */
function serviceState(): ServiceState {
  const g = globalThis as { __loaditRailService?: ServiceState };
  if (!g.__loaditRailService) {
    const store = createStore();
    g.__loaditRailService = { live: buildLiveRig(store), sim: buildSimRig(store), store };
  }
  return g.__loaditRailService;
}

function rigFor(mode: RailMode): ModeRig {
  return serviceState()[mode];
}

/**
 * Test-only: rebuild both rigs so tests do not share runtime state.
 * Pass `{ preserveStore: true }` to simulate a process restart — new
 * runtimes, same ledger — so a get/settle after "reboot" still sees the
 * transfer.
 */
export function resetRailServiceForTests(opts?: { preserveStore?: boolean }): void {
  const g = globalThis as { __loaditRailService?: ServiceState; __loaditRailStore?: TransferStore };
  const kept = opts?.preserveStore ? g.__loaditRailService?.store ?? g.__loaditRailStore : undefined;
  g.__loaditRailService = undefined;
  if (opts?.preserveStore && kept) {
    g.__loaditRailStore = kept;
  } else {
    g.__loaditRailStore = undefined;
  }
}

const LIVE_NOTICE = CASH_CERT_NOTICE;
const SIM_NOTICE = "Simulated doors and simulated money — nothing real moves in this mode.";

/** Wire-safe view of a payment (already plain data; picked explicitly). */
export function serializePayment(p: PaymentRecord) {
  return {
    id: p.id,
    state: p.state,
    status: publicTransferStatus(p.state),
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
        // HQ's five-dimension scoring math — shown, not asserted.
        breakdown: p.quote.route.breakdown,
        feeUsd: p.quote.route.feeUsd,
        etaSeconds: p.quote.route.etaSeconds,
        confirmable: p.quote.route.confirmable,
        settlement: p.quote.route.settlement,
        legs: p.quote.route.legs,
        // UVCE conversion plan (patent §7.2) — estimates, HQ-governed.
        conversion: p.quote.route.conversion,
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

function errorResult(mode: RailMode, rig: ModeRig, err: unknown): RailActionResult {
  const message = err instanceof Error ? err.message : String(err);
  if (err instanceof CertificationGateError) {
    return {
      status: 409,
      payload: {
        ok: false,
        reason: "certification_gate",
        message,
        ...meta(mode, rig),
      },
    };
  }
  if (err instanceof InvalidIntentError) {
    return { status: 400, payload: { ok: false, reason: "invalid_intent", message, ...meta(mode, rig) } };
  }
  if (err instanceof QuoteExpiredError) {
    return { status: 409, payload: { ok: false, reason: "quote_expired", message, ...meta(mode, rig) } };
  }
  if (err instanceof IllegalTransitionError) {
    return { status: 409, payload: { ok: false, reason: "illegal_transition", message, ...meta(mode, rig) } };
  }
  if (err instanceof NoViableRouteError) {
    return { status: 422, payload: { ok: false, reason: "no_viable_route", message, ...meta(mode, rig) } };
  }
  if (err instanceof StubDoorError) {
    return { status: 409, payload: { ok: false, reason: "stub_door", message, ...meta(mode, rig) } };
  }
  if (err instanceof RefundNotAllowedError) {
    return { status: 409, payload: { ok: false, reason: "refund_not_allowed", message, ...meta(mode, rig) } };
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
async function persist(mode: RailMode, payment: PaymentRecord): Promise<void> {
  await rigFor(mode).store.persistPayment(payment, mode);
}

async function resolvePayment(mode: RailMode, paymentId: string): Promise<PaymentRecord> {
  const rig = rigFor(mode);
  if (rig.runtime.hasPayment(paymentId)) return rig.runtime.getPayment(paymentId);
  const stored = await rig.store.loadStored(paymentId);
  if (!stored || stored.mode !== mode) throw new Error(`unknown payment ${paymentId}`);
  rig.runtime.adoptPayment(stored.record);
  return stored.record;
}

async function persistIfPresent(mode: RailMode, paymentId: string): Promise<void> {
  const rig = rigFor(mode);
  if (!rig.runtime.hasPayment(paymentId)) return;
  await persist(mode, rig.runtime.getPayment(paymentId));
}

export async function handleRailAction(body: RailActionRequest): Promise<RailActionResult> {
  const mode: RailMode = body.mode === "sim" ? "sim" : "live";
  const rig = rigFor(mode);
  const { runtime } = rig;

  const ok = (payment: PaymentRecord, extra: Record<string, unknown> = {}): RailActionResult => ({
    status: 200,
    payload: { ok: true, payment: serializePayment(payment), ...meta(mode, rig), ...extra },
  });

  const paymentId = String(body.paymentId || "");

  try {
    switch (body.action) {
      case "create": {
        const payment = runtime.createPayment(body.intent);
        await persist(mode, payment);
        return ok(payment);
      }
      case "get": {
        return ok(await resolvePayment(mode, paymentId));
      }
      case "intake": {
        await resolvePayment(mode, paymentId);
        try {
          const payment = await runtime.beginIntake(paymentId);
          await persist(mode, payment);
          return ok(payment);
        } catch (err) {
          await persistIfPresent(mode, paymentId);
          throw err;
        }
      }
      case "confirm": {
        // Simulated webhook trigger (a real anchor would call the webhook
        // itself). The door's certification gate decides — in live mode the
        // MoneyGram door refuses while certification is IN FLIGHT.
        const payment = await resolvePayment(mode, paymentId);
        if (!payment.intake) {
          return {
            status: 409,
            payload: { ok: false, reason: "no_intake", message: "no intake to confirm — begin intake first", ...meta(mode, rig) },
          };
        }
        try {
          const updated = await runtime.handleWebhook(payment.intake.doorId, {
            internalRef: payment.intake.internalRef,
            type: "intake_confirmed",
          });
          await persist(mode, updated);
          return ok(updated);
        } catch (err) {
          await persistIfPresent(mode, paymentId);
          throw err;
        }
      }
      case "settle": {
        await resolvePayment(mode, paymentId);
        try {
          const payment = await runtime.settle(paymentId);
          await persist(mode, payment);
          return ok(payment);
        } catch (err) {
          await persistIfPresent(mode, paymentId);
          throw err;
        }
      }
      case "heal": {
        await resolvePayment(mode, paymentId);
        try {
          const payment = await runtime.heal(paymentId);
          await persist(mode, payment);
          return ok(payment);
        } catch (err) {
          await persistIfPresent(mode, paymentId);
          throw err;
        }
      }
      case "refund": {
        await resolvePayment(mode, paymentId);
        const payment = runtime.refund(paymentId);
        await persist(mode, payment);
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
        const payment = await resolvePayment(mode, paymentId);
        return ok(payment, { pipe_killed: pipe });
      }
      default:
        return {
          status: 400,
          payload: { ok: false, reason: "unknown_action", message: `unknown action "${String(body.action)}"`, ...meta(mode, rig) },
        };
    }
  } catch (err) {
    return errorResult(mode, rig, err);
  }
}

/** Read a transfer (any mode) by id — status + history for GET /api/v1/transfers/:id. */
export async function getTransferById(id: string): Promise<TransferView | null> {
  const stored = await serviceState().store.loadStored(id);
  return stored ? toTransferView(stored) : null;
}

/** Ledger balances derived from posted lines. `mode` filters; omit for both. */
export async function getLedgerBalances(mode?: RailMode): Promise<AccountBalance[]> {
  return serviceState().store.balances(mode);
}
