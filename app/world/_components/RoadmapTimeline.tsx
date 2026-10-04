"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { Reveal } from "@/components/ui/Reveal";
import { PHASES } from "../_lib/world";
import { Kicker, Display, Lede, StatusBadge } from "./Bits";

/**
 * THE EVOLUTION — a vertical timeline whose spine fills as you scroll. Each
 * phase carries its status and a plain "where this stands" line, so the
 * roadmap reads as a plan, never as a claim.
 */
export function RoadmapTimeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.4 });

  return (
    <section id="roadmap" className="relative scroll-mt-24 border-y border-white/8 bg-[#070A12]/60 py-28 sm:py-40" aria-labelledby="roadmap-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Kicker>The evolution</Kicker>
            <Display>Six phases. One direction.</Display>
            <Lede>This is Loadit&apos;s product vision and roadmap. It is not a claim that every stage is complete — each phase is labeled with exactly where it stands.</Lede>
          </div>

          <ol ref={ref} className="relative grid gap-4 pl-10" aria-label="Roadmap phases">
            <span aria-hidden className="absolute bottom-6 left-[11px] top-6 w-px bg-white/10" />
            <motion.span aria-hidden className="absolute bottom-6 left-[11px] top-6 w-px origin-top bg-rail-gradient" style={{ scaleY: reduce ? 1 : fill }} />
            {PHASES.map((p, i) => (
              <Reveal key={p.n} index={i % 2} as="li" className="relative">
                <span aria-hidden className={`absolute -left-10 top-6 flex h-6 w-6 items-center justify-center rounded-full border bg-[#04060B] ${p.status === "building" ? "border-amber" : "border-cyan-glow/60"}`}>
                  <span className={`h-2 w-2 rounded-full ${p.status === "building" ? "bg-amber" : "bg-cyan-glow"}`} />
                </span>
                <div className="rounded-3xl border border-white/10 bg-[#04060B] p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-mono text-[11px] font-bold tracking-[0.3em] text-rail-400">PHASE {p.n}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold uppercase tracking-tightest text-white sm:text-3xl">{p.title}</h3>
                  <p className="mt-2 text-base text-white/70">{p.body}</p>
                  <p className="mt-4 border-t border-white/8 pt-3 text-sm leading-relaxed text-white/45">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Where it stands · </span>
                    {p.now}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
