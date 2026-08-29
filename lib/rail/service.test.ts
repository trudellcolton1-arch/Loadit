import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { handleRailAction, resetRailServiceForTests, serializePayment } from "./service";

/**
 * API-level tests of the rail service the Loadit app calls (the /api/rail
 * route is a thin authorized wrapper around handleRailAction — authorization
 * itself is covered in ownerGate.test.ts).
 */

const INTENT = {
  amountUsd: 150,
  outcome: { asset: "USDC", wallet: "wallet-colton-controls" },
};

beforeEach(() => resetRailServiceForTests());

function paymentOf(payload: Record<string, unknown>) {
  return payload.payment as ReturnType<typeof serializePayment>;
}

test("live mode: MoneyGram cash is door one and the quote has no chain field", async () => {
  const res = await handleRailAction({ action: "create", mode: "live", intent: INTENT });
  assert.equal(res.status, 200);
  const payment = paymentOf(res.payload);

  assert.equal(payment.quote.route.doorId, "moneygram_cash");
  assert.equal(payment.state, "quoted");
  assert.equal("chain" in payment.intent, false);
  assert.equal(payment.quote.route.settlement, "non_custodial");
  // Cert is in flight → the route says so instead of pretending.
  assert.equal(payment.quote.route.confirmable, false);
  assert.equal(res.payload.moneygram_certification, "IN_FLIGHT");
  assert.match(String(res.payload.notice), /NOT live/);
});

test("live mode: a smuggled chain picker is rejected at the API boundary", async () => {
  const res = await handleRailAction({
    action: "create",
    mode: "live",
    intent: { ...INTENT, chain: "solana" },
  });
  assert.equal(res.status, 400);
  assert.equal(res.payload.reason, "invalid_intent");
});

test("live mode: cash confirm is refused while certification is IN FLIGHT", async () => {
  const created = await handleRailAction({ action: "create", mode: "live", intent: INTENT });
  const paymentId = paymentOf(created.payload).id;

  const intake = await handleRailAction({ action: "intake", mode: "live", paymentId });
  assert.equal(intake.status, 200);
  const afterIntake = paymentOf(intake.payload);
  assert.equal(afterIntake.state, "intake_pending");
  // No partner tx id was invented for the intake.
  assert.equal(afterIntake.intake!.partnerTxId, null);
  assert.match(afterIntake.intake!.internalRef, /^ldi_/);

  const confirm = await handleRailAction({ action: "confirm", mode: "live", paymentId });
  assert.equal(confirm.status, 409);
  assert.equal(confirm.payload.reason, "certification_gate");
  assert.match(String(confirm.payload.message), /IN FLIGHT/);

  // The payment did not advance and still has no partner tx id.
  const after = await handleRailAction({ action: "get", mode: "live", paymentId });
  const record = paymentOf(after.payload);
  assert.equal(record.state, "intake_pending");
  assert.equal(record.intake!.partnerTxId, null);
});

test("live mode: pipe sabotage is not available", async () => {
  const created = await handleRailAction({ action: "create", mode: "live", intent: INTENT });
  const paymentId = paymentOf(created.payload).id;
  const res = await handleRailAction({ action: "kill_pipe", mode: "live", paymentId, pipe: "payout" });
  assert.equal(res.status, 400);
  assert.equal(res.payload.reason, "sim_only");
});

test("sim mode: full flow — dead pipe mid-pay, heal keeps the payment id, one payout", async () => {
  const created = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  assert.equal(created.status, 200);
  assert.equal(created.payload.simulated, true);
  const paymentId = paymentOf(created.payload).id;
  const firstQuoteId = paymentOf(created.payload).quote.quoteId;

  await handleRailAction({ action: "intake", mode: "sim", paymentId });
  const confirmed = await handleRailAction({ action: "confirm", mode: "sim", paymentId });
  assert.equal(confirmed.status, 200);
  assert.equal(paymentOf(confirmed.payload).state, "intake_confirmed");

  // Kill the payout pipe, then try to settle → failed mid-pay.
  await handleRailAction({ action: "kill_pipe", mode: "sim", paymentId, pipe: "payout" });
  const failed = await handleRailAction({ action: "settle", mode: "sim", paymentId });
  assert.equal(paymentOf(failed.payload).state, "failed");
  assert.equal(failed.payload.payouts_recorded, 0);

  // Heal: SAME payment id, NEW quote, resume after the confirmed intake.
  const healed = await handleRailAction({ action: "heal", mode: "sim", paymentId });
  const healedPayment = paymentOf(healed.payload);
  assert.equal(healedPayment.id, paymentId);
  assert.equal(healedPayment.healCount, 1);
  assert.equal(healedPayment.state, "converting");
  assert.equal(healedPayment.quote.healed, true);
  assert.notEqual(healedPayment.quote.quoteId, firstQuoteId);

  const settled = await handleRailAction({ action: "settle", mode: "sim", paymentId });
  const done = paymentOf(settled.payload);
  assert.equal(done.state, "settled");
  assert.equal(settled.payload.payouts_recorded, 1, "exactly one payout across the heal");
  assert.match(done.receipt!.receiptRef, /^ldi_/);
  assert.equal(done.receipt!.deliveredTo, "wallet-colton-controls");
  // Simulated mode says so on every response.
  assert.match(String(settled.payload.notice), /Simulated/);
});

test("sim and live payments live in separate rigs", async () => {
  const sim = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  const simId = paymentOf(sim.payload).id;
  const live = await handleRailAction({ action: "get", mode: "live", paymentId: simId });
  assert.equal(live.status, 404);
});

test("unknown payment and unknown action are clean errors", async () => {
  const missing = await handleRailAction({ action: "get", mode: "sim", paymentId: "pay_nope" });
  assert.equal(missing.status, 404);
  const bogus = await handleRailAction({ action: "detonate", mode: "sim" });
  assert.equal(bogus.status, 400);
  assert.equal(bogus.payload.reason, "unknown_action");
});
