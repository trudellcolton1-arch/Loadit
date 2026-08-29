import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePaymentIntent, InvalidIntentError, type DoorCandidate } from "./types";
import { scoreRoutes, lockQuote, isQuoteExpired, DEFAULT_QUOTE_TTL_MS } from "./scorer";
import { NoViableRouteError } from "./errors";

/** Fixture candidates — no chain/network anywhere. */
function fixtures(): DoorCandidate[] {
  return [
    {
      doorId: "certified_cash",
      kind: "cash",
      label: "Certified cash door",
      feeUsd: 2.0,
      etaSeconds: 900,
      liquidity: 0.9,
      risk: 0.25,
      certification: "CLEARED",
    },
    {
      doorId: "cheap_uncertified",
      kind: "cash_network",
      label: "Cheap uncertified door",
      feeUsd: 0.5,
      etaSeconds: 600,
      liquidity: 0.5,
      risk: 0.3,
      certification: "IN_FLIGHT",
    },
    {
      doorId: "slow_bank",
      kind: "bank",
      label: "Slow bank door",
      feeUsd: 1.0,
      etaSeconds: 8 * 3600,
      liquidity: 0.98,
      risk: 0.1,
      certification: "IN_FLIGHT",
    },
  ];
}

const INTENT = {
  amountUsd: 200,
  outcome: { asset: "BTC", wallet: "bc1q-merchant-destination" },
};

test("intent carries no chain field and the parser rejects any chain picker", () => {
  const intent = parsePaymentIntent(INTENT);
  assert.equal("chain" in intent, false);
  assert.equal("network" in intent, false);
  assert.equal("chain" in intent.outcome, false);

  assert.throws(
    () => parsePaymentIntent({ ...INTENT, chain: "solana" }),
    InvalidIntentError
  );
  assert.throws(
    () => parsePaymentIntent({ ...INTENT, network: "base" }),
    InvalidIntentError
  );
  assert.throws(
    () =>
      parsePaymentIntent({
        amountUsd: 200,
        outcome: { asset: "BTC", wallet: "bc1q…", chain: "ethereum" },
      }),
    InvalidIntentError
  );
});

test("HQ picks a route from fixtures without a chain field on the intent", () => {
  const intent = parsePaymentIntent(INTENT);
  const routes = scoreRoutes(intent, fixtures());

  assert.equal(routes.length, 3);
  // Best route first, every route fully scored on the five dimensions.
  for (const r of routes) {
    for (const dim of ["fee", "time", "liquidity", "risk", "certification"] as const) {
      assert.equal(typeof r.breakdown[dim], "number");
    }
    assert.equal(r.settlement, "non_custodial");
  }
  assert.ok(routes[0].score >= routes[1].score && routes[1].score >= routes[2].score);
  // Certification is worth 15 points at full weight: the certified door wins
  // over the cheaper-but-uncertified ones in this fixture set.
  assert.equal(routes[0].doorId, "certified_cash");
  assert.equal(routes[0].confirmable, true);
  assert.equal(routes[1].confirmable, false);
  // HQ planned the full leg chain itself — intake, convert, payout.
  assert.ok(routes[0].legs.some((l) => l.kind === "intake"));
  assert.ok(routes[0].legs.some((l) => l.kind === "payout"));
});

test("constraints prune candidates; nothing viable throws NoViableRouteError", () => {
  const intent = parsePaymentIntent({
    ...INTENT,
    constraints: { maxEtaSeconds: 1000 },
  });
  const routes = scoreRoutes(intent, fixtures());
  assert.equal(routes.length, 2); // slow_bank pruned
  assert.ok(routes.every((r) => r.doorId !== "slow_bank"));

  const impossible = parsePaymentIntent({
    ...INTENT,
    constraints: { maxFeeUsd: 0.01 },
  });
  assert.throws(() => scoreRoutes(impossible, fixtures()), NoViableRouteError);
});

test("lockQuote locks the best route with a TTL and expires on schedule", () => {
  const intent = parsePaymentIntent(INTENT);
  let clock = 1_000_000;
  const quote = lockQuote("pay_test", intent, fixtures(), {
    ttlMs: 50,
    now: () => clock,
  });

  assert.equal(quote.paymentId, "pay_test");
  assert.equal(quote.route.doorId, "certified_cash");
  assert.equal(quote.ttlMs, 50);
  assert.equal(quote.expiresAt, clock + 50);
  assert.equal(isQuoteExpired(quote, clock), false);
  assert.equal(isQuoteExpired(quote, clock + 49), false);
  clock += 50;
  assert.equal(isQuoteExpired(quote, clock), true);

  // Default TTL applies when none given.
  const def = lockQuote("pay_test", intent, fixtures(), { now: () => clock });
  assert.equal(def.ttlMs, DEFAULT_QUOTE_TTL_MS);
});

test("heal-style exclusion re-scores what is left", () => {
  const intent = parsePaymentIntent(INTENT);
  const routes = scoreRoutes(intent, fixtures(), { excludeDoorIds: ["certified_cash"] });
  assert.equal(routes.length, 2);
  assert.ok(routes.every((r) => r.doorId !== "certified_cash"));
});
