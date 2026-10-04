import { Reveal } from "@/components/ui/Reveal";
import { LOADIT_DETERMINES, YOU_TELL } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge } from "./Bits";

/**
 * TRANSACTION INTENT — the user states four things; the layer works out the
 * rest. The "determines" list is labeled honestly: today's engine returns the
 * route, network, conversion plan, cost, time, risk, and confidence; the full
 * list is the architecture it is growing into.
 */
export function IntentPanel() {
  return (
    <Section tight className="border-y border-white/8 bg-[#070A12]/60">
      <Kicker>Transaction intent</Kicker>
      <Display>You state the outcome.</Display>
      <Lede>Loadit should increasingly operate on intent, not on a user&apos;s knowledge of rails. Four questions in. Everything else is the layer&apos;s job.</Lede>

      <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto_1.4fr] lg:items-stretch">
        <Reveal>
          <div className="h-full rounded-3xl border border-white/10 bg-[#04060B] p-6 sm:p-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white">You tell Loadit</p>
            <ol className="mt-6 space-y-4">
              {YOU_TELL.map((q, i) => (
                <li key={q} className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] text-rail-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-xl font-medium tracking-tight text-white sm:text-2xl">{q}</span>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>

        <div aria-hidden className="flex items-center justify-center font-mono text-2xl text-rail-400 lg:flex-col">
          <span className="lg:hidden">↓</span>
          <span className="hidden lg:inline">→</span>
        </div>

        <Reveal index={1}>
          <div className="h-full rounded-3xl border border-rail-400/30 bg-rail-400/[0.05] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white">Loadit determines</p>
              <StatusBadge status="building" />
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LOADIT_DETERMINES.map((d) => (
                <li key={d} className="rounded-xl border border-white/10 bg-[#04060B]/70 px-3 py-2.5 text-sm text-white/85">{d}</li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-white/45">
              Today the routing engine returns the route, network, conversion plan, cost, time, risk, and confidence for a stated origin and destination. Liquidity pathing, settlement selection, and compliance routing across every rail are the future-state architecture, labeled as such.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
