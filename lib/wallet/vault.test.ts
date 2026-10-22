import assert from "node:assert/strict";
import { test } from "node:test";
import { sealSecret, openSecret, passphraseProblem, fromB64, toB64 } from "./vault";

const SEED = "SBUPFJKQ6QJ4IW4JTR4QSJUMR3VLYYGIFHT3GD4NOHKGPRS4CEWG6TXT"; // a random testnet-shaped seed, never funded
const PUB = "GBKWJHUBIIKSV5GHIRVMS6M4YWAHX2J5BIK3E7BWDWGISC7GSALSIK7P";

test("seal → open round-trips with the right passphrase", async () => {
  const blob = await sealSecret(SEED, "correct horse battery", PUB);
  assert.equal(blob.v, 1);
  assert.equal(blob.pub, PUB);
  assert.notEqual(blob.ct, "");
  assert.equal(await openSecret(blob, "correct horse battery"), SEED);
});

test("wrong passphrase never yields the seed", async () => {
  const blob = await sealSecret(SEED, "correct horse battery", PUB);
  await assert.rejects(() => openSecret(blob, "correct horse batter"), /wrong_passphrase/);
  await assert.rejects(() => openSecret(blob, ""), /wrong_passphrase/);
});

test("a tampered ciphertext is rejected", async () => {
  const blob = await sealSecret(SEED, "correct horse battery", PUB);
  const bytes = fromB64(blob.ct);
  bytes[0] ^= 0x01;
  await assert.rejects(() => openSecret({ ...blob, ct: toB64(bytes) }, "correct horse battery"), /wrong_passphrase/);
});

test("two seals of the same seed differ (fresh salt + iv)", async () => {
  const a = await sealSecret(SEED, "correct horse battery", PUB);
  const b = await sealSecret(SEED, "correct horse battery", PUB);
  assert.notEqual(a.ct, b.ct);
  assert.notEqual(a.salt, b.salt);
});

test("passphrase policy", () => {
  assert.ok(passphraseProblem("short"));
  assert.ok(passphraseProblem("aaaaaaaaaa"));
  assert.ok(passphraseProblem("password1"));
  assert.equal(passphraseProblem("green rail 2026"), null);
});
