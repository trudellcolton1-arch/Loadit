import assert from "node:assert/strict";
import { describe, test, beforeEach, after } from "node:test";
import {
  latestSandboxReport,
  rememberLatestSandboxRun,
  readLatestSandboxRun,
  clearLatestSandboxRun,
  type MgRecordedRun,
} from "./moneygramSandbox";

const SAMPLE_RUN: MgRecordedRun = {
  id: "tx-practice-1",
  interactive_url: "https://ramps.moneygram.com/?transaction_id=tx-practice-1&token=t",
  interactive_url_fixed:
    "https://ramps.moneygram.com/ramps/deposit?transaction_id=tx-practice-1&token=t&operation=deposit",
  account: "GTESTACCOUNT",
  anchor: "extstellar.moneygram.com",
  amountUsd: 20,
  recorded_at: "2026-08-27T00:00:00.000Z",
  sep10: {
    auth_url:
      "https://extstellar.moneygram.com/stellaradapterservice/auth?account=GTESTACCOUNT&client_domain=loadit.net",
    auth_endpoint: "https://extstellar.moneygram.com/stellaradapterservice/auth",
    query_params: { account: "GTESTACCOUNT", client_domain: "loadit.net" },
    challenge: "unsigned-xdr",
    signed_challenge: "signed-xdr",
    network_passphrase: "Test SDF Network ; September 2015",
    client_domain_requested: true,
    client_domain_used: true,
    jwt_claims: {
      client_domain: "loadit.net",
      client_name: null,
      iss: "https://extstellar.moneygram.com",
      sub: "GTESTACCOUNT",
      iat: 1,
      exp: 2,
      claim_keys: ["client_domain", "exp", "iat", "iss", "sub"],
    },
  },
};

describe("latestSandboxReport", { concurrency: false }, () => {
  const prevG = process.env.MG_TEST_STELLAR_SECRET;
  const prevN = process.env.STELLAR_NETWORK;

  beforeEach(() => {
    clearLatestSandboxRun();
    delete process.env.MG_TEST_STELLAR_SECRET;
    process.env.STELLAR_NETWORK = "testnet";
  });

  test("empty state is explicit when nothing is recorded and sandbox is off", async () => {
    const report = await latestSandboxReport();
    assert.equal(report.ok, false);
    assert.equal(report.empty, true);
    assert.equal(report.reason, "not_configured");
    assert.equal(report.run_source, "none");
    assert.equal(report.id, null);
    assert.equal(report.interactive_url, null);
    assert.equal(report.sep10, null);
    assert.match(report.message, /not configured/i);
    assert.equal(report.network, "testnet");
  });

  test("latest without start=1 does not mint a run", async () => {
    const before = readLatestSandboxRun();
    const report = await latestSandboxReport();
    assert.equal(report.empty, true);
    assert.equal(readLatestSandboxRun(), before);
    assert.equal(readLatestSandboxRun(), null);
  });

  test("recorded run is returned without hitting MoneyGram when sandbox is unconfigured", async () => {
    rememberLatestSandboxRun(SAMPLE_RUN);
    const report = await latestSandboxReport();
    assert.equal(report.ok, true);
    assert.equal(report.empty, false);
    assert.equal(report.run_source, "recorded");
    assert.equal(report.id, "tx-practice-1");
    assert.equal(report.interactive_url, SAMPLE_RUN.interactive_url);
    assert.equal(report.sep10?.query_params.client_domain, "loadit.net");
    assert.equal(report.sep10?.signed_challenge, "signed-xdr");
    assert.equal(report.sep10?.jwt_claims.client_domain, "loadit.net");
    assert.equal(report.sep10?.jwt_claims.client_name, null);
    assert.equal(report.network, "testnet");
    assert.ok(report.sep10?.jwt_claims.claim_keys.includes("client_domain"));
    assert.ok(!report.sep10?.jwt_claims.claim_keys.includes("client_name"));
  });

  test("public network is refused and does not start a run", async () => {
    process.env.STELLAR_NETWORK = "public";
    rememberLatestSandboxRun(SAMPLE_RUN);
    const report = await latestSandboxReport({ start: true, amountUsd: 20 });
    assert.equal(report.ok, false);
    assert.equal(report.empty, true);
    assert.equal(report.reason, "public_network");
    assert.equal(report.run_source, "none");
    assert.match(report.message, /testnet-only/i);
  });

  test("start=1 without a practice wallet is a clear not_configured state", async () => {
    rememberLatestSandboxRun(SAMPLE_RUN);
    const started = await latestSandboxReport({ start: true, amountUsd: 20 });
    assert.equal(started.ok, false);
    assert.equal(started.empty, true);
    assert.equal(started.reason, "not_configured");
    assert.equal(readLatestSandboxRun()?.id, "tx-practice-1");
  });

  after(() => {
    if (prevG === undefined) delete process.env.MG_TEST_STELLAR_SECRET;
    else process.env.MG_TEST_STELLAR_SECRET = prevG;
    if (prevN === undefined) delete process.env.STELLAR_NETWORK;
    else process.env.STELLAR_NETWORK = prevN;
  });
});
