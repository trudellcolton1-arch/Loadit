import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MoneyGramDoor,
  moneygramCertification,
  MONEYGRAM_CERT_ENV,
} from "./doors/moneygram";
import { FixtureDoor } from "./doors/fixture";
import { cardDoorStub, bankDoorStub, nextCashNetworkDoorStub } from "./doors/stubs";
import { CertificationGateError, StubDoorError } from "./errors";
import { isInternalRef } from "./ids";

const CREATE = {
  paymentId: "pay_test",
  amountUsd: 100,
  asset: "BTC" as const,
  idempotencyKey: "pay_test:intake:door",
};

async function withCertEnv<T>(value: string | undefined, fn: () => Promise<T> | T): Promise<T> {
  const prev = process.env[MONEYGRAM_CERT_ENV];
  if (value === undefined) delete process.env[MONEYGRAM_CERT_ENV];
  else process.env[MONEYGRAM_CERT_ENV] = value;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env[MONEYGRAM_CERT_ENV];
    else process.env[MONEYGRAM_CERT_ENV] = prev;
  }
}

test("MoneyGram certification defaults to IN_FLIGHT — clearing must be explicit", async () => {
  await withCertEnv(undefined, () => {
    assert.equal(moneygramCertification(), "IN_FLIGHT");
  });
  await withCertEnv("", () => {
    assert.equal(moneygramCertification(), "IN_FLIGHT");
  });
  await withCertEnv("true", () => {
    assert.equal(moneygramCertification(), "IN_FLIGHT");
  });
  await withCertEnv("1", () => {
    assert.equal(moneygramCertification(), "IN_FLIGHT");
  });
  await withCertEnv("CLEARED", () => {
    assert.equal(moneygramCertification(), "CLEARED");
  });
});

test("MoneyGram door refuses to confirm real customer cash while cert is IN FLIGHT", async () => {
  await withCertEnv(undefined, async () => {
    const door = new MoneyGramDoor();
    const intake = await door.create(CREATE);

    assert.equal(intake.status, "pending");
    await assert.rejects(
      door.webhook({ internalRef: intake.internalRef, type: "intake_confirmed" }),
      CertificationGateError
    );
    // Refusal must leave the intake untouched — still pending, still unconfirmed.
    const after = await door.status(intake.internalRef);
    assert.equal(after.status, "pending");
    // The pending-intake instructions carry the honest cert-in-flight note.
    assert.match(intake.instructions ?? "", /certification .* in flight/i);
  });
});

test("MoneyGram door never invents transaction ids", async () => {
  await withCertEnv("CLEARED", async () => {
    const door = new MoneyGramDoor();
    const intake = await door.create(CREATE);

    // The only id we mint is an unmistakably internal Loadit reference.
    assert.ok(isInternalRef(intake.internalRef), "intake ref must be ldi_-prefixed");
    assert.equal(intake.partnerTxId, null);

    // Confirming WITHOUT a partner id leaves partnerTxId null — nothing is
    // synthesized, even with certification cleared.
    const confirmed = await door.webhook({
      internalRef: intake.internalRef,
      type: "intake_confirmed",
    });
    assert.equal(confirmed.status, "confirmed");
    assert.equal(confirmed.partnerTxId, null);

    // A partner id is stored only when the partner's webhook delivers one.
    const door2 = new MoneyGramDoor();
    const intake2 = await door2.create(CREATE);
    const confirmed2 = await door2.webhook({
      internalRef: intake2.internalRef,
      type: "intake_confirmed",
      partnerTxId: "anchor-supplied-id-123",
    });
    assert.equal(confirmed2.partnerTxId, "anchor-supplied-id-123");
  });
});

test("fixture door: confirm blocked while IN_FLIGHT, allowed only once CLEARED", async () => {
  const door = new FixtureDoor({ id: "fixture_cash" }); // defaults to IN_FLIGHT
  assert.equal(door.certification(), "IN_FLIGHT");
  const intake = await door.create(CREATE);

  await assert.rejects(
    door.webhook({ internalRef: intake.internalRef, type: "intake_confirmed" }),
    CertificationGateError
  );
  assert.equal((await door.status(intake.internalRef)).status, "pending");

  // Explicitly cleared in the test — now, and only now, confirm goes through.
  door.setCertification("CLEARED");
  const confirmed = await door.webhook({
    internalRef: intake.internalRef,
    type: "intake_confirmed",
  });
  assert.equal(confirmed.status, "confirmed");
});

test("door create is idempotent on the key — a retry cannot open a second intake", async () => {
  const door = new FixtureDoor({ id: "fixture_cash", certification: "CLEARED" });
  const first = await door.create(CREATE);
  const retry = await door.create(CREATE);
  assert.equal(retry.internalRef, first.internalRef);
  assert.equal(door.createCalls, 1);
});

test("stub doors bid candidates behind the same interface but refuse create", async () => {
  for (const door of [cardDoorStub(), bankDoorStub(), nextCashNetworkDoorStub()]) {
    const candidate = door.candidate({
      amountUsd: 100,
      outcome: { asset: "USDC", wallet: "merchant-wallet" },
    });
    assert.ok(candidate);
    assert.equal(candidate!.stub, true);
    assert.equal(candidate!.certification, "IN_FLIGHT");
    await assert.rejects(door.create(CREATE), StubDoorError);
  }
});

test("cancel: pending intakes cancel; confirmed intakes do not silently uncancel", async () => {
  const door = new FixtureDoor({ id: "fixture_cash", certification: "CLEARED" });
  const intake = await door.create(CREATE);
  const cancelled = await door.cancel(intake.internalRef);
  assert.equal(cancelled.status, "cancelled");

  const door2 = new FixtureDoor({ id: "fixture_cash2", certification: "CLEARED" });
  const intake2 = await door2.create({ ...CREATE, idempotencyKey: "k2" });
  await door2.webhook({ internalRef: intake2.internalRef, type: "intake_confirmed" });
  const stillConfirmed = await door2.cancel(intake2.internalRef);
  assert.equal(stillConfirmed.status, "confirmed");
});
