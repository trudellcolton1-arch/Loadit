import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SITE } from "@/lib/constants";
import { getHqPage } from "@/lib/hqContent";

/**
 * /p/<slug> — HQ-written SEO pages, served on loadit.net so the search value
 * lands on our own domain. HQ owns generation and sanitizes upstream; this
 * route only reads and renders. ISR: re-checked every 10 minutes.
 */
export const revalidate = 600;

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getHqPage(params.slug);
  if (!page) return { title: "Not found" };
  const url = `${SITE.url}/p/${page.slug}`;
  const description = page.metaDescription ?? undefined;
  return {
    title: page.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: page.title,
      description,
      url,
      siteName: SITE.name,
      type: "article",
    },
  };
}

export default async function HqContentPage({ params }: Props) {
  const page = await getHqPage(params.slug);
  if (!page) notFound();

  const url = `${SITE.url}/p/${page.slug}`;
  const article = page.jsonLd ?? {
    "@type": "Article",
    headline: page.title,
    description: page.metaDescription ?? undefined,
    datePublished: page.publishedAt ?? undefined,
    dateModified: page.publishedAt ?? undefined,
    inLanguage: "en",
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    mainEntityOfPage: url,
    url,
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      article,
      ...(page.faq.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: page.faq.map((f) => ({
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
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            {page.title}
          </h1>
          {page.publishedAt && (
            <div className="mt-3 text-xs text-white/40">
              Published{" "}
              {new Date(page.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}

          <div
            className="hq-body mt-10 border-t border-white/10 pt-10"
            /* Written and sanitized upstream by HQ; Loadit renders read-only. */
            dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
          />

          {page.faq.length > 0 && (
            <section className="mt-12 border-t border-white/10 pt-10">
              <h2 className="text-xl font-bold text-white">Frequently asked questions</h2>
              <div className="mt-5 space-y-3">
                {page.faq.map((f) => (
                  <details
                    key={f.q}
                    className="group rounded-xl border border-white/10 bg-white/5 px-5 py-4"
                  >
                    <summary className="cursor-pointer list-none font-semibold text-white/90 transition-colors group-open:text-rail-400">
                      {f.q}
                    </summary>
                    <p className="mt-3 leading-relaxed text-white/60">{f.a}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />

      <style>{`
        .hq-body { color: rgba(255,255,255,.72); font-size: 1.0625rem; line-height: 1.75; }
        .hq-body h2 { color: #fff; font-size: 1.5rem; font-weight: 700; letter-spacing: -.01em; margin: 2.25rem 0 .75rem; }
        .hq-body h3 { color: #fff; font-size: 1.17rem; font-weight: 600; margin: 1.75rem 0 .5rem; }
        .hq-body p { margin: 0 0 1.1rem; }
        .hq-body a { color: #34D17A; text-decoration: underline; text-underline-offset: 3px; }
        .hq-body a:hover { color: #CFF5DF; }
        .hq-body ul, .hq-body ol { margin: 0 0 1.1rem; padding-left: 1.4rem; }
        .hq-body li { margin-bottom: .45rem; }
        .hq-body strong { color: rgba(255,255,255,.92); }
        .hq-body blockquote { border-left: 3px solid #22A95C; padding-left: 1rem; color: rgba(255,255,255,.6); margin: 1.5rem 0; }
        .hq-body table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: .95rem; display: block; overflow-x: auto; }
        .hq-body th, .hq-body td { border: 1px solid rgba(255,255,255,.12); padding: .55rem .8rem; text-align: left; }
        .hq-body th { color: #fff; background: rgba(255,255,255,.05); }
        .hq-body code { background: rgba(255,255,255,.08); border-radius: 5px; padding: .1em .35em; font-size: .92em; }
        .hq-body img { max-width: 100%; border-radius: 12px; }
      `}</style>
    </>
  );
}
