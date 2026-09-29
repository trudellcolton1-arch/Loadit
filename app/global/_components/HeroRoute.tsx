"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cta } from "./Bits";

/**
 * HERO — "GPS for money." A looping route calculation, drawn like a premium
 * navigation app: origin USD → Loadit evaluates three candidate routes →
 * one is selected → destination USDC.
 *
 * Illustrative animation (labeled). Route labels are examples, not live data.
 */

type Phase = "calc" | "candidates" | "selected" | "arrived";
const PHASES: Phase[] = ["calc", "candidates", "selected", "arrived"];
const DUR: Record<Phase, number> = { calc: 1500, candidates: 1900, selected: 1600, arrived: 1700 };

const ROUTES = [
  { id: "A", label: "Solana", meta: "~4s · $0.02", x: 60 },
  { id: "B", label: "Base", meta: "~12s · $0.05", x: 180 },
  { id: "C", label: "Lightning", meta: "~2s · $0.01", x: 300 },
];
const SELECTED = 2;

export function HeroRoute() {
  const [phase, setPhase] = useState<Phase>("calc");

  useEffect(() => {
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      i = (i + 1) % PHASES.length;
      setPhase(PHASES[i]);
      t = setTimeout(step, DUR[PHASES[i]]);
    };
    t = setTimeout(step, DUR.calc);
    return () => clearTimeout(t);
  }, []);

  const showCandidates = phase !== "calc";
  const selected = phase === "selected" || phase === "arrived";
  const arrived = phase === "arrived";

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "26px 26px",
          maskImage: "radial-gradient(ellipse 80% 70% at 60% 40%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 60% 40%, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2"
        style={{ background: "radial-gradient(ellipse at center, rgba(34,169,92,0.14), transparent 65%)" }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.35em] text-rail-400"
          >
            Value-movement infrastructure · Pre-launch
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 text-[2.9rem] font-semibold leading-[0.98] tracking-tightest text-white sm:text-7xl lg:text-[5.4rem]"
          >
            GPS for money.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 text-2xl font-medium leading-snug text-white/85 sm:text-3xl"
          >
            You choose the destination.
            <br />
            <span className="text-rail-gradient">Loadit finds the route.</span>
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg"
          >
            Connect your business to an intelligent infrastructure layer designed to
            coordinate value movement across supported traditional and digital financial
            networks.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-9 flex flex-wrap gap-3"
          >
            <Cta href="/access">Join the early-access list</Cta>
            <Cta href="#how" variant="secondary">How it works</Cta>
            <Cta href="/contact" variant="ghost">Talk to Loadit →</Cta>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40"
          >
            Not available yet · opening to early-access partners first
          </motion.p>
        </div>

        {/* ——— route calculation ——— */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mx-auto w-full max-w-[420px]"
        >
          <div className="rounded-2xl border border-white/10 bg-[#070A12]/80 p-4 shadow-glass">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Route · illustrative</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                <span className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-rail-400" : "bg-amber"} ${phase === "calc" ? "animate-pulse" : ""}`} />
                {phase === "calc" ? "Calculating route…" : phase === "candidates" ? "3 routes found" : arrived ? "Arrived" : "Route selected"}
              </span>
            </div>
            <svg viewBox="0 0 360 400" className="h-auto w-full" role="img" aria-label="Loadit calculating a route from USD to USDC">
              <defs>
                <linearGradient id="hr-line" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#5EEAD4" />
                  <stop offset="1" stopColor="#22C55E" />
                </linearGradient>
              </defs>

              {/* origin */}
              <g>
                <circle cx="180" cy="34" r="6" fill="#fff" />
                <circle cx="180" cy="34" r="12" fill="none" stroke="rgba(255,255,255,0.25)" />
                <text x="180" y="16" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.55)" letterSpacing="2">USD</text>
              </g>

              {/* origin → loadit */}
              <line x1="180" y1="46" x2="180" y2="120" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
              <motion.line
                x1="180" y1="46" x2="180" y2="120"
                stroke="url(#hr-line)" strokeWidth="2" strokeDasharray="6 8"
                animate={{ strokeDashoffset: [0, -28] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              />

              {/* loadit node */}
              <g>
                <rect x="100" y="122" width="160" height="52" rx="10" fill="#0B0F1A" stroke="rgba(34,169,92,0.55)" />
                <text x="180" y="143" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="#fff" letterSpacing="3" fontWeight="700">LOADIT</text>
                <text x="180" y="161" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="10" fill="rgba(255,255,255,0.5)">Intelligent value routing</text>
              </g>

              {/* candidates */}
              {ROUTES.map((r, i) => {
                const isSel = i === SELECTED;
                const on = showCandidates && (!selected || isSel);
                const dim = selected && !isSel;
                return (
                  <g key={r.id}>
                    <motion.path
                      d={`M180 174 C 180 210, ${r.x} 210, ${r.x} 250`}
                      fill="none"
                      stroke={isSel && selected ? "url(#hr-line)" : "rgba(255,255,255,0.35)"}
                      strokeWidth={isSel && selected ? 2.5 : 1.5}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: on ? 1 : 0, opacity: dim ? 0.12 : on ? 1 : 0 }}
                      transition={{ duration: 0.6, delay: showCandidates ? i * 0.12 : 0 }}
                    />
                    <motion.g
                      initial={{ opacity: 0 }}
                      animate={{ opacity: dim ? 0.2 : showCandidates ? 1 : 0 }}
                      transition={{ duration: 0.4, delay: showCandidates ? 0.3 + i * 0.12 : 0 }}
                    >
                      <rect x={r.x - 52} y="250" width="104" height="56" rx="9" fill="#0B0F1A" stroke={isSel && selected ? "rgba(34,169,92,0.8)" : "rgba(255,255,255,0.14)"} />
                      <text x={r.x} y="265" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="8.5" fill={isSel && selected ? "#34D17A" : "rgba(255,255,255,0.45)"} letterSpacing="2">
                        ROUTE {r.id}
                      </text>
                      <text x={r.x} y="282" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="12" fontWeight="700" fill="#fff">
                        {r.label}
                      </text>
                      <text x={r.x} y="297" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="9.5" fill="rgba(255,255,255,0.5)">
                        {r.meta}
                      </text>
                    </motion.g>
                    <motion.path
                      d={`M${r.x} 306 C ${r.x} 332, 180 332, 180 350`}
                      fill="none"
                      stroke="url(#hr-line)"
                      strokeWidth="2.5"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: isSel && selected ? 1 : 0, opacity: isSel && selected ? 1 : 0 }}
                      transition={{ duration: 0.6 }}
                    />
                  </g>
                );
              })}

              {/* destination */}
              <g>
                <motion.circle
                  cx="180" cy="362" r="12" fill="none" stroke="rgba(34,169,92,0.6)"
                  animate={{ r: arrived ? [12, 22, 12] : 12, opacity: arrived ? [0.7, 0, 0.7] : 0.5 }}
                  transition={{ duration: 1.2, repeat: arrived ? Infinity : 0 }}
                />
                <circle cx="180" cy="362" r="6" fill={arrived ? "#22C55E" : "rgba(255,255,255,0.35)"} />
                <text x="180" y="392" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.55)" letterSpacing="2">USDC</text>
              </g>

              {/* selected chip */}
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: selected ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <rect x="232" y="336" width="112" height="22" rx="6" fill="rgba(34,169,92,0.12)" stroke="rgba(34,169,92,0.5)" />
                <text x="288" y="351" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="#34D17A" letterSpacing="1.5" fontWeight="700">
                  ROUTE SELECTED
                </text>
              </motion.g>
            </svg>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
