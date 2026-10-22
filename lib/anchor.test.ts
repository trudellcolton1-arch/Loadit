import assert from "node:assert/strict";
import { test } from "node:test";
import { fixRampsUrl, MG_ANCHOR, NETWORK_PASSPHRASE } from "./anchor";

test("fixRampsUrl routes bare Ramps URLs to the deposit page with the amount", () => {
  const out = fixRampsUrl("https://extramps.moneygram.com/?transaction_id=abc&token=t", 40, "deposit");
  const u = new URL(out);
  assert.equal(u.pathname, "/ramps/deposit");
  assert.equal(u.searchParams.get("operation"), "deposit");
  assert.equal(u.searchParams.get("asset_code"), "USDC");
  assert.equal(u.searchParams.get("amount"), "40");
  assert.equal(u.searchParams.get("transaction_id"), "abc");
});

test("fixRampsUrl routes withdrawals to the withdraw page", () => {
  const u = new URL(fixRampsUrl("https://ramps.moneygram.com/?transaction_id=x&token=t", undefined, "withdraw"));
  assert.equal(u.pathname, "/ramps/withdraw");
  assert.equal(u.searchParams.get("operation"), "withdraw");
  assert.equal(u.searchParams.get("amount"), null);
});

test("fixRampsUrl leaves non-Ramps and already-routed URLs alone", () => {
  assert.equal(fixRampsUrl("https://example.com/?a=1", 10), "https://example.com/?a=1");
  assert.equal(fixRampsUrl("https://ramps.moneygram.com/ramps/deposit?x=1", 10), "https://ramps.moneygram.com/ramps/deposit?x=1");
  assert.equal(fixRampsUrl("not a url", 10), "not a url");
});

test("network constants are the canonical passphrases and distinct USDC issuers", () => {
  assert.equal(NETWORK_PASSPHRASE.public, "Public Global Stellar Network ; September 2015");
  assert.equal(NETWORK_PASSPHRASE.testnet, "Test SDF Network ; September 2015");
  assert.notEqual(MG_ANCHOR.testnet.usdcIssuer, MG_ANCHOR.public.usdcIssuer);
  assert.equal(MG_ANCHOR.public.usdcIssuer, "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN");
});
