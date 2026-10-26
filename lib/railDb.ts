/**
 * RAIL DATABASE — write-capable Neon Postgres over its HTTPS SQL endpoint.
 *
 * RAIL_DATABASE_URL is a SEPARATE role from HYLAQ_DATABASE_URL. Hylaq access
 * stays read-only (lib/hylaqDb.ts never writes). This client is the only
 * path that inserts rail transfers, ledger lines, and idempotency keys.
 *
 * Do not fall back to HYLAQ_DATABASE_URL / HQ_CONTENT_DATABASE_URL — a
 * missing write URL must fail closed (memory store at the service layer,
 * or an explicit error from this module) rather than silently writing
 * through the read-only Hylaq role.
 */

interface NeonRow {
  [key: string]: unknown;
}

interface NeonResponse {
  rows?: NeonRow[];
  results?: { rows?: NeonRow[] }[];
}

export const RAIL_DATABASE_ENV = "RAIL_DATABASE_URL";

export function railConfigured(): boolean {
  return Boolean(process.env[RAIL_DATABASE_ENV]);
}

export function railConnectionString(): string {
  const conn = process.env[RAIL_DATABASE_ENV];
  if (!conn) throw new Error("RAIL_DATABASE_URL not configured — rail writes need a dedicated Neon role");
  return conn;
}

function sqlUrl(conn: string): string {
  return `https://${new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname}/sql`;
}

async function railRequest(body: unknown, extraHeaders: Record<string, string> = {}): Promise<NeonResponse> {
  const conn = railConnectionString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(sqlUrl(conn), {
      method: "POST",
      headers: {
        "Neon-Connection-String": conn,
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`rail db ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }
    return (await res.json()) as NeonResponse;
  } finally {
    clearTimeout(timeout);
  }
}

/** Run a parameterized query against the rail write role. Returns rows. */
export async function railQuery<T = NeonRow>(query: string, params: unknown[] = []): Promise<T[]> {
  const data = await railRequest({ query, params });
  const rows = data.rows ?? data.results?.[0]?.rows ?? [];
  return rows as T[];
}

export interface RailStatement {
  query: string;
  params?: unknown[];
}

/**
 * Run statements in one Neon HTTP batch transaction. Used so a transfer
 * snapshot, its status history, and the matching ledger posting commit
 * together — or not at all.
 */
export async function railTx(statements: RailStatement[]): Promise<void> {
  if (!statements.length) return;
  if (statements.length === 1) {
    await railRequest({ query: statements[0].query, params: statements[0].params ?? [] });
    return;
  }
  await railRequest(
    {
      queries: statements.map((s) => ({ query: s.query, params: s.params ?? [] })),
    },
    { "Neon-Batch-Isolation-Level": "RepeatableRead" }
  );
}

export interface RailSql {
  query<T = NeonRow>(query: string, params?: unknown[]): Promise<T[]>;
  tx(statements: RailStatement[]): Promise<void>;
}

export const defaultRailSql: RailSql = {
  query: railQuery,
  tx: railTx,
};
