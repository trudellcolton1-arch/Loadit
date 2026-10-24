import assert from "node:assert/strict";
import { test } from "node:test";
import {
  quoteSession,
  validateCreateSession,
  newSessionId,
  isValidSessionId,
  MEMO_MAX_BYTES,
  DEFAULT_EXPIRES_MINUTES,
} from "./session";

test("the Loadit fee (0.75%, $1 minimum) is applied to every session", () => {
  // Game-store sized orders sit under the $1 floor…
  assert.equal(quoteSession(5).feeUsd, 1);
  assert.equal(quoteSession(50).feeUsd, 1);
  // …and 0.75% takes over above ~$133.
  assert.equal(quoteSession(200).feeUsd, 1.5);
  assert.equal(quoteSession(1000).feeUsd, 7.5);
});

test("the buyer pays the item amount in USDC, to the cent", () => {
  assert.equal(quoteSession(25).usdcAmount, "25.00");
  assert.equal(quoteSession(9.99).usdcAmount, "9.99");
  assert.equal(quoteSession(5).amountUsd, 5);
});

const VALID = {
  amount_usd: 25,
  order_id: "bw-order-1042",
  item: { name: "Obsidian Mech Skin", sku: "SKIN-OBS-01" },
  success_url: "https://billionairewarfare.com/store/thanks",
  cancel_url: "https://billionairewarfare.com/store",
  webhook_url: "https://example.com/api/loadit-webhook",
  metadata: { player_id: "p_883" },
};

test("a valid create request normalizes cleanly", () => {
  const v = validateCreateSession({ ...VALID }, { allowHttpLocalhost: false });
  assert.ok(v.ok);
  if (!v.ok) return;
  assert.equal(v.input.amountUsd, 25);
  assert.equal(v.input.orderId, "bw-order-1042");
  assert.equal(v.input.item.name, "Obsidian Mech Skin");
  assert.equal(v.input.expiresInMinutes, DEFAULT_EXPIRES_MINUTES);
  assert.deepEqual(v.input.metadata, { player_id: "p_883" });
});

test("amounts outside the allowed range are rejected", () => {
  for (const amount_usd of [0, -5, 0.25, 100_000, NaN, "abc"]) {
    const v = validateCreateSession({ ...VALID, amount_usd }, { allowHttpLocalhost: false });
    assert.equal(v.ok, false);
    if (!v.ok) assert.equal(v.reason, "invalid_amount");
  }
});

test("order ids and items are validated", () => {
  for (const order_id of ["", "-leading-dash", "a".repeat(65), "has spaces"]) {
    const v = validateCreateSession({ ...VALID, order_id }, { allowHttpLocalhost: false });
    assert.equal(v.ok, false);
  }
  const noName = validateCreateSession(
    { ...VALID, item: { sku: "X" } },
    { allowHttpLocalhost: false }
  );
  assert.equal(noName.ok, false);
  if (!noName.ok) assert.equal(noName.reason, "invalid_item");
});

test("redirect and webhook URLs must be https (localhost http only in test mode)", () => {
  const httpLive = validateCreateSession(
    { ...VALID, success_url: "http://billionairewarfare.com/thanks" },
    { allowHttpLocalhost: false }
  );
  assert.equal(httpLive.ok, false);

  const localhostLive = validateCreateSession(
    { ...VALID, webhook_url: "http://localhost:3000/webhook" },
    { allowHttpLocalhost: false }
  );
  assert.equal(localhostLive.ok, false);

  const localhostTest = validateCreateSession(
    { ...VALID, webhook_url: "http://localhost:3000/webhook" },
    { allowHttpLocalhost: true }
  );
  assert.ok(localhostTest.ok);

  const junk = validateCreateSession(
    { ...VALID, cancel_url: "javascript:alert(1)" },
    { allowHttpLocalhost: true }
  );
  assert.equal(junk.ok, false);
});

test("metadata limits are enforced", () => {
  const tooMany = Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`k${i}`, "v"]));
  assert.equal(
    validateCreateSession({ ...VALID, metadata: tooMany }, { allowHttpLocalhost: false }).ok,
    false
  );
  assert.equal(
    validateCreateSession(
      { ...VALID, metadata: { k: "v".repeat(201) } },
      { allowHttpLocalhost: false }
    ).ok,
    false
  );
  assert.equal(
    validateCreateSession({ ...VALID, metadata: ["nope"] }, { allowHttpLocalhost: false }).ok,
    false
  );
});

test("session ids are well-formed and always fit a Stellar text memo", () => {
  for (let i = 0; i < 20; i++) {
    const id = newSessionId();
    assert.ok(isValidSessionId(id));
    assert.ok(Buffer.byteLength(id, "utf8") <= MEMO_MAX_BYTES);
  }
  assert.equal(isValidSessionId("lp_zzzz"), false);
  assert.equal(isValidSessionId("cs_0123456789abcdef"), false);
});

test("expiry window is bounded", () => {
  const tooShort = validateCreateSession(
    { ...VALID, expires_in_minutes: 1 },
    { allowHttpLocalhost: false }
  );
  assert.equal(tooShort.ok, false);
  const fine = validateCreateSession(
    { ...VALID, expires_in_minutes: 30 },
    { allowHttpLocalhost: false }
  );
  assert.ok(fine.ok);
  if (fine.ok) assert.equal(fine.input.expiresInMinutes, 30);
});
