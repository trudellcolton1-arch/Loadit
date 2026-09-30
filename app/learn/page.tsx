import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ARTICLES, TOOLS } from "@/lib/learn";
import { SITE } from "@/lib/constants";
import { listHqPages } from "@/lib/hqContent";

/** HQ publishes new guides daily; re-check every 10 minutes. */
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Learn — Guides, Explainers & Free Tools",
  description:
    "Plain-language guides on AI-powered financial routing, cross-asset transfers, settlement, crypto and stablecoins — plus free calculators for cost and settlement time.",
  alternates: { canonical: "/learn" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Loadit Learn",
  url: `${SITE.url}/learn`,
  description:
    "Guides, explainers, and free tools on AI-powered financial routing, settlement, and moving value across cash, cards, crypto, and stablecoins.",
  hasPart: [...ARTICLES, ...TOOLS].map((e) => ({
    "@type": e.kind === "Tool" ? "WebApplication" : "BlogPosting",
    name: e.title,
    url: `${SITE.url}${e.href}`,
    description: e.blurb,
  })),
};

function Card({ href, kind, title, blurb }: { href: string; kind: string; title: string; blurb: string }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-rail/40 hover:bg-white/[0.04]"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-rail-400">{kind}</span>
      <h2 className="mt-3 text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">{blurb}</p>
      <span className="mt-4 text-sm font-medium text-rail-400 transition-transform group-hover:translate-x-0.5">
        Read →
      </span>
    </Link>
  );
}

export default async function Page() {
  const hqPages = await listHqPages();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-rail/30 bg-rail/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rail-400">
              Learn
            </div>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Guides, explainers &amp; free tools
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-white/60">
              Everything you need to understand moving money across cash, cards, crypto, and stablecoins — and how AI
              routing makes it cheaper and faster.
            </p>
          </div>

          <h2 className="mt-16 text-sm font-semibold uppercase tracking-wider text-white/40">Free tools</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TOOLS.map((t) => (
              <Card key={t.href} href={t.href} kind={t.kind} title={t.title} blurb={t.blurb} />
            ))}
          </div>

          <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-white/40">Guides &amp; explainers</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {ARTICLES.map((a) => (
              <Card key={a.href} href={a.href} kind={a.kind} title={a.title} blurb={a.blurb} />
            ))}
          </div>

          {hqPages.length > 0 && (
            <>
              <h2 className="mt-14 text-sm font-semibold uppercase tracking-wider text-white/40">
                How-to guides <span className="normal-case tracking-normal text-white/30">· written by HQ, Loadit&apos;s routing intelligence</span>
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {hqPages.map((p) => (
                  <Card
                    key={p.slug}
                    href={`/p/${p.slug}`}
                    kind="Guide"
                    title={p.title}
                    blurb={p.metaDescription ?? "A practical guide from HQ."}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
