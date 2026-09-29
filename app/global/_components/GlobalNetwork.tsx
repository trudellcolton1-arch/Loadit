"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

/**
 * GLOBAL NETWORK — not a spinning globe. A minimal navigation map: geographic
 * nodes on a dotted field, with routes that appear, branch, recalculate, and
 * complete like turn-by-turn directions. Illustrative corridors.
 */

const NODES: Record<string, { x: number; y: number; label: string }> = {
  dallas: { x: 180, y: 190, label: "Dallas" },
  newyork: { x: 250, y: 150, label: "New York" },
  saopaulo: { x: 300, y: 300, label: "São Paulo" },
  london: { x: 415, y: 128, label: "London" },
  lagos: { x: 428, y: 236, label: "Lagos" },
  dubai: { x: 505, y: 190, label: "Dubai" },
  singapore: { x: 612, y: 252, label: "Singapore" },
  tokyo: { x: 690, y: 160, label: "Tokyo" },
  sydney: { x: 700, y: 335, label: "Sydney" },
};

const STORIES = [
  { from: "dallas", to: "london", fromAsset: "USD", toAsset: "USDC", via: "Route · Solana" },
  { from: "newyork", to: "singapore", fromAsset: "USDC", toAsset: "Local settlement", via: "Route · Base → partner" },
  { from: "london", to: "lagos", fromAsset: "GBP", toAsset: "USDC", via: "Route · Lightning" },
  { from: "dubai", to: "tokyo", fromAsset: "USDC", toAsset: "USDT", via: "Route · XRPL" },
  { from: "saopaulo", to: "newyork", fromAsset: "BRL", toAsset: "USDC", via: "Route · Polygon" },
];

function curve(a: { x: number; y: number }, b: { x: number; y: number }, lift = 0.28) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const cx = mx + nx * len * lift, cy = my + ny * len * lift;
  return `M${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export function GlobalNetwork() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<"draw" | "branch" | "done">("draw");

  useEffect(() => {
    if (!inView) return;
    let t: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setPhase("draw");
      t = setTimeout(() => {
        setPhase("branch");
        t = setTimeout(() => {
          setPhase("done");
          t = setTimeout(() => {
            setI((k) => (k + 1) % STORIES.length);
            cycle();
          }, 1800);
        }, 1200);
      }, 1400);
    };
    cycle();
    return () => clearTimeout(t);
  }, [inView]);

  const s = STORIES[i];
  const A = NODES[s.from], B = NODES[s.to];

  return (
    <Section id="network" grid>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Kicker>Global network</Kicker>
          <H2>Value has a destination. We find the route.</H2>
          <Lede>
            Corridors behave like navigation: a route appears, alternatives are weighed, one is
            selected, the value arrives. Illustrative corridors — not live volume.
          </Lede>
        </div>
        <StatusTag status="ILLUSTRATIVE" className="mb-2" />
      </div>

      <div ref={ref} className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-[#070A12]/85 shadow-glass">
        {/* route ticker */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/8 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.15em]">
          <span className="text-white/45">{A.label} <span className="text-white">{s.fromAsset}</span></span>
          <span className="text-rail-400">→ Loadit routing →</span>
          <span className="text-white/45">{B.label} <span className="text-white">{s.toAsset}</span></span>
          <span className="ml-auto text-white/35">
            {phase === "draw" ? "Calculating…" : phase === "branch" ? "Comparing routes…" : s.via}
          </span>
        </div>

        <svg viewBox="0 0 860 400" className="h-auto w-full" role="img" aria-label="Animated map of value routes between cities">
          <defs>
            <pattern id="gn-dots" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.07)" />
            </pattern>
            <linearGradient id="gn-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#5EEAD4" /><stop offset="1" stopColor="#22C55E" />
            </linearGradient>
            <radialGradient id="gn-fade" cx="50%" cy="50%" r="60%">
              <stop offset="55%" stopColor="#070A12" stopOpacity="0" />
              <stop offset="100%" stopColor="#070A12" stopOpacity="1" />
            </radialGradient>
          </defs>
          <rect width="860" height="400" fill="url(#gn-dots)" />
          {/* faint land masses as soft blobs so it reads as a map without being one */}
          <g fill="rgba(255,255,255,0.025)">
            <ellipse cx="215" cy="185" rx="110" ry="80" />
            <ellipse cx="300" cy="300" rx="55" ry="70" />
            <ellipse cx="450" cy="165" rx="90" ry="60" />
            <ellipse cx="450" cy="255" rx="60" ry="60" />
            <ellipse cx="620" cy="190" rx="120" ry="75" />
            <ellipse cx="700" cy="330" rx="50" ry="35" />
          </g>
          <rect width="860" height="400" fill="url(#gn-fade)" />

          {/* dormant corridors */}
          {STORIES.map((st, k) => k !== i && (
            <path key={k} d={curve(NODES[st.from], NODES[st.to])} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          ))}

          {/* alternative (branch) */}
          <motion.path
            d={curve(A, B, -0.22)}
            fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" strokeDasharray="3 6"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: phase === "branch" ? 1 : 0, opacity: phase === "branch" ? 1 : 0 }}
            transition={{ duration: 0.7 }}
          />
          {/* selected route */}
          <motion.path
            key={i}
            d={curve(A, B)}
            fill="none" stroke="url(#gn-route)" strokeWidth="2.2" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0.4 }}
            animate={{ pathLength: 1, opacity: phase === "done" ? 1 : 0.85 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
          <motion.path
            d={curve(A, B)}
            fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="10 260"
            animate={{ strokeDashoffset: [0, -270], opacity: phase === "done" ? [0.9, 0.9] : 0 }}
            transition={{ strokeDashoffset: { duration: 1.6, repeat: Infinity, ease: "linear" } }}
          />

          {/* nodes */}
          {Object.entries(NODES).map(([id, n]) => {
            const on = id === s.from || id === s.to;
            const dest = id === s.to && phase === "done";
            return (
              <g key={id}>
                {dest && (
                  <motion.circle cx={n.x} cy={n.y} r="8" fill="none" stroke="rgba(34,169,92,0.7)"
                    animate={{ r: [8, 20], opacity: [0.8, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
                )}
                <circle cx={n.x} cy={n.y} r={on ? 4 : 2.5} fill={on ? "#fff" : "rgba(255,255,255,0.4)"} />
                <text x={n.x} y={n.y - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9.5" letterSpacing="1.5"
                  fill={on ? "#fff" : "rgba(255,255,255,0.4)"}>
                  {n.label.toUpperCase()}
                </text>
              </g>
            );
          })}

          {/* labels at endpoints */}
          <g fontFamily="var(--font-mono)" fontSize="9" letterSpacing="1">
            <text x={A.x} y={A.y + 18} textAnchor="middle" fill="#34D17A">{s.fromAsset}</text>
            <motion.text x={B.x} y={B.y + 18} textAnchor="middle" fill="#34D17A" animate={{ opacity: phase === "done" ? 1 : 0.35 }}>
              {s.toAsset.toUpperCase()}
            </motion.text>
          </g>
        </svg>
      </div>

      <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">
        The internet routes information. Loadit routes value.
      </p>
    </Section>
  );
}
