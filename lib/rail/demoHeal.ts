/**
 * DEMO-ONLY driver: take a simulated payment to a recoverable dead-payout
 * failure so the owner can WATCH Heal under the same payment id.
 *
 * This is the /rail (and app "test the machine") path. It is not the
 * MoneyGram cert-in-flight confirm — that 409 stays honest and is not
 * a heal demo.
 */
import type { RailRuntime, PaymentRecord } from "./runtime";

export const SIMULATED_DEAD_PAYOUT = "simulated: payout pipe killed mid-pay";

export interface KillablePayout {
  killNext(mode: "before" | "after", reason?: string): void;
}

/**
 * Drive a quoted (or already-in-flight) payment to `failed` by killing
 * the payout pipe after a simulated confirm. Same payment id throughout.
 */
export async function driveToDeadPayout(
  runtime: RailRuntime,
  payout: KillablePayout,
  paymentId: string
): Promise<PaymentRecord> {
  let payment = runtime.getPayment(paymentId);

  if (payment.state === "quoted") {
    payment = await runtime.beginIntake(paymentId);
  }
  if (payment.state === "intake_pending" && payment.intake) {
    payment = await runtime.handleWebhook(payment.intake.doorId, {
      internalRef: payment.intake.internalRef,
      type: "intake_confirmed",
    });
  }
  if (
    payment.state !== "intake_confirmed" &&
    payment.state !== "converting" &&
    payment.state !== "paying_out"
  ) {
    throw new Error(`cannot break a payout pipe from ${payment.state} — need a simulated intake first`);
  }

  payout.killNext("before", SIMULATED_DEAD_PAYOUT);
  return runtime.settle(paymentId);
}
