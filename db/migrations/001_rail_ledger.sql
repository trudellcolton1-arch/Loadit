-- Loadit rail ledger — transfers, chart of accounts, immutable double-entry
-- lines, status history, and durable idempotency keys.
--
-- Amounts are integer minor units (USD cents). Never floats.
-- Apply with: npm run rail:migrate  (requires RAIL_DATABASE_URL).
-- This role is write-capable and MUST be separate from HYLAQ_DATABASE_URL.

create table if not exists rail_schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

create table if not exists rail_ledger_account (
  id text primary key,
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset', 'liability', 'income', 'expense', 'equity')),
  currency text not null,
  created_at timestamptz not null default now(),
  unique (code, currency)
);

create table if not exists rail_transfer (
  id text primary key,
  mode text not null check (mode in ('live', 'sim')),
  state text not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null default 'USD',
  record_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rail_transfer_mode_state_idx on rail_transfer (mode, state);

create table if not exists rail_transfer_status_history (
  id bigserial primary key,
  transfer_id text not null references rail_transfer (id),
  seq int not null,
  at timestamptz not null,
  from_state text,
  to_state text not null,
  note text,
  unique (transfer_id, seq)
);

create table if not exists rail_ledger_entry (
  id text primary key,
  transfer_id text not null references rail_transfer (id),
  idempotency_key text not null unique,
  kind text not null check (kind in ('funded', 'in_transit', 'paid_out', 'refunded')),
  currency text not null,
  created_at timestamptz not null default now()
);

create table if not exists rail_ledger_line (
  id bigserial primary key,
  entry_id text not null references rail_ledger_entry (id),
  account_id text not null references rail_ledger_account (id),
  debit_minor bigint not null default 0 check (debit_minor >= 0),
  credit_minor bigint not null default 0 check (credit_minor >= 0),
  currency text not null,
  check (not (debit_minor > 0 and credit_minor > 0)),
  check (debit_minor > 0 or credit_minor > 0)
);

create index if not exists rail_ledger_line_entry_idx on rail_ledger_line (entry_id);
create index if not exists rail_ledger_line_account_idx on rail_ledger_line (account_id);

create table if not exists rail_idempotency (
  key text primary key,
  result_json jsonb not null,
  created_at timestamptz not null default now()
);

-- Statement-level guard: after any line write, every entry must balance per currency.
create or replace function rail_assert_entries_balanced() returns trigger as $$
begin
  if exists (
    select 1
      from rail_ledger_line
     group by entry_id, currency
    having sum(debit_minor) <> sum(credit_minor)
  ) then
    raise exception 'unbalanced rail ledger entry (debits must equal credits per currency)';
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists rail_ledger_balanced on rail_ledger_line;
create trigger rail_ledger_balanced
  after insert or update or delete on rail_ledger_line
  for each statement
  execute function rail_assert_entries_balanced();

insert into rail_ledger_account (id, code, name, account_type, currency) values
  ('usd:door',     'door',     'Funding door',        'asset',     'USD'),
  ('usd:clearing', 'clearing', 'In-transit clearing', 'asset',     'USD'),
  ('usd:customer', 'customer', 'Customer funds',      'liability', 'USD'),
  ('usd:fees',     'fees',     'Loadit fee income',   'income',    'USD')
on conflict (id) do nothing;
