"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Counter } from "@/components/ui/Counter";
import {
  ANALYSIS_STEPS,
  ASSETS,
  PAYMENT_METHODS,
  PREFERRED_NETWORKS,
  computeRoute,
  formatUSD,
  type Asset,
  type NetworkId,
  type PaymentMethod,
  type RouteResult,
} from "@/lib/aero";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Small primitives (ShadCN-style, zero dependency)                          */
/* -------------------------------------------------------------------------- */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
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
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm transition-all duration-200",
        active
          ? "border-cyan/50 bg-cyan/10 text-white shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]"
          : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  accent?: "cyan" | "green" | "default";
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
      <FieldLabel>{label}</FieldLabel>
      <div
        className={cn(
          "mt-1.5 text-lg font-semibold tracking-tight sm:text-xl",
          accent === "green" && "text-signal",
          accent === "cyan" && "text-cyan",
          (!accent || accent === "default") && "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Animated route flow — particles "like money flowing"                      */
/* -------------------------------------------------------------------------- */

const KIND_STYLE: Record<RouteResult["path"][number]["kind"], string> = {
  origin: "border-white/15 text-white",
  engine: "border-cyan/50 text-cyan shadow-[0_0_24px_-8px_rgba(34,211,238,0.6)]",
  asset: "border-white/15 text-white/90",
  network: "border-signal/50 text-signal",
  wallet: "border-signal/50 text-signal shadow-[0_0_24px_-8px_rgba(52,211,153,0.5)]",
};

function RouteFlow({ path, live }: { path: RouteResult["path"]; live: boolean }) {
  const [vertical, setVertical] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setVertical(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div
      className={cn(
        "flex items-stretch justify-center gap-0",
        vertical ? "flex-col items-center" : "flex-row flex-wrap"
      )}
    >
      {path.map((node, i) => (
        <div
          key={`${node.label}-${i}`}
          className={cn(
            "flex items-center",
            vertical ? "flex-col" : "flex-row"
          )}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "grid place-items-center rounded-2xl border bg-surface px-4 py-2.5 text-sm font-medium",
              KIND_STYLE[node.kind]
            )}
          >
            {node.label}
          </motion.div>

          {i < path.length - 1 && (
            <Connector vertical={vertical} active={live} index={i} />
          )}
        </div>
      ))}
    </div>
  );
}

function Connector({
  vertical,
  active,
  index,
}: {
  vertical: boolean;
  active: boolean;
  index: number;
}) {
  const particles = [0, 1, 2];
  return (
    <div
      className={cn(
        "relative",
        vertical ? "h-7 w-px" : "h-px w-8 sm:w-12"
      )}
    >
      <div
        className={cn(
          "absolute inset-0",
          vertical
            ? "bg-gradient-to-b from-cyan/40 to-signal/40"
            : "bg-gradient-to-r from-cyan/40 to-signal/40"
        )}
      />
      {active &&
        particles.map((p) => (
          <motion.span
            key={p}
            className="absolute h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]"
            style={
              vertical
                ? { left: "50%", marginLeft: -3, top: -3 }
                : { top: "50%", marginTop: -3, left: -3 }
            }
            initial={vertical ? { y: 0, opacity: 0 } : { x: 0, opacity: 0 }}
            animate={
              vertical
                ? { y: [0, 28], opacity: [0, 1, 0] }
                : { x: [0, 48], opacity: [0, 1, 0] }
            }
            transition={{
              duration: 1.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15 + p * 0.36,
            }}
          />
        ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Main section                                                              */
/* -------------------------------------------------------------------------- */

const SECURITY_CHECKS = [
  "Wallet Validation",
  "Route Verification",
  "Replay Protection",
  "Fraud Detection",
  "Non-Custodial Settlement",
  "Audit Logging",
];

export function AeroSimulator() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Debit Card");
  const [asset, setAsset] = useState<Asset>("BTC");
  const [amount, setAmount] = useState(500);
  const [wallet, setWallet] = useState("");
  const [preferred, setPreferred] = useState<"auto" | NetworkId>("auto");

  const [phase, setPhase] = useState<"idle" | "analyzing" | "done">("idle");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [investor, setInvestor] = useState(false);
  const [runId, setRunId] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  // Live preview of the route for the diagram, before/while configuring.
  const preview = useMemo(
    () => computeRoute({ paymentMethod, asset, amount, wallet, preferred }),
    [paymentMethod, asset, amount, wallet, preferred]
  );

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("analyzing");
    setStep(0);
    setResult(null);

    const stepMs = 620;
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setStep(i), i * stepMs)
      );
    });
    timers.current.push(
      window.setTimeout(() => {
        setResult(computeRoute({ paymentMethod, asset, amount, wallet, preferred }));
        setPhase("done");
        setRunId((r) => r + 1);
      }, ANALYSIS_STEPS.length * stepMs)
    );
  };

  const runFromHero = () => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    run();
  };

  const r = result;
  const flowPath = (r ?? preview).path;

  return (
    <section id="demo" className="relative bg-black section-py">
      <div className="container-px mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="eyebrow"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-rail" />
            Loadit AERO™ · AI Settlement Router
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tightest text-gradient sm:text-5xl lg:text-6xl"
          >
            AI-Powered Financial Routing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-2xl text-pretty text-white/55 sm:text-lg"
          >
            Loadit automatically finds the fastest, cheapest, and most efficient
            path for every transaction.
          </motion.p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
            <button
              onClick={runFromHero}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-void transition-all hover:shadow-[0_0_44px_-8px_rgba(34,211,238,0.7)]"
            >
              Run Simulation
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </button>

            {/* Investor Mode toggle */}
            <button
              onClick={() => setInvestor((v) => !v)}
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white/70"
              role="switch"
              aria-checked={investor}
            >
              <span className={cn(!investor && "text-white")}>Normal</span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  investor ? "bg-cyan/70" : "bg-white/15"
                )}
              >
                <motion.span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow"
                  animate={{ left: investor ? 18 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              </span>
              <span className={cn(investor && "text-cyan")}>Investor</span>
            </button>
          </div>
        </div>

        {/* Simulator + analysis/results */}
        <div className="mt-14 grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
          {/* Inputs */}
          <div
            ref={cardRef}
            className="glass rounded-4xl p-6 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Simulator</h3>
              <span className="rounded-full border border-cyan/30 bg-cyan/10 px-2.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-cyan">
                Live
              </span>
            </div>

            <div className="mt-6 space-y-6">
              <div>
                <FieldLabel>Payment Method</FieldLabel>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <Chip key={m} active={paymentMethod === m} onClick={() => setPaymentMethod(m)}>
                      {m}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Asset</FieldLabel>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ASSETS.map((a) => (
                    <Chip key={a.id} active={asset === a.id} onClick={() => setAsset(a.id)}>
                      {a.id}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Amount (USD)</FieldLabel>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 focus-within:border-cyan/50">
                  <span className="text-xl font-semibold text-white/40">$</span>
                  <input
                    type="number"
                    min={1}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-transparent text-xl font-semibold tracking-tight text-white outline-none"
                    aria-label="Amount in USD"
                  />
                </div>
                <input
                  type="range"
                  min={20}
                  max={10000}
                  step={20}
                  value={Math.min(amount, 10000)}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="mt-3 w-full accent-cyan"
                  aria-label="Amount slider"
                />
              </div>

              <div>
                <FieldLabel>Destination Wallet</FieldLabel>
                <input
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  placeholder="0x… or recipient handle"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-cyan/50"
                />
              </div>

              <div>
                <FieldLabel>Preferred Network · Optional</FieldLabel>
                <select
                  value={preferred}
                  onChange={(e) => setPreferred(e.target.value as "auto" | NetworkId)}
                  className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-cyan/50"
                >
                  {PREFERRED_NETWORKS.map((n) => (
                    <option key={n.id} value={n.id} className="bg-surface">
                      {n.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={run}
                disabled={phase === "analyzing"}
                className="w-full rounded-full bg-cyan px-6 py-3.5 text-sm font-semibold text-void transition-all hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.8)] disabled:opacity-60"
              >
                {phase === "analyzing" ? "Running AERO…" : "Run AI Route →"}
              </button>
            </div>
          </div>

          {/* Analysis / Results */}
          <div className="glass relative flex min-h-[460px] flex-col overflow-hidden rounded-4xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="m-auto max-w-sm text-center text-sm text-white/45"
                >
                  Configure a transaction and run AERO to see the optimal route,
                  fees, settlement time, savings, success probability, and risk —
                  scored live across 14 networks.
                </motion.div>
              )}

              {phase === "analyzing" && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="m-auto w-full max-w-md"
                >
                  <div className="mx-auto mb-8 h-12 w-12 animate-spin-slow rounded-full border-2 border-white/10 border-t-cyan" />
                  <ul className="space-y-3">
                    {ANALYSIS_STEPS.map((s, i) => {
                      const state = i < step ? "done" : i === step ? "active" : "idle";
                      return (
                        <li key={s} className="flex items-center gap-3">
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[0.6rem]",
                              state === "done" && "border-signal/50 bg-signal/15 text-signal",
                              state === "active" && "border-cyan/60 bg-cyan/15 text-cyan",
                              state === "idle" && "border-white/10 text-white/30"
                            )}
                          >
                            {state === "done" ? "✓" : i + 1}
                          </span>
                          <span
                            className={cn(
                              "font-mono text-sm",
                              state === "idle" ? "text-white/30" : "text-white/80"
                            )}
                          >
                            {s}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}

              {phase === "done" && r && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex h-full flex-col"
                >
                  <div className="flex items-center justify-between">
                    <FieldLabel>Route Selected</FieldLabel>
                    <span className="rounded-full border border-signal/30 bg-signal/10 px-3 py-1 text-xs font-medium text-signal">
                      {r.network.name}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Stat label="Savings vs Legacy" value={`${r.savingsPct}%`} accent="green" />
                    <Stat label="Estimated Fee" value={formatUSD(r.loaditFee)} accent="cyan" />
                    <Stat label="Estimated Time" value={r.eta} />
                    <Stat label="Network Used" value={r.network.name} />
                    <Stat label="Success Prob." value={`${r.successProbability}%`} accent="green" />
                    <Stat
                      label="Risk Score"
                      value={`${r.risk.value} · ${r.risk.label}`}
                      accent={r.risk.label === "Low" ? "green" : "default"}
                    />
                  </div>

                  {/* Why AERO chose this route */}
                  <div className="mt-5 rounded-2xl border border-cyan/20 bg-cyan/[0.04] p-5">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan">◇</span>
                      <FieldLabel>Why AERO chose this route</FieldLabel>
                    </div>
                    <p className="mt-2 text-pretty text-sm leading-relaxed text-white/75">
                      {r.explanation}
                    </p>
                  </div>

                  {/* Fee comparison bar */}
                  <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/40 line-through">
                        Legacy {formatUSD(r.legacyFee)}
                      </span>
                      <span className="text-white">Loadit {formatUSD(r.loaditFee)}</span>
                    </div>
                    <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        key={runId}
                        initial={{ width: "100%" }}
                        animate={{ width: `${100 - r.savingsPct}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan to-signal"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Network visualization */}
        <div className="mt-5 glass rounded-4xl p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <FieldLabel>Settlement Path</FieldLabel>
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-white/35">
              {phase === "done" ? "Value flowing" : "Preview"}
            </span>
          </div>
          <div className="mt-8 pb-2">
            <RouteFlow path={flowPath} live={phase === "done"} />
          </div>
        </div>

        {/* Live metrics + security */}
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* Live metrics */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <FieldLabel>Live Metrics</FieldLabel>
            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Metric label="Networks Scanned" value={r?.metrics.networksScanned ?? 14} runId={runId} />
              <Metric label="Liquidity Pools" value={r?.metrics.poolsChecked ?? 32} runId={runId} />
              <Metric
                label="Confidence"
                value={r?.metrics.confidence ?? 97}
                suffix="%"
                runId={runId}
              />
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
                <FieldLabel>Est. Savings</FieldLabel>
                <div className="mt-1.5 text-xl font-semibold tracking-tight text-signal">
                  {formatUSD(r?.metrics.estSavings ?? preview.savingsAbs)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
                <FieldLabel>Settlement Speed</FieldLabel>
                <div className="mt-1.5 text-xl font-semibold tracking-tight text-white">
                  {r?.metrics.settlementSpeed ?? preview.eta}
                </div>
              </div>
              <Metric label="Routes Compared" value={6} runId={runId} />
            </div>
          </div>

          {/* Security panel */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <FieldLabel>Security</FieldLabel>
            <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {SECURITY_CHECKS.map((c, i) => (
                <motion.li
                  key={c}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-3.5 py-2.5"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-signal/15 text-[0.65rem] text-signal">
                    ✓
                  </span>
                  <span className="text-sm text-white/80">{c}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Investor Mode */}
        <AnimatePresence>
          {investor && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-5 rounded-4xl border border-cyan/20 bg-cyan/[0.03] p-6 sm:p-8">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-rail" />
                  <FieldLabel>Investor Mode · Full Decision Trace</FieldLabel>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <InvestorCard title="Route Logic">
                    <ul className="space-y-2">
                      {(r ?? preview).investor.routeLogic.map((l, i) => (
                        <li key={i} className="flex gap-2 text-sm text-white/65">
                          <span className="text-cyan">→</span>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </InvestorCard>

                  <InvestorCard title="Cost Breakdown">
                    <dl className="space-y-2">
                      {(r ?? preview).investor.costBreakdown.map((c) => (
                        <div key={c.label} className="flex items-center justify-between text-sm">
                          <dt className="text-white/50">{c.label}</dt>
                          <dd className="font-mono text-white">{c.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </InvestorCard>

                  <InvestorCard title="Fee Comparison">
                    <ul className="space-y-2">
                      {(r ?? preview).investor.feeComparison.map((f) => (
                        <li key={f.rail} className="flex items-center justify-between text-sm">
                          <span className={cn("flex items-center gap-2", f.best ? "text-signal" : "text-white/55")}>
                            {f.best && <span className="text-[0.6rem]">●</span>}
                            {f.rail}
                          </span>
                          <span className="font-mono text-white/80">{formatUSD(f.fee)}</span>
                        </li>
                      ))}
                    </ul>
                  </InvestorCard>

                  <InvestorCard title="Settlement Analysis">
                    <p className="text-sm leading-relaxed text-white/65">
                      {(r ?? preview).investor.settlementAnalysis}
                    </p>
                  </InvestorCard>

                  <InvestorCard title="AI Reasoning">
                    <p className="text-sm leading-relaxed text-white/65">
                      {(r ?? preview).investor.aiReasoning}
                    </p>
                  </InvestorCard>

                  <InvestorCard title="Network Decisions">
                    <ul className="space-y-2">
                      {(r ?? preview).investor.networkDecisions.map((d, i) => (
                        <li key={i} className="text-sm">
                          <span
                            className={cn(
                              "mr-2 rounded px-1.5 py-0.5 font-mono text-[0.6rem] uppercase",
                              d.status === "selected"
                                ? "bg-signal/15 text-signal"
                                : "bg-white/5 text-white/40"
                            )}
                          >
                            {d.status}
                          </span>
                          <span className="text-white/70">{d.network}</span>
                          <span className="text-white/40"> — {d.reason}</span>
                        </li>
                      ))}
                    </ul>
                  </InvestorCard>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  suffix = "",
  runId,
}: {
  label: string;
  value: number;
  suffix?: string;
  runId: number;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3.5">
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1.5 text-xl font-semibold tracking-tight text-white">
        <Counter key={`${label}-${runId}`} value={value} suffix={suffix} duration={1100} />
      </div>
    </div>
  );
}

function InvestorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
      <h4 className="mb-3 text-sm font-semibold text-white">{title}</h4>
      {children}
    </div>
  );
}
