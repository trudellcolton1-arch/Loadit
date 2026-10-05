import { Section, Eyebrow, H2, Lede, StatusTag, Cta } from "./Bits";
import { INFO } from "../_lib/content";
import { PRODUCTS } from "../_lib/claims";

/**
 * TWO FRONT DOORS — Loadit.net for people (B2C) and Loadit Global for
 * businesses and developers (B2B), on the same engine. The kid version first,
 * then what each is, where it stands, and what inside it has which status.
 */
export function Products() {
  return (
    <Section id="products">
      <Eyebrow>Two front doors, one engine</Eyebrow>
      <H2>Loadit.net for people. Loadit Global for businesses.</H2>
      <Lede>
        The consumer product proves each capability first; the business platform then exposes the same capability to partners behind their own brand. Both run on the engine the patent describes.
      </Lede>
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {PRODUCTS.map((p) => (
          <article key={p.name} className="flex flex-col rounded-2xl border border-white/10 bg-[#070A12] p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">{p.audience}</p>
                <h3 className="mt-1 text-2xl font-semibold tracking-tightest text-white">{p.name}</h3>
              </div>
              <StatusTag status={p.status} />
            </div>
            <p className="mt-4 rounded-xl border border-rail-400/25 bg-rail-400/[0.05] px-4 py-3 text-base leading-relaxed text-white">{p.kid}</p>
            <p className="mt-4 text-sm leading-relaxed text-white/65">{p.what}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rail-400">Where it stands · </span>
              {p.now}
            </p>
            <ul className="mt-5 divide-y divide-white/8 rounded-xl border border-white/10">
              {p.items.map((it) => (
                <li key={it.label} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-white/80">
                  {it.label}
                  <StatusTag status={it.status} />
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-3">
              <Cta href={p.url} variant="secondary" className="px-4 py-2 text-xs">Visit {p.name} ↗</Cta>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-6 text-xs text-white/45">
        The long-term picture that both doors lead to is told at <a href={INFO.vision} className="text-white underline decoration-white/30 underline-offset-4">loadit.world</a>.
      </p>
    </Section>
  );
}
