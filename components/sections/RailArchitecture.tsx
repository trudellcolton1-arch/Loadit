"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { RAIL_LAYERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function RailArchitecture() {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section
      id="architecture"
      className="relative section-py overflow-hidden border-y border-white/5 bg-ink"
    >
      {/* command-center grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(91,155,255,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(91,155,255,0.25) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent)",
        }}
      />

      <div className="container-px relative mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="The Loadit Rail"
          title="One stack. Every form of value."
          description="A unified financial rail that captures value at the edge, verifies identity, routes it with AI, and settles across any network — orchestrated like a mission-control system."
        />

        <div className="mx-auto mt-16 max-w-3xl space-y-3">
          {RAIL_LAYERS.map((layer, i) => {
            const isActive = hover === i;
            return (
              <Reveal key={layer.id} index={i}>
                <motion.div
                  onHoverStart={() => setHover(i)}
                  onHoverEnd={() => setHover(null)}
                  className={cn(
                    "group relative flex items-center gap-5 rounded-2xl border px-5 py-5 transition-all duration-400 sm:px-7",
                    isActive
                      ? "border-rail-500/40 bg-rail-500/[0.06] shadow-glow"
                      : "border-white/8 bg-white/[0.02]"
                  )}
                >
                  {/* layer index */}
                  <div
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-xl border font-mono text-sm transition-colors",
                      isActive
                        ? "border-rail-400/50 text-rail-gradient"
                        : "border-white/10 text-white/40"
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-white sm:text-lg">
                      {layer.name}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/45">
                      {layer.desc}
                    </p>
                  </div>

                  {/* data-flow indicator */}
                  <div className="hidden w-24 shrink-0 sm:block">
                    <div className="relative h-px w-full overflow-hidden bg-white/10">
                      <motion.div
                        className="absolute inset-y-0 w-1/3 bg-rail-gradient"
                        animate={
                          isActive
                            ? { x: ["-40%", "320%"] }
                            : { x: "-40%" }
                        }
                        transition={{
                          duration: 1.2,
                          repeat: isActive ? Infinity : 0,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <Reveal index={2}>
          <p className="mx-auto mt-12 max-w-xl text-center text-sm text-white/40">
            The Rail Orchestrator binds AI routing, quantum optimization,
            temporal rules, energy denomination, and offline identity into a
            single transaction object.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
