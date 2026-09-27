/**
 * LOADIT RAIL RUNTIME — public surface.
 *
 * One machine: intent → HQ score → locked quote → door intake → convert →
 * payout → settled, with self-heal under the same payment id and idempotency
 * keys on every side effect. Non-custodial throughout — Loadit never holds
 * keys.
 *
 * STATUS: MoneyGram certification is complete (5/5) and cleared for go-live.
 * Consumer cash-in is not live yet — it launches with the production build.
 * The MoneyGram door still refuses to confirm real customer cash until
 * MONEYGRAM_CASH_IN_CERT=CLEARED in the production runtime. No partner tx
 * ids invented.
 */
export * from "./types";
export * from "./uvce";
export * from "./errors";
export * from "./ids";
export * from "./stateMachine";
export * from "./idempotency";
export * from "./scorer";
export * from "./runtime";
export * from "./executors";
export { BaseDoor } from "./doors/baseDoor";
export {
  MoneyGramDoor,
  moneygramCertification,
  MONEYGRAM_CERT_ENV,
} from "./doors/moneygram";
export { cardDoorStub, bankDoorStub, nextCashNetworkDoorStub } from "./doors/stubs";
export { FixtureDoor } from "./doors/fixture";
