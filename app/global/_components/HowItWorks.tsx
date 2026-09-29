import { Reveal } from "@/components/ui/Reveal";
import { Section, Kicker, H2 } from "./Bits";

const STEPS = [
  {
    n: "01",
    title: "Define the origin",
    body: "Tell Loadit what value is entering the system.",
    items: ["USD", "cash-originated value", "card-originated value", "stablecoins", "digital assets"],
  },
  {
    n: "02",
    title: "Define the destination",
    body: "Tell Loadit what the recipient or application needs.",
    items: ["USD", "USDC", "supported digital assets", "supported settlement endpoints"],
  },
  {
    n: "03",
    title: "Loadit finds the route",
    body: "The orchestration layer evaluates supported pathways using variables such as:",
    items: ["cost", "latency", "liquidity", "availability", "risk", "compliance"],
  },
  {
    n: "04",
    title: "Settlement",
    body: "The transaction is executed across the selected supported infrastructure and returned through a normalized Loadit interface.",
    items: ["one payment id", "idempotent execution", "normalized receipt"],
  },
];

export function HowItWorks() {
  return (
    <Section id="how">
      <Kicker>How Loadit works</Kicker>
      <H2>Origin. Destination. Route. Settlement.</H2>
      <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} index={i} className="bg-[#070A12] p-7">
            <div className="font-mono text-xs font-bold tracking-[0.25em] text-rail-400">{s.n}</div>
            <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{s.body}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {s.items.map((it) => (
                <li key={it} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/65">
                  {it}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
