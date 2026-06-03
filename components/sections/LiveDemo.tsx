"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { NETWORKS } from "@/lib/constants";
import { formatUSD } from "@/lib/utils";

const ASSETS = ["USDC", "USDT", "BTC", "ETH", "SOL"] as const;
const PREFERENCES = ["Cheapest", "Fastest", "Balanced"] as const;

type Result = {
  network: (typeof NETWORKS)[number];
  legacyFee: number;
  loaditFee: number;
  savings: number;
  eta: string;
  path: string[];
};

/** Deterministic-ish fake routing so the demo "feels real". */
function computeRoute(
  amount: number,
  asset: string,
  preference: string
): Result {
  // Pick a plausible network based on preference + asset.
  const pool = NETWORKS.filter((n) => n.id !== "bank");
  let network = pool[2]; // Solana default — fast + cheap
  if (preference === "Fastest") network = pool.find((n) => n.id === "ln") ?? network;
  if (preference === "Cheapest") network = pool.find((n) => n.id === "sol") ?? network;
  if (asset === "BTC") network = pool.find((n) => n.id === "ln") ?? network;
  if (asset === "ETH") network = pool.find((n) => n.id === "base") ?? network;

  const legacyFee = Math.max(3.2, amount * 0.029 + 0.3);
  const loaditFee = Math.max(0.45, amount * 0.0009 + 0.05);
  const savings = Math.round((1 - loaditFee / legacyFee) * 100);
  const eta = network.id === "ln" ? "~0.4s" : network.id === "sol" ? "~1.8s" : "~3.2s";

  return {
    network,
    legacyFee,
    loaditFee,
    savings,
    eta,
    path: ["Capture", "Identity", "AERO", network.name, "Settled"],
  };
}

export function LiveDemo() {
  const [amount, setAmount] = useState(250);
  const [asset, setAsset] = useState<string>("USDC");
  const [wallet, setWallet] = useState("");
  const [preference, setPreference] = useState<string>("Balanced");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const route = () => {
    setLoading(true);
    setResult(null);
    // Simulate AERO scoring latency.
    setTimeout(() => {
      setResult(computeRoute(amount, asset, preference));
      setLoading(false);
    }, 1400);
  };

  return (
    <section
      id="demo"
      className="relative section-py border-y border-white/5 bg-ink"
    >
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Live Demo"
          title="Watch AERO route a payment."
          description="Enter a transaction. The engine scores the network, computes the savings, and draws the settlement path — live."
        />

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.1fr]">
          {/* Inputs */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                  Amount (USD)
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-2xl font-semibold text-white/40">$</span>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-transparent text-2xl font-semibold tracking-tight text-white outline-none placeholder:text-white/20"
                  />
                </div>
                <input
                  type="range"
                  min={10}
                  max={5000}
                  step={10}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-4 w-full accent-rail-500"
                  aria-label="Amount slider"
                />
              </div>

              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                  Asset
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ASSETS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAsset(a)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm transition-all ${
                        asset === a
                          ? "border-rail-400/50 bg-rail-500/10 text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                  Wallet address
                </label>
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="0x… or recipient handle"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-rail-400/50"
                />
              </div>

              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                  Preference
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {PREFERENCES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPreference(p)}
                      className={`rounded-xl border px-2 py-2 text-sm transition-all ${
                        preference === p
                          ? "border-rail-400/50 bg-rail-500/10 text-white"
                          : "border-white/10 text-white/50 hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={route}
                disabled={loading}
                className="w-full"
              >
                {loading ? "AERO is scoring routes…" : "AI Route →"}
              </Button>
            </div>
          </div>

          {/* Output */}
          <div className="glass relative flex min-h-[420px] flex-col overflow-hidden rounded-4xl p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-rail-500/10 blur-3xl" />

            <AnimatePresence mode="wait">
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="m-auto text-center"
                >
                  <div className="mx-auto h-12 w-12 animate-spin-slow rounded-full border-2 border-white/10 border-t-rail-400" />
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                    Scoring {NETWORKS.length} routes
                  </p>
                </motion.div>
              )}

              {!loading && !result && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="m-auto max-w-xs text-center text-sm text-white/40"
                >
                  Configure a transaction and run AERO to see the optimal route,
                  your savings, and the settlement path.
                </motion.div>
              )}

              {!loading && result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                      Optimal route
                    </span>
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-medium text-signal">
                      {result.network.name}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-3">
                    <Stat
                      label="You save"
                      value={`${result.savings}%`}
                      accent
                    />
                    <Stat label="Loadit fee" value={formatUSD(result.loaditFee)} />
                    <Stat label="Arrival" value={result.eta} />
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40 line-through">
                        Legacy {formatUSD(result.legacyFee)}
                      </span>
                      <span className="text-white">
                        Loadit {formatUSD(result.loaditFee)}
                      </span>
                    </div>
                    <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: "100%" }}
                        animate={{ width: `${100 - result.savings}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-rail-gradient"
                      />
                    </div>
                  </div>

                  {/* settlement path */}
                  <div className="mt-auto pt-6">
                    <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-white/40">
                      Settlement path
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {result.path.map((step, i) => (
                        <motion.span
                          key={step}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-center gap-1.5"
                        >
                          <span
                            className={`rounded-lg border px-2.5 py-1 text-xs ${
                              i === result.path.length - 1
                                ? "border-signal/30 bg-signal/10 text-signal"
                                : "border-white/10 bg-white/[0.03] text-white/70"
                            }`}
                          >
                            {step}
                          </span>
                          {i < result.path.length - 1 && (
                            <span className="text-rail-400/50">→</span>
                          )}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-xl text-center text-xs text-white/30">
          Illustrative simulation. Real routing scores live network conditions,
          liquidity, and fees at settlement time.
        </p>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
      <div className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-white/40">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-semibold tracking-tight ${
          accent ? "text-signal" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
