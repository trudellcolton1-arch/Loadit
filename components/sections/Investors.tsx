"use client";

import { motion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import { Counter } from "@/components/ui/Counter";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { METRICS } from "@/lib/constants";

// Simple area-chart growth curve.
const POINTS = [8, 14, 12, 22, 30, 42, 58, 72, 96];

export function Investors() {
  const max = Math.max(...POINTS);
  const w = 100;
  const h = 40;
  const path = POINTS.map(
    (p, i) =>
      `${(i / (POINTS.length - 1)) * w},${h - (p / max) * h}`
  ).join(" ");

  return (
    <section
      id="investors"
      className="relative overflow-hidden bg-black section-py"
    >
      {/* subtle moving glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-rail-500/10 blur-[140px]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container-px relative mx-auto max-w-7xl">
        <div className="flex flex-col items-center text-center">
          <Reveal>
            <Badge>Patent Pending · Now Raising</Badge>
          </Reveal>
          <Reveal index={1}>
            <h2 className="mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tightest text-gradient sm:text-5xl lg:text-6xl">
              Infrastructure for the next era of money.
            </h2>
          </Reveal>
          <Reveal index={2}>
            <p className="mt-5 max-w-2xl text-pretty text-white/50 sm:text-lg">
              Loadit isn&apos;t another crypto app. It&apos;s the rail value
              moves on — and we&apos;re building it now.
            </p>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((m, i) => (
            <Reveal key={m.label} index={i}>
              <div className="glass h-full rounded-3xl p-6">
                <div className="text-4xl font-semibold tracking-tightest text-rail-gradient sm:text-5xl">
                  <Counter value={m.value} suffix={m.suffix} />
                </div>
                <div className="mt-3 text-sm font-medium text-white">
                  {m.label}
                </div>
                <div className="mt-1 text-xs text-white/40">{m.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Growth visualization */}
        <Reveal index={2}>
          <div className="glass mt-6 overflow-hidden rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                  Transaction volume · trajectory
                </div>
                <div className="mt-1 text-lg font-semibold text-white">
                  Built to compound
                </div>
              </div>
              <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-medium text-signal">
                ↗ Projected
              </span>
            </div>
            <svg
              viewBox={`0 0 ${w} ${h}`}
              preserveAspectRatio="none"
              className="mt-6 h-40 w-full"
            >
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b9bff" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#5b9bff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <motion.polyline
                points={path}
                fill="none"
                stroke="url(#area)"
                strokeWidth="0.8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeInOut" }}
                style={{ stroke: "#5eead4" }}
                vectorEffect="non-scaling-stroke"
              />
              <motion.polygon
                points={`0,${h} ${path} ${w},${h}`}
                fill="url(#area)"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, delay: 0.4 }}
              />
            </svg>
          </div>
        </Reveal>

        <Reveal index={2}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button href="#access" variant="primary">
              Request the Deck →
            </Button>
            <Button href="mailto:invest@loadit.net" variant="secondary">
              invest@loadit.net
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
