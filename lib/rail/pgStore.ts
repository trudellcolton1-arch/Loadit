/**
 * POSTGRES TRANSFER STORE — durable rail ledger on Neon.
 *
 * Writes go through lib/railDb.ts (RAIL_DATABASE_URL only). Every persist
 * is one batch transaction: transfer snapshot + new history rows + any
 * ledger postings whose idempotency key is new. Lines of a posting are
 * inserted as a single multi-row statement so the statement-level
 * balance trigger sees a complete, zero-sum set.
 */
import type { PaymentRecord } from "./runtime";
import type { RailSql } from "../railDb";
import { defaultRailSql } from "../railDb";
import {
  assertBalanced,
  derivePostings,
  naturalBalance,
  rollupBalances,
  transferAmounts,
  type AccountBalance,
  type LedgerAccountType,
  type LedgerLine,
  type LedgerPosting,
  type LedgerPostingKind,
  LEDGER_ACCOUNTS,
} from "./ledger";
import type { RailStoreMode, StoredTransfer, TransferStore } from "./store";

interface TransferRow {
  id: string;
  mode: RailStoreMode;
  record_json: PaymentRecord | string;
}

interface PostingRow {
  id: string;
  transfer_id: string;
  idempotency_key: string;
  kind: LedgerPostingKind;
  currency: string;
  created_at: string;
}

interface LineRow {
  entry_id: string;
  account_id: string;
  debit_minor: string | number;
  credit_minor: string | number;
  currency: string;
}

interface BalanceRow {
  id: string;
  code: string;
  name: string;
  account_type: LedgerAccountType;
  currency: string;
  debit_minor: string | number;
  credit_minor: string | number;
}

function parseJson<T>(value: T | string): T {
  return typeof value === "string" ? (JSON.parse(value) as T) : value;
}

function asInt(value: string | number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(n)) throw new Error(`expected integer minor units, got ${String(value)}`);
  return n;
}

export class PgTransferStore implements TransferStore {
  constructor(private readonly sql: RailSql = defaultRailSql) {}

  async get<T>(key: string): Promise<T | undefined> {
    const rows = await this.sql.query<{ result_json: T | string }>(
      `select result_json from rail_idempotency where key = $1`,
      [key]
    );
    if (!rows.length) return undefined;
    return parseJson(rows[0].result_json);
  }

  async put<T>(key: string, value: T): Promise<void> {
    await this.sql.query(
      `insert into rail_idempotency (key, result_json) values ($1, $2::jsonb)
       on conflict (key) do nothing`,
      [key, value]
    );
  }

  async persistPayment(record: PaymentRecord, mode: RailStoreMode): Promise<void> {
    const postings = derivePostings(record);
    for (const posting of postings) assertBalanced(posting);

    const statements: { query: string; params?: unknown[] }[] = [
      {
        query: `insert into rail_transfer
                  (id, mode, state, amount_minor, currency, record_json, updated_at)
                values ($1, $2, $3, $4, $5, $6::jsonb, now())
                on conflict (id) do update set
                  mode = excluded.mode,
                  state = excluded.state,
                  amount_minor = excluded.amount_minor,
                  currency = excluded.currency,
                  record_json = excluded.record_json,
                  updated_at = now()`,
        params: [
          record.id,
          mode,
          record.state,
          transferAmounts(record).amountMinor,
          "USD",
          record,
        ],
      },
    ];

    for (const [seq, entry] of record.history.entries()) {
      statements.push({
        query: `insert into rail_transfer_status_history
                  (transfer_id, seq, at, from_state, to_state, note)
                values ($1, $2, $3, $4, $5, $6)
                on conflict (transfer_id, seq) do nothing`,
        params: [record.id, seq, entry.at, entry.from, entry.to, entry.note ?? null],
      });
    }

    for (const posting of postings) {
      statements.push({
        query: `insert into rail_ledger_entry
                  (id, transfer_id, idempotency_key, kind, currency, created_at)
                values ($1, $2, $3, $4, $5, $6)
                on conflict (idempotency_key) do nothing`,
        params: [
          posting.id,
          posting.transferId,
          posting.idempotencyKey,
          posting.kind,
          posting.currency,
          posting.createdAt,
        ],
      });
      if (posting.lines.length) {
        const values: string[] = [];
        const params: unknown[] = [];
        posting.lines.forEach((ln, i) => {
          const o = i * 5;
          values.push(`($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5})`);
          params.push(posting.id, ln.accountId, ln.debitMinor, ln.creditMinor, ln.currency);
        });
        statements.push({
          query: `insert into rail_ledger_line
                    (entry_id, account_id, debit_minor, credit_minor, currency)
                  select v.entry_id, v.account_id, v.debit_minor, v.credit_minor, v.currency
                  from (values ${values.join(", ")}) as v(entry_id, account_id, debit_minor, credit_minor, currency)
                  where not exists (
                    select 1 from rail_ledger_line e
                    where e.entry_id = v.entry_id and e.account_id = v.account_id
                  )`,
          params,
        });
      }
    }

    await this.sql.tx(statements);
  }

  async loadTransfer(id: string): Promise<PaymentRecord | null> {
    const stored = await this.loadStored(id);
    return stored?.record ?? null;
  }

  async loadStored(id: string): Promise<StoredTransfer | null> {
    const rows = await this.sql.query<TransferRow>(
      `select id, mode, record_json from rail_transfer where id = $1`,
      [id]
    );
    if (!rows.length) return null;
    return { record: parseJson(rows[0].record_json), mode: rows[0].mode };
  }

  async balances(mode?: RailStoreMode): Promise<AccountBalance[]> {
    const rows = await this.sql.query<BalanceRow>(
      `select a.id, a.code, a.name, a.account_type, a.currency,
              coalesce(sum(x.debit_minor), 0) as debit_minor,
              coalesce(sum(x.credit_minor), 0) as credit_minor
         from rail_ledger_account a
         left join (
           select l.account_id, l.debit_minor, l.credit_minor
             from rail_ledger_line l
             join rail_ledger_entry e on e.id = l.entry_id
             join rail_transfer t on t.id = e.transfer_id
            where ($1::text is null or t.mode = $1)
         ) x on x.account_id = a.id
        group by a.id, a.code, a.name, a.account_type, a.currency
        order by a.id`,
      [mode ?? null]
    );
    if (!rows.length) {
      // Migration not applied yet — fall back to the in-code chart at zero.
      return rollupBalances([]);
    }
    return rows.map((r) => {
      const debitMinor = asInt(r.debit_minor);
      const creditMinor = asInt(r.credit_minor);
      return {
        accountId: r.id,
        code: r.code,
        name: r.name,
        accountType: r.account_type,
        currency: r.currency,
        debitMinor,
        creditMinor,
        balanceMinor: naturalBalance(r.account_type, debitMinor, creditMinor),
      };
    });
  }

  async listPostings(transferId?: string): Promise<LedgerPosting[]> {
    const entries = await this.sql.query<PostingRow>(
      transferId
        ? `select id, transfer_id, idempotency_key, kind, currency, created_at
             from rail_ledger_entry where transfer_id = $1 order by created_at`
        : `select id, transfer_id, idempotency_key, kind, currency, created_at
             from rail_ledger_entry order by created_at`,
      transferId ? [transferId] : []
    );
    if (!entries.length) return [];
    const ids = entries.map((e) => e.id);
    const lines = await this.sql.query<LineRow>(
      `select entry_id, account_id, debit_minor, credit_minor, currency
         from rail_ledger_line where entry_id = any($1::text[])`,
      [ids]
    );
    const byEntry = new Map<string, LedgerLine[]>();
    for (const ln of lines) {
      const list = byEntry.get(ln.entry_id) ?? [];
      list.push({
        accountId: ln.account_id,
        debitMinor: asInt(ln.debit_minor),
        creditMinor: asInt(ln.credit_minor),
        currency: ln.currency,
      });
      byEntry.set(ln.entry_id, list);
    }
    return entries.map((e) => ({
      id: e.id,
      transferId: e.transfer_id,
      idempotencyKey: e.idempotency_key,
      kind: e.kind,
      currency: e.currency,
      createdAt: typeof e.created_at === "string" ? e.created_at : String(e.created_at),
      lines: byEntry.get(e.id) ?? [],
    }));
  }
}

/** Exported so tests can assert the seed chart matches the SQL migration. */
export const PG_SEEDED_ACCOUNT_IDS = LEDGER_ACCOUNTS.map((a) => a.id);
