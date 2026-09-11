"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { HOW_STEPS } from "@/lib/constants";

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how-it-works" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="How It Works"
          title="Money in. Crypto out. Seconds."
          description="Card today — cash at 350,000+ MoneyGram counters launching soon. No bank account. Six steps from checkout to on-chain value."
        />

        <div ref={ref} className="relative mx-auto mt-20 max-w-3xl">
          {/* progress rail */}
          <div className="absolute left-[1.45rem] top-0 hidden h-full w-px bg-white/8 sm:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full origin-top bg-rail-gradient shadow-glow"
            />
          </div>

          <ol className="space-y-10 sm:space-y-14">
            {HOW_STEPS.map((step, i) => (
              <Reveal as="li" key={step.n} index={i} className="relative">
                <div className="flex items-start gap-6">
                  <div className="relative z-10 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-surface font-mono text-sm text-white/70">
                    <span>{String(step.n).padStart(2, "0")}</span>
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 text-white/45">{step.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
