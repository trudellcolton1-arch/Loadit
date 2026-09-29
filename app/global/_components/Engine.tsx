import { Reveal } from "@/components/ui/Reveal";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

const LAYERS = [
  { name: "Transaction intent", sub: "origin · destination · amount · constraints" },
  { name: "Loadit API", sub: "authenticated, normalized interface" },
  { name: "UVCE", sub: "Universal Value Conversion Engine" },
  { name: "Intelligent orchestration", sub: "HQ · scores every supported path" },
  { name: "Route evaluation", sub: "cost · speed · liquidity · availability · risk · compliance" },
  { name: "Compliance + risk", sub: "jurisdiction-aware, scored per route" },
  { name: "Settlement execution", sub: "idempotent · one payment id" },
  { name: "Destination", sub: "the value the application asked for" },
];

const EXPLAIN = [
  {
    title: "Universal Value Conversion Engine",
    status: "PATENT PENDING" as const,
    body: "The UVCE is designed to normalize different representations of value into a system Loadit's infrastructure can route and process. A card authorization, cash at a counter, and a stablecoin on one network all become the same kind of settlement-ready object.",
  },
  {
    title: "Intelligent routing",
    status: "IN BUILD" as const,
    body: "Loadit's orchestration layer evaluates available supported settlement paths instead of forcing developers to hard-code every possible financial route. The selected route is locked with a time-to-live and returned with its cost, expected time, and confidence.",
  },
  {
    title: "Adaptive routing",
    status: "IN BUILD" as const,
    body: "If infrastructure becomes unavailable or unsuitable, the system architecture is designed to evaluate alternative supported pathways — under the same payment identifier, with idempotent execution so nothing is ever paid twice.",
  },
];

export function Engine() {
  return (
    <Section grid>
      <Kicker>Under the hood</Kicker>
      <H2>The engine behind the route.</H2>
      <Lede>Introduced only after the analogy — because the analogy is the product.</Lede>

      <div className="mt-14 grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        {/* layered stack */}
        <Reveal>
          <ol className="relative rounded-2xl border border-white/10 bg-[#070A12]/85 p-3 shadow-glass">
            {LAYERS.map((l, i) => {
              const core = i >= 2 && i <= 6;
              return (
                <li key={l.name} className="relative">
                  <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${core ? "border border-rail-400/25 bg-rail-400/[0.05]" : "border border-white/8 bg-white/[0.02]"}`}>
                    <div>
                      <div className={`text-sm font-semibold ${core ? "text-white" : "text-white/80"}`}>{l.name}</div>
                      <div className="font-mono text-[10px] text-white/40">{l.sub}</div>
                    </div>
                    <span className="font-mono text-[10px] text-white/30">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  {i < LAYERS.length - 1 && (
                    <div className="flex justify-center py-1">
                      <span className="h-4 w-px bg-gradient-to-b from-white/20 to-rail-500/50" />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Reveal>

        <div className="grid content-start gap-6">
          {EXPLAIN.map((e, i) => (
            <Reveal key={e.title} index={i}>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">{e.title}</h3>
                  <StatusTag status={e.status} />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/60">{e.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
