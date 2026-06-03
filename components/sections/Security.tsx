"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { SECURITY_PILLARS } from "@/lib/constants";

export function Security() {
  return (
    <section id="security" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Animated vault */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto grid aspect-square max-w-md place-items-center">
              {/* concentric rings */}
              {[0, 1, 2, 3].map((r) => (
                <motion.div
                  key={r}
                  className="absolute rounded-full border border-white/10"
                  style={{
                    width: `${40 + r * 20}%`,
                    height: `${40 + r * 20}%`,
                  }}
                  animate={{ rotate: r % 2 === 0 ? 360 : -360 }}
                  transition={{
                    duration: 30 + r * 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <span
                    className="absolute h-1.5 w-1.5 rounded-full bg-rail-400 shadow-glow"
                    style={{ top: "-3px", left: "50%" }}
                  />
                </motion.div>
              ))}

              {/* glow core */}
              <div className="absolute h-32 w-32 rounded-full bg-rail-500/20 blur-2xl animate-pulse-rail" />

              {/* vault core */}
              <motion.div
                className="glass relative grid h-28 w-28 place-items-center rounded-3xl"
                animate={{ scale: [1, 1.04, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none">
                  <path
                    d="M12 2 4 5v6c0 5 3.4 8.5 8 11 4.6-2.5 8-6 8-11V5l-8-3Z"
                    stroke="url(#vaultGrad)"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="m9 12 2 2 4-4"
                    stroke="url(#vaultGrad)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <defs>
                    <linearGradient id="vaultGrad" x1="4" y1="2" x2="20" y2="22">
                      <stop stopColor="#5eead4" />
                      <stop offset="1" stopColor="#c084fc" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
            </div>
          </Reveal>

          <div className="order-1 lg:order-2">
            <SectionHeading
              eyebrow="Security"
              title={
                <>
                  Built for the next{" "}
                  <span className="text-rail-gradient">100 years.</span>
                </>
              }
              description="Defense-in-depth from the edge device to final settlement — with primitives ready for the quantum era."
            />

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {SECURITY_PILLARS.map((p, i) => (
                <Reveal key={p.title} index={i}>
                  <div className="glass glass-hover rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white">
                      {p.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      {p.desc}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
