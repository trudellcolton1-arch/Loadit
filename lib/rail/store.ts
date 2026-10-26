/**
 * TRANSFER STORE — the persistence contract the rail service talks to.
 *
 * Two implementations:
 *   MemoryTransferStore  — default when RAIL_DATABASE_URL is unset. Same
 *                          process, survives a simulated "restart" as long
 *                          as the store instance is kept.
 *   PgTransferStore      — Neon Postgres over HTTPS (lib/rail/pgStore.ts),
 *                          the durable path. Writes use RAIL_DATABASE_URL
 *                          only; never the read-only Hylaq URL.
 *
 * persistPayment is idempotent: re-saving the same payment upserts the
 * snapshot, appends only new history rows, and inserts ledger postings
 * only when their idempotency key is new. Every posting is balanced
 * before it is stored.
 */
import type { PaymentRecord } from "./runtime";
import type { StepCache } from "./idempotency";
import {
  assertBalanced,
  derivePostings,
  publicTransferStatus,
  rollupBalances,
  transferAmounts,
  type AccountBalance,
  type LedgerPosting,
  type PublicTransferStatus,
} from "./ledger";

export type RailStoreMode = "live" | "sim";

export interface StoredTransfer {
  record: PaymentRecord;
  mode: RailStoreMode;
}

export interface TransferView {
  id: string;
  mode: RailStoreMode;
  status: PublicTransferStatus;
  state: PaymentRecord["state"];
  amountMinor: number;
  feeMinor: number;
  netMinor: number;
  currency: string;
  history: PaymentRecord["history"];
  intent: PaymentRecord["intent"];
  quote: PaymentRecord["quote"];
  intake: PaymentRecord["intake"];
  receipt: PaymentRecord["receipt"];
  healCount: number;
  lastError: string | null;
}

export interface TransferStore extends StepCache {
  persistPayment(record: PaymentRecord, mode: RailStoreMode): Promise<void>;
  loadTransfer(id: string): Promise<PaymentRecord | null>;
  loadStored(id: string): Promise<StoredTransfer | null>;
  balances(mode?: RailStoreMode): Promise<AccountBalance[]>;
  /** Test/inspect helper — every posting ever accepted. */
  listPostings(transferId?: string): Promise<LedgerPosting[]>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function viewOf(stored: StoredTransfer): TransferView {
  const amounts = transferAmounts(stored.record);
  return {
    id: stored.record.id,
    mode: stored.mode,
    status: publicTransferStatus(stored.record.state),
    state: stored.record.state,
    amountMinor: amounts.amountMinor,
    feeMinor: amounts.feeMinor,
    netMinor: amounts.netMinor,
    currency: amounts.currency,
    history: stored.record.history,
    intent: stored.record.intent,
    quote: stored.record.quote,
    intake: stored.record.intake,
    receipt: stored.record.receipt,
    healCount: stored.record.healCount,
    lastError: stored.record.lastError,
  };
}

export function toTransferView(stored: StoredTransfer): TransferView {
  return viewOf(stored);
}

export class MemoryTransferStore implements TransferStore {
  private readonly transfers = new Map<string, StoredTransfer>();
  private readonly postings = new Map<string, LedgerPosting>();
  private readonly steps = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return this.steps.get(key) as T | undefined;
  }

  async put<T>(key: string, value: T): Promise<void> {
    if (!this.steps.has(key)) this.steps.set(key, value);
  }

  async persistPayment(record: PaymentRecord, mode: RailStoreMode): Promise<void> {
    const derived = derivePostings(record);
    for (const posting of derived) assertBalanced(posting);
    this.transfers.set(record.id, { record: clone(record), mode });
    for (const posting of derived) {
      if (this.postings.has(posting.idempotencyKey)) continue;
      this.postings.set(posting.idempotencyKey, clone(posting));
    }
  }

  async loadTransfer(id: string): Promise<PaymentRecord | null> {
    const stored = this.transfers.get(id);
    return stored ? clone(stored.record) : null;
  }

  async loadStored(id: string): Promise<StoredTransfer | null> {
    const stored = this.transfers.get(id);
    return stored ? { record: clone(stored.record), mode: stored.mode } : null;
  }

  async balances(mode?: RailStoreMode): Promise<AccountBalance[]> {
    const relevant = [...this.postings.values()].filter((p) => {
      if (!mode) return true;
      return this.transfers.get(p.transferId)?.mode === mode;
    });
    return rollupBalances(relevant);
  }

  async listPostings(transferId?: string): Promise<LedgerPosting[]> {
    const all = [...this.postings.values()];
    return transferId ? all.filter((p) => p.transferId === transferId) : all;
  }
}
