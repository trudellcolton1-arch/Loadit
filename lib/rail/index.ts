/**
 * LOADIT RAIL RUNTIME — public surface.
 *
 * One machine: intent → HQ score → locked quote → door intake → convert →
 * payout → settled, with self-heal under the same payment id and idempotency
 * keys on every side effect. Non-custodial throughout — Loadit never holds
 * keys.
 *
 * STATUS: MoneyGram cash-in certification is IN FLIGHT. The MoneyGram door
 * refuses to confirm real customer cash until MONEYGRAM_CASH_IN_CERT=CLEARED
 * is set explicitly by the owner. Nothing here generates partner tx ids.
 */
export * from "./types";
export * from "./errors";
export * from "./healPolicy";
export { driveToDeadPayout, SIMULATED_DEAD_PAYOUT } from "./demoHeal";
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
