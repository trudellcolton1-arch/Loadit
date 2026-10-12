import { Section, Eyebrow, H2, Lede, StatusTag, Cta } from "./Bits";
import { FOUNDER_LINE, GATES, NOT_FUNDED, RAISE, REPORTING, TIMELINE, USE_OF_FUNDS } from "../_lib/claims";

const usd = (n: number) => `$${n.toLocaleString("en-US")}`;

/**
 * THE RAISE — what $500K funds, line by line. Every dollar sits in one of four
 * categories with the amount, how it was sized, and when it is spent; then the
 * twelve-month timeline, the gates that control spending, what the money will
 * not be used for, and how spend is reported back. All of it is a plan and is
 * labeled as one.
 */
export function Raise() {
  const total = USE_OF_FUNDS.reduce((a, c) => a + c.total, 0);
  const linesTotal = USE_OF_FUNDS.reduce((a, c) => a + c.lines.reduce((x, l) => x + l.amount, 0), 0);
  const reconciled = total === RAISE.amount && linesTotal === RAISE.amount;

  return (
    <Section id="raise" alt>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>The raise</Eyebrow>
          <H2>{RAISE.amountLabel} to go from prototype to live product.</H2>
          <Lede>{RAISE.thesis}</Lede>
        </div>
        <StatusTag status="planned" className="mb-2" />
      </div>

      {/* headline figures */}
      <dl className="mt-10 grid gap-3 sm:grid-cols-4">
        {[
          ["Round", RAISE.amountLabel],
          ["Instrument", RAISE.instrument],
          ["Horizon", `${RAISE.horizonMonths} months`],
          ["Average spend", RAISE.avgMonthly],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/10 bg-[#04060B] px-4 py-3">
            <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
            <dd className="mt-1 text-lg font-semibold text-white">{v}</dd>
          </div>
        ))}
      </dl>

      {/* allocation bar */}
      <div className="mt-8 overflow-hidden rounded-xl border border-white/10" role="img" aria-label={USE_OF_FUNDS.map((c) => `${c.name} ${c.share}`).join(", ")}>
        <div className="flex h-3">
          {USE_OF_FUNDS.map((c, i) => (
            <div key={c.name} style={{ width: `${(c.total / total) * 100}%`, opacity: 1 - i * 0.2 }} className="bg-rail-400" />
          ))}
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-white/55">
        {USE_OF_FUNDS.map((c) => (
          <li key={c.name}><span className="text-white">{c.share}</span> {c.name} · {usd(c.total)}</li>
        ))}
      </ul>

      {/* line items */}
      <div className="mt-10 grid gap-6">
        {USE_OF_FUNDS.map((c) => (
          <section key={c.name} className="overflow-hidden rounded-2xl border border-white/10 bg-[#04060B]" aria-labelledby={`cat-${c.share}`}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-5 py-4">
              <div>
                <h3 id={`cat-${c.share}`} className="text-lg font-semibold text-white">{c.name} <span className="text-white/40">· {c.share}</span></h3>
                <p className="mt-1 text-sm text-white/60">{c.purpose}</p>
              </div>
              <div className="text-2xl font-semibold tracking-tightest text-white">{usd(c.total)}</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                  <tr>
                    <th className="px-5 py-2.5 font-semibold">Line item</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">How it was sized</th>
                    <th className="px-5 py-2.5 font-semibold">When</th>
                  </tr>
                </thead>
                <tbody>
                  {c.lines.map((l) => (
                    <tr key={l.item} className="border-t border-white/8 align-top">
                      <td className="px-5 py-3 text-white/85">{l.item}</td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-white">{usd(l.amount)}</td>
                      <td className="px-3 py-3 text-white/55">{l.basis}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-white/55">{l.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-white">{FOUNDER_LINE.item}</p>
            <p className="text-xs text-white/55">{FOUNDER_LINE.basis}</p>
          </div>
          <span className="font-mono text-white">{usd(FOUNDER_LINE.amount)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] px-5 py-4">
          <p className="text-sm font-semibold text-white">Total {reconciled ? "— every line reconciles to the round" : ""}</p>
          <span className="text-2xl font-semibold tracking-tightest text-white">{usd(linesTotal)}</span>
        </div>
      </div>

      {/* timeline */}
      <h3 className="mt-14 text-2xl font-semibold tracking-tightest text-white">Twelve months, in order.</h3>
      <p className="mt-2 max-w-2xl text-sm text-white/55">Spend per phase is the plan&apos;s sum of the line items active in those months. Deliverables are what each phase has to produce before the next one starts.</p>
      <ol className="mt-6 grid gap-3 lg:grid-cols-5">
        {TIMELINE.map((p) => (
          <li key={p.months} className="rounded-2xl border border-white/10 bg-[#04060B] p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] font-bold tracking-[0.2em] text-rail-400">MONTHS {p.months}</span>
              <span className="font-mono text-[11px] text-white/45">{p.spend}</span>
            </div>
            <h4 className="mt-3 text-base font-semibold text-white">{p.title}</h4>
            <ul className="mt-3 space-y-1.5">
              {p.deliverables.map((d) => (
                <li key={d} className="flex gap-2 text-xs leading-relaxed text-white/65"><span aria-hidden className="text-rail-400">—</span>{d}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      {/* gates / not funded / reporting */}
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-[#04060B] p-6">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Spending gates</h3>
          <ul className="mt-4 space-y-4">
            {GATES.map((g) => (
              <li key={g.gate}>
                <p className="text-sm font-semibold text-white">{g.gate}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{g.why}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#04060B] p-6">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">What this round does not fund</h3>
          <ul className="mt-4 space-y-2.5">
            {NOT_FUNDED.map((n) => (
              <li key={n} className="flex gap-3 text-sm text-white/75"><span aria-hidden className="text-white/30">×</span>{n}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#04060B] p-6">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">How spend is reported</h3>
          <ul className="mt-4 space-y-2.5">
            {REPORTING.map((r) => (
              <li key={r} className="flex gap-3 text-sm text-white/75"><span aria-hidden className="text-rail-400">—</span>{r}</li>
            ))}
          </ul>
          <div className="mt-6">
            <Cta href="#contact" className="px-4 py-2.5 text-xs">Discuss the round</Cta>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs leading-relaxed text-white/45">
        This is a plan, not a commitment: hires, rates, vendor prices, and timing will move. Allocation across the four categories matches the published pitch; line items are sized from current vendor pricing and market rates and are reviewed by the founder. Valuation cap and other terms are discussed in person and are not published here.
      </p>
    </Section>
  );
}
