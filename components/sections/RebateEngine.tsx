"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Counter } from "@/components/ui/Counter";
import {
  ASSETS,
  PAYMENT_METHODS,
  computeRoute,
  formatUSD,
  type Asset,
  type PaymentMethod,
} from "@/lib/aero";
import { cn } from "@/lib/utils";

// Share of the routing savings rebated back to the user.
const REBATE_RATE = 0.25;

interface Result {
  network: string;
  legacy: number;
  loadit: number;
  savings: number;
  rebate: number;
  eta: string;
}

export function RebateEngine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [asset, setAsset] = useState<Asset>("USDC");
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [earned, setEarned] = useState(0);
  const [count, setCount] = useState(0);
  const [paidToday, setPaidToday] = useState(284910);
  const timer = useRef<number>();

  useEffect(() => () => clearTimeout(timer.current), []);

  // Social-proof: rebates paid out today, ticking up.
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(
      () => setPaidToday((v) => v + Math.floor(Math.random() * 220 + 40)),
      1500
    );
    return () => clearInterval(id);
  }, [inView]);

  const run = () => {
    setLoading(true);
    setResult(null);
    timer.current = window.setTimeout(() => {
      const r = computeRoute({ paymentMethod, asset, amount, wallet: "", preferred: "auto" });
      const savings = Math.max(0, r.legacyFee - r.loaditFee);
      const rebate = savings * REBATE_RATE;
      setResult({
        network: r.network.name,
        legacy: r.legacyFee,
        loadit: r.loaditFee,
        savings,
        rebate,
        eta: r.eta,
      });
      setEarned((e) => e + rebate);
      setCount((c) => c + 1);
      setPaidToday((v) => v + rebate);
      setLoading(false);
    }, 900);
  };

  const r = result;
  const legacyPct = r ? Math.min(100, (r.legacy / r.legacy) * 100) : 100;
  const loaditPct = r ? (r.loadit / r.legacy) * 100 : 0;

  return (
    <section id="earn" className="relative bg-black section-py" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Loadit Rewards · World First"
          title="We pay you to move money."
          description="Every legacy rail charges you to move money. HQ routes your transfer the cheapest way — and pays a share of the savings back to you. The first payment rail that earns you money."
        />

        {/* social proof */}
        <div className="mt-10 flex flex-col items-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-[0.25em] text-rail-400">
            ● Rebates paid to users today
          </div>
          <div className="mt-1 font-mono text-4xl font-semibold tracking-tight text-rail-gradient sm:text-5xl">
            ${paidToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* input */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              Move money
            </span>
            <div className="mt-5 space-y-5">
              <div>
                <Label>Paying with</Label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <Chip key={m} active={paymentMethod === m} onClick={() => setPaymentMethod(m)}>
                      {m}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <Label>Receiving</Label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ASSETS.map((a) => (
                    <Chip key={a.id} active={asset === a.id} onClick={() => setAsset(a.id)}>
                      {a.id}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Amount (USD)</Label>
                  <span className="font-mono text-sm text-white">${amount.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={10000}
                  step={20}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-rail-500"
                />
              </div>
              <button
                onClick={run}
                disabled={loading}
                className="w-full rounded-full bg-rail-500 px-6 py-3.5 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
              >
                {loading ? "HQ is routing…" : "Route & earn →"}
              </button>
            </div>

            {/* your earnings */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/5 pt-6">
              <div className="rounded-2xl border border-rail-500/25 bg-rail-500/[0.05] p-4">
                <Label>Your rebate balance</Label>
                <div className="mt-1 font-mono text-2xl font-semibold text-rail-gradient">
                  {formatUSD(earned)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <Label>Transfers</Label>
                <div className="mt-1 font-mono text-2xl font-semibold text-white">{count}</div>
              </div>
            </div>
          </div>

          {/* result */}
          <div className="glass relative flex min-h-[420px] flex-col justify-center overflow-hidden rounded-4xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto text-center">
                  <div className="mx-auto h-12 w-12 animate-spin-slow rounded-full border-2 border-white/10 border-t-rail-400" />
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
                    Finding the cheapest path
                  </p>
                </motion.div>
              )}

              {!loading && !r && (
                <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="m-auto max-w-sm text-center text-sm text-white/45">
                  Set up a transfer and run HQ. You&apos;ll see the legacy cost,
                  Loadit&apos;s cost, and the cash rebate paid back to you.
                </motion.div>
              )}

              {!loading && r && (
                <motion.div key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                      Routed via
                    </span>
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-medium text-signal">
                      {r.network} · {r.eta}
                    </span>
                  </div>

                  {/* the big number */}
                  <div className="mt-6 rounded-3xl border border-rail-500/30 bg-rail-500/[0.07] p-6 text-center">
                    <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rail-400">
                      You earned
                    </div>
                    <div className="mt-1 font-mono text-5xl font-semibold tracking-tight text-rail-gradient">
                      <Counter key={count} value={Math.round(r.rebate * 100)} duration={700} />
                    </div>
                    <div className="-mt-2 font-mono text-xs text-white/40">
                      = {formatUSD(r.rebate)} cash back
                    </div>
                  </div>

                  {/* breakdown */}
                  <div className="mt-6 space-y-3">
                    <Bar label="Legacy rail cost" value={r.legacy} max={r.legacy} tone="bg-white/15" valueClass="text-white/50 line-through" />
                    <Bar label="Loadit cost" value={r.loadit} max={r.legacy} tone="bg-gradient-to-r from-cyan to-rail-500" valueClass="text-white" />
                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm">
                      <span className="text-white/50">Total saved</span>
                      <span className="font-mono font-semibold text-white">{formatUSD(r.savings)}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl border border-rail-500/25 bg-rail-500/[0.05] px-4 py-3 text-sm">
                      <span className="text-rail-400">Paid back to you ({Math.round(REBATE_RATE * 100)}%)</span>
                      <span className="font-mono font-semibold text-rail-gradient">{formatUSD(r.rebate)}</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-white/30">
          Illustrative. Rebates are a share of real routing savings and depend on
          live network and market conditions; amounts shown are estimates.
        </p>
      </div>
    </section>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
  valueClass,
}: {
  label: string;
  value: number;
  max: number;
  tone: string;
  valueClass: string;
}) {
  const pct = Math.max(2, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/50">{label}</span>
        <span className={cn("font-mono", valueClass)}>{formatUSD(value)}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
      {children}
    </span>
  );
}
function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-2 py-2 text-xs transition-all sm:text-sm",
        active
          ? "border-rail-500/40 bg-rail-500/10 text-white"
          : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
