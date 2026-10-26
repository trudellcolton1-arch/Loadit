/**
 * PAYMENT STATE MACHINE — one payment id, one lifecycle.
 *
 *   quoted → intake_pending → intake_confirmed → converting → paying_out → settled
 *
 * Any live state may drop to `failed`. From `failed` there are two ways out:
 * `healing` — HQ re-scores what is left and mints a new quote under the SAME
 * payment id, then resumes at the point the money actually reached —
 * `quoted`/`intake_pending` when no customer money is in yet, `converting`
 * when intake was already confirmed; or `refunded` — confirmed customer money
 * goes back out instead of forward (runtime.refund guards that money actually
 * came in and was never paid out). `settled` and `refunded` are terminal.
 */
import { IllegalTransitionError } from "./errors";

export type PaymentState =
  | "quoted"
  | "intake_pending"
  | "intake_confirmed"
  | "converting"
  | "paying_out"
  | "settled"
  | "failed"
  | "healing"
  | "refunded";

export const PAYMENT_STATES: PaymentState[] = [
  "quoted",
  "intake_pending",
  "intake_confirmed",
  "converting",
  "paying_out",
  "settled",
  "failed",
  "healing",
  "refunded",
];

/** The complete legal transition table. Anything not listed throws. */
export const LEGAL_TRANSITIONS: Record<PaymentState, readonly PaymentState[]> = {
  quoted: ["intake_pending", "failed"],
  intake_pending: ["intake_confirmed", "failed"],
  intake_confirmed: ["converting", "failed"],
  converting: ["paying_out", "failed"],
  paying_out: ["settled", "failed"],
  // Terminal: money delivered, nothing may follow.
  settled: [],
  // A failed payment can be healed (re-scored under the same id) or, when
  // confirmed customer money is in and nothing was paid out, refunded.
  failed: ["healing", "refunded"],
  // Healing resumes where the money actually is; if nothing is left to try,
  // it drops back to failed.
  healing: ["quoted", "intake_pending", "converting", "failed"],
  // Terminal: confirmed money went back to the customer.
  refunded: [],
};

export function canTransition(from: PaymentState, to: PaymentState): boolean {
  return (LEGAL_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: PaymentState, to: PaymentState): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

export interface TransitionEntry {
  at: string;
  from: PaymentState | null;
  to: PaymentState;
  note?: string;
}

/** Append-only transition log entry (validates legality first). */
export function recordTransition(
  history: TransitionEntry[],
  from: PaymentState,
  to: PaymentState,
  note?: string
): TransitionEntry[] {
  assertTransition(from, to);
  return [...history, { at: new Date().toISOString(), from, to, note }];
}
