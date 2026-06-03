"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Badge } from "@/components/ui/Badge";
import { SITE } from "@/lib/constants";

// Three.js is heavy — load it client-only, after first paint.
const NeuralField = dynamic(() => import("@/components/three/NeuralField"), {
  ssr: false,
  loading: () => null,
});

const VALUE_CHAIN = ["Cash", "Card", "Stablecoin", "Crypto", "Anything"];

export function Hero() {
  return (
    <section
      id="top"
      className="relative grain flex min-h-[100svh] flex-col items-center justify-center overflow-hidden"
    >
      {/* 3D financial universe */}
      <div className="absolute inset-0 -z-10">
        <NeuralField />
      </div>

      {/* Atmospheric gradients */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-grid-fade" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-64 bg-gradient-to-t from-void to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-rail-500/10 blur-[120px]" />

      <div className="container-px relative mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative grid place-items-center">
            <div className="absolute h-24 w-24 rounded-full bg-rail-500/20 blur-2xl animate-pulse-rail" />
            <Logo className="h-16 w-16 animate-float" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
        >
          <Badge>Patent Pending · The Unified Rail</Badge>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="mt-6 text-balance text-5xl font-semibold tracking-tightest text-gradient sm:text-7xl lg:text-[5.5rem] lg:leading-[0.95]"
        >
          Move Value.
          <br />
          <span className="text-rail-gradient">Anywhere.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5 }}
          className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/55 sm:text-xl"
        >
          {SITE.description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.62 }}
          className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Button href="#access" variant="primary">
            Request Access
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Button>
          <Button href="#how-it-works" variant="secondary">
            See How It Works
          </Button>
        </motion.div>

        {/* Value transformation chain */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.9 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 font-mono text-xs uppercase tracking-[0.2em] text-white/40"
        >
          {VALUE_CHAIN.map((v, i) => (
            <span key={v} className="flex items-center gap-3">
              <span className={i === VALUE_CHAIN.length - 1 ? "text-rail-gradient" : ""}>
                {v}
              </span>
              {i < VALUE_CHAIN.length - 1 && (
                <span className="text-rail-400/50">→</span>
              )}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="flex h-9 w-5 items-start justify-center rounded-full border border-white/15 p-1.5">
          <motion.span
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1 rounded-full bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
