"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

interface EnergyData {
  estimate: boolean;
  priceUsdPerKwh: number;
  eurPerMwh: number;
  intensity: number;
  index: string;
  renewable: number;
  mix: { fuel: string; perc: number }[];
}

const FUEL_COLOR: Record<string, string> = {
  wind: "#5eead4",
  solar: "#fbbf24",
  nuclear: "#22d3ee",
  gas: "#f87171",
  coal: "#9ca3af",
  biomass: "#a3e635",
  hydro: "#38bdf8",
  imports: "#c084fc",
  other: "#94a3b8",
};

const fmt = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export function EnergyDesk() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });
  const [data, setData] = useState<EnergyData | null>(null);

  const [usd, setUsd] = useState(500);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/energy");
        const d = await r.json();
        if (!cancelled && d?.ok) setData(d);
      } catch {
        /* keep last */
      }
    };
    load();
    if (!inView) return;
    const id = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inView]);

  const price = data?.priceUsdPerKwh || 0.12;
  const kwh = usd / price;
  const indexColor =
    data?.index === "low"
      ? "text-rail-400"
      : data?.index === "high"
        ? "text-red-400"
        : "text-amber-400";

  const mix = (data?.mix ?? []).slice().sort((a, b) => b.perc - a.perc);

  return (
    <section id="energy-desk" className="relative bg-black section-py" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Energy-Backed Money · World First"
          title="Money backed by electrons."
          description="Mint value backed by real kilowatt-hours, priced off live power markets and settled against the live grid. The first currency collateralized by electricity itself."
        />

        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_1fr]">
          {/* Live grid */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                Live grid
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest",
                  data ? "text-rail-400" : "text-white/40"
                )}
              >
                <span
                  className={cn(
                    "h-1 w-1 rounded-full",
                    data ? "bg-rail-400 animate-pulse-rail" : "bg-white/30"
                  )}
                />
                {data ? "live" : "connecting"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Tile
                label="Spot energy"
                value={`$${fmt(price, 3)}`}
                sub={`${data?.estimate ? "est · " : ""}per kWh`}
                accent
              />
              <Tile
                label="Carbon"
                value={`${Math.round(data?.intensity ?? 0)}`}
                sub="gCO₂/kWh"
                tone={indexColor}
              />
              <Tile
                label="Renewable"
                value={`${Math.round(data?.renewable ?? 0)}%`}
                sub="of generation"
                tone="text-rail-400"
              />
            </div>

            <div className="mt-6">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
                Generation mix
              </span>
              <div className="mt-3 space-y-2">
                {mix.map((m) => (
                  <div key={m.fuel} className="flex items-center gap-3">
                    <span className="w-16 shrink-0 font-mono text-[0.7rem] capitalize text-white/55">
                      {m.fuel}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: FUEL_COLOR[m.fuel] ?? "#94a3b8" }}
                        animate={{ width: `${m.perc}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                    <span className="w-9 shrink-0 text-right font-mono text-[0.7rem] text-white/45">
                      {fmt(m.perc, 0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Issuance desk */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              Mint kWh-backed value
            </span>

            <div className="mt-5">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
                Amount (USD)
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-xl font-semibold text-white/40">$</span>
                <input
                  type="number"
                  min={1}
                  value={usd}
                  onChange={(e) => {
                    setUsd(Number(e.target.value));
                    setSettled(false);
                  }}
                  className="w-full bg-transparent text-xl font-semibold text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl border border-rail-500/20 bg-rail-500/[0.05] px-5 py-5">
              <div>
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
                  Backed by
                </div>
                <div className="mt-1 text-3xl font-semibold tracking-tight text-rail-gradient">
                  {fmt(kwh, 1)} kWh
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
                  Renewable-backed
                </div>
                <div className="mt-1 text-lg font-semibold text-rail-400">
                  {fmt(((data?.renewable ?? 0) / 100) * kwh, 1)} kWh
                </div>
              </div>
            </div>

            <button
              onClick={() => setSettled(true)}
              className={cn(
                "mt-6 w-full rounded-full px-6 py-3.5 text-sm font-semibold transition-all",
                settled
                  ? "border border-rail-500/40 bg-rail-500/10 text-rail-400"
                  : "bg-rail-500 text-void hover:shadow-glow"
              )}
            >
              {settled
                ? "✓ Generation verified · settlement cleared"
                : "Confirm generation (live-grid oracle) →"}
            </button>

            <AnimatePresence>
              {settled && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 rounded-2xl border border-signal/25 bg-signal/[0.06] p-4 text-sm leading-relaxed text-white/75"
                >
                  {fmt(kwh, 1)} kWh verified against the live grid (
                  {Math.round(data?.intensity ?? 0)} gCO₂/kWh,{" "}
                  {Math.round(data?.renewable ?? 0)}% renewable). Value minted and
                  settled against real production — money became electricity.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-white/30">
          Live data: power spot price (energy-charts / Fraunhofer ISE), grid mix
          and carbon intensity (UK Carbon Intensity API), FX (Frankfurter).
          Illustrative issuance — real minting requires custody, oracles, and
          applicable compliance.
        </p>
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  sub,
  accent,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
      <div className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-white/40">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight sm:text-2xl",
          accent ? "text-rail-gradient" : tone ?? "text-white"
        )}
      >
        {value}
      </div>
      <div className="font-mono text-[0.55rem] text-white/35">{sub}</div>
    </div>
  );
}
