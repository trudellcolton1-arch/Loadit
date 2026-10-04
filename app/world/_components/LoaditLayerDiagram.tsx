import { Reveal } from "@/components/ui/Reveal";
import { Section, Kicker, Display, Lede, StatusBadge } from "./Bits";

/**
 * THE LOADIT LAYER — the reveal. Intent enters at the top, the intelligence
 * layer sits in the middle, four kinds of network fan out beneath it, and
 * everything converges on a destination. Flow lines animate along the paths
 * (CSS dash animation; disabled under reduced motion).
 */
const BRANCHES = [
  { x: 110, label: "Banks" },
  { x: 290, label: "Cash" },
  { x: 470, label: "Digital assets" },
  { x: 650, label: "Merchants" },
];

export function LoaditLayerDiagram() {
  return (
    <Section id="layer">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <Kicker>The Loadit layer</Kicker>
          <Display>One intelligence layer.</Display>
          <Lede>
            Loadit is building infrastructure designed to determine how value should move across different networks. The networks stay where they are. The intelligence about them moves into one place.
          </Lede>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <StatusBadge status="building" verbose />
          </div>
          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Above the layer</dt>
              <dd className="mt-1.5 text-white/75">Intent. What you have, where it goes, what the other side should receive, what matters.</dd>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Below the layer</dt>
              <dd className="mt-1.5 text-white/75">Rails. Banks, cash networks, chains, card networks, merchant systems — each executed by the party licensed to do it.</dd>
            </div>
          </dl>
        </div>

        <Reveal>
          <figure className="rounded-3xl border border-white/10 bg-[#070A12]/85 p-4 shadow-glass sm:p-6">
            <svg viewBox="0 0 760 560" className="h-auto w-full" role="img" aria-label="Diagram: user intent flows into the Loadit intelligence layer, which fans out to banks, cash, digital assets, and merchants, converging on a destination.">
              <defs>
                <linearGradient id="ll-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" />
                  <stop offset="100%" stopColor="#22A95C" />
                </linearGradient>
                <filter id="ll-glow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="8" result="b" />
                  <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* intent */}
              <g>
                <rect x="250" y="24" width="260" height="56" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.14)" />
                <text x="380" y="48" textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="3">USER INTENT</text>
                <text x="380" y="67" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="10">value · destination · requirements</text>
              </g>
              <line x1="380" y1="80" x2="380" y2="150" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
              <line x1="380" y1="80" x2="380" y2="150" stroke="url(#ll-grad)" strokeWidth="1.5" className="world-flow" />

              {/* the layer */}
              <g filter="url(#ll-glow)">
                <rect x="190" y="150" width="380" height="110" rx="20" fill="rgba(34,169,92,0.08)" stroke="rgba(52,209,122,0.6)" strokeWidth="1.5" />
              </g>
              <text x="380" y="195" textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="15" fontWeight="700" letterSpacing="5">LOADIT</text>
              <text x="380" y="218" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="3">INTELLIGENCE LAYER</text>
              <text x="380" y="240" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="10">HQ scores every path · UVCE converts · ledger verifies</text>

              {/* branches */}
              {BRANCHES.map((b) => {
                const d = `M380 260 C 380 320, ${b.x} 300, ${b.x} 360`;
                const back = `M${b.x} 420 C ${b.x} 480, 380 460, 380 500`;
                return (
                  <g key={b.label}>
                    <path d={d} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                    <path d={d} fill="none" stroke="url(#ll-grad)" strokeWidth="1.5" className="world-flow" />
                    <rect x={b.x - 70} y="360" width="140" height="60" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.14)" />
                    <text x={b.x} y="395" textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700" letterSpacing="2">{b.label.toUpperCase()}</text>
                    <path d={back} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                    <path d={back} fill="none" stroke="url(#ll-grad)" strokeWidth="1.5" className="world-flow" />
                  </g>
                );
              })}

              {/* destination */}
              <rect x="270" y="500" width="220" height="48" rx="24" fill="rgba(255,255,255,0.95)" />
              <text x="380" y="530" textAnchor="middle" fill="#04060B" fontFamily="ui-monospace, monospace" fontSize="12" fontWeight="700" letterSpacing="4">DESTINATION</text>
            </svg>
            <figcaption className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              Conceptual architecture · the user chooses the outcome, Loadit chooses the route
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </Section>
  );
}
