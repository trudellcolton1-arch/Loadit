/**
 * PAYMENT STATE MACHINE — one payment id, one lifecycle.
 *
 *   quoted → intake_pending → intake_confirmed → converting → paying_out → settled
 *
 * Any live state may drop to `failed`. From `failed` the only way out is
 * `healing`: HQ re-scores what is left and mints a new quote under the SAME
 * payment id, then resumes at the point the money actually reached —
 * `quoted`/`intake_pending` when no customer money is in yet, `converting`
 * when intake was already confirmed. `settled` is terminal.
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
  | "healing";

export const PAYMENT_STATES: PaymentState[] = [
  "quoted",
  "intake_pending",
  "intake_confirmed",
  "converting",
  "paying_out",
  "settled",
  "failed",
  "healing",
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
  // A failed payment can only be healed (which re-scores under the same id).
  failed: ["healing"],
  // Healing resumes where the money actually is; if nothing is left to try,
  // it drops back to failed.
  healing: ["quoted", "intake_pending", "converting", "failed"],
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
