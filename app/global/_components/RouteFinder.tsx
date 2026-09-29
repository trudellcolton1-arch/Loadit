"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Section, Kicker, H2, Lede, StatusTag, Cta } from "./Bits";

/**
 * THE GPS EXPERIENCE — "Money shouldn't need directions."
 *
 * YOU HAVE → YOU NEED → FIND ROUTE. Pre-launch: this is a PREVIEW of the
 * experience. It animates how Loadit evaluates a route and shows the shape
 * of the result — no live quote, no numbers, nothing presented as available.
 */

type Origin = { id: string; label: string };
type Dest = { id: string; label: string; via: string };

const ORIGINS: Origin[] = [
  { id: "usd_bank", label: "USD · Bank transfer" },
  { id: "usd_debit", label: "USD · Debit card" },
  { id: "usd_credit", label: "USD · Credit card" },
  { id: "cash", label: "Cash · at a counter" },
  { id: "usdc", label: "USDC" },
  { id: "btc", label: "BTC" },
];
const DESTS: Dest[] = [
  { id: "usdc", label: "USDC", via: "Solana" },
  { id: "usdt", label: "USDT", via: "Solana" },
  { id: "btc", label: "BTC", via: "Lightning" },
  { id: "eth", label: "ETH", via: "Base" },
  { id: "sol", label: "SOL", via: "Solana" },
  { id: "xrp", label: "XRP", via: "XRPL" },
  { id: "usd", label: "USD · Fiat settlement", via: "Licensed partner" },
];

const CHECKS = ["Network availability", "Liquidity", "Cost", "Settlement speed", "Compliance", "Risk"];

export function RouteFinder() {
  const [origin, setOrigin] = useState<Origin>(ORIGINS[0]);
  const [dest, setDest] = useState<Dest>(DESTS[0]);
  const [stage, setStage] = useState<"idle" | "running" | "done">("idle");
  const [checks, setChecks] = useState(0);

  const run = async () => {
    setStage("running");
    setChecks(0);
    for (let i = 1; i <= CHECKS.length; i++) {
      await new Promise((r) => setTimeout(r, 260));
      setChecks(i);
    }
    await new Promise((r) => setTimeout(r, 200));
    setStage("done");
  };

  const reset = () => { setStage("idle"); setChecks(0); };

  const Select = <T extends { id: string; label: string }>({
    label, value, options, onChange,
  }: { label: string; value: T; options: T[]; onChange: (v: T) => void }) => (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">{label}</span>
      <div className="relative mt-2">
        <select
          value={value.id}
          onChange={(e) => onChange(options.find((o) => o.id === e.target.value)!)}
          className="w-full appearance-none rounded-xl border border-white/12 bg-[#0B0F1A] px-4 py-3.5 pr-10 text-base font-medium text-white outline-none transition-colors focus:border-rail-400/60"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <svg aria-hidden width="14" height="14" viewBox="0 0 14 14" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
          <path d="M3 5l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </label>
  );

  return (
    <Section id="find-route" grid>
      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        <div>
          <Kicker>The GPS experience · preview</Kicker>
          <H2>Money shouldn&apos;t need directions.</H2>
          <Lede>
            Your application tells Loadit the origin and destination. Loadit handles the
            supported route between them. This is a preview of that experience — the platform
            is pre-launch.
          </Lede>

          <div className="mt-8 grid gap-4">
            <Select label="You have" value={origin} options={ORIGINS} onChange={(v) => { setOrigin(v); reset(); }} />
            <Select label="You need" value={dest} options={DESTS} onChange={(v) => { setDest(v); reset(); }} />
            <button
              onClick={run}
              disabled={stage === "running"}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-void transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              {stage === "running" ? "Finding route…" : "Find route →"}
            </button>
            <p className="text-xs text-white/40">
              Illustrative. No live quote is produced — nothing here is available to integrate yet.
            </p>
          </div>
        </div>

        {/* ——— navigation-style route panel ——— */}
        <div className="rounded-2xl border border-white/10 bg-[#070A12]/85 p-5 shadow-glass sm:p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Route</span>
            <StatusTag status="PREVIEW" />
          </div>

          <div className="mt-6 grid gap-0">
            <Node label="Origin" value={origin.label} active />
            <Line active={stage !== "idle"} />

            <div className="rounded-xl border border-rail-400/30 bg-rail-400/[0.05] px-4 py-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-white">LOADIT</span>
                <span className="text-[11px] text-white/45">
                  {stage === "idle" ? "Awaiting intent" : stage === "running" ? "Analyzing available pathways…" : "Pathway selected"}
                </span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {CHECKS.map((c, i) => {
                  const done = checks > i;
                  return (
                    <li key={c} className="flex items-center gap-2 text-xs">
                      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${done ? "border-rail-400 bg-rail-400/20 text-rail-400" : "border-white/15 text-transparent"}`}>
                        <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4l1.8 1.8L6.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.3" /></svg>
                      </span>
                      <span className={done ? "text-white/85" : "text-white/35"}>{c}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Line active={stage === "done"} />
            <Node label="Destination" value={dest.label} active={stage === "done"} />
          </div>

          <AnimatePresence>
            {stage === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400">Route shape · illustrative</p>
                <p className="mt-2 text-sm text-white/75">
                  {origin.label} → Loadit normalizes the value, scores every supported path, and selects one → {dest.label}
                  {dest.via ? <span className="text-white/45"> · e.g. via {dest.via}</span> : null}
                </p>
                <p className="mt-3 text-[11px] text-white/35">
                  When the platform opens, this returns the selected network, cost, expected time, and a normalized settlement object.
                </p>
                <div className="mt-4">
                  <Cta href="/access" className="px-4 py-2 text-xs">Join the early-access list</Cta>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Section>
  );
}

function Node({ label, value, active }: { label: string; value: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 rounded-full ${active ? "bg-white" : "bg-white/25"}`} />
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}

function Line({ active }: { active: boolean }) {
  return (
    <div className="ml-[5px] my-1 h-7 w-0.5 overflow-hidden rounded bg-white/10">
      <motion.div
        className="h-full w-full bg-gradient-to-b from-cyan-glow to-rail-500"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: active ? 1 : 0 }}
        style={{ transformOrigin: "top" }}
        transition={{ duration: 0.4 }}
      />
    </div>
  );
}
