import { Section, Eyebrow, H2, Lede, StatusTag, StatusKey, Cta } from "./Bits";
import { INFO } from "../_lib/content";
import { PATENT, PATENT_PARTS } from "../_lib/claims";

/**
 * THE PATENT, IN PLAIN WORDS — the whole filing explained so a five-year-old
 * could follow it, then each of the ten parts: the kid version first, the
 * filing's own description and claim numbers behind a disclosure, and an
 * honest "today" line with status.
 */
export function Patent() {
  return (
    <Section id="patent" alt>
      <Eyebrow>The patent, in plain words</Eyebrow>
      <H2>One machine. Ten parts. Explained simply.</H2>
      <Lede>
        Loadit has filed a U.S. patent application for the {PATENT.shortTitle}. Here is the whole thing in words a five-year-old could follow, then each part with what the filing says and how much of it exists today.
      </Lede>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] p-6 sm:p-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-rail-400">The five-year-old version</p>
          <p className="mt-4 text-xl font-medium leading-snug text-white sm:text-2xl">{PATENT.kid}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#04060B] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">The filing</p>
            <span className="rounded-md border border-white/20 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Patent pending</span>
          </div>
          <p className="mt-3 text-sm leading-snug text-white/80">{PATENT.title}</p>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            {[["Claims", PATENT.claims], ["Parts", PATENT.parts], ["Figures", PATENT.figures]].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                <dd className="mt-1 text-2xl font-semibold tracking-tightest text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-white/8 pt-4 text-xs leading-relaxed text-white/55">
            <span className="font-mono uppercase tracking-[0.18em] text-white/40">What pending means · </span>
            {PATENT.pendingMeans}
          </p>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
        <h3 className="text-2xl font-semibold tracking-tightest text-white">The ten parts.</h3>
        <StatusKey className="max-w-md" />
      </div>
      <ol className="mt-5 grid gap-3">
        {PATENT_PARTS.map((p) => (
          <li key={p.n} className="rounded-2xl border border-white/10 bg-[#04060B] p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-[150px_1fr_auto] sm:items-start sm:gap-6">
              <div>
                <div className="font-mono text-[10px] text-white/35">§{p.n} · {p.claims}</div>
                <div className="mt-1 font-mono text-[12px] font-bold tracking-[0.22em] text-rail-400">{p.code}</div>
                <div className="mt-1 text-sm text-white/70">{p.name}</div>
              </div>
              <div>
                <p className="text-base leading-relaxed text-white sm:text-lg">{p.kid}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/60">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Why it matters · </span>
                  {p.why}
                </p>
                <details className="mt-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-2.5">
                  <summary className="cursor-pointer text-xs font-semibold text-white/75">What the filing says</summary>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{p.filing}</p>
                </details>
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm leading-relaxed text-white/75">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-rail-400">Today · </span>
                  {p.today}
                </p>
              </div>
              <StatusTag status={p.status} className="justify-self-start sm:justify-self-end" />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Cta href="https://loadit.world/#technology" variant="secondary">The architecture in depth, on Loadit.world</Cta>
        <Cta href={INFO.dataRoom} variant="ghost">Full filing · investor data room (access required) →</Cta>
      </div>
      <p className="mt-4 text-xs text-white/45">
        Descriptions stay at the level of the public application. Independent claim, as filed: &ldquo;{PATENT.independentClaim}&rdquo;
      </p>
    </Section>
  );
}
