"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { SYSTEMS, WORLD } from "../_lib/world";
import { Cta } from "./Bits";

/**
 * THE END STATE — the complexity disappears. The rails fade, two points
 * remain, Loadit sits between them, and the final statement lands.
 */
const RAIL_POS: [number, number][] = [
  [12, 22], [30, 12], [52, 18], [72, 10], [88, 26], [18, 70], [40, 82], [62, 76], [84, 68],
];

export function EndState() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const railsOpacity = useTransform(scrollYProgress, [0, 0.35], [0.7, 0]);
  const lineScale = useTransform(scrollYProgress, [0.3, 0.6], [0, 1]);
  const coreOpacity = useTransform(scrollYProgress, [0.5, 0.65], [0, 1]);
  const headOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
  const headY = useTransform(scrollYProgress, [0.6, 0.8], [24, 0]);

  return (
    <section ref={ref} className="relative" style={{ height: reduce ? "auto" : "260vh" }} aria-labelledby="end-title">
      <div className={`${reduce ? "py-28" : "sticky top-0 flex h-[100svh]"} items-center overflow-hidden`}>
        <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
          {/* fading rails */}
          {!reduce && (
            <motion.div style={{ opacity: railsOpacity }} aria-hidden className="pointer-events-none absolute inset-0">
              {SYSTEMS.map((s, i) => (
                <span
                  key={s}
                  className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.25em] text-white/40"
                  style={{ left: `${RAIL_POS[i][0]}%`, top: `${RAIL_POS[i][1]}%` }}
                >
                  {s}
                </span>
              ))}
            </motion.div>
          )}

          {/* sender — loadit — recipient */}
          <div className="relative mx-auto grid max-w-3xl grid-cols-[auto_1fr_auto] items-center gap-4 sm:gap-8">
            <Point label="Sender" />
            <div className="relative h-px bg-white/10">
              <motion.div className="absolute inset-0 origin-left bg-rail-gradient" style={{ scaleX: reduce ? 1 : lineScale }} />
              <motion.div
                style={{ opacity: reduce ? 1 : coreOpacity }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rail-400/60 bg-[#04060B] px-4 py-2 font-mono text-[11px] font-bold tracking-[0.3em] text-white shadow-glow"
              >
                LOADIT
              </motion.div>
            </div>
            <Point label="Recipient" />
          </div>

          <motion.div style={reduce ? undefined : { opacity: headOpacity, y: headY }} className="mt-12 text-center sm:mt-16">
            <h2 id="end-title" className="mx-auto max-w-4xl text-balance font-semibold uppercase leading-[0.95] tracking-tightest text-white [font-size:clamp(2rem,6vw,4.5rem)]">
              You shouldn&apos;t need to know how money got there.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-lg text-white/60">
              The internet hides the complexity of moving information. Loadit&apos;s vision is to do the same for value.
            </p>
            <p className="mt-8 font-mono text-[12px] font-bold uppercase tracking-[0.4em] text-rail-400 sm:text-sm">
              Any value. Any network. Any destination.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Cta href={WORLD.parent.url}>Enter Loadit</Cta>
              <Cta href={WORLD.global.url} variant="secondary">For businesses →</Cta>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Point({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="h-4 w-4 rounded-full bg-white shadow-[0_0_30px_rgba(255,255,255,0.6)]" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/70 sm:text-[11px]">{label}</span>
    </div>
  );
}
