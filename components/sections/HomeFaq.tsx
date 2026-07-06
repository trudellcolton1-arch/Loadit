import Link from "next/link";
import { FAQS } from "@/lib/seo";

/**
 * Server-rendered FAQ for the homepage. Uses native <details>, so every
 * question AND answer is in the initial HTML — the version crawlers that weight
 * rendered text (and AI engines) actually read. Same FAQS that build the
 * FAQPage JSON-LD, so on-page text and structured data match exactly.
 */
export function HomeFaq() {
  return (
    <section id="faq" className="relative border-t border-white/5 section-py">
      <div className="container-px mx-auto max-w-3xl">
        <div className="text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-rail-400">FAQ</p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/55">
            What Loadit is, how it moves money, and what it costs.
          </p>
        </div>

        <div className="mt-12 flex flex-col gap-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition-colors open:bg-white/[0.04]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-white [&::-webkit-details-marker]:hidden">
                <h3 className="text-base font-medium sm:text-lg">{f.q}</h3>
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-white/60 transition-transform duration-300 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-white/55 sm:text-base">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 rounded-full border border-rail/30 bg-rail/10 px-5 py-3 text-sm font-semibold text-rail-400 transition-colors hover:bg-rail/15"
          >
            Explore guides &amp; free tools →
          </Link>
        </div>
      </div>
    </section>
  );
}
