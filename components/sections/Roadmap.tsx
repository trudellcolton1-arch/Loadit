"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ROADMAP } from "@/lib/constants";

export function Roadmap() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const width = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="roadmap" className="relative section-py border-t border-white/5">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Roadmap"
          title="The path to a universal value layer."
        />

        <div ref={ref} className="relative mt-20">
          {/* horizontal progress rail (desktop) */}
          <div className="absolute left-0 right-0 top-6 hidden h-px bg-white/8 lg:block">
            <motion.div
              style={{ width }}
              className="h-full bg-rail-gradient shadow-glow"
            />
          </div>

          <ol className="grid gap-10 lg:grid-cols-5 lg:gap-4">
            {ROADMAP.map((item, i) => (
              <Reveal as="li" key={item.year} index={i} className="relative">
                <div className="mb-6 hidden lg:block">
                  <span className="block h-3 w-3 rounded-full bg-rail-gradient shadow-glow" />
                </div>
                <div className="font-mono text-2xl font-semibold tracking-tight text-rail-gradient">
                  {item.year}
                </div>
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/45">
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
