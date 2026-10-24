import assert from "node:assert/strict";
import { test } from "node:test";
import {
  matchPayment,
  sep7PayUri,
  STELLAR_NETWORKS,
  type HorizonPaymentRecord,
} from "./stellar";

const DEST = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const ISSUER = STELLAR_NETWORKS.test.usdcIssuer;
const MEMO = "lp_0123456789abcdef";

const CRITERIA = { destination: DEST, memo: MEMO, minUsdc: 25, usdcIssuer: ISSUER };

function record(overrides: Partial<HorizonPaymentRecord> = {}): HorizonPaymentRecord {
  return {
    type: "payment",
    transaction_successful: true,
    to: DEST,
    asset_type: "credit_alphanum4",
    asset_code: "USDC",
    asset_issuer: ISSUER,
    amount: "25.0000000",
    transaction_hash: "abc123hash",
    created_at: "2026-10-24T12:00:00Z",
    transaction: { memo: MEMO, memo_type: "text" },
    ...overrides,
  };
}

test("a correct on-chain payment matches: right destination, asset, memo, amount", () => {
  const m = matchPayment([record()], CRITERIA);
  assert.ok(m);
  assert.equal(m.txHash, "abc123hash");
  assert.equal(m.amount, 25);
});

test("the memo is the session binding — wrong or missing memo never matches", () => {
  assert.equal(matchPayment([record({ transaction: { memo: "lp_ffffffffffffffff", memo_type: "text" } })], CRITERIA), null);
  assert.equal(matchPayment([record({ transaction: { memo: null, memo_type: "text" } })], CRITERIA), null);
  assert.equal(matchPayment([record({ transaction: { memo: MEMO, memo_type: "hash" } })], CRITERIA), null);
  assert.equal(matchPayment([record({ transaction: null })], CRITERIA), null);
});

test("asset, issuer, and destination must all be exact", () => {
  assert.equal(matchPayment([record({ asset_code: "USDT" })], CRITERIA), null);
  assert.equal(
    matchPayment([record({ asset_issuer: "GA" + "B".repeat(54) })], CRITERIA),
    null
  );
  assert.equal(matchPayment([record({ to: "GC" + "A".repeat(54) })], CRITERIA), null);
});

test("underpayment is rejected; half-cent float dust is tolerated", () => {
  assert.equal(matchPayment([record({ amount: "24.5000000" })], CRITERIA), null);
  assert.ok(matchPayment([record({ amount: "24.9960000" })], CRITERIA));
  assert.ok(matchPayment([record({ amount: "30.0000000" })], CRITERIA));
  assert.equal(matchPayment([record({ amount: "not-a-number" })], CRITERIA), null);
});

test("failed transactions and non-payment operations never match", () => {
  assert.equal(matchPayment([record({ transaction_successful: false })], CRITERIA), null);
  assert.equal(matchPayment([record({ type: "create_account" })], CRITERIA), null);
  assert.equal(matchPayment([record({ transaction_hash: undefined })], CRITERIA), null);
});

test("path payments that deliver USDC count as settlement", () => {
  assert.ok(matchPayment([record({ type: "path_payment_strict_send" })], CRITERIA));
  assert.ok(matchPayment([record({ type: "path_payment_strict_receive" })], CRITERIA));
});

test("the right record is found among unrelated traffic", () => {
  const noise = [
    record({ transaction: { memo: "other-order", memo_type: "text" }, transaction_hash: "n1" }),
    record({ asset_code: "XLM", asset_type: "native", transaction_hash: "n2" }),
    record({ transaction_hash: "the-one" }),
    record({ transaction_hash: "n3" }),
  ];
  const m = matchPayment(noise, CRITERIA);
  assert.ok(m);
  assert.equal(m.txHash, "the-one");
});

test("SEP-7 pay URIs carry the full payment intent", () => {
  const uri = sep7PayUri({ destination: DEST, usdcAmount: "25.00", memo: MEMO, mode: "test" });
  assert.ok(uri.startsWith("web+stellar:pay?"));
  const q = new URLSearchParams(uri.slice("web+stellar:pay?".length));
  assert.equal(q.get("destination"), DEST);
  assert.equal(q.get("asset_code"), "USDC");
  assert.equal(q.get("asset_issuer"), ISSUER);
  assert.equal(q.get("amount"), "25.00");
  assert.equal(q.get("memo"), MEMO);
  assert.equal(q.get("memo_type"), "MEMO_TEXT");
});

test("live and test networks point at the right Horizon and USDC issuer", () => {
  assert.equal(STELLAR_NETWORKS.live.horizon, "https://horizon.stellar.org");
  assert.equal(STELLAR_NETWORKS.test.horizon, "https://horizon-testnet.stellar.org");
  assert.equal(STELLAR_NETWORKS.live.network, "stellar");
  assert.equal(STELLAR_NETWORKS.test.network, "stellar-testnet");
  assert.notEqual(STELLAR_NETWORKS.live.usdcIssuer, STELLAR_NETWORKS.test.usdcIssuer);
});
