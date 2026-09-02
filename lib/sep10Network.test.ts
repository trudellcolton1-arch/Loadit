import assert from "node:assert/strict";
import { test } from "node:test";
import { Networks } from "@stellar/stellar-sdk";
import {
  MONEYGRAM_PRODUCTION_HOME_DOMAIN,
  PUBLIC_PASSPHRASE,
  TESTNET_PASSPHRASE,
  passphraseForHomeDomain,
} from "./sep10Network";

test("public passphrase only for MoneyGram production home_domain", () => {
  assert.equal(MONEYGRAM_PRODUCTION_HOME_DOMAIN, "mgxanchor.moneygram.com");
  assert.equal(passphraseForHomeDomain("mgxanchor.moneygram.com"), PUBLIC_PASSPHRASE);
  assert.equal(passphraseForHomeDomain("MGXANCHOR.MONEYGRAM.COM"), PUBLIC_PASSPHRASE);
  assert.equal(PUBLIC_PASSPHRASE, Networks.PUBLIC);
  assert.equal(PUBLIC_PASSPHRASE, "Public Global Stellar Network ; September 2015");
});

test("sandbox and unknown home_domains stay on testnet", () => {
  assert.equal(passphraseForHomeDomain("extstellar.moneygram.com"), TESTNET_PASSPHRASE);
  assert.equal(passphraseForHomeDomain("extmgxanchor.moneygram.com"), TESTNET_PASSPHRASE);
  assert.equal(passphraseForHomeDomain("testanchor.stellar.org"), TESTNET_PASSPHRASE);
  assert.equal(passphraseForHomeDomain(""), TESTNET_PASSPHRASE);
  assert.equal(passphraseForHomeDomain(null), TESTNET_PASSPHRASE);
  assert.equal(passphraseForHomeDomain(undefined), TESTNET_PASSPHRASE);
  assert.equal(TESTNET_PASSPHRASE, "Test SDF Network ; September 2015");
});
