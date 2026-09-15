import assert from "node:assert/strict";
import { test } from "node:test";
import { calcLoaditFee } from "../aero";

test("Rail POC fee is 0.75% with a $1 minimum", () => {
  assert.equal(calcLoaditFee(50), 1);
  assert.equal(calcLoaditFee(100), 1);
  assert.equal(calcLoaditFee(150), 1.13);
  assert.equal(calcLoaditFee(500), 3.75);
});
