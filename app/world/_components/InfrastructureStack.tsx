"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { STACK } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge } from "./Bits";

/**
 * THE LOADIT STACK — the layers of the ecosystem as a stack you can open.
 * Left: the stack (keyboard navigable). Right: the selected layer. On phones
 * the detail opens inline under the selected layer.
 */
export function InfrastructureStack() {
  const [active, setActive] = useState(STACK[1].id);
  const reduce = usePrefersReducedMotion();
  const current = STACK.find((l) => l.id === active) ?? STACK[0];

  return (
    <Section id="technology" className="border-y border-white/8 bg-[#070A12]/60">
      <Kicker>The Loadit stack</Kicker>
      <Display>What the layer is made of.</Display>
      <Lede>
        Each part has one job. Descriptions stay at the architecture level — the patent-pending design is public; the implementation is not.
      </Lede>

      <div className="mt-14 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ol className="grid gap-2" aria-label="Infrastructure layers">
          {STACK.map((l, i) => {
            const on = l.id === active;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setActive(l.id)}
                  aria-expanded={on}
                  aria-controls={`layer-${l.id}`}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors ${
                    on ? "border-rail-400/50 bg-rail-400/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/25"
                  }`}
                >
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-[10px] text-white/35">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className={`block font-mono text-[12px] font-bold tracking-[0.22em] ${on ? "text-rail-400" : "text-white"}`}>{l.code}</span>
                      <span className="block text-sm text-white/60">{l.name}</span>
                    </span>
                  </span>
                  <StatusBadge status={l.status} />
                </button>
                {/* inline detail on phones */}
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`layer-${l.id}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      className="overflow-hidden lg:hidden"
                    >
                      <div className="px-5 pb-4 pt-3">
                        <p className="text-sm font-medium text-white/85">{l.role}</p>
                        <p className="mt-2 text-sm leading-relaxed text-white/60">{l.body}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ol>

        <div className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-[#04060B] p-8 shadow-glass">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[12px] font-bold tracking-[0.3em] text-rail-400">{current.code}</p>
                  <StatusBadge status={current.status} verbose />
                </div>
                <h3 className="mt-4 text-3xl font-semibold tracking-tightest text-white">{current.name}</h3>
                <p className="mt-3 text-lg text-white/80">{current.role}</p>
                <p className="mt-5 text-base leading-relaxed text-white/60">{current.body}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}
