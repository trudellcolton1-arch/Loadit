"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NETWORKS } from "@/lib/constants";

/** Positions the 8 networks evenly around a circle. */
function useRing(radius: number, cx: number, cy: number) {
  return useMemo(
    () =>
      NETWORKS.map((n, i) => {
        const angle = (i / NETWORKS.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...n,
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
        };
      }),
    [radius, cx, cy]
  );
}

export function RoutingEngine() {
  const SIZE = 520;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const nodes = useRing(200, cx, cy);
  const [active, setActive] = useState(0);

  // The AI "chooses" a new best route on a cadence.
  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1 + Math.floor(Math.random() * 3)) % NETWORKS.length),
      1800
    );
    return () => clearInterval(id);
  }, []);

  const activeNode = nodes[active];

  return (
    <section id="routing" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="AERO · AI Routing Engine"
              title={
                <>
                  AI finds the best path.{" "}
                  <span className="text-rail-gradient">Every time.</span>
                </>
              }
              description="AI Enhanced Routing Optimization tokenizes every payment and scores routes across legacy processors, L1s, L2s, Lightning, and liquidity pools in real time — then settles on the cheapest, fastest path available in that millisecond."
            />

            <div className="mt-10 grid grid-cols-2 gap-3 sm:max-w-md">
              {[
                { k: "Route", v: activeNode.name },
                { k: "Status", v: "Optimal", accent: true },
                { k: "Est. cost", v: "$0.45" },
                { k: "Settlement", v: "~2s" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="glass rounded-2xl px-4 py-3.5"
                >
                  <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                    {s.k}
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={s.v}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.3 }}
                      className={`mt-1 text-lg font-semibold tracking-tight ${
                        s.accent ? "text-signal" : "text-white"
                      }`}
                    >
                      {s.v}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          {/* Live visualization */}
          <div className="relative mx-auto w-full max-w-[520px]">
            <svg
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              className="h-auto w-full"
              role="img"
              aria-label="AI routing engine arbitrating across blockchain networks"
            >
              <defs>
                <radialGradient id="core-glow">
                  <stop offset="0%" stopColor="#5b9bff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#5b9bff" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="active-line">
                  <stop offset="0%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>

              {/* base connections */}
              {nodes.map((n) => (
                <line
                  key={`base-${n.id}`}
                  x1={cx}
                  y1={cy}
                  x2={n.x}
                  y2={n.y}
                  stroke="white"
                  strokeOpacity={0.07}
                  strokeWidth={1}
                />
              ))}

              {/* active route */}
              <motion.line
                x1={cx}
                y1={cy}
                x2={activeNode.x}
                y2={activeNode.y}
                stroke="url(#active-line)"
                strokeWidth={2.5}
                strokeLinecap="round"
                initial={false}
                animate={{ x2: activeNode.x, y2: activeNode.y }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* travelling pulse */}
              <motion.circle
                r={4}
                fill="#5eead4"
                initial={false}
                animate={{ cx: [cx, activeNode.x], cy: [cy, activeNode.y] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* core */}
              <circle cx={cx} cy={cy} r={70} fill="url(#core-glow)" />
              <circle
                cx={cx}
                cy={cy}
                r={30}
                fill="#0B0F1A"
                stroke="#5b9bff"
                strokeOpacity={0.5}
              />
              <text
                x={cx}
                y={cy + 4}
                textAnchor="middle"
                className="fill-white font-mono text-[13px] font-semibold"
              >
                AERO
              </text>

              {/* network nodes */}
              {nodes.map((n, i) => {
                const isActive = i === active;
                return (
                  <g key={n.id}>
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={isActive ? 26 : 22}
                      fill={isActive ? "#10151F" : "#0B0F1A"}
                      stroke={isActive ? n.color : "white"}
                      strokeOpacity={isActive ? 1 : 0.12}
                      strokeWidth={isActive ? 2 : 1}
                      style={{ transition: "all 0.4s ease" }}
                    />
                    <text
                      x={n.x}
                      y={n.y + 4}
                      textAnchor="middle"
                      className="fill-white/80 font-mono text-[11px]"
                    >
                      {n.short}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
