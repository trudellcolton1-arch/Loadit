"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Markets                                                                    */
/* -------------------------------------------------------------------------- */

type Market = "lock" | "gas" | "cond";
const MARKETS: { id: Market; label: string }[] = [
  { id: "lock", label: "Rate Locks" },
  { id: "gas", label: "Gas Futures" },
  { id: "cond", label: "Conditional" },
];

const PAIRS = [
  { id: "BTC/USD", spot: 118240, dp: 0 },
  { id: "ETH/USD", spot: 4210, dp: 0 },
  { id: "USD/MXN", spot: 17.05, dp: 2 },
] as const;

const DURATIONS = [
  { id: "1D", label: "1 Day", f: 0.004 },
  { id: "7D", label: "7 Days", f: 0.009 },
  { id: "30D", label: "30 Days", f: 0.018 },
] as const;

const GAS_NETS = ["Solana", "Base", "Ethereum"] as const;
const CONDITIONS = [
  "BTC > $120,000",
  "Delivery confirmed",
  "Grid kWh verified",
  "USD/MXN < 17.00",
] as const;

const fmt = (n: number, dp = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

interface Position {
  id: number;
  market: Market;
  label: string;
  notional: number;
  premium: number;
  mark: number; // synthetic mark % for gas/conditional
  pairIdx?: number; // for rate locks → live P&L from the pair
  entry?: number; // entry spot at open
}

/* -------------------------------------------------------------------------- */

export function TemporalExchange() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10%" });

  const [market, setMarket] = useState<Market>("lock");
  const [spots, setSpots] = useState(PAIRS.map((p) => p.spot));
  const [balance, setBalance] = useState(25000);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<{ id: number; t: string }[]>([]);
  const [deposit, setDeposit] = useState(false);
  const [live, setLive] = useState(false);
  const [dirs, setDirs] = useState<boolean[]>([]);
  const idRef = useRef(0);
  const spotsRef = useRef(spots);
  useEffect(() => {
    spotsRef.current = spots;
  }, [spots]);

  // order inputs
  const [pairIdx, setPairIdx] = useState(0);
  const [durIdx, setDurIdx] = useState(1);
  const [gasNet, setGasNet] = useState<(typeof GAS_NETS)[number]>("Solana");
  const [cond, setCond] = useState<(typeof CONDITIONS)[number]>(CONDITIONS[0]);
  const [notional, setNotional] = useState(2500);

  // Real live prices — fetch on mount, then poll while in view.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const r = await fetch("/api/prices");
        const d = await r.json();
        if (cancelled || !d?.ok) return;
        const prev = spotsRef.current;
        const next = PAIRS.map((p, i) =>
          d.prices[p.id] != null ? d.prices[p.id] : prev[i]
        );
        setDirs(next.map((v, i) => v >= prev[i]));
        setSpots(next);
        setLive(true);
      } catch {
        /* keep last known */
      }
    };
    load();
    if (!inView) return;
    const id = setInterval(load, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [inView]);

  // Synthetic marks for gas/conditional positions + live trade tape.
  useEffect(() => {
    if (!inView) return;
    const id = setInterval(() => {
      setPositions((ps) =>
        ps.map((p) =>
          p.market === "lock" ? p : { ...p, mark: p.mark + (Math.random() - 0.49) * 0.004 }
        )
      );
      if (Math.random() < 0.7) {
        const p = PAIRS[Math.floor(Math.random() * PAIRS.length)].id;
        const d = DURATIONS[Math.floor(Math.random() * 3)].id;
        const amt = [500, 1000, 2500, 5000, 10000][Math.floor(Math.random() * 5)];
        const kinds = [
          `LOCK ${p} · ${d} · $${fmt(amt, 0)}`,
          `GAS ${GAS_NETS[Math.floor(Math.random() * 3)]} · $${fmt(amt, 0)}`,
          `COND ${CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]} · $${fmt(amt, 0)}`,
        ];
        setTrades((t) =>
          [
            { id: idRef.current++, t: kinds[Math.floor(Math.random() * kinds.length)] },
            ...t,
          ].slice(0, 7)
        );
      }
    }, 1500);
    return () => clearInterval(id);
  }, [inView]);

  const pnlOf = (p: Position) =>
    p.market === "lock" && p.pairIdx != null && p.entry
      ? p.notional * ((spots[p.pairIdx] - p.entry) / p.entry)
      : p.notional * p.mark;

  // Quote the premium for the current order.
  const premium = (() => {
    if (market === "lock") return notional * DURATIONS[durIdx].f;
    if (market === "gas") return Math.max(0.5, notional * 0.0025);
    return notional * 0.006;
  })();

  const orderLabel = (() => {
    if (market === "lock") return `Lock ${PAIRS[pairIdx].id} · ${DURATIONS[durIdx].label}`;
    if (market === "gas") return `Gas Future · ${gasNet} · cheapest window`;
    return `Conditional · ${cond}`;
  })();

  const place = () => {
    if (premium > balance) {
      setDeposit(true);
      return;
    }
    setBalance((b) => b - premium);
    setPositions((p) => [
      {
        id: idRef.current++,
        market,
        label: orderLabel,
        notional,
        premium,
        mark: 0,
        ...(market === "lock" ? { pairIdx, entry: spots[pairIdx] } : {}),
      },
      ...p,
    ]);
    setTrades((t) =>
      [{ id: idRef.current++, t: `YOU · ${orderLabel} · $${fmt(notional, 0)}` }, ...t].slice(0, 7)
    );
  };

  const close = (id: number) => {
    setPositions((ps) => {
      const pos = ps.find((p) => p.id === id);
      if (pos) setBalance((b) => b + pos.premium + pnlOf(pos));
      return ps.filter((p) => p.id !== id);
    });
  };

  const portfolioPnl = positions.reduce((s, p) => s + pnlOf(p), 0);

  return (
    <section id="exchange" className="relative bg-black section-py" ref={ref}>
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Temporal Exchange · World First"
          title="Trade time, not just price."
          description="The first market for the timing and conditions of settlement. Lock today's rate, buy tomorrow's cheapest gas window, or sell a conditional release — powered by Loadit's patented temporal settlement."
        />

        {/* spot ticker — real live prices */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-3 font-mono text-sm">
          <span
            className={cn(
              "flex items-center gap-1.5 text-[0.6rem] uppercase tracking-widest",
              live ? "text-rail-400" : "text-white/40"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                live ? "bg-rail-400 animate-pulse-rail" : "bg-white/30"
              )}
            />
            {live ? "Live" : "Connecting"}
          </span>
          {PAIRS.map((p, i) => {
            const up = dirs[i] ?? true;
            return (
              <span key={p.id} className="flex items-center gap-2">
                <span className="text-white/45">{p.id}</span>
                <span className="text-white">{fmt(spots[i], p.dp)}</span>
                <span className={up ? "text-rail-400" : "text-red-400"}>
                  {up ? "▲" : "▼"}
                </span>
              </span>
            );
          })}
        </div>

        {/* balance bar */}
        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-3xl border border-rail-500/20 bg-rail-500/[0.04] p-5 sm:flex-row sm:p-6">
          <div className="flex items-center gap-8">
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
                Balance
              </div>
              <div className="font-mono text-2xl font-semibold text-white">
                ${fmt(balance)}
              </div>
            </div>
            <div>
              <div className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
                Open P&L
              </div>
              <div
                className={cn(
                  "font-mono text-2xl font-semibold",
                  portfolioPnl >= 0 ? "text-rail-gradient" : "text-red-400"
                )}
              >
                {portfolioPnl >= 0 ? "+" : "−"}${fmt(Math.abs(portfolioPnl))}
              </div>
            </div>
          </div>
          <button
            onClick={() => setDeposit(true)}
            className="rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
          >
            + Add Funds
          </button>
        </div>

        {/* markets */}
        <div className="mx-auto mt-6 flex max-w-md gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {MARKETS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMarket(m.id)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-xs transition-all sm:text-sm",
                market === m.id
                  ? "border border-rail-500/30 bg-rail-500/15 text-white"
                  : "border border-transparent text-white/55 hover:text-white"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          {/* order panel */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
              New position
            </span>

            <div className="mt-5 space-y-5">
              {market === "lock" && (
                <>
                  <Field label="Pair">
                    <div className="grid grid-cols-3 gap-2">
                      {PAIRS.map((p, i) => (
                        <Chip key={p.id} active={pairIdx === i} onClick={() => setPairIdx(i)}>
                          {p.id}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="Lock duration">
                    <div className="grid grid-cols-3 gap-2">
                      {DURATIONS.map((d, i) => (
                        <Chip key={d.id} active={durIdx === i} onClick={() => setDurIdx(i)}>
                          {d.label}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                </>
              )}
              {market === "gas" && (
                <Field label="Network">
                  <div className="grid grid-cols-3 gap-2">
                    {GAS_NETS.map((n) => (
                      <Chip key={n} active={gasNet === n} onClick={() => setGasNet(n)}>
                        {n}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}
              {market === "cond" && (
                <Field label="Release condition">
                  <select
                    value={cond}
                    onChange={(e) => setCond(e.target.value as (typeof CONDITIONS)[number])}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-rail-400/50"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c} value={c} className="bg-surface">
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Notional (USD)">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                  <span className="text-lg font-semibold text-white/40">$</span>
                  <input
                    type="number"
                    value={notional}
                    min={100}
                    onChange={(e) => setNotional(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-semibold text-white outline-none"
                  />
                </div>
              </Field>

              <div className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm">
                <span className="text-white/50">Premium</span>
                <span className="font-mono font-semibold text-rail-gradient">
                  ${fmt(premium)}
                </span>
              </div>

              <button
                onClick={place}
                className="w-full rounded-full bg-rail-500 px-6 py-3.5 text-sm font-semibold text-void transition-all hover:shadow-glow"
              >
                Open position · {orderLabel}
              </button>
            </div>
          </div>

          {/* positions + trades */}
          <div className="space-y-5">
            <div className="glass rounded-4xl p-6 sm:p-8">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                Your positions
              </span>
              <div className="mt-4 space-y-2.5">
                {positions.length === 0 && (
                  <p className="text-sm text-white/40">No open positions yet. Open one to start.</p>
                )}
                <AnimatePresence initial={false}>
                  {positions.map((p) => {
                    const pnl = pnlOf(p);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-white">{p.label}</div>
                          <div className="font-mono text-[0.7rem] text-white/40">
                            ${fmt(p.notional, 0)} notional · ${fmt(p.premium)} premium
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "font-mono text-sm font-semibold",
                              pnl >= 0 ? "text-rail-400" : "text-red-400"
                            )}
                          >
                            {pnl >= 0 ? "+" : "−"}${fmt(Math.abs(pnl))}
                          </span>
                          <button
                            onClick={() => close(p.id)}
                            className="rounded-full border border-white/12 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-white/5"
                          >
                            Close
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div className="glass rounded-4xl p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                  Live tape
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                  <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />
                  streaming
                </span>
              </div>
              <div className="mt-4 space-y-2 font-mono text-[0.76rem]">
                <AnimatePresence initial={false}>
                  {trades.map((t) => (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className={cn(t.t.startsWith("YOU") ? "text-rail-400" : "text-white/55")}
                    >
                      {t.t}
                    </motion.div>
                  ))}
                  {trades.length === 0 && <p className="text-white/30">Awaiting flow…</p>}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-white/30">
          Live simulation for demonstration. Temporal contracts shown here are not
          financial advice or live financial instruments. Funding and settlement go
          live once provider keys and the required compliance are connected.
        </p>
      </div>

      <DepositModal open={deposit} onClose={() => setDeposit(false)} />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Deposit modal                                                              */
/* -------------------------------------------------------------------------- */

function DepositModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(100);
  const [providers, setProviders] = useState<Record<string, boolean> | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMsg("");
    fetch("/api/funding")
      .then((r) => r.json())
      .then((d) => setProviders(d.providers))
      .catch(() => setProviders({}));
  }, [open]);

  const fund = async (provider: string) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/funding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, amount }),
      });
      const data = await res.json();
      if (data?.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data?.ok && data.address) {
        setMsg(`Send to: ${data.address}`);
      } else {
        setMsg(
          `${provider[0].toUpperCase() + provider.slice(1)} isn't connected yet. Add its API key in Vercel to enable real deposits.`
        );
      }
    } catch {
      setMsg("Couldn't start the deposit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const OPTS = [
    { id: "stripe", label: "Card · Stripe", desc: "Debit / credit via Stripe" },
    { id: "coinbase", label: "Crypto · Coinbase", desc: "Pay with crypto via Coinbase" },
    { id: "crypto", label: "Self-custody wallet", desc: "Send on-chain" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-void/80 backdrop-blur-xl" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass relative w-full max-w-md rounded-4xl p-6 sm:p-8"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full text-white/60 hover:bg-white/5 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold tracking-tight text-white">Add funds</h3>
            <p className="mt-1.5 text-sm text-white/45">
              Fund your Loadit balance to trade temporal contracts.
            </p>

            <div className="mt-6">
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
                Amount (USD)
              </span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="text-xl font-semibold text-white/40">$</span>
                <input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-semibold text-white outline-none"
                />
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {OPTS.map((o) => {
                const live = providers?.[o.id];
                return (
                  <button
                    key={o.id}
                    onClick={() => fund(o.id)}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3.5 text-left transition-colors hover:border-white/15 disabled:opacity-60"
                  >
                    <span>
                      <span className="block text-sm font-medium text-white">{o.label}</span>
                      <span className="block text-xs text-white/40">{o.desc}</span>
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-widest",
                        live ? "bg-rail-500/15 text-rail-400" : "bg-white/5 text-white/40"
                      )}
                    >
                      {live ? "live" : "demo"}
                    </span>
                  </button>
                );
              })}
            </div>

            {msg && <p className="mt-4 break-words text-xs text-amber-400/90">{msg}</p>}

            <p className="mt-5 text-[0.7rem] leading-relaxed text-white/30">
              Deposits are processed by your connected provider (Stripe / Coinbase).
              Loadit is non-custodial. Real funding requires provider keys and the
              applicable compliance to be in place.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </div>
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
