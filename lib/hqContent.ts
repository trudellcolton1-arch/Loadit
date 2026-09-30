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
 *
 * PUBLISHING RULES (replaces the hand allowlist of Aug 29, which left every
 * newer HQ page 404ing):
 *   1. Every row HQ marks status='published' for this domain renders — except
 *   2. BLOCKED pages: anything whose slug or title targets a comprehensively
 *      sanctioned jurisdiction, or names the cash partner in the URL itself.
 *      Those are not-found and omitted from the sitemap whatever the DB says.
 *   3. SANITIZED copy: the public site does not name the cash partner and never
 *      presents retail cash-in as live, so the partner name is de-branded at
 *      render time and every page carries a "where Loadit stands today" note.
 * The real fix for 2–3 belongs in HQ's writing brief; this keeps the site
 * honest in the meantime.
 */

const DOMAINS = ["loadit.net", "www.loadit.net"];
const REVALIDATE_S = 600;

/**
 * Never publish remittance / on-ramp guides aimed at comprehensively
 * sanctioned jurisdictions. Matched against slug and title.
 */
export const HQ_BLOCKED_PATTERNS: readonly RegExp[] = [
  /\bcuba(n)?\b/i,
  /\biran(ian)?\b/i,
  /north[\s-]?korea/i,
  /\bsyria(n)?\b/i,
  /\bcrimea(n)?\b/i,
  /\bdonetsk\b|\bluhansk\b/i,
  /\brussia(n)?\b/i,
  /\bbelarus(ian)?\b/i,
  // The cash partner is not named on any public surface — a URL that names
  // it cannot be de-branded, so the page stays out.
  /moneygram/i,
];

/** Hand-maintained blocklist for one-offs (exact slug, lowercase). */
export const HQ_BLOCKED_SLUGS: readonly string[] = [];

const BLOCKED_SLUG_SET = new Set(HQ_BLOCKED_SLUGS);

/** True when a page must not render, whatever its DB status. */
export function isBlockedHqPage(page: { slug: string; title?: string | null }): boolean {
  const slug = (page.slug || "").trim().toLowerCase();
  if (!slug) return true;
  if (BLOCKED_SLUG_SET.has(slug)) return true;
  const hay = `${slug} ${page.title || ""}`;
  return HQ_BLOCKED_PATTERNS.some((re) => re.test(hay));
}

/** Drop blocked rows — the sitemap and the page both go through this. */
export function filterPublishableHqPages<T extends { slug: string; title?: string | null }>(pages: T[]): T[] {
  return pages.filter((p) => !isBlockedHqPage(p));
}

/**
 * Public-surface guardrails applied to HQ prose at render time:
 *  - the cash partner is never named (site-wide rule since the Sep 11 scrub);
 *    cash-in is described as launching, never as available today;
 *  - HQ's CTA-insertion glitch ("a tool like try Loadit") is repaired.
 * Works on plain text and on HTML alike (no tags are touched).
 */
export function sanitizeHqText(input: string): string {
  if (!input) return input;
  let s = input;
  // "a MoneyGram location/kiosk/counter/agent" → "a participating cash location (launching soon)"
  s = s.replace(/\b(a|an|any|your|the)\s+(?:Walmart\s+)?MoneyGram\s+(location|kiosk|counter|agent|store)s?\b/gi,
    (_m, art: string) => `${art} participating cash location (retail cash-in launching soon)`);
  // "MoneyGram locations/kiosks…" → "participating cash locations (launching soon)"
  s = s.replace(/\b(?:Walmart\s+)?MoneyGram\s+(location|kiosk|counter|agent|store)s?\b/gi,
    "participating cash locations (retail cash-in launching soon)");
  // "at/through/via MoneyGram" → "… a licensed cash network (launching soon)"
  s = s.replace(/\b(at|through|via|with|using)\s+MoneyGram\b/gi, "$1 a licensed cash network (retail cash-in launching soon)");
  // Anything left: the bare name.
  s = s.replace(/\bMoneyGram(?:'s)?\b/g, "a licensed cash network");
  // Repair the CTA glitch: "a tool like try Loadit", "where try Loadit comes in".
  s = s.replace(/\b(like|where|with|is|of|as|to)\s+try Loadit\b/g, "$1 Loadit");
  s = s.replace(/\btry Loadit (fits|comes|is|was|does|handles|lets|helps)\b/g, "Loadit $1");
  return s;
}

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
    // NOTE: no `cache: "no-store"` here — POST fetches are never cached anyway,
    // and the explicit hint forces a dynamic bailout during the sitemap's
    // static/ISR generation (thrown error → swallowed → empty page list).
    const res = await fetch(`https://${host}/sql`, {
      method: "POST",
      headers: { "Neon-Connection-String": conn, "Content-Type": "application/json" },
      body: JSON.stringify({ query, params }),
      signal: controller.signal,
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
  metaDescription: string | null;
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
    .map((f) => ({ q: sanitizeHqText(String(f.q ?? f.question ?? "").trim()), a: sanitizeHqText(String(f.a ?? f.answer ?? "").trim()) }))
    .filter((f) => f.q && f.a);
}

/** Sanitize the string leaves of HQ's JSON-LD (headline, description, FAQ text). */
function sanitizeJsonLd(v: unknown): unknown {
  if (typeof v === "string") return sanitizeHqText(v);
  if (Array.isArray(v)) return v.map(sanitizeJsonLd);
  if (v && typeof v === "object") {
    return Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, sanitizeJsonLd(x)]));
  }
  return v;
}

const getHqPageUncached = async (slug: string): Promise<HqPage | null> => {
  const clean = (slug || "").trim().toLowerCase();
  // Blocklist first: a blocked slug is notFound before we even look at the DB.
  if (!clean || isBlockedHqPage({ slug: clean })) return null;
  if (!contentDbConfigured()) return null;
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
    const title = String(r.title || r.slug);
    // Title-level block (a slug can be clean while the title targets a blocked place).
    if (isBlockedHqPage({ slug: clean, title })) return null;
    return {
      slug: String(r.slug),
      title: sanitizeHqText(title),
      metaDescription: r.metaDescription ? sanitizeHqText(String(r.metaDescription)) : null,
      bodyHtml: sanitizeHqText(String(r.bodyHtml)),
      faq: toFaq(r.faq),
      jsonLd: (sanitizeJsonLd(toObject(r.jsonLd)) as Record<string, unknown> | null) ?? null,
      publishedAt: r.publishedAt ? String(r.publishedAt) : null,
    };
  } catch {
    return null; // read-side failure must never 500 a page
  }
};

/** One published, publishable HQ page for this domain, by slug. Cached 10 min. */
export const getHqPage = unstable_cache(getHqPageUncached, ["hq-content-page-v2"], {
  revalidate: REVALIDATE_S,
});

const listHqPagesUncached = async (): Promise<HqPageSummary[]> => {
  if (!contentDbConfigured()) return [];
  try {
    const rows = await contentQuery<Record<string, unknown>>(
      `select slug, title, meta_description as "metaDescription", published_at as "publishedAt"
       from hq_content_page
       where status = 'published' and domain = any($1) and body_html is not null
       order by published_at desc nulls last
       limit 500`,
      [DOMAINS]
    );
    return filterPublishableHqPages(
      rows
        .filter((r) => r.slug)
        .map((r) => ({
          slug: String(r.slug),
          title: String(r.title || r.slug),
          metaDescription: r.metaDescription ? String(r.metaDescription) : null,
          publishedAt: r.publishedAt ? String(r.publishedAt) : null,
        }))
    ).map((p) => ({
      ...p,
      title: sanitizeHqText(p.title),
      metaDescription: p.metaDescription ? sanitizeHqText(p.metaDescription) : null,
    }));
  } catch {
    return []; // sitemap must build even if the DB is unreachable
  }
};

/** Published, publishable HQ pages for this domain (sitemap + /learn). Cached 10 min. */
export const listHqPages = unstable_cache(listHqPagesUncached, ["hq-content-list-v2"], {
  revalidate: REVALIDATE_S,
});
