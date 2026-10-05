import { Section, Eyebrow, H2, Lede, StatusTag, StatusKey } from "./Bits";
import { DESTINATIONS, SOURCES, describeRoute } from "../_lib/content";
import { RouteExplorer } from "./RouteExplorer";

/**
 * HOW LOADIT WORKS — source → Loadit coordination → destination. The
 * interactive explorer for people who click; a complete static table of every
 * route for people who don't (and for crawlers and screen readers).
 */
export function HowItWorks() {
  const pairs = SOURCES.flatMap((s) => DESTINATIONS.map((d) => ({ s, d, r: describeRoute(s.id, d.id) })));
  return (
    <Section id="how-it-works">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow>How Loadit works</Eyebrow>
          <H2>Source. Loadit coordination. Destination.</H2>
          <Lede>
            The customer states what they have and what should arrive. Loadit normalizes the value, selects a supported network, hands the regulated steps to licensed partners, and tracks every leg under one identifier. The customer never needs to know which rail carried the value.
          </Lede>
        </div>
        <StatusKey className="max-w-md" />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["1 · Source", "Cash at a licensed counter, a card, bank funds, or a digital asset the sender already holds."],
          ["2 · Loadit coordination", "Identity is verified by the partner where money changes hands. Loadit converts the value into a settlement-ready form, scores supported routes on cost, speed, liquidity, availability, risk, and compliance, and selects one."],
          ["3 · Destination", "A digital asset or stablecoin in a wallet the recipient controls today; payouts and merchant settlement later."],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-rail-400">{k}</div>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <RouteExplorer />
      </div>

      {/* static, accessible version of every route */}
      <details className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] px-5 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-white">All routes as a table (static version)</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
              <tr><th className="py-2 pr-4 font-semibold">Source</th><th className="py-2 pr-4 font-semibold">Destination</th><th className="py-2 pr-4 font-semibold">Status</th><th className="py-2 font-semibold">Note</th></tr>
            </thead>
            <tbody>
              {pairs.map(({ s, d, r }) => (
                <tr key={s.id + d.id} className="border-t border-white/8 align-top">
                  <td className="py-2.5 pr-4 text-white">{s.label}</td>
                  <td className="py-2.5 pr-4 text-white">{d.label}</td>
                  <td className="py-2.5 pr-4"><StatusTag status={r.status} /></td>
                  <td className="py-2.5 text-white/60">{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </Section>
  );
}
