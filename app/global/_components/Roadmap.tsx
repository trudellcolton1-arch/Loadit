import { Reveal } from "@/components/ui/Reveal";
import { PHASES } from "../_lib/site";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

/**
 * LAUNCH SEQUENCE — how the full platform gets proven without launching
 * everything at once. The platform is the whole system; Phase 1 is Load.
 */
export function Roadmap() {
  return (
    <Section id="roadmap" tight>
      <Kicker>Launch sequence</Kicker>
      <H2>The platform is the whole system. Load is the first proof.</H2>
      <Lede>
        Cash and card to digital assets is the first doorway, not the whole company. Each phase
        proves one customer behavior on the same transaction engine — the consumer product at
        loadit.net proves it first, then partners embed it.
      </Lede>
      <ol className="mt-12 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {PHASES.map((p, i) => (
          <Reveal key={p.n} index={i % 4} as="li">
            <div className={`h-full rounded-2xl border p-5 ${p.status === "IN BUILD" ? "border-amber/40 bg-amber/[0.04]" : "border-white/10 bg-white/[0.02]"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-rail-400">PHASE {p.n}</span>
                <StatusTag status={p.status} />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white">{p.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </ol>
      <p className="mt-6 text-xs text-white/40">
        Order is the plan, not a promise of dates. A phase is marked in build only when it exists in the runtime.
      </p>
    </Section>
  );
}
