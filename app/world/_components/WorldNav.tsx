"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { NAV, WORLD } from "../_lib/world";

/**
 * Floating navigation — a single glass pill that stays out of the story's way.
 * Desktop: anchors + Loadit.net. Mobile: wordmark + a sheet. A hairline at the
 * very top shows how far through the world you are.
 */
export function WorldNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.div aria-hidden className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-rail-gradient" style={{ scaleX: progress }} />
      <header className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <nav
          aria-label="Primary"
          className={`pointer-events-auto flex items-center gap-1 rounded-full border px-2 py-1.5 backdrop-blur-md transition-colors ${
            scrolled ? "border-white/12 bg-[#04060B]/80" : "border-white/8 bg-[#04060B]/40"
          }`}
        >
          <a href="#top" className="flex items-center gap-2 rounded-full px-3 py-1.5" aria-label="Loadit.world — back to top">
            <span className="relative inline-flex h-4 w-4 items-center justify-center" aria-hidden>
              <span className="absolute inset-0 rounded-full border border-rail-400/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-rail-400" />
            </span>
            <span className="font-mono text-[12px] font-bold tracking-[0.22em] text-white">
              LOADIT<span className="text-white/45">.WORLD</span>
            </span>
          </a>
          <div className="hidden items-center md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="rounded-full px-3 py-1.5 text-sm text-white/65 transition-colors hover:bg-white/[0.06] hover:text-white">
                {n.label}
              </a>
            ))}
            <a
              href={WORLD.parent.url}
              className="ml-1 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-void transition-colors hover:bg-white/90"
            >
              Loadit.net ↗
            </a>
          </div>
          <button
            className="rounded-full p-2 text-white/80 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
              {open ? <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" /> : <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.6" />}
            </svg>
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col justify-end bg-[#04060B]/95 px-6 pb-10 pt-24 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <nav aria-label="Mobile" className="grid gap-1">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.05 * i } }}
                  className="rounded-xl px-2 py-3 text-3xl font-semibold tracking-tightest text-white"
                >
                  {n.label}
                </motion.a>
              ))}
              <a href={WORLD.parent.url} className="mt-6 rounded-full bg-white px-5 py-3.5 text-center text-sm font-semibold text-void">
                Loadit.net ↗
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
