import { Reveal } from "@/components/ui/Reveal";
import { Section, Kicker, H2 } from "./Bits";

const LEGACY = ["Business", "Provider A", "Network A", "Exchange", "Bridge", "Provider B", "Settlement"];
const PAIN = [
  "Multiple APIs",
  "Multiple contracts",
  "Multiple failure points",
  "Different asset requirements",
  "Different networks",
  "Different compliance requirements",
];

export function GpsComparison() {
  return (
    <Section>
      <Kicker>The comparison</Kicker>
      <H2>
        Your GPS doesn&apos;t ask you to understand the road network.
        <br />
        <span className="text-white/45">Why should your financial infrastructure?</span>
      </H2>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {/* traditional */}
        <Reveal>
          <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">Traditional integration</p>
            <ol className="mt-6 space-y-0">
              {LEGACY.map((n, i) => (
                <li key={n} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full border border-white/30 bg-white/10" />
                    {i < LEGACY.length - 1 && <span className="my-0.5 h-6 w-px bg-white/15" />}
                  </div>
                  <span className={`-mt-0.5 text-sm ${i === 0 || i === LEGACY.length - 1 ? "text-white" : "text-white/55"}`}>{n}</span>
                </li>
              ))}
            </ol>
            <ul className="mt-8 grid grid-cols-1 gap-2 border-t border-white/8 pt-6 sm:grid-cols-2">
              {PAIN.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-white/45">
                  <span className="h-1 w-1 rounded-full bg-amber" /> {p}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* loadit */}
        <Reveal index={1}>
          <div className="relative h-full overflow-hidden rounded-2xl border border-rail-400/30 bg-rail-400/[0.04] p-6 sm:p-8">
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(34,169,92,0.18), transparent 65%)" }} />
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-rail-400">Loadit</p>
            <ol className="mt-6">
              {["Business", "LOADIT API", "Desired destination"].map((n, i) => (
                <li key={n} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`h-2.5 w-2.5 rounded-full ${i === 1 ? "bg-rail-400 shadow-glow" : "border border-white/40 bg-white/10"}`} />
                    {i < 2 && <span className="my-0.5 h-10 w-px bg-gradient-to-b from-cyan-glow/70 to-rail-500/70" />}
                  </div>
                  <span className={`-mt-0.5 ${i === 1 ? "font-mono text-sm font-bold tracking-[0.2em] text-white" : "text-sm text-white"}`}>{n}</span>
                </li>
              ))}
            </ol>
            <div className="mt-10 border-t border-white/8 pt-6">
              <p className="text-2xl font-semibold tracking-tight text-white">One integration.</p>
              <p className="text-2xl font-semibold tracking-tight text-rail-gradient">Multiple possible routes.</p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
