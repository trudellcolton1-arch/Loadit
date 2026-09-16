import assert from "node:assert/strict";
import { test } from "node:test";
import { planConversion, type UvceContext } from "./uvce";
import type { PaymentIntent } from "./types";

const CTX: UvceContext = { doorId: "moneygram_cash", doorLabel: "Cash partner (cash)", doorKind: "cash" };

const intent = (amountUsd: number, asset: string): PaymentIntent => ({
  amountUsd,
  outcome: { asset: asset as PaymentIntent["outcome"]["asset"], wallet: "wallet-you-control" },
});

test("plan is deterministic — same inputs, identical plan", () => {
  const a = planConversion(intent(150, "SOL"), CTX);
  const b = planConversion(intent(150, "SOL"), CTX);
  assert.deepEqual(a, b);
});

test("emits a normalized uvce.v1 settlement object, non-custodial", () => {
  const plan = planConversion(intent(150, "BTC"), CTX);
  assert.equal(plan.normalized.schema, "uvce.v1");
  assert.equal(plan.normalized.valueIn.form, "cash");
  assert.equal(plan.normalized.valueIn.amountUsd, 150);
  assert.equal(plan.normalized.valueOut.asset, "BTC");
  assert.equal(plan.normalized.valueOut.chain, "Lightning");
  assert.equal(plan.normalized.settlement, "non_custodial");
  assert.equal(plan.estimates, true);
});

test("sources venues and HQ selects exactly one, the top score", () => {
  const plan = planConversion(intent(500, "ETH"), CTX);
  assert.ok(plan.venues.length >= 3);
  const selected = plan.venues.filter((v) => v.selected);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].venueId, plan.venues[0].venueId);
  for (let i = 1; i < plan.venues.length; i++) {
    assert.ok(plan.venues[i - 1].score >= plan.venues[i].score, "venues sorted best-first");
  }
});

test("fee normalization: 0.75% ($1 min) + 0.25% swap only on cross-asset", () => {
  const sol = planConversion(intent(150, "SOL"), CTX);
  assert.equal(sol.fees.loaditFeeUsd, 1.13);
  assert.equal(sol.fees.swapFeeUsd, 0.38); // 150 * 0.25%
  const usdc = planConversion(intent(150, "USDC"), CTX);
  assert.equal(usdc.fees.swapFeeUsd, 0); // stable target — no cross-asset swap
  const small = planConversion(intent(20, "USDC"), CTX);
  assert.equal(small.fees.loaditFeeUsd, 1); // $1 minimum
  for (const p of [sol, usdc]) {
    const sum =
      p.fees.loaditFeeUsd + p.fees.swapFeeUsd + p.fees.venueCostUsd + p.fees.networkFeeUsd;
    assert.ok(Math.abs(p.fees.totalUsd - sum) < 0.011, "total is the sum of the parts");
  }
});

test("HQ↔UVCE directive transcript shows the governance loop", () => {
  const plan = planConversion(intent(150, "SOL"), CTX);
  assert.equal(plan.directives.length, 6);
  assert.deepEqual(plan.directives.map((d) => d.from), ["HQ", "UVCE", "HQ", "UVCE", "HQ", "UVCE"]);
  assert.match(plan.directives[0].note, /Non-custodial/);
  assert.match(plan.directives[4].note, /Approved/);
  assert.match(plan.directives[5].note, /no keys, no balance, no custody/);
});

test("legs start with door intake and name the selected venue on the convert leg", () => {
  const plan = planConversion(intent(150, "SOL"), CTX);
  assert.equal(plan.legs[0].kind, "intake");
  assert.match(plan.legs[0].via, /Cash partner/);
  const convert = plan.legs.filter((l) => l.kind === "convert");
  assert.ok(convert.length >= 1);
  const winner = plan.venues.find((v) => v.selected)!;
  assert.ok(convert.some((l) => l.via.includes(winner.label)), "convert leg is routed via the UVCE venue");
  assert.equal(plan.legs[plan.legs.length - 1].kind, "payout");
});

test("forecast timing is coherent with the program deferral", () => {
  const plan = planConversion(intent(150, "SOL"), CTX);
  if (plan.forecast.action === "brief_defer") {
    assert.ok(plan.forecast.deferMs > 0);
    assert.equal(plan.program.deferral, "brief");
  } else {
    assert.equal(plan.forecast.deferMs, 0);
    assert.equal(plan.program.deferral, "none");
  }
});

test("card doors normalize as card_fiat value-in", () => {
  const plan = planConversion(intent(150, "USDC"), {
    doorId: "card_door",
    doorLabel: "Card door",
    doorKind: "card",
  });
  assert.equal(plan.normalized.valueIn.form, "card_fiat");
});
