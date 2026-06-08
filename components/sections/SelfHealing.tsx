"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const RAILS = ["Solana", "Base", "Ethereum", "XRPL", "Lightning", "Banks"];

type Status = "primary" | "healthy" | "failed";

export function SelfHealing() {
  const [primary, setPrimary] = useState(0);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [log, setLog] = useState<{ id: number; t: string; m: string }[]>([]);
  const idRef = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const addLog = (m: string) =>
    setLog((p) =>
      [
        { id: idRef.current++, t: new Date().toLocaleTimeString("en-US", { hour12: false }), m },
        ...p,
      ].slice(0, 4)
    );

  const fail = () => {
    const down = primary;
    const candidates = RAILS.map((_, i) => i).filter(
      (i) => i !== down && !failed.has(i)
    );
    if (candidates.length === 0) return;
    const next = candidates[0];
    const ms = 120 + Math.floor(Math.random() * 260);

    setFailed((s) => new Set(s).add(down));
    setPrimary(next);
    addLog(
      `${RAILS[down]} failed · rerouted to ${RAILS[next]} in ${ms}ms · packets replicated · reconciled`
    );

    // auto-heal the failed rail after a few seconds
    const id = window.setTimeout(() => {
      setFailed((s) => {
        const n = new Set(s);
        n.delete(down);
        return n;
      });
      addLog(`${RAILS[down]} recovered · rejoined mesh`);
    }, 4200);
    timers.current.push(id);
  };

  const statusOf = (i: number): Status =>
    failed.has(i) ? "failed" : i === primary ? "primary" : "healthy";

  return (
    <section id="resilience" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Self-Healing · Patent Pending"
          title="The rail that heals itself."
          description="When a network halts, a processor fails, or liquidity dries up, Loadit detects it and autonomously reroutes — replicating settlement packets across rails and deterministically reconciling on recovery. (Claims 16, 24)"
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          {/* mesh */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                Settlement mesh
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />
                routing
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {RAILS.map((r, i) => {
                const s = statusOf(i);
                return (
                  <motion.div
                    key={r}
                    layout
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4 transition-colors",
                      s === "primary" && "border-rail-500/50 bg-rail-500/[0.08]",
                      s === "healthy" && "border-white/8 bg-white/[0.02]",
                      s === "failed" && "border-red-500/40 bg-red-500/[0.06]"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{r}</span>
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          s === "primary" && "bg-rail-400",
                          s === "healthy" && "bg-white/25",
                          s === "failed" && "bg-red-500"
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        "mt-1 font-mono text-[0.6rem] uppercase tracking-widest",
                        s === "primary" && "text-rail-400",
                        s === "healthy" && "text-white/35",
                        s === "failed" && "text-red-400"
                      )}
                    >
                      {s === "primary" ? "● carrying" : s === "failed" ? "✕ down" : "standby"}
                    </div>
                    {s === "primary" && (
                      <motion.span
                        className="absolute bottom-0 left-0 h-0.5 bg-rail-gradient"
                        animate={{ width: ["0%", "100%"] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <button
              onClick={fail}
              className="mt-7 rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
            >
              Simulate rail failure →
            </button>
          </div>

          {/* event log */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              Recovery log
            </span>
            <div className="mt-4 space-y-2.5 font-mono text-[0.76rem]">
              {log.length === 0 && (
                <p className="text-white/35">
                  Mesh healthy. Trigger a failure to watch AERO reroute.
                </p>
              )}
              <AnimatePresence initial={false}>
                {log.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2"
                  >
                    <span className="shrink-0 text-white/35">{e.t}</span>
                    <span className="text-white/70">{e.m}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
