import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/constants";

export interface ArticleFaq {
  q: string;
  a: string;
}

export interface ArticleProps {
  slug: string;
  kind: string;
  title: string;
  description: string;
  updated: string; // ISO
  readMins: number;
  faqs?: ArticleFaq[];
  children: ReactNode;
}

/** Long-form article shell with BlogPosting + optional FAQPage structured data. */
export function ArticleLayout({ slug, kind, title, description, updated, readMins, faqs, children }: ArticleProps) {
  const url = `${SITE.url}/learn/${slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        headline: title,
        description,
        datePublished: updated,
        dateModified: updated,
        inLanguage: "en",
        author: { "@type": "Organization", name: SITE.name, url: SITE.url },
        publisher: {
          "@type": "Organization",
          name: SITE.name,
          logo: { "@type": "ImageObject", url: `${SITE.url}/icon.svg` },
        },
        mainEntityOfPage: url,
        url,
      },
      ...(faqs && faqs.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <article className="mx-auto max-w-3xl">
          <Link href="/learn" className="text-sm text-white/50 transition-colors hover:text-rail">
            ← Learn
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-rail/30 bg-rail/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rail-400">
            {kind}
          </div>
          <h1 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/60">{description}</p>
          <div className="mt-3 text-xs text-white/40">
            Updated {new Date(updated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · {readMins} min read
          </div>

          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="article">{children}</div>
          </div>

          {faqs && faqs.length > 0 && (
            <section className="mt-14 border-t border-white/10 pt-10">
              <h2 className="text-2xl font-bold tracking-tight text-white">Frequently asked questions</h2>
              <div className="mt-6 flex flex-col gap-4">
                {faqs.map((f) => (
                  <div key={f.q} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                    <h3 className="font-semibold text-white">{f.q}</h3>
                    <p className="mt-2 text-white/65">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-14 flex flex-col items-start gap-4 rounded-3xl border border-rail/20 bg-gradient-to-br from-rail/10 to-transparent p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-lg font-semibold text-white">Try it with Loadit</div>
              <div className="mt-1 text-sm text-white/60">Turn cash or card into crypto in seconds — AI-routed, non-custodial.</div>
            </div>
            <Link
              href="/install"
              className="whitespace-nowrap rounded-full bg-rail px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
            >
              Get the app →
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
