/**
 * Apply db/migrations/*.sql against RAIL_DATABASE_URL (write role).
 *
 * Usage: npm run rail:migrate
 *
 * Safe to re-run: each file is recorded in rail_schema_migrations and
 * skipped once applied. Does not touch HYLAQ_DATABASE_URL.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { railConfigured, railQuery, railTx } from "../lib/railDb";

function splitSql(sql: string): string[] {
  const out: string[] = [];
  let buf = "";
  let dollar: string | null = null;
  for (let i = 0; i < sql.length; i++) {
    if (!dollar && sql.startsWith("--", i)) {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length - 1 : nl;
      continue;
    }
    if (sql[i] === "$") {
      const m = sql.slice(i).match(/^(\$[a-zA-Z0-9_]*\$)/);
      if (m) {
        if (dollar === m[1]) dollar = null;
        else if (!dollar) dollar = m[1];
        buf += m[1];
        i += m[1].length - 1;
        continue;
      }
    }
    if (!dollar && sql[i] === ";") {
      const stmt = buf.trim();
      if (stmt) out.push(stmt);
      buf = "";
      continue;
    }
    buf += sql[i];
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

async function main(): Promise<void> {
  if (!railConfigured()) {
    throw new Error("RAIL_DATABASE_URL is not set — will not fall back to the Hylaq read-only URL");
  }

  const dir = join(process.cwd(), "db/migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await railQuery(
    `create table if not exists rail_schema_migrations (
       id text primary key,
       applied_at timestamptz not null default now()
     )`
  );

  const applied = new Set(
    (await railQuery<{ id: string }>(`select id from rail_schema_migrations`)).map((r) => r.id)
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(dir, file), "utf8");
    const statements = splitSql(sql);
    console.log(`apply ${file} (${statements.length} statements)`);
    await railTx(statements.map((query) => ({ query })));
    await railQuery(`insert into rail_schema_migrations (id) values ($1) on conflict (id) do nothing`, [file]);
    console.log(`ok   ${file}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
