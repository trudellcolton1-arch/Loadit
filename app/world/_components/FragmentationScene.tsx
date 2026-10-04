"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { FRICTIONS, SYSTEMS } from "../_lib/world";

/**
 * THE WORLD TODAY — nine financial systems floating apart. As the visitor
 * scrolls through the pinned scene they drift into a connected ring and a
 * single point appears at the center. The copy switches from "isolated" to
 * "connected" at the same moment.
 */

// Scattered starting positions (percent of the stage) and their ring targets.
const START: [number, number][] = [
  [8, 14], [78, 10], [30, 36], [88, 46], [14, 62], [60, 30], [40, 84], [86, 82], [62, 66],
];

function ringPos(i: number, n: number, rx: number, ry: number): [number, number] {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return [50 + Math.cos(a) * rx, 50 + Math.sin(a) * ry];
}

function System({ label, i, progress, reduce }: { label: string; i: number; progress: MotionValue<number>; reduce: boolean }) {
  const [sx, sy] = START[i];
  const [tx, ty] = ringPos(i, SYSTEMS.length, 31, 40);
  const left = useTransform(progress, [0.05, 0.75], [`${sx}%`, `${tx}%`]);
  const top = useTransform(progress, [0.05, 0.75], [`${sy}%`, `${ty}%`]);
  const opacity = useTransform(progress, [0, 0.08], [0, 1]);
  const drift = useTransform(progress, [0, 1], [i % 2 ? 6 : -6, 0]);
  return (
    <motion.div
      style={reduce ? { left: `${tx}%`, top: `${ty}%` } : { left, top, opacity, y: drift }}
      className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/12 bg-[#070A12]/90 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 shadow-glass sm:px-4 sm:py-2 sm:text-[11px]"
    >
      {label}
    </motion.div>
  );
}

export function FragmentationScene() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const linkOpacity = useTransform(scrollYProgress, [0.55, 0.9], [0, 1]);
  const coreScale = useTransform(scrollYProgress, [0.6, 0.9], [0.4, 1]);
  const coreOpacity = useTransform(scrollYProgress, [0.6, 0.85], [0, 1]);
  const copyA = useTransform(scrollYProgress, [0, 0.4, 0.55], [1, 1, 0]);
  const copyB = useTransform(scrollYProgress, [0.55, 0.75], [0, 1]);

  return (
    <section id="vision" ref={ref} className="relative scroll-mt-24" style={{ height: reduce ? "auto" : "300vh" }} aria-labelledby="today-title">
      <div className={`${reduce ? "" : "sticky top-0 h-[100svh]"} overflow-hidden`}>
        <div className="mx-auto grid h-full max-w-7xl grid-rows-[auto_minmax(0,1fr)] gap-4 px-5 pb-6 pt-24 sm:gap-6 sm:px-8 sm:pb-10 sm:pt-28 lg:grid-cols-[0.9fr_1.1fr] lg:grid-rows-1 lg:items-center">
          <div className="relative min-h-[250px] sm:min-h-[300px] lg:min-h-[320px]">
            <motion.div style={reduce ? undefined : { opacity: copyA }} className={reduce ? "" : "absolute inset-0"}>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-rail-400">The world today</p>
              <h2 id="today-title" className="mt-5 text-balance font-semibold uppercase leading-[0.95] tracking-tightest text-white [font-size:clamp(2rem,5.5vw,4.25rem)]">
                Money is everywhere.
                <br />
                <span className="text-white/45">The rails aren&apos;t connected.</span>
              </h2>
              <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
                Each system has its own rules, settlement, liquidity, compliance, APIs, costs, and speeds. Moving value between them still means a person or a business has to understand:
              </p>
              <ul className="mt-4 hidden max-w-md flex-wrap gap-1.5 sm:flex" aria-label="What you currently have to understand">
                {FRICTIONS.map((f) => (
                  <li key={f} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 font-mono text-[11px] text-white/60">{f}</li>
                ))}
              </ul>
            </motion.div>
            {!reduce && (
              <motion.div style={{ opacity: copyB }} className="pointer-events-none absolute inset-0" aria-hidden>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-rail-400">What it should look like</p>
                <h3 className="mt-5 text-balance font-semibold uppercase leading-[0.95] tracking-tightest text-white [font-size:clamp(2rem,5.5vw,4.25rem)]">
                  Same networks.
                  <br />
                  <span className="text-rail-400">One layer between them.</span>
                </h3>
                <p className="mt-6 max-w-md text-pretty text-base leading-relaxed text-white/60 sm:text-lg">
                  Nothing about the rails changes. What changes is that a single intelligent layer understands all of them — so you don&apos;t have to.
                </p>
              </motion.div>
            )}
          </div>

          {/* the stage */}
          <div className="relative h-full min-h-[260px] w-full justify-self-center lg:aspect-[1/0.9] lg:h-auto" role="img" aria-label="Nine isolated financial systems drifting into a connected ring around Loadit">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              {SYSTEMS.map((_, i) => {
                const [x, y] = ringPos(i, SYSTEMS.length, 31, 40);
                return (
                  <motion.line key={i} x1={x} y1={y} x2={50} y2={50} stroke="url(#frag-grad)" strokeWidth={0.35} vectorEffect="non-scaling-stroke" style={{ opacity: reduce ? 1 : linkOpacity }} />
                );
              })}
              <defs>
                <linearGradient id="frag-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5EEAD4" />
                  <stop offset="100%" stopColor="#22A95C" />
                </linearGradient>
              </defs>
            </svg>
            <motion.div
              style={reduce ? undefined : { scale: coreScale, opacity: coreOpacity }}
              className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-rail-400/50 bg-rail-400/10 shadow-glow sm:h-28 sm:w-28"
            >
              <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-white">LOADIT</span>
            </motion.div>
            {SYSTEMS.map((s, i) => (
              <System key={s} label={s} i={i} progress={scrollYProgress} reduce={reduce} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
