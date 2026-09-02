import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const LIVE_SIGNING_KEY = "GCNLOGNOEEROESV4RD6NRJZWYF7W4GHFJE7H2R4W35OYWY6QQ4SIF4CC";
const PUBLIC_PASSPHRASE = 'NETWORK_PASSPHRASE = "Public Global Stellar Network ; September 2015"';
const TESTNET_PASSPHRASE = 'NETWORK_PASSPHRASE = "Test SDF Network ; September 2015"';

function readToml(name: string): string {
  return readFileSync(join(process.cwd(), "public/.well-known", name), "utf8");
}

test("canonical stellar.toml is PUBLIC network with the live SIGNING_KEY", () => {
  const toml = readToml("stellar.toml");
  assert.ok(toml.includes(PUBLIC_PASSPHRASE));
  assert.ok(!toml.includes("Test SDF Network"));
  assert.ok(toml.includes(`SIGNING_KEY = "${LIVE_SIGNING_KEY}"`));
  assert.ok(toml.includes('ORG_NAME = "Loadit"'));
  assert.ok(toml.includes('ORG_URL = "https://loadit.net"'));
  assert.ok(toml.includes('ORG_OFFICIAL_EMAIL = "colt@loadit.net"'));
  assert.ok(toml.includes('ORG_LOGO = "https://loadit.net/icon-512.png"'));
  assert.ok(toml.includes('name = "Colton Trudell"'));
  assert.ok(toml.includes('email = "colt@loadit.net"'));
  assert.doesNotMatch(toml, /patented/i);
  assert.doesNotMatch(toml, /\bLoad\.\b/);
  assert.doesNotMatch(toml, /Tim Dugan/i);
  assert.doesNotMatch(toml, /cash is live/i);
});

test("stellar-testnet.toml preserves the testnet passphrase and same SIGNING_KEY", () => {
  const toml = readToml("stellar-testnet.toml");
  assert.ok(toml.includes(TESTNET_PASSPHRASE));
  assert.ok(!toml.includes("Public Global Stellar Network"));
  assert.ok(toml.includes(`SIGNING_KEY = "${LIVE_SIGNING_KEY}"`));
});
