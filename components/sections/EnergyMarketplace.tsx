"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */

type Source = "solar" | "wind" | "hydro" | "nuclear" | "gas" | "grid" | "other";
const GREEN: Source[] = ["solar", "wind", "hydro"];

const SOURCE_COLOR: Record<Source, string> = {
  solar: "#fbbf24",
  wind: "#5eead4",
  hydro: "#38bdf8",
  nuclear: "#22d3ee",
  gas: "#f87171",
  grid: "#94a3b8",
  other: "#a3e635",
};

interface Listing {
  id: number;
  name: string;
  source: Source;
  region: string;
  offset: number; // price vs spot, e.g. -0.08
  available: number; // kWh
  fixed?: number; // fixed $/kWh (for user listings)
  mine?: boolean;
}

const BASE: Omit<Listing, "id">[] = [
  { name: "SunPeak Solar Farm", source: "solar", region: "CAISO", offset: -0.08, available: 42000 },
  { name: "WestWind Array", source: "wind", region: "ERCOT", offset: -0.12, available: 88000 },
  { name: "Cascade Hydro", source: "hydro", region: "NWPP", offset: -0.05, available: 30000 },
  { name: "Vogtle Nuclear", source: "nuclear", region: "SERC", offset: 0.02, available: 120000 },
  { name: "EU Grid Spot", source: "grid", region: "ENTSO-E", offset: 0.0, available: 250000 },
  { name: "Rooftop Pool", source: "solar", region: "Distributed", offset: 0.04, available: 5200 },
  { name: "Permian Surplus", source: "gas", region: "ERCOT", offset: -0.03, available: 64000 },
  { name: "DataCenter Recapture", source: "other", region: "PJM", offset: -0.06, available: 15000 },
];

const fmt = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

interface EnergyData {
  priceUsdPerKwh: number;
  estimate: boolean;
  intensity: number;
  renewable: number;
}

/* -------------------------------------------------------------------------- */

export function EnergyMarketplace() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });

  const [energy, setEnergy] = useState<EnergyData | null>(null);
  const [balance, setBalance] = useState(50000);
  const [holdings, setHoldings] = useState({ kwh: 0, cost: 0 });
  const [listings, setListings] = useState<Listing[]>(
    BASE.map((b, i) => ({ ...b, id: i }))
  );
  const [filter, setFilter] = useState<Source | "all">("all");
  const [greenOnly, setGreenOnly] = useState(false);
  const [tape, setTape] = useState<{ id: number; t: string; mine?: boolean }[]>([]);
  const [buy, setBuy] = useState<Listing | null>(null);
  const [qty, setQty] = useState(1000);
  const idRef = useRef(100);

  // listing form
  const [fSource, setFSource] = useState<Source>("solar");
  const [fPrice, setFPrice] = useState(0.1);
  const [fKwh, setFKwh] = useState(10000);

  const spot = energy?.priceUsdPerKwh || 0.12;
  const priceOf = (l: Listing) => l.fixed ?? spot * (1 + l.offset);

  // Live energy data.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/energy");
        const d = await r.json();
        if (!cancelled && d?.ok) setEnergy(d);
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

  // Ambient trade tape.
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      if (Math.random() < 0.75) {
        const l = BASE[Math.floor(Math.random() * BASE.length)];
        const k = [500, 1000, 2500, 5000, 12000][Math.floor(Math.random() * 5)];
        setTape((t) =>
          [
            { id: idRef.current++, t: `${fmt(k, 0)} kWh · ${l.name} · $${fmt(spot * (1 + l.offset), 3)}/kWh` },
            ...t,
          ].slice(0, 7)
        );
      }
    }, 1700);
    return () => clearInterval(id);
  }, [inView, spot]);

  const visible = useMemo(
    () =>
      listings.filter(
        (l) =>
          (filter === "all" || l.source === filter) &&
          (!greenOnly || GREEN.includes(l.source))
      ),
    [listings, filter, greenOnly]
  );

  const confirmBuy = () => {
    if (!buy) return;
    const price = priceOf(buy);
    const amount = Math.min(qty, buy.available);
    const total = amount * price;
    if (total > balance) return;
    setBalance((b) => b - total);
    setHoldings((h) => ({ kwh: h.kwh + amount, cost: h.cost + total }));
    setListings((ls) =>
      ls.map((l) => (l.id === buy.id ? { ...l, available: l.available - amount } : l))
    );
    setTape((t) =>
      [{ id: idRef.current++, t: `YOU bought ${fmt(amount, 0)} kWh · ${buy.name} · $${fmt(total)}`, mine: true }, ...t].slice(0, 7)
    );
    setBuy(null);
  };

  const list = () => {
    if (fPrice <= 0 || fKwh <= 0) return;
    setListings((ls) => [
      {
        id: idRef.current++,
        name: "Your listing",
        source: fSource,
        region: "You",
        offset: 0,
        available: fKwh,
        fixed: fPrice,
        mine: true,
      },
      ...ls,
    ]);
    setTape((t) =>
      [{ id: idRef.current++, t: `YOU listed ${fmt(fKwh, 0)} kWh · ${fSource} · $${fmt(fPrice, 3)}/kWh`, mine: true }, ...t].slice(0, 7)
    );
  };

  const value = holdings.kwh * spot;
  const pnl = value - holdings.cost;
  const avg = holdings.kwh ? holdings.cost / holdings.kwh : 0;

  return (
    <section id="marketplace" className="relative bg-black section-py" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Energy Marketplace · World First"
          title="Buy and sell electricity as money."
          description="A live two-sided market for kilowatt-hours. Producers list real generation; anyone can buy energy-backed value — priced off live power markets, settled against the grid."
        />

        {/* market bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-3 font-mono text-sm">
          <span className={cn("flex items-center gap-1.5 text-[0.6rem] uppercase tracking-widest", energy ? "text-rail-400" : "text-white/40")}>
            <span className={cn("h-1.5 w-1.5 rounded-full", energy ? "bg-rail-400 animate-pulse-rail" : "bg-white/30")} />
            {energy ? "live market" : "connecting"}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-white/45">Spot</span>
            <span className="text-white">${fmt(spot, 3)}/kWh</span>
            {energy?.estimate && <span className="text-white/30">est</span>}
          </span>
          <span className="flex items-center gap-2">
            <span className="text-white/45">Carbon</span>
            <span className="text-white">{Math.round(energy?.intensity ?? 0)} gCO₂</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-white/45">Renewable</span>
            <span className="text-rail-400">{Math.round(energy?.renewable ?? 0)}%</span>
          </span>
        </div>

        {/* holdings */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-3xl border border-rail-500/20 bg-rail-500/[0.04] p-5 sm:flex-row sm:p-6">
          <div className="flex flex-wrap items-center gap-8">
            <Metric label="Balance" value={`$${fmt(balance)}`} />
            <Metric label="kWh owned" value={`${fmt(holdings.kwh, 0)}`} accent />
            <Metric label="Avg cost" value={holdings.kwh ? `$${fmt(avg, 3)}` : "—"} />
            <Metric
              label="Value · P&L"
              value={`$${fmt(value)}`}
              sub={holdings.kwh ? `${pnl >= 0 ? "+" : "−"}$${fmt(Math.abs(pnl))}` : ""}
              tone={pnl >= 0 ? "text-rail-400" : "text-red-400"}
            />
          </div>
        </div>

        {/* filters */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(["all", "solar", "wind", "hydro", "nuclear", "gas", "grid"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs capitalize transition-all",
                  filter === s
                    ? "border-rail-500/40 bg-rail-500/10 text-white"
                    : "border-white/10 text-white/55 hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <button
            onClick={() => setGreenOnly((g) => !g)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs transition-all",
              greenOnly ? "border-rail-500/40 bg-rail-500/10 text-rail-400" : "border-white/10 text-white/55"
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", greenOnly ? "bg-rail-400" : "bg-white/30")} />
            Green only
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          {/* listings */}
          <div className="glass rounded-4xl p-5 sm:p-6">
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {visible.map((l) => {
                  const price = priceOf(l);
                  const green = GREEN.includes(l.source);
                  return (
                    <motion.div
                      key={l.id}
                      layout
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                    >
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: SOURCE_COLOR[l.source] }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-white">{l.name}</span>
                          {l.mine && (
                            <span className="rounded bg-rail-500/15 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-rail-400">you</span>
                          )}
                          {green && (
                            <span className="rounded bg-rail-500/10 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-widest text-rail-400/80">green</span>
                          )}
                        </div>
                        <div className="font-mono text-[0.68rem] capitalize text-white/40">
                          {l.source} · {l.region} · {fmt(l.available, 0)} kWh avail
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-white">${fmt(price, 3)}</div>
                        <div className="font-mono text-[0.6rem] text-white/35">per kWh</div>
                      </div>
                      <button
                        onClick={() => {
                          setBuy(l);
                          setQty(Math.min(1000, l.available));
                        }}
                        className="rounded-full bg-rail-500 px-4 py-1.5 text-xs font-semibold text-void transition-all hover:shadow-glow"
                      >
                        Buy
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {visible.length === 0 && (
                <p className="py-6 text-center text-sm text-white/40">No listings match your filters.</p>
              )}
            </div>
          </div>

          {/* sidebar: list + tape */}
          <div className="space-y-5">
            <div className="glass rounded-4xl p-5 sm:p-6">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">List your energy</span>
              <div className="mt-4 space-y-3">
                <select
                  value={fSource}
                  onChange={(e) => setFSource(e.target.value as Source)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none focus:border-rail-400/50"
                >
                  {(["solar", "wind", "hydro", "nuclear", "gas", "other"] as Source[]).map((s) => (
                    <option key={s} value={s} className="bg-surface capitalize">{s}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-widest text-white/40">$ / kWh</span>
                    <input type="number" step="0.001" value={fPrice} onChange={(e) => setFPrice(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white outline-none focus:border-rail-400/50" />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[0.55rem] uppercase tracking-widest text-white/40">kWh</span>
                    <input type="number" value={fKwh} onChange={(e) => setFKwh(Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white outline-none focus:border-rail-400/50" />
                  </label>
                </div>
                <button onClick={list} className="w-full rounded-full border border-rail-500/40 bg-rail-500/10 px-4 py-2.5 text-sm font-semibold text-rail-400 transition-all hover:bg-rail-500/15">
                  List energy →
                </button>
              </div>
            </div>

            <div className="glass rounded-4xl p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">Live trades</span>
                <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                  <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />streaming
                </span>
              </div>
              <div className="mt-4 space-y-2 font-mono text-[0.74rem]">
                <AnimatePresence initial={false}>
                  {tape.map((t) => (
                    <motion.div key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      className={t.mine ? "text-rail-400" : "text-white/55"}>
                      {t.t}
                    </motion.div>
                  ))}
                  {tape.length === 0 && <p className="text-white/30">Awaiting flow…</p>}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-white/30">
          Live simulation. Spot price, carbon intensity, and grid mix are real
          (energy-charts, UK Carbon Intensity). Real trading requires custody,
          settlement, metered-generation oracles, and applicable compliance.
        </p>
      </div>

      {/* buy modal */}
      <AnimatePresence>
        {buy && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" onClick={() => setBuy(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="glass relative w-full max-w-md rounded-4xl p-6 sm:p-8">
              <button onClick={() => setBuy(null)} aria-label="Close" className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-white">✕</button>
              <h3 className="text-xl font-semibold tracking-tight text-white">Buy energy</h3>
              <p className="mt-1 text-sm text-white/45">{buy.name} · {buy.region} · ${fmt(priceOf(buy), 3)}/kWh</p>

              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">Quantity (kWh)</span>
                  <span className="font-mono text-sm text-white">{fmt(qty, 0)}</span>
                </div>
                <input type="range" min={100} max={buy.available} step={100} value={Math.min(qty, buy.available)}
                  onChange={(e) => setQty(Number(e.target.value))} className="mt-3 w-full accent-rail-500" />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <span className="text-sm text-white/50">Total</span>
                <span className="font-mono text-lg font-semibold text-rail-gradient">${fmt(qty * priceOf(buy))}</span>
              </div>

              <button onClick={confirmBuy} disabled={qty * priceOf(buy) > balance}
                className="mt-6 w-full rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-50">
                {qty * priceOf(buy) > balance ? "Insufficient balance" : `Buy ${fmt(qty, 0)} kWh →`}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Metric({ label, value, sub, accent, tone }: { label: string; value: string; sub?: string; accent?: boolean; tone?: string }) {
  return (
    <div>
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">{label}</div>
      <div className={cn("font-mono text-xl font-semibold sm:text-2xl", accent ? "text-rail-gradient" : tone ?? "text-white")}>
        {value}
      </div>
      {sub && <div className={cn("font-mono text-[0.65rem]", tone ?? "text-white/40")}>{sub}</div>}
    </div>
  );
}
