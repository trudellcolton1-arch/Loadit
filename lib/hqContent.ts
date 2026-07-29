import { unstable_cache } from "next/cache";

/**
 * HQ CONTENT ENGINE — read-only view of the SEO pages HQ writes for this
 * domain. HQ (Hylaq Quantum) owns generation and publishes into ITS OWN Neon
 * Postgres (table hq_content_page, tagged per domain) — a separate database
 * from the primary Hylaq DB that powers handle lookups. Loadit only READS and
 * renders the pages tagged for loadit.net at /p/<slug>.
 *
 * Connection: HQ_CONTENT_DATABASE_URL (HQ's Neon), falling back to
 * HYLAQ_DATABASE_URL for a single-database setup. Same Neon HTTP SQL path as
 * lib/hylaqDb.ts.
 *
 * Both helpers are ISR-cached (10 min) and never throw — a DB hiccup or a
 * missing connection string renders as "no pages", never a 500.
 */

const DOMAINS = ["loadit.net", "www.loadit.net"];
const REVALIDATE_S = 600;

function contentDbUrl(): string | undefined {
  return process.env.HQ_CONTENT_DATABASE_URL || process.env.HYLAQ_DATABASE_URL;
}

function contentDbConfigured(): boolean {
  return Boolean(contentDbUrl());
}

/** Read-only query against HQ's content Neon over its HTTPS SQL endpoint. */
async function contentQuery<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  const conn = contentDbUrl();
  if (!conn) throw new Error("content db not configured");
  const host = new URL(conn.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`content db ${res.status}`);
    const data = (await res.json()) as { rows?: T[] };
    return data.rows ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

export interface HqFaq {
  q: string;
  a: string;
}

export interface HqPage {
  slug: string;
  title: string;
  metaDescription: string | null;
  bodyHtml: string;
  faq: HqFaq[];
  jsonLd: Record<string, unknown> | null;
  publishedAt: string | null;
}

export interface HqPageSummary {
  slug: string;
  title: string;
  publishedAt: string | null;
}

/** Coerce a jsonb-or-text column into an object (or null). */
function toObject(v: unknown): Record<string, unknown> | null {
  if (!v) return null;
  if (typeof v === "object") return v as Record<string, unknown>;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Coerce the faq column (jsonb-or-text, array of {q,a}) into a clean list. */
function toFaq(v: unknown): HqFaq[] {
  let raw: unknown = v;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is Record<string, unknown> => Boolean(f) && typeof f === "object")
    .map((f) => ({ q: String(f.q ?? f.question ?? "").trim(), a: String(f.a ?? f.answer ?? "").trim() }))
    .filter((f) => f.q && f.a);
}

const getHqPageUncached = async (slug: string): Promise<HqPage | null> => {
  if (!contentDbConfigured()) return null;
  const clean = (slug || "").trim().toLowerCase();
  if (!clean) return null;
  try {
    const rows = await contentQuery<Record<string, unknown>>(
      `select slug, title,
              meta_description as "metaDescription",
              body_html as "bodyHtml",
              faq,
              json_ld as "jsonLd",
              published_at as "publishedAt"
       from hq_content_page
       where status = 'published' and domain = any($1) and slug = $2
       limit 1`,
      [DOMAINS, clean]
    );
    if (!rows.length) return null;
    const r = rows[0];
    if (!r.bodyHtml) return null;
    return {
      slug: String(r.slug),
      title: String(r.title || r.slug),
      metaDescription: r.metaDescription ? String(r.metaDescription) : null,
      bodyHtml: String(r.bodyHtml),
      faq: toFaq(r.faq),
      jsonLd: toObject(r.jsonLd),
      publishedAt: r.publishedAt ? String(r.publishedAt) : null,
    };
  } catch {
    return null; // read-side failure must never 500 a page
  }
};

/** One published HQ page for this domain, by slug. Cached 10 min. */
export const getHqPage = unstable_cache(getHqPageUncached, ["hq-content-page"], {
  revalidate: REVALIDATE_S,
});

const listHqPagesUncached = async (): Promise<HqPageSummary[]> => {
  if (!contentDbConfigured()) return [];
  try {
    const rows = await contentQuery<Record<string, unknown>>(
      `select slug, title, published_at as "publishedAt"
       from hq_content_page
       where status = 'published' and domain = any($1)
       order by published_at desc nulls last
       limit 500`,
      [DOMAINS]
    );
    return rows
      .filter((r) => r.slug)
      .map((r) => ({
        slug: String(r.slug),
        title: String(r.title || r.slug),
        publishedAt: r.publishedAt ? String(r.publishedAt) : null,
      }));
  } catch {
    return []; // sitemap must build even if the DB is unreachable
  }
};

/** All published HQ pages for this domain (for the sitemap). Cached 10 min. */
export const listHqPages = unstable_cache(listHqPagesUncached, ["hq-content-list"], {
  revalidate: REVALIDATE_S,
});
