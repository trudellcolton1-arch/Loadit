import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { calcLoaditFee } from "../aero";
import { planMoneyGram } from "../moneygram";
import { CASH_CERT_LINE, CASH_CERT_GATE, CASH_CERT_NOTICE } from "./copy";

const LOCKED =
  "certification complete (5/5) — launching soon, not live yet.";

test("Rail POC fee is 0.75% with a $1 minimum", () => {
  assert.equal(calcLoaditFee(50), 1);
  assert.equal(calcLoaditFee(100), 1);
  assert.equal(calcLoaditFee(150), 1.13);
  assert.equal(calcLoaditFee(500), 3.75);
});

test("cash-cert copy is locked: 5/5 complete, not awaiting, not live", () => {
  assert.equal(CASH_CERT_LINE, LOCKED);
  assert.match(CASH_CERT_LINE, /certification complete \(5\/5\)/i);
  assert.match(CASH_CERT_LINE, /not live yet/i);
  assert.doesNotMatch(CASH_CERT_LINE, /in flight/i);
  assert.doesNotMatch(CASH_CERT_LINE, /awaiting/i);
  assert.doesNotMatch(CASH_CERT_LINE, /4\/5/);
  assert.doesNotMatch(CASH_CERT_GATE, /in flight/i);
  assert.doesNotMatch(CASH_CERT_NOTICE, /in flight/i);
  assert.match(CASH_CERT_GATE, /5\/5/);
  assert.match(CASH_CERT_NOTICE, /production build/i);
});

test("Expo CERT_LINE stays in lockstep with the shared cash-cert line", () => {
  const mobile = readFileSync(join(process.cwd(), "mobile/lib/railPoc.ts"), "utf8");
  assert.ok(mobile.includes(LOCKED));
  assert.doesNotMatch(mobile, /awaiting cert/i);
  assert.doesNotMatch(mobile, /certification in flight/i);
});

test("MoneyGram plan preview does not sound like live cash-in", () => {
  const plan = planMoneyGram(100, "BTC", "bc1qpreview");
  assert.match(plan.steps[0].title, /not live/i);
  assert.match(plan.steps[0].detail, /certification complete \(5\/5\)/i);
  assert.match(plan.steps[0].detail, /not live yet/i);
  assert.doesNotMatch(plan.steps[0].detail, /in flight/i);
  assert.doesNotMatch(plan.steps[0].detail, /awaiting/i);
  assert.doesNotMatch(plan.steps[0].detail, /4\/5/);
});

test("product surfaces do not claim patented or awaiting cert", () => {
  const files = [
    "components/sections/ApiDocs.tsx",
    "components/sections/TemporalExchange.tsx",
    "components/sections/HowItWorks.tsx",
    "app/developers/page.tsx",
    "app/exchange/page.tsx",
    "app/technology/page.tsx",
    "app/api/aero/route.ts",
    "app/api/v1/route/route.ts",
    "mobile/app/rail.tsx",
    "mobile/app/moneygram.tsx",
    "mobile/app/load.tsx",
    "mobile/app/hq.tsx",
    "mobile/app/index.tsx",
  ];
  for (const rel of files) {
    const text = readFileSync(join(process.cwd(), rel), "utf8");
    assert.doesNotMatch(text, /awaiting cert/i, rel);
    assert.doesNotMatch(text, /certification in flight/i, rel);
    const claims = text
      .replace(/patent-pending/gi, "")
      .replace(/not patented/gi, "")
      .replace(/never "patented"/gi, "")
      .replace(/never say "patented"/gi, "");
    assert.doesNotMatch(claims, /\bpatented\b/i, rel);
  }
});
