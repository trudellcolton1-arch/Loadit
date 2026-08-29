import assert from "node:assert/strict";
import { test } from "node:test";
import { RailRuntime } from "./runtime";
import { FixtureDoor } from "./doors/fixture";
import { FixturePayoutExecutor, FixtureConvertExecutor } from "./executors";
import { InvalidIntentError } from "./types";
import { QuoteExpiredError } from "./errors";
import { isInternalRef } from "./ids";

const INTENT = {
  amountUsd: 150,
  outcome: { asset: "USDC" as const, wallet: "merchant-destination" },
};

/** A runtime with two certified fixture doors and sabotage-able pipes. */
function buildRig(opts: { ttlMs?: number; now?: () => number } = {}) {
  const primary = new FixtureDoor({
    id: "fixture_primary",
    certification: "CLEARED",
    feeUsd: 1,
    etaSeconds: 300,
    liquidity: 0.9,
    risk: 0.1,
  });
  const backup = new FixtureDoor({
    id: "fixture_backup",
    certification: "CLEARED",
    feeUsd: 3,
    etaSeconds: 600,
    liquidity: 0.7,
    risk: 0.2,
  });
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({ doors: [primary, backup], payout, convert, ...opts });
  return { runtime, primary, backup, payout, convert };
}

async function confirmIntake(runtime: RailRuntime, paymentId: string, doorId: string) {
  const intake = runtime.getPayment(paymentId).intake!;
  return runtime.handleWebhook(doorId, {
    internalRef: intake.internalRef,
    type: "intake_confirmed",
  });
}

test("happy path: one payment id from quoted to settled, exactly one payout", async () => {
  const { runtime, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);
  assert.equal(payment.state, "quoted");
  assert.match(payment.id, /^pay_/);
  assert.equal(payment.quote.route.doorId, "fixture_primary");

  await runtime.beginIntake(payment.id);
  assert.equal(payment.state, "intake_pending");
  await confirmIntake(runtime, payment.id, "fixture_primary");
  assert.equal(payment.state, "intake_confirmed");

  await runtime.settle(payment.id);
  assert.equal(payment.state, "settled");
  assert.equal(payout.ledger.length, 1);
  assert.equal(payment.receipt!.amountUsd, 150);
  assert.equal(payment.receipt!.deliveredTo, "merchant-destination");
  // The receipt ref is a Loadit-internal id, never a fabricated partner tx id.
  assert.ok(isInternalRef(payment.receipt!.receiptRef));
  assert.equal(payment.intake!.partnerTxId, null);
});

test("runtime rejects an intent that smuggles a chain picker", () => {
  const { runtime } = buildRig();
  assert.throws(() => runtime.createPayment({ ...INTENT, chain: "solana" }), InvalidIntentError);
});

test("dead pipe mid-pay: heal keeps the payment id and never double-pays", async () => {
  const { runtime, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);
  const paymentId = payment.id;
  const originalQuoteId = payment.quote.quoteId;

  await runtime.beginIntake(paymentId);
  await confirmIntake(runtime, paymentId, "fixture_primary");

  // The payout pipe dies before the money moves.
  payout.killNext("before", "liquidity provider timed out");
  await runtime.settle(paymentId);
  assert.equal(payment.state, "failed");
  assert.match(payment.lastError!, /timed out/);
  assert.equal(payout.ledger.length, 0);

  // Heal: SAME payment id, NEW quote, resume after the confirmed intake.
  await runtime.heal(paymentId);
  assert.equal(payment.id, paymentId);
  assert.equal(payment.healCount, 1);
  assert.equal(payment.state, "converting");
  assert.notEqual(payment.quote.quoteId, originalQuoteId);
  assert.equal(payment.quote.healed, true);
  assert.equal(payment.quote.paymentId, paymentId);
  assert.equal(payment.quotes.length, 2);
  // Intake was NOT redone — the customer's money came in exactly once.
  assert.equal(payment.intake!.status, "confirmed");

  await runtime.settle(paymentId);
  assert.equal(payment.state, "settled");
  assert.equal(payout.ledger.length, 1, "exactly one payout across the heal");
});

test("payout fired but the ack was lost: retry replays the receipt, no second payout", async () => {
  const { runtime, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);

  await runtime.beginIntake(payment.id);
  await confirmIntake(runtime, payment.id, "fixture_primary");

  // The ugliest failure: money moved, then the pipe died before the ack.
  payout.killNext("after", "ack lost after payout");
  await runtime.settle(payment.id);
  assert.equal(payment.state, "failed");
  assert.equal(payout.ledger.length, 1, "the payout really did fire");

  await runtime.heal(payment.id);
  await runtime.settle(payment.id);
  assert.equal(payment.state, "settled");
  // Idempotency key held: the retry REPLAYED the original receipt.
  assert.equal(payout.ledger.length, 1, "still exactly one payout");
  assert.equal(payment.receipt!.replayed, true);
});

test("dead intake pipe: heal re-scores what is left and routes around the dead door", async () => {
  const { runtime, primary, convert, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);
  const paymentId = payment.id;
  assert.equal(payment.quote.route.doorId, "fixture_primary");

  primary.killNextCreate("primary door pipe burst");
  await assert.rejects(runtime.beginIntake(paymentId));
  assert.equal(payment.state, "failed");

  // Heal before any money moved: full re-score, dead door excluded.
  await runtime.heal(paymentId);
  assert.equal(payment.id, paymentId);
  assert.equal(payment.state, "quoted");
  assert.equal(payment.quote.route.doorId, "fixture_backup");
  assert.equal(payment.quote.healed, true);

  await runtime.beginIntake(paymentId);
  await confirmIntake(runtime, paymentId, "fixture_backup");
  await runtime.settle(paymentId);
  assert.equal(payment.state, "settled");
  assert.equal(payout.ledger.length, 1);
  assert.equal(convert.conversions.length, 1);
});

test("dead convert pipe: heal resumes at converting, one conversion total", async () => {
  const { runtime, convert, payout } = buildRig();
  const payment = runtime.createPayment(INTENT);

  await runtime.beginIntake(payment.id);
  await confirmIntake(runtime, payment.id, "fixture_primary");

  convert.killNext("bridge unreachable");
  await runtime.settle(payment.id);
  assert.equal(payment.state, "failed");

  await runtime.heal(payment.id);
  assert.equal(payment.state, "converting");
  await runtime.settle(payment.id);
  assert.equal(payment.state, "settled");
  assert.equal(convert.conversions.length, 1);
  assert.equal(payout.ledger.length, 1);
});

test("expired quote fails honestly and heal re-quotes under the same id", async () => {
  let clock = 1_000_000;
  const { runtime } = buildRig({ ttlMs: 100, now: () => clock });
  const payment = runtime.createPayment(INTENT);
  const firstQuote = payment.quote.quoteId;

  clock += 101; // TTL passes before intake begins
  await assert.rejects(runtime.beginIntake(payment.id), QuoteExpiredError);
  assert.equal(payment.state, "failed");

  await runtime.heal(payment.id);
  assert.equal(payment.state, "quoted");
  assert.notEqual(payment.quote.quoteId, firstQuote);
  assert.equal(payment.quote.expiresAt, clock + 100);

  await runtime.beginIntake(payment.id);
  assert.equal(payment.state, "intake_pending");
});

test("uncertified door in the runtime: webhook confirm is refused, payment stays pending", async () => {
  const gated = new FixtureDoor({ id: "fixture_gated", certification: "IN_FLIGHT" });
  const payout = new FixturePayoutExecutor();
  const convert = new FixtureConvertExecutor();
  const runtime = new RailRuntime({ doors: [gated], payout, convert });

  const payment = runtime.createPayment(INTENT);
  await runtime.beginIntake(payment.id);
  const intake = payment.intake!;

  await assert.rejects(
    runtime.handleWebhook("fixture_gated", {
      internalRef: intake.internalRef,
      type: "intake_confirmed",
    }),
    /IN FLIGHT/
  );
  assert.equal(payment.state, "intake_pending");
  assert.equal(payout.ledger.length, 0);
});
