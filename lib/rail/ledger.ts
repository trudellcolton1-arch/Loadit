/**
 * RAIL LEDGER — integer minor units, a fixed chart of accounts, and
 * balanced double-entry postings derived from a payment's history.
 *
 * This is an audit/orchestration ledger, not a custodial wallet. Loadit
 * still holds no keys; the books record where customer money sat in the
 * pipeline (door → clearing → merchant / refund) so every movement can be
 * replayed and every posting sums to zero per currency.
 *
 * Amounts are always integer minor units (USD cents). The payment intent
 * still speaks USD floats at the API boundary; conversion happens here,
 * once, with Math.round. Nothing in this file does float arithmetic on
 * balances.
 */
import type { PaymentRecord } from "./runtime";
import { stepKey } from "./idempotency";

export const LEDGER_CURRENCY = "USD" as const;
export const USD_DECIMALS = 2;
export const USD_MINOR_FACTOR = 100;

export type LedgerAccountType = "asset" | "liability" | "income" | "expense" | "equity";

export type LedgerPostingKind = "funded" | "in_transit" | "paid_out" | "refunded";

export interface LedgerAccount {
  id: string;
  code: string;
  name: string;
  accountType: LedgerAccountType;
  currency: string;
}

/** System chart — seeded into Postgres by the rail migration; kept here so
 *  the memory store and the SQL seed cannot drift. */
export const LEDGER_ACCOUNTS: readonly LedgerAccount[] = [
  { id: "usd:door", code: "door", name: "Funding door", accountType: "asset", currency: LEDGER_CURRENCY },
  { id: "usd:clearing", code: "clearing", name: "In-transit clearing", accountType: "asset", currency: LEDGER_CURRENCY },
  { id: "usd:customer", code: "customer", name: "Customer funds", accountType: "liability", currency: LEDGER_CURRENCY },
  { id: "usd:fees", code: "fees", name: "Loadit fee income", accountType: "income", currency: LEDGER_CURRENCY },
] as const;

export const ACCOUNT = {
  door: "usd:door",
  clearing: "usd:clearing",
  customer: "usd:customer",
  fees: "usd:fees",
} as const;

export class UnbalancedLedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnbalancedLedgerError";
  }
}

export class InvalidAmountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidAmountError";
  }
}

/** USD float → integer cents. Rejects non-finite input. */
export function toMinorUnits(amountUsd: number): number {
  if (!Number.isFinite(amountUsd)) {
    throw new InvalidAmountError(`amount is not a finite number: ${String(amountUsd)}`);
  }
  const minor = Math.round(amountUsd * USD_MINOR_FACTOR);
  if (!Number.isSafeInteger(minor) || minor < 0) {
    throw new InvalidAmountError(`amount ${amountUsd} is not a non-negative safe integer in minor units`);
  }
  return minor;
}

export function fromMinorUnits(minor: number): number {
  if (!Number.isSafeInteger(minor)) {
    throw new InvalidAmountError(`minor units must be a safe integer, got ${String(minor)}`);
  }
  return minor / USD_MINOR_FACTOR;
}

export interface LedgerLine {
  accountId: string;
  debitMinor: number;
  creditMinor: number;
  currency: string;
}

export interface LedgerPosting {
  id: string;
  transferId: string;
  idempotencyKey: string;
  kind: LedgerPostingKind;
  currency: string;
  lines: LedgerLine[];
  createdAt: string;
}

export interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  accountType: LedgerAccountType;
  currency: string;
  debitMinor: number;
  creditMinor: number;
  /** Natural balance: debit − credit for assets/expenses; credit − debit otherwise. */
  balanceMinor: number;
}

export interface TransferAmounts {
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
}

export function transferAmounts(payment: Pick<PaymentRecord, "intent" | "quote">): TransferAmounts {
  const amountMinor = toMinorUnits(payment.intent.amountUsd);
  const feeMinor = toMinorUnits(payment.quote.loaditFeeUsd);
  if (feeMinor > amountMinor) {
    throw new InvalidAmountError(
      `fee ${feeMinor} exceeds gross ${amountMinor} — cannot post a payment that is all fee`
    );
  }
  return {
    amountMinor,
    feeMinor,
    netMinor: amountMinor - feeMinor,
    currency: LEDGER_CURRENCY,
  };
}

function line(accountId: string, debitMinor: number, creditMinor: number, currency = LEDGER_CURRENCY): LedgerLine {
  return { accountId, debitMinor, creditMinor, currency };
}

function debit(accountId: string, minor: number, currency = LEDGER_CURRENCY): LedgerLine {
  return line(accountId, minor, 0, currency);
}

function credit(accountId: string, minor: number, currency = LEDGER_CURRENCY): LedgerLine {
  return line(accountId, 0, minor, currency);
}

function postingId(transferId: string, kind: LedgerPostingKind): string {
  return `led_${transferId}_${kind}`;
}

function makePosting(
  payment: PaymentRecord,
  kind: LedgerPostingKind,
  lines: LedgerLine[]
): LedgerPosting {
  const posting: LedgerPosting = {
    id: postingId(payment.id, kind),
    transferId: payment.id,
    idempotencyKey: stepKey.ledger(payment.id, kind),
    kind,
    currency: LEDGER_CURRENCY,
    lines,
    createdAt: new Date().toISOString(),
  };
  assertBalanced(posting);
  return posting;
}

/**
 * Every posting must sum to zero per currency (total debits = total credits)
 * and every line must be a single-sided non-negative integer.
 */
export function assertBalanced(posting: LedgerPosting): void {
  if (!posting.lines.length) {
    throw new UnbalancedLedgerError(`posting ${posting.id} has no lines`);
  }
  const totals = new Map<string, { debit: number; credit: number }>();
  for (const [i, ln] of posting.lines.entries()) {
    if (!Number.isSafeInteger(ln.debitMinor) || !Number.isSafeInteger(ln.creditMinor)) {
      throw new UnbalancedLedgerError(`posting ${posting.id} line ${i} is not integer minor units`);
    }
    if (ln.debitMinor < 0 || ln.creditMinor < 0) {
      throw new UnbalancedLedgerError(`posting ${posting.id} line ${i} has a negative amount`);
    }
    if (ln.debitMinor > 0 && ln.creditMinor > 0) {
      throw new UnbalancedLedgerError(`posting ${posting.id} line ${i} is both debit and credit`);
    }
    if (ln.debitMinor === 0 && ln.creditMinor === 0) {
      throw new UnbalancedLedgerError(`posting ${posting.id} line ${i} is a zero line`);
    }
    const t = totals.get(ln.currency) ?? { debit: 0, credit: 0 };
    t.debit += ln.debitMinor;
    t.credit += ln.creditMinor;
    totals.set(ln.currency, t);
  }
  for (const [currency, t] of totals) {
    if (t.debit !== t.credit) {
      throw new UnbalancedLedgerError(
        `posting ${posting.id} ${currency} does not balance: debit ${t.debit} ≠ credit ${t.credit}`
      );
    }
  }
}

export function naturalBalance(accountType: LedgerAccountType, debitMinor: number, creditMinor: number): number {
  if (accountType === "asset" || accountType === "expense") return debitMinor - creditMinor;
  return creditMinor - debitMinor;
}

export function rollupBalances(postings: Iterable<LedgerPosting>): AccountBalance[] {
  const byId = new Map<string, { debit: number; credit: number }>();
  for (const posting of postings) {
    for (const ln of posting.lines) {
      const t = byId.get(ln.accountId) ?? { debit: 0, credit: 0 };
      t.debit += ln.debitMinor;
      t.credit += ln.creditMinor;
      byId.set(ln.accountId, t);
    }
  }
  return LEDGER_ACCOUNTS.map((acct) => {
    const t = byId.get(acct.id) ?? { debit: 0, credit: 0 };
    return {
      accountId: acct.id,
      code: acct.code,
      name: acct.name,
      accountType: acct.accountType,
      currency: acct.currency,
      debitMinor: t.debit,
      creditMinor: t.credit,
      balanceMinor: naturalBalance(acct.accountType, t.debit, t.credit),
    };
  });
}

function historyReached(payment: PaymentRecord, state: string): boolean {
  return payment.history.some((h) => h.to === state);
}

/** Where confirmed customer money currently sits, for a refund posting. */
export function moneyLocation(payment: PaymentRecord): "door" | "clearing" {
  if (historyReached(payment, "converting") || historyReached(payment, "paying_out") || historyReached(payment, "settled")) {
    return "clearing";
  }
  return "door";
}

export function fundedPosting(payment: PaymentRecord): LedgerPosting {
  const { amountMinor } = transferAmounts(payment);
  return makePosting(payment, "funded", [debit(ACCOUNT.door, amountMinor), credit(ACCOUNT.customer, amountMinor)]);
}

export function inTransitPosting(payment: PaymentRecord): LedgerPosting {
  const { amountMinor } = transferAmounts(payment);
  return makePosting(payment, "in_transit", [debit(ACCOUNT.clearing, amountMinor), credit(ACCOUNT.door, amountMinor)]);
}

export function paidOutPosting(payment: PaymentRecord): LedgerPosting {
  const { amountMinor, feeMinor, netMinor } = transferAmounts(payment);
  // Customer liability is released in full. The merchant slice leaves
  // clearing; the fee slice stays in clearing as realized income.
  return makePosting(payment, "paid_out", [
    debit(ACCOUNT.customer, amountMinor),
    credit(ACCOUNT.fees, feeMinor),
    credit(ACCOUNT.clearing, netMinor),
  ]);
}

export function refundedPosting(payment: PaymentRecord): LedgerPosting {
  const { amountMinor } = transferAmounts(payment);
  const loc = moneyLocation(payment);
  const source = loc === "clearing" ? ACCOUNT.clearing : ACCOUNT.door;
  return makePosting(payment, "refunded", [debit(ACCOUNT.customer, amountMinor), credit(source, amountMinor)]);
}

/**
 * Deterministic postings implied by a payment's history. Re-deriving the
 * same payment always yields the same ids and keys, so persist is safe to
 * retry: the store de-dupes on idempotency_key.
 *
 * Money-moving states only:
 *   intake_confirmed → funded
 *   converting       → in_transit (once, even across heals)
 *   settled          → paid_out
 *   refunded         → refunded
 * quoted / intake_pending / failed / healing / paying_out write no new money.
 */
export function derivePostings(payment: PaymentRecord): LedgerPosting[] {
  const out: LedgerPosting[] = [];
  if (historyReached(payment, "intake_confirmed")) out.push(fundedPosting(payment));
  if (historyReached(payment, "converting")) out.push(inTransitPosting(payment));
  if (historyReached(payment, "settled")) out.push(paidOutPosting(payment));
  if (historyReached(payment, "refunded")) out.push(refundedPosting(payment));
  return out;
}

/** Public status vocabulary used by GET /api/v1/transfers/:id. */
export type PublicTransferStatus = "created" | "funded" | "in_transit" | "paid_out" | "failed" | "refunded";

export function publicTransferStatus(state: PaymentRecord["state"]): PublicTransferStatus {
  switch (state) {
    case "quoted":
    case "intake_pending":
      return "created";
    case "intake_confirmed":
      return "funded";
    case "converting":
    case "paying_out":
    case "healing":
      return "in_transit";
    case "settled":
      return "paid_out";
    case "failed":
      return "failed";
    case "refunded":
      return "refunded";
  }
}
