/**
 * DATA ROOM — server-side storage + access control for the loadit.net
 * investor diligence library at /data-room.
 *
 * Architecture (deliberately boring):
 *   /data-room page → /api/dataroom (structure) → Neon Postgres →
 *   /api/dataroom/file/[id] (authorized view/download)
 *
 * Storage: the same Neon Postgres the HQ content pages use, over its HTTPS
 * SQL endpoint (raw 5432 isn't reachable from Vercel serverless). Documents
 * live in `dataroom_documents` with content base64-encoded — investor docs
 * are megabytes, not gigabytes, and this keeps the whole room inside infra
 * that already exists. Vercel's request cap means uploads top out ~3 MB per
 * file; the admin UI says so.
 *
 * Access control — two levels, checked server-side on EVERY read and write:
 *   - Admin (DATAROOM_ADMIN_KEY): add/rename/delete sections, upload,
 *     replace, delete documents. The owner only.
 *   - Investor (DATAROOM_ACCESS_CODE): view structure, view/download
 *     documents. Read-only, no exceptions.
 * Both secrets are server-only env vars, compared timing-safe. Codes travel
 * in request headers (never query strings, so they stay out of URL logs).
 * If either env var is unset the room REFUSES that level entirely — it
 * never falls open.
 */
import { createHash, timingSafeEqual } from "crypto";

/* ------------------------------------------------------------------ auth */

export type DataroomRole = "admin" | "investor" | null;

function safeEqual(a: string, b: string): boolean {
  // Hash both sides so length differences don't leak timing.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** Resolve the caller's role from request headers. Null = not authorized. */
export function dataroomRole(headers: Headers): DataroomRole {
  const adminKey = process.env.DATAROOM_ADMIN_KEY || "";
  const accessCode = process.env.DATAROOM_ACCESS_CODE || "";
  const gotAdmin = headers.get("x-dataroom-admin") || "";
  const gotCode = headers.get("x-dataroom-code") || "";
  if (adminKey && gotAdmin && safeEqual(gotAdmin, adminKey)) return "admin";
  if (accessCode && gotCode && safeEqual(gotCode, accessCode)) return "investor";
  return null;
}

/* -------------------------------------------------------------------- db */

function dbUrl(): string | undefined {
  return (
    process.env.DATAROOM_DATABASE_URL ||
    process.env.HQ_CONTENT_DATABASE_URL ||
    process.env.HYLAQ_DATABASE_URL
  );
}

export function dataroomConfigured(): boolean {
  return Boolean(dbUrl());
}

/** Parameterized query over Neon's HTTPS SQL endpoint. */
export async function drQuery<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const conn = dbUrl();
  if (!conn) throw new Error("data room db not configured");
  const host = new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`data room db ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const data = (await res.json()) as { rows?: T[] };
    return data.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

/** Create tables when missing. Called from admin actions only. */
export async function ensureSchema(): Promise<void> {
  await drQuery(`
    create table if not exists dataroom_sections (
      id bigint generated always as identity primary key,
      title text not null,
      position int not null default 0
    )`);
  await drQuery(`
    create table if not exists dataroom_documents (
      id text primary key,
      section_id bigint not null references dataroom_sections(id) on delete cascade,
      folder text not null default '',
      name text not null,
      mime text not null,
      size_bytes bigint not null,
      content_b64 text not null,
      uploaded_at timestamptz not null default now()
    )`);
}

/* ----------------------------------------------------------------- types */

export interface DataroomDocMeta {
  id: string;
  sectionId: number;
  folder: string;
  name: string;
  mime: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface DataroomSection {
  id: number;
  title: string;
  position: number;
  documents: DataroomDocMeta[];
}

/** Full structure — metadata only, never document content. */
export async function loadStructure(): Promise<DataroomSection[]> {
  try {
    const sections = await drQuery<{ id: number; title: string; position: number }>(
      "select id, title, position from dataroom_sections order by position, id"
    );
    if (!sections.length) return [];
    const docs = await drQuery<{
      id: string; section_id: number; folder: string; name: string;
      mime: string; size_bytes: number; uploaded_at: string;
    }>(
      `select id, section_id, folder, name, mime, size_bytes, uploaded_at
       from dataroom_documents order by folder, name`
    );
    return sections.map((s) => ({
      id: Number(s.id),
      title: s.title,
      position: s.position,
      documents: docs
        .filter((d) => Number(d.section_id) === Number(s.id))
        .map((d) => ({
          id: d.id,
          sectionId: Number(d.section_id),
          folder: d.folder,
          name: d.name,
          mime: d.mime,
          sizeBytes: Number(d.size_bytes),
          uploadedAt: d.uploaded_at,
        })),
    }));
  } catch (err) {
    // Tables not created yet → empty room rather than a 500.
    if (/relation .* does not exist/i.test(err instanceof Error ? err.message : "")) return [];
    throw err;
  }
}

export function newDocId(): string {
  const rand = Array.from({ length: 18 }, () =>
    "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]
  ).join("");
  return `drd_${rand}`;
}

/** ~3 MB raw file cap — keeps the base64 payload inside Vercel's body limit. */
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
