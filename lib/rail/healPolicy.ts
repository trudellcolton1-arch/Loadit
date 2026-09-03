/**
 * When Heal may run, and the owner-English refusal when it may not.
 *
 * Heal is same-id self-heal on a FAILED payment: re-score what is left,
 * lock a new quote, resume. It is not a second confirm, it does not
 * clear MONEYGRAM_CASH_IN_CERT, and it does not mint a new payment id.
 *
 * A cert-in-flight confirm refusal leaves the payment in intake_pending
 * on purpose. That is not a dead pipe. Pressing Heal there must speak
 * — not silently no-op, and not pretend the gate cleared.
 */
import type { PaymentState } from "./stateMachine";
import { HealRefusedError } from "./errors";

export interface HealView {
  state: PaymentState;
  quote: { route: { confirmable: boolean; doorLabel: string } };
}

const STATE_IN_ENGLISH: Record<PaymentState, string> = {
  quoted: "quoted",
  intake_pending: "intake pending",
  intake_confirmed: "intake confirmed",
  converting: "converting",
  paying_out: "paying out",
  settled: "settled",
  failed: "failed",
  healing: "healing",
};

/**
 * Null when Heal may run (payment is `failed`). Otherwise an error that
 * the API/UI can show verbatim — payment must stay exactly as it is.
 */
export function healRefusal(payment: HealView): HealRefusedError | null {
  if (payment.state === "failed") return null;

  if (payment.state === "intake_pending" && payment.quote.route.confirmable === false) {
    return new HealRefusedError(
      "certification_gate",
      `Heal cannot recover this. ${payment.quote.route.doorLabel} certification is still in flight — no cash was confirmed, and Heal does not clear that gate or start a new payment. Same payment, same error, until certification is cleared.`
    );
  }

  if (payment.state === "settled") {
    return new HealRefusedError(
      "illegal_transition",
      "This payment already settled. Heal will not run again — it paid out once and will not pay a second time."
    );
  }

  return new HealRefusedError(
    "illegal_transition",
    `Heal only runs after a recoverable failure — a dead pipe or an expired quote. This payment is still ${STATE_IN_ENGLISH[payment.state]}, so there is nothing to heal.`
  );
}
