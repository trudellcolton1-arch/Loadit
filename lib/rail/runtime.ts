/**
 * LOADIT RAIL RUNTIME — the one machine.
 *
 * intent in → HQ scores and locks a quote → a door takes the money in →
 * HQ converts → payout lands in the merchant's wallet. One payment id for
 * the whole lifecycle, including heals.
 *
 * Self-heal: when a pipe dies mid-flight the payment drops to `failed`;
 * heal() re-scores what is LEFT (never redoing a leg that already moved
 * money), locks a new quote under the SAME payment id, and resumes. Every
 * side effect runs under a deterministic idempotency key, so a retry —
 * including the ugly case where the payout fired but the ack was lost —
 * can never pay twice.
 *
 * Non-custodial: the runtime routes and orchestrates. It holds no keys and
 * no balances; doors and executors deliver to destinations the customer and
 * merchant control.
 */
import type {
  DoorAdapter,
  DoorIntake,
  DoorWebhookEvent,
  LockedQuote,
  PaymentIntent,
  PayoutExecutor,
  PayoutReceipt,
  ConvertExecutor,
} from "./types";
import { parsePaymentIntent } from "./types";
import {
  assertTransition,
  recordTransition,
  type PaymentState,
  type TransitionEntry,
} from "./stateMachine";
import { lockQuote, isQuoteExpired, type ScoreOptions } from "./scorer";
import { stepKey } from "./idempotency";
import { DeadPipeError, NoViableRouteError, QuoteExpiredError } from "./errors";
import { newPaymentId } from "./ids";

export interface PaymentRecord {
  id: string;
  intent: PaymentIntent;
  state: PaymentState;
  /** The active quote. Heals replace it — the payment id never changes. */
  quote: LockedQuote;
  /** Every quote ever locked for this payment, oldest first. */
  quotes: LockedQuote[];
  intake: DoorIntake | null;
  receipt: PayoutReceipt | null;
  healCount: number;
  /** Doors whose pipe died for this payment — excluded on re-score. */
  failedDoorIds: string[];
  history: TransitionEntry[];
  lastError: string | null;
}

export interface RailRuntimeOptions {
  doors: DoorAdapter[];
  payout: PayoutExecutor;
  convert: ConvertExecutor;
  /** Quote TTL, ms (default 90s). */
  ttlMs?: number;
  /** Clock override for tests. */
  now?: () => number;
}

export class RailRuntime {
  private readonly doors = new Map<string, DoorAdapter>();
  private readonly payments = new Map<string, PaymentRecord>();
  private readonly payoutExecutor: PayoutExecutor;
  private readonly convertExecutor: ConvertExecutor;
  private readonly ttlMs?: number;
  private readonly now: () => number;

  constructor(opts: RailRuntimeOptions) {
    for (const door of opts.doors) this.doors.set(door.id, door);
    this.payoutExecutor = opts.payout;
    this.convertExecutor = opts.convert;
    this.ttlMs = opts.ttlMs;
    this.now = opts.now ?? Date.now;
  }

  getPayment(paymentId: string): PaymentRecord {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`unknown payment ${paymentId}`);
    return payment;
  }

  private scoreOptions(payment?: Pick<PaymentRecord, "failedDoorIds">): ScoreOptions {
    return {
      ttlMs: this.ttlMs,
      now: this.now,
      excludeDoorIds: payment?.failedDoorIds ?? [],
    };
  }

  private candidates(intent: PaymentIntent) {
    return Array.from(this.doors.values())
      .map((door) => door.candidate(intent))
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }

  private transition(payment: PaymentRecord, to: PaymentState, note?: string): void {
    payment.history = recordTransition(payment.history, payment.state, to, note);
    payment.state = to;
  }

  private failPayment(payment: PaymentRecord, reason: string): void {
    payment.lastError = reason;
    this.transition(payment, "failed", reason);
  }

  /** Intent in (no chain field — parsePaymentIntent enforces it), quote out. */
  createPayment(rawIntent: unknown): PaymentRecord {
    const intent = parsePaymentIntent(rawIntent);
    const paymentId = newPaymentId();
    const quote = lockQuote(paymentId, intent, this.candidates(intent), this.scoreOptions());
    const payment: PaymentRecord = {
      id: paymentId,
      intent,
      state: "quoted",
      quote,
      quotes: [quote],
      intake: null,
      receipt: null,
      healCount: 0,
      failedDoorIds: [],
      history: [
        { at: new Date().toISOString(), from: null, to: "quoted", note: `quote ${quote.quoteId}` },
      ],
      lastError: null,
    };
    this.payments.set(paymentId, payment);
    return payment;
  }

  /** Open the intake at the quoted door. Idempotent per (payment, door). */
  async beginIntake(paymentId: string): Promise<PaymentRecord> {
    const payment = this.getPayment(paymentId);
    assertTransition(payment.state, "intake_pending");
    if (isQuoteExpired(payment.quote, this.now())) {
      this.failPayment(payment, `quote ${payment.quote.quoteId} expired before intake`);
      throw new QuoteExpiredError(payment.quote.quoteId);
    }
    const door = this.doors.get(payment.quote.route.doorId);
    if (!door) throw new Error(`door ${payment.quote.route.doorId} not registered`);

    this.transition(payment, "intake_pending", `intake opening at ${door.label}`);
    try {
      payment.intake = await door.create({
        paymentId,
        amountUsd: payment.intent.amountUsd,
        asset: payment.intent.outcome.asset,
        idempotencyKey: stepKey.intake(paymentId, door.id),
      });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      payment.failedDoorIds.push(door.id);
      this.failPayment(payment, `intake pipe died at ${door.id}: ${reason}`);
      throw err;
    }
    return payment;
  }

  /**
   * Deliver a door webhook. A confirm while the door's certification is IN
   * FLIGHT throws CertificationGateError and the payment stays intake_pending
   * — real customer money is never confirmed through an uncertified door.
   */
  async handleWebhook(doorId: string, event: DoorWebhookEvent): Promise<PaymentRecord> {
    const door = this.doors.get(doorId);
    if (!door) throw new Error(`door ${doorId} not registered`);
    const intake = await door.webhook(event); // certification gate lives in the door
    const payment = this.getPayment(intake.paymentId);
    payment.intake = intake;
    if (intake.status === "confirmed" && payment.state === "intake_pending") {
      this.transition(payment, "intake_confirmed", `intake ${intake.internalRef} confirmed`);
    } else if (intake.status === "failed" && payment.state !== "failed") {
      this.failPayment(payment, `door ${doorId} reported intake_failed`);
    }
    return payment;
  }

  /**
   * Drive the tail of the machine: convert, then pay out, then settle.
   * Resumes from wherever the payment currently is. A dead pipe drops the
   * payment to `failed` (heal() takes it from there).
   */
  async settle(paymentId: string): Promise<PaymentRecord> {
    const payment = this.getPayment(paymentId);
    try {
      if (payment.state === "intake_confirmed") {
        this.transition(payment, "converting");
      }
      if (payment.state === "converting") {
        await this.convertExecutor.convert({
          idempotencyKey: stepKey.convert(paymentId),
          paymentId,
          routeId: payment.quote.route.routeId,
          amountUsd: payment.intent.amountUsd,
          asset: payment.intent.outcome.asset,
        });
        this.transition(payment, "paying_out");
      }
      if (payment.state === "paying_out") {
        payment.receipt = await this.payoutExecutor.payout({
          idempotencyKey: stepKey.payout(paymentId),
          paymentId,
          routeId: payment.quote.route.routeId,
          amountUsd: payment.intent.amountUsd,
          wallet: payment.intent.outcome.wallet,
        });
        this.transition(payment, "settled", `receipt ${payment.receipt.receiptRef}`);
      }
    } catch (err) {
      if (err instanceof DeadPipeError) {
        this.failPayment(payment, err.message);
        return payment;
      }
      throw err;
    }
    return payment;
  }

  /**
   * Self-heal a failed payment: re-score what is LEFT, lock a new quote
   * under the SAME payment id, and resume at the point the money reached.
   * Never re-runs a leg that already moved money — intake stays confirmed,
   * and the payout idempotency key is stable across heals.
   */
  async heal(paymentId: string): Promise<PaymentRecord> {
    const payment = this.getPayment(paymentId);
    this.transition(payment, "healing", `heal #${payment.healCount + 1}`);
    payment.healCount += 1;

    const moneyIsIn = payment.intake?.status === "confirmed";
    try {
      if (moneyIsIn) {
        // Customer money already entered through the confirmed door — only
        // the convert/payout legs are left. Re-score those with the intake
        // door pinned; resume at converting.
        const door = this.doors.get(payment.intake!.doorId);
        const candidate = door?.candidate(payment.intent);
        if (!door || !candidate) {
          throw new NoViableRouteError(
            `intake door ${payment.intake!.doorId} no longer bids — cannot re-plan remaining legs`
          );
        }
        const quote = lockQuote(paymentId, payment.intent, [candidate], {
          ttlMs: this.ttlMs,
          now: this.now,
          healed: true,
        });
        payment.quote = quote;
        payment.quotes.push(quote);
        this.transition(payment, "converting", `healed quote ${quote.quoteId} — resuming after confirmed intake`);
      } else {
        // No customer money moved yet — full re-score across the remaining
        // doors (dead ones excluded), back to quoted.
        if (payment.intake && payment.intake.status === "pending") {
          const door = this.doors.get(payment.intake.doorId);
          await door?.cancel(payment.intake.internalRef).catch(() => undefined);
          payment.intake = null;
        }
        const quote = lockQuote(paymentId, payment.intent, this.candidates(payment.intent), {
          ...this.scoreOptions(payment),
          healed: true,
        });
        payment.quote = quote;
        payment.quotes.push(quote);
        this.transition(payment, "quoted", `healed quote ${quote.quoteId} — re-scored remaining doors`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      payment.lastError = reason;
      this.transition(payment, "failed", `heal failed: ${reason}`);
      throw err;
    }
    return payment;
  }
}
