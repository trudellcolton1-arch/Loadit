import assert from "node:assert/strict";
import { test } from "node:test";
import { signWebhook, verifyWebhookSignature } from "./webhooks";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({
  id: "evt_abc",
  type: "payment.succeeded",
  data: { object: { id: "lp_0123456789abcdef", order_id: "bw-1042", amount_usd: 25 } },
});

test("webhook signatures verify against the exact raw body", () => {
  const now = Math.floor(Date.now() / 1000);
  const header = signWebhook(SECRET, BODY, now);
  assert.match(header, /^t=\d+,v1=[0-9a-f]{64}$/);
  assert.equal(verifyWebhookSignature(SECRET, header, BODY), true);
});

test("a tampered body or wrong secret fails verification", () => {
  const now = Math.floor(Date.now() / 1000);
  const header = signWebhook(SECRET, BODY, now);
  assert.equal(verifyWebhookSignature(SECRET, header, BODY.replace("25", "2500")), false);
  assert.equal(verifyWebhookSignature("whsec_other", header, BODY), false);
});

test("stale timestamps are rejected (replay guard), fresh ones accepted", () => {
  const now = 1_800_000_000;
  const header = signWebhook(SECRET, BODY, now);
  // 10 minutes later with a 5-minute tolerance → rejected.
  assert.equal(verifyWebhookSignature(SECRET, header, BODY, 300, now + 600), false);
  // Within tolerance → accepted (either direction of clock skew).
  assert.equal(verifyWebhookSignature(SECRET, header, BODY, 300, now + 299), true);
  assert.equal(verifyWebhookSignature(SECRET, header, BODY, 300, now - 299), true);
});

test("malformed headers never verify", () => {
  assert.equal(verifyWebhookSignature(SECRET, "", BODY), false);
  assert.equal(verifyWebhookSignature(SECRET, "t=notanumber,v1=deadbeef", BODY), false);
  assert.equal(verifyWebhookSignature(SECRET, "v1=" + "a".repeat(64), BODY), false);
  assert.equal(
    verifyWebhookSignature(SECRET, `t=${Math.floor(Date.now() / 1000)},v1=tooshort`, BODY),
    false
  );
  assert.equal(verifyWebhookSignature("", signWebhook(SECRET, BODY, 1), BODY), false);
});
