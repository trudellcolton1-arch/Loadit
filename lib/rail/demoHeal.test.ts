import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { RailRuntime } from "./runtime";
import { FixtureDoor } from "./doors/fixture";
import { FixturePayoutExecutor, FixtureConvertExecutor } from "./executors";
import { driveToDeadPayout } from "./demoHeal";
import { handleRailAction, resetRailServiceForTests, serializePayment } from "./service";

const INTENT = {
  amountUsd: 150,
  outcome: { asset: "USDC" as const, wallet: "demo-merchant-wallet" },
};

function buildRig() {
  const door = new FixtureDoor({
    id: "demo_cash",
    certification: "CLEARED",
    feeUsd: 1.2,
    label: "Demo cash door (simulated)",
  });
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({ doors: [door], payout, convert });
  return { runtime, payout };
}

beforeEach(() => resetRailServiceForTests());

test("demo driver: dead payout is recoverable — Heal changes state under the same id", async () => {
  const { runtime, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);
  const paymentId = payment.id;
  const firstQuote = payment.quote.quoteId;

  await driveToDeadPayout(runtime, payout, paymentId);
  assert.equal(payment.id, paymentId);
  assert.equal(payment.state, "failed");
  assert.match(payment.lastError ?? "", /simulated/);
  assert.match(payment.lastError ?? "", /pipe/);
  assert.equal(payout.ledger.length, 0);

  await runtime.heal(paymentId);
  assert.equal(payment.id, paymentId);
  assert.equal(payment.state, "converting");
  assert.equal(payment.healCount, 1);
  assert.equal(payment.quote.healed, true);
  assert.notEqual(payment.quote.quoteId, firstQuote);
  assert.equal(payment.lastError, null);

  await runtime.settle(paymentId);
  assert.equal(payment.state, "settled");
  assert.equal(payout.ledger.length, 1);
  assert.equal(payment.receipt!.deliveredTo, INTENT.outcome.wallet);
});

test("API: Heal after a simulated dead pipe recovers; Heal after a cert-in-flight confirm does not", async () => {
  const sim = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  const simId = (sim.payload.payment as ReturnType<typeof serializePayment>).id;
  const firstQuote = (sim.payload.payment as ReturnType<typeof serializePayment>).quote.quoteId;

  await handleRailAction({ action: "intake", mode: "sim", paymentId: simId });
  await handleRailAction({ action: "confirm", mode: "sim", paymentId: simId });
  await handleRailAction({ action: "kill_pipe", mode: "sim", paymentId: simId, pipe: "payout" });
  const dead = await handleRailAction({ action: "settle", mode: "sim", paymentId: simId });
  assert.equal((dead.payload.payment as ReturnType<typeof serializePayment>).state, "failed");

  const healed = await handleRailAction({ action: "heal", mode: "sim", paymentId: simId });
  const healedPay = healed.payload.payment as ReturnType<typeof serializePayment>;
  assert.equal(healed.status, 200);
  assert.equal(healed.payload.ok, true);
  assert.equal(healedPay.id, simId);
  assert.equal(healedPay.state, "converting");
  assert.equal(healedPay.quote.healed, true);
  assert.notEqual(healedPay.quote.quoteId, firstQuote);
  assert.equal(healedPay.lastError, null);

  const live = await handleRailAction({ action: "create", mode: "live", intent: INTENT });
  const liveId = (live.payload.payment as ReturnType<typeof serializePayment>).id;
  const liveQuote = (live.payload.payment as ReturnType<typeof serializePayment>).quote.quoteId;
  await handleRailAction({ action: "intake", mode: "live", paymentId: liveId });
  const confirm = await handleRailAction({ action: "confirm", mode: "live", paymentId: liveId });
  assert.equal(confirm.status, 409);
  assert.equal(confirm.payload.reason, "certification_gate");

  const refused = await handleRailAction({ action: "heal", mode: "live", paymentId: liveId });
  const refusedPay = refused.payload.payment as ReturnType<typeof serializePayment>;
  assert.equal(refused.status, 409);
  assert.equal(refused.payload.ok, false);
  assert.match(String(refused.payload.message), /Heal cannot recover/);
  assert.equal(refusedPay.id, liveId);
  assert.equal(refusedPay.state, "intake_pending");
  assert.equal(refusedPay.healCount, 0);
  assert.equal(refusedPay.quote.quoteId, liveQuote);
  assert.equal(refusedPay.quote.healed, false);
});
