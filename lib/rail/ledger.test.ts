import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ACCOUNT,
  assertBalanced,
  derivePostings,
  fromMinorUnits,
  fundedPosting,
  inTransitPosting,
  paidOutPosting,
  publicTransferStatus,
  refundedPosting,
  rollupBalances,
  toMinorUnits,
  transferAmounts,
  UnbalancedLedgerError,
  InvalidAmountError,
} from "./ledger";
import type { PaymentRecord } from "./runtime";
import type { LockedQuote } from "./types";
import type { PaymentState, TransitionEntry } from "./stateMachine";

const QUOTE = {
  quoteId: "q_test",
  paymentId: "pay_test",
  amountUsd: 150,
  loaditFeeUsd: 1.13,
  ttlMs: 90_000,
  lockedAt: 1,
  expiresAt: 2,
  route: {
    routeId: "route_test",
    doorId: "fixture_primary",
    doorLabel: "fixture",
    legs: [],
    conversion: { venues: [], program: { deferral: "none" }, forecast: { deferMs: 0 } },
    feeUsd: 1,
    etaSeconds: 300,
    score: 90,
    breakdown: { fee: 1, time: 1, liquidity: 1, risk: 1, certification: 100 },
    confirmable: true,
    settlement: "non_custodial" as const,
  },
} as unknown as LockedQuote;

function payment(state: PaymentState, historyTo: PaymentState[]): PaymentRecord {
  const history: TransitionEntry[] = historyTo.map((to, i) => ({
    at: new Date(1_700_000_000_000 + i * 1000).toISOString(),
    from: i === 0 ? null : historyTo[i - 1],
    to,
  }));
  return {
    id: "pay_test",
    intent: { amountUsd: 150, outcome: { asset: "USDC", wallet: "merchant-destination" } },
    state,
    quote: QUOTE,
    quotes: [QUOTE],
    intake: {
      internalRef: "ldi_in",
      doorId: "fixture_primary",
      paymentId: "pay_test",
      amountUsd: 150,
      status: "confirmed",
      partnerTxId: null,
      createdAt: new Date().toISOString(),
    },
    receipt: null,
    healCount: 0,
    failedDoorIds: [],
    history,
    lastError: null,
  };
}

test("toMinorUnits is integer cents; never keeps a float", () => {
  assert.equal(toMinorUnits(150), 15_000);
  assert.equal(toMinorUnits(1.13), 113);
  assert.equal(toMinorUnits(1), 100);
  assert.equal(fromMinorUnits(15_000), 150);
  assert.throws(() => toMinorUnits(Number.NaN), InvalidAmountError);
  assert.throws(() => toMinorUnits(-1), InvalidAmountError);
});

test("transferAmounts splits gross into fee + net in minor units", () => {
  const a = transferAmounts(payment("quoted", ["quoted"]));
  assert.equal(a.amountMinor, 15_000);
  assert.equal(a.feeMinor, 113);
  assert.equal(a.netMinor, 14_887);
  assert.equal(a.currency, "USD");
});

test("every money-moving posting balances to zero per currency", () => {
  const p = payment("settled", ["quoted", "intake_pending", "intake_confirmed", "converting", "paying_out", "settled"]);
  for (const posting of [fundedPosting(p), inTransitPosting(p), paidOutPosting(p), refundedPosting(p)]) {
    assert.doesNotThrow(() => assertBalanced(posting));
    const totals = posting.lines.reduce(
      (acc, ln) => ({ debit: acc.debit + ln.debitMinor, credit: acc.credit + ln.creditMinor }),
      { debit: 0, credit: 0 }
    );
    assert.equal(totals.debit, totals.credit);
    for (const ln of posting.lines) {
      assert.equal(Number.isInteger(ln.debitMinor), true);
      assert.equal(Number.isInteger(ln.creditMinor), true);
    }
  }
});

test("assertBalanced rejects a posting that does not sum to zero", () => {
  const p = payment("intake_confirmed", ["quoted", "intake_confirmed"]);
  const bad = fundedPosting(p);
  bad.lines[1] = { ...bad.lines[1], creditMinor: bad.lines[1].creditMinor - 1 };
  assert.throws(() => assertBalanced(bad), UnbalancedLedgerError);
});

test("derivePostings is deterministic and keyed for idempotent retries", () => {
  const p = payment("settled", ["quoted", "intake_confirmed", "converting", "settled"]);
  const a = derivePostings(p);
  const b = derivePostings(p);
  assert.equal(a.length, 3);
  assert.deepEqual(
    a.map((x) => x.idempotencyKey),
    b.map((x) => x.idempotencyKey)
  );
  assert.deepEqual(
    a.map((x) => x.id),
    ["led_pay_test_funded", "led_pay_test_in_transit", "led_pay_test_paid_out"]
  );
});

test("settled books: fee remains in clearing, customer and door are flat", () => {
  const p = payment("settled", ["quoted", "intake_confirmed", "converting", "settled"]);
  const balances = rollupBalances(derivePostings(p));
  const by = Object.fromEntries(balances.map((b) => [b.accountId, b.balanceMinor]));
  assert.equal(by[ACCOUNT.door], 0);
  assert.equal(by[ACCOUNT.customer], 0);
  assert.equal(by[ACCOUNT.fees], 113);
  assert.equal(by[ACCOUNT.clearing], 113);
});

test("refund after funded returns every account to zero", () => {
  const p = payment("refunded", ["quoted", "intake_confirmed", "failed", "refunded"]);
  const balances = rollupBalances(derivePostings(p));
  for (const b of balances) assert.equal(b.balanceMinor, 0, `${b.accountId} should be zero after refund`);
});

test("refund after in-transit (failed mid-convert) also zeros the books", () => {
  const p = payment("refunded", ["quoted", "intake_confirmed", "converting", "failed", "refunded"]);
  const balances = rollupBalances(derivePostings(p));
  for (const b of balances) assert.equal(b.balanceMinor, 0, `${b.accountId} should be zero after refund`);
});

test("public status maps the machine states the API promised", () => {
  assert.equal(publicTransferStatus("quoted"), "created");
  assert.equal(publicTransferStatus("intake_pending"), "created");
  assert.equal(publicTransferStatus("intake_confirmed"), "funded");
  assert.equal(publicTransferStatus("converting"), "in_transit");
  assert.equal(publicTransferStatus("paying_out"), "in_transit");
  assert.equal(publicTransferStatus("settled"), "paid_out");
  assert.equal(publicTransferStatus("failed"), "failed");
  assert.equal(publicTransferStatus("refunded"), "refunded");
});
