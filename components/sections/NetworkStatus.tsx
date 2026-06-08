"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";

const SYSTEMS = [
  "AERO Routing Engine",
  "Settlement Layer",
  "Identity & Compliance",
  "Liquidity Aggregator",
  "Self-Healing Mesh",
  "Post-Quantum Keystore",
];

const EVENTS = [
  "Failed route auto-rerouted · Base → Solana",
  "Liquidity pool rebalanced · XRPL",
  "Post-quantum keys rotated · ring 7",
  "Anomaly cleared · settlement assurance 99.8%",
  "Node recovered · mesh healed in 240ms",
  "Compliance attestation anchored",
];

export function NetworkStatus() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [feed, setFeed] = useState<{ id: number; t: string; m: string }[]>([]);
  const [throughput, setThroughput] = useState(1284390);
  const idRef = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      const m = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      const t = new Date().toLocaleTimeString("en-US", { hour12: false });
      setFeed((p) => [{ id: idRef.current++, t, m }, ...p].slice(0, 5));
      setThroughput((v) => v + Math.floor(Math.random() * 4200 + 800));
    }, 1800);
    return () => clearInterval(id);
  }, [inView]);

  return (
    <section id="status" className="relative section-py border-t border-white/5" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Network Status"
          title="Operational. Continuously."
          description="A self-healing, post-quantum-ready rail — monitored in real time, built to run for the next 100 years."
        />

        <div className="mt-12 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rail-400 opacity-60" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-rail-400" />
          </span>
          <span className="text-lg font-semibold text-white">
            All systems operational
          </span>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_1fr]">
          {/* systems */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div className="space-y-3">
              {SYSTEMS.map((s) => (
                <div
                  key={s}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                >
                  <span className="text-sm text-white/80">{s}</span>
                  <span className="flex items-center gap-2 text-xs text-rail-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rail-400" />
                    Operational
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { k: "Uptime", v: "99.99%" },
                { k: "Settled / min", v: throughput.toLocaleString() },
                { k: "Median latency", v: "38ms" },
              ].map((m) => (
                <div key={m.k} className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
                  <div className="font-mono text-[0.58rem] uppercase tracking-widest text-white/40">
                    {m.k}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-rail-gradient sm:text-base">
                    {m.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* live event feed */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                Self-Healing Events
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />
                live
              </span>
            </div>
            <div className="mt-4 space-y-2.5 font-mono text-[0.78rem]">
              {feed.length === 0 && (
                <p className="text-white/35">Monitoring…</p>
              )}
              {feed.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  <span className="shrink-0 text-white/35">{e.t}</span>
                  <span className="text-white/70">{e.m}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
