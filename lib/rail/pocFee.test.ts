import assert from "node:assert/strict";
import { test } from "node:test";
import { calcLoaditFee } from "../aero";
import { CASH_CERT_LINE, CASH_CERT_GATE } from "./copy";

test("Rail POC fee is 0.75% with a $1 minimum", () => {
  assert.equal(calcLoaditFee(50), 1);
  assert.equal(calcLoaditFee(100), 1);
  assert.equal(calcLoaditFee(150), 1.13);
  assert.equal(calcLoaditFee(500), 3.75);
});

test("cash-cert copy is 4/5 approved, not awaiting, not live", () => {
  assert.match(CASH_CERT_LINE, /Cert approved \(4\/5\)/);
  assert.match(CASH_CERT_LINE, /cash-in not live yet/i);
  assert.doesNotMatch(CASH_CERT_LINE, /in flight/i);
  assert.doesNotMatch(CASH_CERT_LINE, /awaiting/i);
  assert.doesNotMatch(CASH_CERT_GATE, /in flight/i);
});
