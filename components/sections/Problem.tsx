"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { TIMELINE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Problem() {
  return (
    <section id="problem" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The Problem"
          title={
            <>
              Every payment network was built for{" "}
              <span className="text-white/40">one thing.</span>
            </>
          }
          description="The internet got protocols. Money never did. For 150 years we've bolted one single-purpose rail onto the next — each fast at its one job, none able to talk to the rest."
        />

        <div className="relative mt-20">
          {/* Animated rail line */}
          <div className="absolute left-0 right-0 top-[3.25rem] hidden h-px lg:block">
            <div className="h-full w-full rail-line" />
          </div>

          <ol className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-4">
            {TIMELINE.map((item, i) => (
              <Reveal as="li" key={item.year} index={i} className="relative">
                {/* Node */}
                <div className="relative mb-6 hidden lg:block">
                  <motion.span
                    className={cn(
                      "block h-3 w-3 rounded-full",
                      item.highlight
                        ? "bg-rail-gradient shadow-glow"
                        : "bg-white/25"
                    )}
                    whileInView={
                      item.highlight
                        ? { scale: [1, 1.4, 1] }
                        : undefined
                    }
                    viewport={{ once: false }}
                    transition={{
                      duration: 2,
                      repeat: item.highlight ? Infinity : 0,
                    }}
                  />
                </div>

                <div
                  className={cn(
                    "rounded-2xl border p-5 transition-colors",
                    item.highlight
                      ? "border-rail-500/40 bg-rail-500/[0.06] shadow-glow"
                      : "border-white/5 bg-white/[0.02] hover:border-white/10"
                  )}
                >
                  <div
                    className={cn(
                      "font-mono text-xs tracking-widest",
                      item.highlight ? "text-rail-gradient" : "text-white/40"
                    )}
                  >
                    {item.year}
                  </div>
                  <h3
                    className={cn(
                      "mt-2 text-lg font-semibold tracking-tight",
                      item.highlight && "text-white"
                    )}
                  >
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/45">
                    {item.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        <Reveal index={2}>
          <p className="mx-auto mt-20 max-w-2xl text-balance text-center text-2xl font-medium tracking-tight text-white/80 sm:text-3xl">
            Loadit was built for{" "}
            <span className="text-rail-gradient">everything.</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
