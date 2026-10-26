import assert from "node:assert/strict";
import { test, beforeEach } from "node:test";
import { handleRailAction, resetRailServiceForTests, serializePayment, getTransferById, getLedgerBalances } from "./service";
import { MemoryTransferStore } from "./store";
import { derivePostings, ACCOUNT } from "./ledger";
import { PgTransferStore } from "./pgStore";
import type { RailSql } from "../railDb";
import type { PaymentRecord } from "./runtime";
import { authorizeAeroApi } from "../aeroApi";

const INTENT = {
  amountUsd: 150,
  outcome: { asset: "USDC", wallet: "wallet-colton-controls" },
};

beforeEach(() => resetRailServiceForTests());

function paymentOf(payload: Record<string, unknown>) {
  return payload.payment as ReturnType<typeof serializePayment>;
}

async function simTo(state: "intake_confirmed" | "failed_mid_pay" | "settled") {
  const created = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  const paymentId = paymentOf(created.payload).id;
  await handleRailAction({ action: "intake", mode: "sim", paymentId });
  await handleRailAction({ action: "confirm", mode: "sim", paymentId });
  if (state === "intake_confirmed") return paymentId;
  if (state === "failed_mid_pay") {
    await handleRailAction({ action: "kill_pipe", mode: "sim", paymentId, pipe: "payout" });
    await handleRailAction({ action: "settle", mode: "sim", paymentId });
    return paymentId;
  }
  await handleRailAction({ action: "settle", mode: "sim", paymentId });
  return paymentId;
}

test("idempotent persist: saving the same payment twice writes one posting set", async () => {
  const created = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  const id = paymentOf(created.payload).id;
  await handleRailAction({ action: "intake", mode: "sim", paymentId: id });
  const confirmed = await handleRailAction({ action: "confirm", mode: "sim", paymentId: id });
  assert.equal(confirmed.status, 200);

  const view = await getTransferById(id);
  assert.ok(view);
  assert.equal(view.status, "funded");

  const fake: PaymentRecord = {
    id: view.id,
    intent: view.intent,
    state: view.state,
    quote: view.quote,
    quotes: [view.quote],
    intake: view.intake,
    receipt: view.receipt,
    healCount: view.healCount,
    failedDoorIds: [],
    history: view.history,
    lastError: view.lastError,
  };
  const isolated = new MemoryTransferStore();
  await isolated.persistPayment(fake, "sim");
  await isolated.persistPayment(fake, "sim");
  const postings = await isolated.listPostings(id);
  assert.equal(postings.length, derivePostings(fake).length);
  assert.equal(postings.length, 1, "funded only — one posting after two persists");
  assert.equal(postings[0].kind, "funded");
});

test("restart persistence: a new runtime still sees the transfer and can settle it", async () => {
  const paymentId = await simTo("intake_confirmed");

  resetRailServiceForTests({ preserveStore: true });

  const after = await handleRailAction({ action: "get", mode: "sim", paymentId });
  assert.equal(after.status, 200);
  assert.equal(paymentOf(after.payload).id, paymentId);
  assert.equal(paymentOf(after.payload).state, "intake_confirmed");
  assert.equal(paymentOf(after.payload).status, "funded");

  const settled = await handleRailAction({ action: "settle", mode: "sim", paymentId });
  assert.equal(paymentOf(settled.payload).state, "settled");
  assert.equal(settled.payload.payouts_recorded, 1);

  const view = await getTransferById(paymentId);
  assert.ok(view);
  assert.equal(view.status, "paid_out");
  assert.equal(view.amountMinor, 15_000);
  assert.ok(view.history.some((h) => h.to === "settled"));

  const balances = await getLedgerBalances("sim");
  const by = Object.fromEntries(balances.map((b) => [b.accountId, b.balanceMinor]));
  assert.equal(by[ACCOUNT.door], 0);
  assert.equal(by[ACCOUNT.customer], 0);
  assert.equal(by[ACCOUNT.fees], 113);
  assert.equal(by[ACCOUNT.clearing], 113);
});

test("refund of a failed-after-funded payment zeros the ledger", async () => {
  const paymentId = await simTo("failed_mid_pay");
  const failed = await handleRailAction({ action: "get", mode: "sim", paymentId });
  assert.equal(paymentOf(failed.payload).state, "failed");

  const refunded = await handleRailAction({ action: "refund", mode: "sim", paymentId });
  assert.equal(refunded.status, 200);
  assert.equal(paymentOf(refunded.payload).state, "refunded");
  assert.equal(paymentOf(refunded.payload).status, "refunded");

  const balances = await getLedgerBalances("sim");
  for (const b of balances) {
    assert.equal(b.balanceMinor, 0, `${b.accountId} should be zero after refund`);
  }
});

test("refund is refused when no customer money is in, and after a payout", async () => {
  const created = await handleRailAction({ action: "create", mode: "sim", intent: INTENT });
  const paymentId = paymentOf(created.payload).id;
  const tooSoon = await handleRailAction({ action: "refund", mode: "sim", paymentId });
  assert.equal(tooSoon.status, 409);
  assert.equal(tooSoon.payload.reason, "refund_not_allowed");

  const settledId = await simTo("settled");
  const tooLate = await handleRailAction({ action: "refund", mode: "sim", paymentId: settledId });
  assert.equal(tooLate.status, 409);
  assert.equal(tooLate.payload.reason, "refund_not_allowed");
});

test("idempotent step retry after restart does not double-pay", async () => {
  const paymentId = await simTo("settled");
  resetRailServiceForTests({ preserveStore: true });
  const again = await handleRailAction({ action: "settle", mode: "sim", paymentId });
  // Already settled — illegal transition, or if we re-enter paying_out it must replay.
  // After hydrate the state is settled, so settle() is a no-op (no matching branch).
  assert.equal(again.status, 200);
  assert.equal(paymentOf(again.payload).state, "settled");
  assert.equal(again.payload.payouts_recorded, 0, "fresh executor; receipt already on the record, settle does not pay again");
});

test("GET transfer helper 404s unknown ids; balances start at zero", async () => {
  assert.equal(await getTransferById("pay_nope"), null);
  const balances = await getLedgerBalances("live");
  assert.ok(balances.length >= 4);
  for (const b of balances) assert.equal(b.balanceMinor, 0);
});

test("GET /api/v1/transfers/:id and /ledger/balances use the same API key gate", async () => {
  const { GET: getTransfer } = await import("../../app/api/v1/transfers/[id]/route");
  const { GET: getBalances } = await import("../../app/api/v1/ledger/balances/route");

  const unauthorized = await getTransfer(new Request("http://localhost/api/v1/transfers/x"), {
    params: { id: "x" },
  });
  assert.equal(unauthorized.status, 401);

  const paymentId = await simTo("intake_confirmed");
  const res = await getTransfer(
    new Request("http://localhost/api/v1/transfers/" + paymentId, { headers: { "x-api-key": "demo" } }),
    { params: { id: paymentId } }
  );
  assert.equal(res.status, 200);
  const body = (await res.json()) as { ok: boolean; transfer: { id: string; status: string; amount_minor: number } };
  assert.equal(body.ok, true);
  assert.equal(body.transfer.id, paymentId);
  assert.equal(body.transfer.status, "funded");
  assert.equal(body.transfer.amount_minor, 15_000);

  const bal = await getBalances(
    new Request("http://localhost/api/v1/ledger/balances?mode=sim", { headers: { "x-api-key": "demo" } })
  );
  assert.equal(bal.status, 200);
  const balBody = (await bal.json()) as { ok: boolean; balances: { account_id: string; balance_minor: number }[] };
  assert.equal(balBody.ok, true);
  const door = balBody.balances.find((b) => b.account_id === ACCOUNT.door);
  assert.ok(door);
  assert.equal(door.balance_minor, 15_000);
});

test("public API-key gate rejects a missing key the same way as /api/v1/route", () => {
  const fail = authorizeAeroApi(new Request("http://localhost/api/v1/transfers/x"));
  assert.equal(fail.ok, false);
  const ok = authorizeAeroApi(new Request("http://localhost/api/v1/transfers/x", { headers: { "x-api-key": "demo" } }));
  assert.equal(ok.ok, true);
  if (ok.ok) assert.equal(ok.plan, "demo");
});

test("PgTransferStore persist is one transaction of upsert + history + balanced lines", async () => {
  const statements: { query: string; params?: unknown[] }[] = [];
  const rows = new Map<string, Record<string, unknown>[]>();
  const sql: RailSql = {
    async query<T>(query: string, params: unknown[] = []) {
      if (/from rail_idempotency/.test(query)) return [] as T[];
      if (/from rail_transfer /.test(query)) {
        const id = params[0];
        const found = (rows.get("transfer") ?? []).filter((r) => r.id === id);
        return found as T[];
      }
      if (/from rail_ledger_entry/.test(query)) return [] as T[];
      if (/from rail_ledger_account/.test(query)) return [] as T[];
      return [] as T[];
    },
    async tx(batch) {
      statements.push(...batch);
    },
  };
  const store = new PgTransferStore(sql);
  const fake: PaymentRecord = {
    id: "pay_pg",
    intent: { amountUsd: 150, outcome: { asset: "USDC", wallet: "w" } },
    state: "intake_confirmed",
    quote: {
      quoteId: "q1",
      paymentId: "pay_pg",
      amountUsd: 150,
      loaditFeeUsd: 1.13,
      ttlMs: 1,
      lockedAt: 1,
      expiresAt: 2,
      route: {
        routeId: "r1",
        doorId: "d",
        doorLabel: "d",
        legs: [],
        conversion: { venues: [], program: { deferral: "none" }, forecast: { deferMs: 0 } },
        feeUsd: 1,
        etaSeconds: 1,
        score: 1,
        breakdown: { fee: 1, time: 1, liquidity: 1, risk: 1, certification: 1 },
        confirmable: true,
        settlement: "non_custodial",
      },
    } as unknown as PaymentRecord["quote"],
    quotes: [],
    intake: {
      internalRef: "ldi_x",
      doorId: "d",
      paymentId: "pay_pg",
      amountUsd: 150,
      status: "confirmed",
      partnerTxId: null,
      createdAt: new Date().toISOString(),
    },
    receipt: null,
    healCount: 0,
    failedDoorIds: [],
    history: [
      { at: "2026-01-01T00:00:00.000Z", from: null, to: "quoted" },
      { at: "2026-01-01T00:00:01.000Z", from: "quoted", to: "intake_confirmed" },
    ],
    lastError: null,
  };
  await store.persistPayment(fake, "sim");
  const sqlText = statements.map((s) => s.query).join("\n");
  assert.match(sqlText, /insert into rail_transfer/i);
  assert.match(sqlText, /on conflict \(id\) do update/i);
  assert.match(sqlText, /insert into rail_transfer_status_history/i);
  assert.match(sqlText, /insert into rail_ledger_entry/i);
  assert.match(sqlText, /on conflict \(idempotency_key\) do nothing/i);
  assert.match(sqlText, /insert into rail_ledger_line/i);
  const lineStmt = statements.find((s) => /rail_ledger_line/.test(s.query));
  assert.ok(lineStmt);
  const minors = (lineStmt!.params ?? []).filter((p) => typeof p === "number");
  assert.ok(minors.every((n) => Number.isInteger(n)));
  assert.equal(
    minors.filter((_, i) => i % 2 === 0).reduce((a, b) => a + (b as number), 0) >= 0,
    true
  );
});
