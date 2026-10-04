"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "../_lib/useReducedMotion";
import { PATENT, STACK } from "../_lib/world";
import { PatentFigure } from "./PatentFigure";
import { Section, Kicker, Display, Lede, StatusBadge, StatusLegend, Cta } from "./Bits";

/**
 * THE PATENT — the Loadit Unified Financial Rail, subsystem by subsystem.
 * The filing header, FIG. 1 redrawn, then an explorer over the ten
 * subsystems (§7.1–§7.10). Every entry states what the patent describes and,
 * separately, what exists in the runtime today.
 */
export function InfrastructureStack() {
  const [active, setActive] = useState(STACK[2].id);
  const reduce = usePrefersReducedMotion();
  const current = STACK.find((l) => l.id === active) ?? STACK[0];

  return (
    <Section id="technology" className="border-y border-white/8 bg-[#070A12]/60">
      <Kicker>The patent</Kicker>
      <Display>One rail. Ten subsystems.</Display>
      <Lede>
        The architecture behind the vision is a single filing: the {PATENT.shortTitle}. What follows is the
        whole of it at the level the public application describes — and, for each part, exactly how much of it
        is running today.
      </Lede>

      {/* filing header */}
      <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="rounded-3xl border border-rail-400/30 bg-rail-400/[0.05] p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">{PATENT.shortTitle}</span>
            <span className="rounded-md border border-cyan-glow/40 bg-cyan-glow/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-glow">Patent pending</span>
          </div>
          <h3 className="mt-4 text-pretty text-lg font-medium leading-snug text-white sm:text-xl">{PATENT.title}</h3>
          <dl className="mt-6 grid grid-cols-3 gap-4">
            {[
              ["Claims", String(PATENT.claims)],
              ["Subsystems", String(PATENT.subsystems)],
              ["Figures", String(PATENT.figures)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tightest text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 border-t border-white/10 pt-5 text-sm leading-relaxed text-white/65">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Independent claim · </span>
            {PATENT.independentClaim}
          </p>
          <p className="mt-4 text-xs text-white/45">{PATENT.status}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Cta href={PATENT.links.overview} variant="secondary" className="px-4 py-2 text-xs">Patent overview on Loadit.net</Cta>
            <Cta href={PATENT.links.dataRoom} variant="ghost" className="px-4 py-2 text-xs">Full filing · investor data room →</Cta>
          </div>
        </div>
        <PatentFigure />
      </div>

      {/* explorer */}
      <div className="mt-16 flex flex-wrap items-end justify-between gap-4">
        <h3 className="text-2xl font-semibold tracking-tightest text-white sm:text-3xl">Subsystem by subsystem.</h3>
        <StatusLegend />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ol className="grid gap-2" aria-label="Patent subsystems">
          {STACK.map((l) => {
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
                    <span className="font-mono text-[10px] text-white/35">§{l.section}</span>
                    <span>
                      <span className={`block font-mono text-[12px] font-bold tracking-[0.22em] ${on ? "text-rail-400" : "text-white"}`}>{l.code}</span>
                      <span className="block text-sm text-white/60">{l.name}</span>
                    </span>
                  </span>
                  <StatusBadge status={l.status} />
                </button>
                <AnimatePresence initial={false}>
                  {on && (
                    <motion.div
                      id={`layer-${l.id}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      className="overflow-hidden lg:hidden"
                    >
                      <Detail layer={l} compact />
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
                exit={reduce ? undefined : { opacity: 0, y: -8, transition: { duration: 0.12 } }}
                transition={{ duration: 0.25 }}
              >
                <Detail layer={current} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Detail({ layer, compact = false }: { layer: (typeof STACK)[number]; compact?: boolean }) {
  return (
    <div className={compact ? "px-5 pb-5 pt-3" : ""}>
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[12px] font-bold tracking-[0.3em] text-rail-400">
            {layer.code} <span className="text-white/35">· §{layer.section} · {layer.claims}</span>
          </p>
          <StatusBadge status={layer.status} verbose />
        </div>
      )}
      <h4 className={`${compact ? "text-lg" : "mt-4 text-3xl"} font-semibold tracking-tightest text-white`}>{layer.name}</h4>
      <p className={`${compact ? "mt-1 text-sm" : "mt-3 text-lg"} text-white/80`}>{layer.role}</p>
      <p className={`${compact ? "mt-3 text-sm" : "mt-5 text-base"} leading-relaxed text-white/60`}>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">What the patent describes · </span>
        {layer.body}
      </p>
      <p className={`${compact ? "mt-3 text-sm" : "mt-4 text-base"} rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 leading-relaxed text-white/75`}>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400">Today · </span>
        {layer.today}
      </p>
      {compact && <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">{layer.claims}</p>}
    </div>
  );
}
