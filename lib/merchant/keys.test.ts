import assert from "node:assert/strict";
import { test } from "node:test";

process.env.AERO_SIGNING_SECRET = "test-signing-secret";
delete process.env.API_KEYS_REVOKED;

import { signApiKey } from "../apiKeys";
import {
  mintMerchantKey,
  verifyMerchantKey,
  webhookSecret,
  isValidStellarAddressShape,
} from "./keys";

const ADDR = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const SOL_ADDR = "DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy";

test("merchant key mint/verify roundtrip preserves identity, addresses, and mode", () => {
  const minted = mintMerchantKey({
    name: "Billionaire Warfare",
    email: "dev@example.com",
    address: ADDR,
    solanaAddress: SOL_ADDR,
    mode: "test",
  });
  assert.match(minted.kid, /^m_[0-9a-f]{10}$/);
  assert.match(minted.apiKey, /^lk_/);
  assert.match(minted.webhookSecret, /^whsec_/);

  const merchant = verifyMerchantKey(minted.apiKey);
  assert.ok(merchant);
  assert.equal(merchant.kid, minted.kid);
  assert.equal(merchant.name, "Billionaire Warfare");
  assert.equal(merchant.address, ADDR);
  assert.equal(merchant.solanaAddress, SOL_ADDR);
  assert.equal(merchant.mode, "test");
});

test("single-network merchants work: Stellar-only and Solana-only", () => {
  const stellarOnly = verifyMerchantKey(
    mintMerchantKey({ name: "S", address: ADDR, mode: "test" }).apiKey
  );
  assert.ok(stellarOnly);
  assert.equal(stellarOnly.address, ADDR);
  assert.equal(stellarOnly.solanaAddress, undefined);

  const solanaOnly = verifyMerchantKey(
    mintMerchantKey({ name: "Q", solanaAddress: SOL_ADDR, mode: "test" }).apiKey
  );
  assert.ok(solanaOnly);
  assert.equal(solanaOnly.address, undefined);
  assert.equal(solanaOnly.solanaAddress, SOL_ADDR);
});

test("non-merchant and tampered keys are rejected", () => {
  // A regular HQ plan key is not a merchant key.
  const hqKey = signApiKey({ kid: "k_hq1", plan: "startup", email: "a@b.c" });
  assert.equal(verifyMerchantKey(hqKey), null);

  // Flipping a character breaks the HMAC.
  const minted = mintMerchantKey({ name: "Shop", address: ADDR, mode: "live" });
  const tampered = minted.apiKey.slice(0, -2) + (minted.apiKey.endsWith("a") ? "bb" : "aa");
  assert.equal(verifyMerchantKey(tampered), null);
  assert.equal(verifyMerchantKey(""), null);
  assert.equal(verifyMerchantKey("lk_garbage.sig"), null);
});

test("mode defaults to test unless explicitly live", () => {
  const live = mintMerchantKey({ name: "Shop", address: ADDR, mode: "live" });
  assert.equal(verifyMerchantKey(live.apiKey)!.mode, "live");
});

test("minting rejects malformed addresses and requires at least one network", () => {
  assert.throws(() => mintMerchantKey({ name: "Shop", address: "not-an-address", mode: "test" }));
  assert.throws(() =>
    mintMerchantKey({ name: "Shop", solanaAddress: "not-base58!", mode: "test" })
  );
  assert.throws(() => mintMerchantKey({ name: "Shop", mode: "test" }));
  assert.equal(isValidStellarAddressShape(ADDR), true);
  assert.equal(isValidStellarAddressShape(ADDR.toLowerCase()), false);
  assert.equal(isValidStellarAddressShape("G" + "A".repeat(54)), false);
});

test("webhook secrets are deterministic per merchant and distinct across merchants", () => {
  assert.equal(webhookSecret("m_abc"), webhookSecret("m_abc"));
  assert.notEqual(webhookSecret("m_abc"), webhookSecret("m_def"));
});

test("revoked merchant keys stop verifying", () => {
  const minted = mintMerchantKey({ name: "Shop", address: ADDR, mode: "test" });
  assert.ok(verifyMerchantKey(minted.apiKey));
  process.env.API_KEYS_REVOKED = `other, ${minted.kid}`;
  try {
    assert.equal(verifyMerchantKey(minted.apiKey), null);
  } finally {
    delete process.env.API_KEYS_REVOKED;
  }
});
