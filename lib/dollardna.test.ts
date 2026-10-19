import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSETS, ancestors, buildScenario, exampleValuationCents, formatAmount, holdings, mulDivRound, stateAt } from "./dollardna";

const s = buildScenario();
const byId = new Map(s.parcels.map((p) => [p.id, p]));

test("amounts are exact integers in each asset's minor unit", () => {
  assert.equal(formatAmount("BTC", 200_000n), "0.00200000");
  assert.equal(formatAmount("USD", 11_910n), "119.10");
  assert.equal(formatAmount("USDC", 79_800_000n), "79.800000");
  assert.equal(formatAmount("USD", 123_456_789n), "1,234,567.89");
  assert.equal(ASSETS.BTC.decimals, 8);
  assert.equal(ASSETS.USD.decimals, 2);
  assert.equal(ASSETS.USDC.decimals, 6);
});

test("half-up rounding is explicit and reported", () => {
  assert.deepEqual(mulDivRound(10n, 1n, 4n), { value: 3n, rounding: 1n }); // 2.5 → 3
  assert.deepEqual(mulDivRound(10n, 1n, 5n), { value: 2n, rounding: 0n }); // exact
  assert.deepEqual(mulDivRound(7n, 1n, 3n), { value: 2n, rounding: 0n }); // 2.33 → 2 (down)
});

test("BTC → USD conversion reconciles: gross − fee − rounding = output", () => {
  const c = s.events.find((e) => e.id === "E2")!.conversion!;
  assert.equal(c.inputMinor, 200_000n);
  const gross = mulDivRound(c.inputMinor, c.rate.num, c.rate.den).value;
  assert.equal(gross, 12_000n); // $120.00 at the example $60,000
  assert.equal(c.feeMinor, 90n); // 0.75%
  assert.equal(c.outputMinor, gross - c.feeMinor);
  assert.equal(c.roundingMinor, 0n);
  assert.equal(byId.get("P2")!.amount, 11_910n);
});

test("USD → USDC conversion reconciles and never mixes units", () => {
  const c = s.events.find((e) => e.id === "E4")!.conversion!;
  assert.equal(c.inputAsset, "USD");
  assert.equal(c.outputAsset, "USDC");
  assert.equal(c.inputMinor, 8_000n);
  assert.equal(c.feeMinor, 20n);
  assert.equal(c.netInputMinor, 7_980n);
  assert.equal(c.outputMinor, mulDivRound(c.netInputMinor, c.rate.num, c.rate.den).value);
  assert.equal(c.outputMinor, 79_800_000n);
});

test("splits conserve quantity exactly and link both children to the parent", () => {
  const p2 = byId.get("P2")!, p3 = byId.get("P3")!, p4 = byId.get("P4")!;
  assert.equal(p3.amount + p4.amount, p2.amount);
  assert.deepEqual(p3.parents, ["P2"]);
  assert.deepEqual(p4.parents, ["P2"]);
  assert.deepEqual(p2.children.sort(), ["P3", "P4"]);
  const p5 = byId.get("P5")!, p6 = byId.get("P6")!, p7 = byId.get("P7")!;
  assert.equal(p6.amount + p7.amount, p5.amount);
});

test("consumed parents are history, never holdings", () => {
  for (const id of ["P1", "P2", "P3", "P5"]) assert.equal(byId.get(id)!.status, "consumed", id);
  const h = holdings(s.parcels);
  assert.equal(h.BTC, 0n);
  assert.equal(h.USD, 3_910n);
  assert.equal(h.USDC, 29_800_000n + 50_000_000n);
  const sender = holdings(s.parcels, s.people.sender);
  assert.equal(sender.USDC, 29_800_000n);
  const recipient = holdings(s.parcels, s.people.recipient);
  assert.equal(recipient.USDC, 50_000_000n);
});

test("example valuation + fees paid = original gross (nothing created or lost)", () => {
  const h = holdings(s.parcels);
  const valuation = exampleValuationCents(h, s.exampleRates); // 39.10 + 29.80 + 50.00 = 118.90
  const fees = s.events.filter((e) => e.conversion).reduce((a, e) => a + e.conversion!.feeMinor, 0n); // 0.90 + 0.20
  assert.equal(valuation, 11_890n);
  assert.equal(valuation + fees, 12_000n);
});

test("ancestry reaches from the paid parcel back to the Bitcoin entry", () => {
  assert.deepEqual(ancestors(s.parcels, "P6"), ["P5", "P3", "P2", "P1"]);
});

test("stateAt hides future parcels and recomputes status", () => {
  const after2 = stateAt(s, 2);
  assert.deepEqual(after2.map((p) => p.id).sort(), ["P1", "P2"]);
  assert.equal(after2.find((p) => p.id === "P1")!.status, "consumed");
  assert.equal(after2.find((p) => p.id === "P2")!.status, "current");
  assert.equal(holdings(after2).USD, 11_910n);
  const after0 = stateAt(s, 0);
  assert.equal(after0.length, 0);
});

test("nothing in the scenario is marked as implemented", () => {
  assert.ok(s.events.every((e) => e.status === "conceptual"));
});
