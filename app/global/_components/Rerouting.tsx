"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

/**
 * REROUTING — the GPS moment everyone recognizes. Route A carries the value,
 * degrades, Loadit recalculates, Route B lights up. Illustrative animation.
 */
type Phase = "a" | "degraded" | "recalc" | "b";
const SEQ: Phase[] = ["a", "degraded", "recalc", "b"];
const DUR: Record<Phase, number> = { a: 2200, degraded: 1500, recalc: 1500, b: 2600 };

export function Rerouting() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px" });
  const [phase, setPhase] = useState<Phase>("a");

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    let t: ReturnType<typeof setTimeout>;
    const step = () => {
      i = (i + 1) % SEQ.length;
      setPhase(SEQ[i]);
      t = setTimeout(step, DUR[SEQ[i]]);
    };
    t = setTimeout(step, DUR.a);
    return () => clearTimeout(t);
  }, [inView]);

  const aOn = phase === "a";
  const degraded = phase === "degraded" || phase === "recalc";
  const bOn = phase === "b";

  const status =
    phase === "a" ? "Route A · carrying value"
      : phase === "degraded" ? "⚠ Route degraded"
        : phase === "recalc" ? "Recalculating…"
          : "Alternative route selected";

  return (
    <Section grid>
      <div ref={ref} className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <div className="rounded-2xl border border-white/10 bg-[#070A12]/85 p-5 shadow-glass">
            <div className="flex items-center justify-between">
              <StatusTag status="ILLUSTRATIVE" />
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${phase === "degraded" ? "text-amber" : phase === "b" ? "text-rail-400" : "text-white/60"}`}>
                {status}
              </span>
            </div>
            <svg viewBox="0 0 360 300" className="mt-4 h-auto w-full" role="img" aria-label="Loadit rerouting from a degraded route to an alternative route">
              <defs>
                <linearGradient id="rr-live" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#5EEAD4" /><stop offset="1" stopColor="#22C55E" />
                </linearGradient>
              </defs>
              {/* origin & destination */}
              <g>
                <circle cx="40" cy="150" r="6" fill="#fff" />
                <text x="40" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.6)" letterSpacing="2">USD</text>
              </g>
              <g>
                <motion.circle cx="320" cy="150" r="12" fill="none" stroke="rgba(34,169,92,0.6)"
                  animate={{ r: bOn ? [12, 22, 12] : 12, opacity: bOn ? [0.7, 0, 0.7] : 0.4 }}
                  transition={{ duration: 1.2, repeat: bOn ? Infinity : 0 }} />
                <circle cx="320" cy="150" r="6" fill={bOn || aOn ? "#22C55E" : "rgba(255,255,255,0.35)"} />
                <text x="320" y="128" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="rgba(255,255,255,0.6)" letterSpacing="2">USDC</text>
              </g>

              {/* route A (top) */}
              <path d="M46 150 C 100 60, 260 60, 314 150" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
              <motion.path
                d="M46 150 C 100 60, 260 60, 314 150" fill="none"
                stroke={degraded ? "#FBBF24" : "url(#rr-live)"} strokeWidth="2.5"
                strokeDasharray={degraded ? "4 6" : "8 10"}
                animate={{ opacity: aOn ? 1 : degraded ? 0.7 : 0.15, strokeDashoffset: aOn ? [0, -36] : 0 }}
                transition={{ opacity: { duration: 0.4 }, strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" } }}
              />
              <g>
                <rect x="140" y="70" width="80" height="22" rx="6" fill="#0B0F1A" stroke={degraded ? "rgba(251,191,36,0.6)" : "rgba(255,255,255,0.15)"} />
                <text x="180" y="85" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill={degraded ? "#FBBF24" : "#fff"} letterSpacing="1.5">
                  {degraded ? "ROUTE A · DOWN" : "ROUTE A"}
                </text>
              </g>
              <motion.g animate={{ opacity: phase === "degraded" ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <circle cx="180" cy="112" r="9" fill="rgba(251,191,36,0.15)" stroke="#FBBF24" />
                <text x="180" y="116" textAnchor="middle" fontFamily="var(--font-sans)" fontSize="11" fill="#FBBF24" fontWeight="700">!</text>
              </motion.g>

              {/* route B (bottom) */}
              <path d="M46 150 C 100 240, 260 240, 314 150" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="2" />
              <motion.path
                d="M46 150 C 100 240, 260 240, 314 150" fill="none"
                stroke="url(#rr-live)" strokeWidth="2.5" strokeDasharray="8 10"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: bOn ? 1 : 0, opacity: bOn ? 1 : 0, strokeDashoffset: bOn ? [0, -36] : 0 }}
                transition={{ pathLength: { duration: 0.8 }, opacity: { duration: 0.3 }, strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" } }}
              />
              <motion.g animate={{ opacity: bOn || phase === "recalc" ? 1 : 0.3 }} transition={{ duration: 0.3 }}>
                <rect x="140" y="208" width="80" height="22" rx="6" fill="#0B0F1A" stroke={bOn ? "rgba(34,169,92,0.8)" : "rgba(255,255,255,0.15)"} />
                <text x="180" y="223" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="#fff" letterSpacing="1.5">ROUTE B</text>
              </motion.g>

              {/* recalculating scan */}
              <motion.g animate={{ opacity: phase === "recalc" ? 1 : 0 }} transition={{ duration: 0.25 }}>
                <rect x="118" y="138" width="124" height="24" rx="6" fill="rgba(11,15,26,0.95)" stroke="rgba(255,255,255,0.2)" />
                <text x="180" y="154" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fill="#fff" letterSpacing="1.5">RECALCULATING…</text>
              </motion.g>
              <motion.g animate={{ opacity: bOn ? 1 : 0 }} transition={{ duration: 0.3 }}>
                <rect x="96" y="262" width="168" height="22" rx="6" fill="rgba(34,169,92,0.12)" stroke="rgba(34,169,92,0.5)" />
                <text x="180" y="277" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="#34D17A" letterSpacing="1.5" fontWeight="700">ALTERNATIVE ROUTE SELECTED</text>
              </motion.g>
            </svg>
          </div>
        </div>

        <div className="order-1 lg:order-2">
          <Kicker>Adaptive routing</Kicker>
          <H2>Financial infrastructure changes constantly.</H2>
          <Lede>
            Networks become congested. Liquidity changes. Providers experience downtime.
            Fees move. Rules differ between jurisdictions.
          </Lede>
          <Lede className="mt-4">
            Loadit&apos;s orchestration layer is designed to evaluate supported paths and adapt
            routing accordingly. Think GPS. But for value.
          </Lede>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
            Same payment id · no double execution · one normalized result
          </p>
        </div>
      </div>
    </Section>
  );
}
