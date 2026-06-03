"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { FUTURE_CARDS } from "@/lib/constants";

type Card = (typeof FUTURE_CARDS)[number];

export function FutureOfMoney() {
  const [open, setOpen] = useState<Card | null>(null);

  // Lock scroll + escape-to-close while a card is expanded.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <section id="future" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="The Future of Money"
          title="The capabilities behind the rail."
          description="A portfolio of patent-pending primitives — from temporal settlement to quantum optimization. Tap any capability to go deeper."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUTURE_CARDS.map((card, i) => (
            <Reveal key={card.id} index={i % 3}>
              <motion.button
                layoutId={`card-${card.id}`}
                onClick={() => setOpen(card)}
                className="glass glass-hover group relative flex h-full w-full flex-col items-start gap-3 overflow-hidden rounded-3xl p-6 text-left"
              >
                <span className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rail-500/10 blur-2xl transition-opacity group-hover:opacity-100" />
                <motion.span
                  layoutId={`tag-${card.id}`}
                  className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-rail-gradient"
                >
                  {card.tag}
                </motion.span>
                <motion.h3
                  layoutId={`title-${card.id}`}
                  className="text-xl font-semibold tracking-tight text-white"
                >
                  {card.title}
                </motion.h3>
                <p className="text-sm leading-relaxed text-white/45">
                  {card.blurb}
                </p>
                <span className="mt-auto pt-3 font-mono text-xs text-white/40 transition-colors group-hover:text-white/70">
                  Expand →
                </span>
              </motion.button>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Full-screen expansion */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] grid place-items-center p-4 sm:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-void/80 backdrop-blur-xl"
              onClick={() => setOpen(null)}
            />
            <motion.div
              layoutId={`card-${open.id}`}
              className="glass relative w-full max-w-2xl overflow-hidden rounded-4xl p-8 sm:p-12"
            >
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rail-500/20 blur-3xl" />
              <button
                onClick={() => setOpen(null)}
                className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
              <motion.span
                layoutId={`tag-${open.id}`}
                className="font-mono text-xs uppercase tracking-[0.2em] text-rail-gradient"
              >
                {open.tag}
              </motion.span>
              <motion.h3
                layoutId={`title-${open.id}`}
                className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl"
              >
                {open.title}
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-5 text-pretty text-base leading-relaxed text-white/60 sm:text-lg"
              >
                {open.detail}
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
