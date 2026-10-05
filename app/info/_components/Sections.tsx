import { Section, Eyebrow, H2, Lede, Rows, StatusTag, StatusKey, Cta } from "./Bits";
import { INFO } from "../_lib/content";
import {
  claim,
  PROBLEM,
  MARKET_ENTRY,
  MILESTONES,
  REVENUE_NOW,
  REVENUE_LATER,
  COSTS,
  ROADMAP,
  DIFFERENTIATION,
  FAQ,
  LEADERSHIP,
} from "../_lib/claims";

/* ------------------------------------------------------------- the problem */
export function Problem() {
  return (
    <Section alt>
      <Eyebrow>The problem</Eyebrow>
      <H2>Value is held in systems that don&apos;t talk to each other.</H2>
      <Lede>None of them is broken. They were simply built for different forms of value, and moving between them is still a job someone has to do by hand.</Lede>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
        {PROBLEM.map((p) => (
          <div key={p.k} className="bg-[#04060B] p-6">
            <h3 className="text-base font-semibold text-white">{p.k}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{p.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- market entry */
export function MarketEntry() {
  return (
    <Section alt>
      <Eyebrow>Initial market entry</Eyebrow>
      <H2>Start with cash and cards, end with a wallet the customer controls.</H2>
      <Lede>The first product is deliberately narrow: one funded transaction, one supported asset out, through a distribution channel that already exists. Everything below is a plan, labeled as such.</Lede>
      <div className="mt-10">
        <Rows items={MARKET_ENTRY} />
      </div>
      <p className="mt-4 text-xs text-white/45">{claim("production-build")}</p>
    </Section>
  );
}

/* ------------------------------------------------------------- progress */
export function Progress() {
  return (
    <Section id="progress">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>Progress and evidence</Eyebrow>
          <H2>What has actually been built or validated.</H2>
          <Lede>Dated where a date exists. No usage, volume, or revenue figures are shown because none exist yet — Loadit is pre-launch.</Lede>
        </div>
        <StatusKey className="max-w-md" />
      </div>
      <ol className="mt-10 grid gap-3">
        {MILESTONES.map((m) => (
          <li key={m.title} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4 sm:grid-cols-[110px_1fr_auto] sm:items-start sm:gap-6">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/45">{m.when}</div>
            <div>
              <h3 className="text-base font-semibold text-white">{m.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/60">{m.detail}</p>
              {m.link && (
                <a href={m.link.href} className="mt-2 inline-block text-xs font-semibold text-rail-400 hover:text-rail-100">{m.link.label} →</a>
              )}
            </div>
            <StatusTag status={m.status} className="justify-self-start sm:justify-self-end" />
          </li>
        ))}
      </ol>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          ["Engine", claim("self-heal")],
          ["Security", claim("pqc")],
          ["Platform", claim("b2b-prelaunch")],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/10 bg-[#070A12] p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- business model */
export function BusinessModel() {
  return (
    <Section id="business-model" alt>
      <Eyebrow>Business model</Eyebrow>
      <H2>Disclosed fees on coordinated transactions. Nothing hidden in a spread.</H2>
      <Lede>{claim("pre-revenue")} The mechanisms below are how Loadit intends to earn once the production application launches; the fee levels are published design intent and may change before launch.</Lede>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">At launch</h3>
          <div className="mt-3"><Rows items={REVENUE_NOW} /></div>
        </div>
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Potential later</h3>
          <div className="mt-3"><Rows items={REVENUE_LATER.map((r) => ({ ...r, status: "planned" as const }))} /></div>
        </div>
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-[#070A12] p-6">
        <h3 className="text-base font-semibold text-white">What sits against the fee</h3>
        <p className="mt-1 text-sm text-white/55">Transaction fees are revenue, not profit. Each coordinated transaction carries real costs:</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {COSTS.map((c) => (
            <li key={c} className="flex gap-3 text-sm text-white/70"><span aria-hidden className="text-rail-400">—</span>{c}</li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-white/45">Unit economics for the first route are a validation goal, not a published figure. Margin assumptions are discussed in the investor materials, not here.</p>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- roadmap */
export function Roadmap() {
  const near = ROADMAP.filter((r) => r.horizon === "near");
  const later = ROADMAP.filter((r) => r.horizon === "later");
  const Step = ({ s }: { s: (typeof ROADMAP)[number] }) => (
    <li className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-rail-400">{s.n}</span>
        <StatusTag status={s.status} />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-white">{s.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{s.body}</p>
      <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-relaxed text-white/45">
        <span className="font-mono uppercase tracking-[0.18em] text-white/40">Depends on · </span>
        {s.depends}
      </p>
    </li>
  );
  return (
    <Section id="roadmap">
      <Eyebrow>Expansion and roadmap</Eyebrow>
      <H2>An ordered sequence, gated by dependencies, not dates.</H2>
      <Lede>Near-term execution is the production app and the first route. The rest is the long-term direction, in the order it would have to happen. No launch dates are published.</Lede>
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.5fr]">
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Near-term execution</h3>
          <ol className="mt-3 grid gap-3">{near.map((s) => <Step key={s.n} s={s} />)}</ol>
        </div>
        <div>
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">Long-term direction</h3>
          <ol className="mt-3 grid gap-3 border-l border-dashed border-white/15 pl-4 sm:grid-cols-1">{later.map((s) => <Step key={s.n} s={s} />)}</ol>
          <p className="mt-4 text-xs text-white/45">The full long-term picture, including capabilities not yet designed in detail, is at <a href={INFO.vision} className="text-white underline decoration-white/30 underline-offset-4">loadit.world</a>.</p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- differentiation */
export function Differentiation() {
  return (
    <Section alt>
      <Eyebrow>Differentiation</Eyebrow>
      <H2>What could make this valuable.</H2>
      <Lede>Specifics that exist or are demonstrable, rather than claims about what others cannot do.</Lede>
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
        {DIFFERENTIATION.map((d) => (
          <div key={d.k} className="bg-[#04060B] p-6">
            <h3 className="text-base font-semibold text-white">{d.k}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{d.v}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- leadership */
export function Leadership() {
  return (
    <Section>
      <Eyebrow>Leadership</Eyebrow>
      <H2>Who is building it.</H2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {LEADERSHIP.map((p) => (
          <div key={p.name} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <h3 className="text-xl font-semibold text-white">{p.name}</h3>
            <p className="mt-1 text-sm text-rail-400">{p.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/60">{p.note}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-dashed border-white/15 p-6">
          <p className="text-sm leading-relaxed text-white/55">
            Additional team members, advisors, and the engineering hires for the production build are described in the investor materials once confirmed. This page lists only verified roles.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------- faq */
export function Faq() {
  return (
    <Section alt>
      <Eyebrow>Investor FAQ</Eyebrow>
      <H2>Straight answers to the first questions.</H2>
      <div className="mt-8 divide-y divide-white/8 rounded-2xl border border-white/10 bg-[#04060B]">
        {FAQ.map((f) => (
          <details key={f.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-white">
              {f.q}
              <span aria-hidden className="font-mono text-white/40 transition-transform group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/65">{f.a}</p>
          </details>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Cta href="#contact" variant="secondary">Ask something else</Cta>
      </div>
    </Section>
  );
}
