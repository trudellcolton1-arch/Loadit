"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const hx = (n: number) =>
  Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const auditHash = () => `0x${hx(4)}…${hx(6)}`;
const nowTime = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false });

type Tab = "rate" | "gas" | "conditional";
const TABS: { id: Tab; label: string }[] = [
  { id: "rate", label: "Lock Rate" },
  { id: "gas", label: "Gas Window" },
  { id: "conditional", label: "Conditional" },
];

interface AuditEntry {
  id: number;
  time: string;
  label: string;
  hash: string;
}

/* -------------------------------------------------------------------------- */
/*  Section                                                                    */
/* -------------------------------------------------------------------------- */

export function TemporalVault() {
  const [tab, setTab] = useState<Tab>("rate");
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const idRef = useRef(0);

  const log = (label: string) =>
    setEntries((p) =>
      [{ id: idRef.current++, time: nowTime(), label, hash: auditHash() }, ...p].slice(0, 5)
    );

  // Seed + heartbeat anchoring.
  useEffect(() => {
    log("Audit chain initialized");
    const id = setInterval(() => log("Audit anchor written"), 5000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 24h settlement countdown.
  const [secs, setSecs] = useState(24 * 3600 - 47);
  useEffect(() => {
    const id = setInterval(() => setSecs((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const hhmmss = useMemo(() => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
  }, [secs]);

  return (
    <section id="temporal" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Temporal Settlement · Patent Pending"
          title="Trade on time, not just price."
          description="Decouple initiation from settlement: lock today's rate, target tomorrow's cheapest gas window, or release on a verified future condition — every step on a cryptographic audit trail."
        />

        {/* Tabs */}
        <div className="mx-auto mt-10 flex max-w-md gap-1.5 rounded-full border border-white/10 bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-full px-3 py-2 text-xs transition-all sm:text-sm",
                tab === t.id
                  ? "border border-rail-500/30 bg-rail-500/15 text-white"
                  : "border border-transparent text-white/55 hover:text-white"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Interactive panel */}
          <div className="glass min-h-[380px] rounded-4xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {tab === "rate" && <LockRate key="rate" log={log} />}
              {tab === "gas" && <GasWindow key="gas" log={log} />}
              {tab === "conditional" && <Conditional key="cond" log={log} />}
            </AnimatePresence>
          </div>

          {/* Vault + audit */}
          <div className="flex flex-col gap-5">
            <div className="glass relative overflow-hidden rounded-4xl p-6 sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(34,169,92,0.18), transparent 70%)" }}
              />
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="grid h-11 w-11 place-items-center rounded-2xl border border-rail-500/30 bg-rail-500/10"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                    <rect x="4" y="10" width="16" height="10" rx="2" stroke="#34D17A" strokeWidth="1.5" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="#34D17A" strokeWidth="1.5" />
                  </svg>
                </motion.div>
                <div>
                  <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                    Settlement Vault
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Non-custodial escrow
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                  Settles in
                </div>
                <div className="mt-1 font-mono text-3xl font-semibold tracking-tight text-rail-gradient">
                  {hhmmss}
                </div>
                <p className="mt-2 text-xs text-white/45">
                  Initiation and settlement are decoupled. Funds release only when
                  your temporal condition is met — verifiably, never early.
                </p>
              </div>
            </div>

            {/* Cryptographic audit trail */}
            <div className="glass rounded-4xl p-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">
                  Cryptographic Audit
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-rail-400">
                  <span className="h-1 w-1 rounded-full bg-rail-400 animate-pulse-rail" />
                  anchored
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                <AnimatePresence initial={false}>
                  {entries.map((e) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-between gap-3 font-mono text-[0.72rem]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="text-white/35">{e.time}</span>
                        <span className="truncate text-white/70">{e.label}</span>
                      </span>
                      <span className="shrink-0 text-rail-400/80">{e.hash}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Lock Rate                                                             */
/* -------------------------------------------------------------------------- */

function LockRate({ log }: { log: (s: string) => void }) {
  const [market, setMarket] = useState(118240);
  const [locked, setLocked] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(
      () => setMarket((m) => Math.round(m + (Math.random() - 0.48) * 140)),
      900
    );
    return () => clearInterval(id);
  }, []);

  const delta = locked != null ? locked - market : 0;
  const protectedPct = locked ? Math.abs((delta / locked) * 100).toFixed(2) : "0.00";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Heading sub="Freeze today's rate for a future settlement. If the market moves against you, the locked rate holds.">
        Lock Rate · BTC / USD
      </Heading>

      <div className="mt-7 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-5">
          <Label>Live market</Label>
          <div className="mt-1 font-mono text-2xl font-semibold tracking-tight text-white">
            ${market.toLocaleString()}
          </div>
        </div>
        <div
          className={cn(
            "rounded-2xl border p-5 transition-colors",
            locked != null
              ? "border-rail-500/40 bg-rail-500/[0.07]"
              : "border-white/8 bg-white/[0.02]"
          )}
        >
          <Label>{locked != null ? "Locked rate" : "Not locked"}</Label>
          <div className="mt-1 font-mono text-2xl font-semibold tracking-tight text-rail-gradient">
            {locked != null ? `$${locked.toLocaleString()}` : "—"}
          </div>
        </div>
      </div>

      {locked != null && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-sm"
        >
          <span className="text-white/50">Protection vs. market drift</span>
          <span className={delta >= 0 ? "text-signal" : "text-amber-400"}>
            {delta >= 0 ? "+" : ""}
            ${Math.abs(delta).toLocaleString()} · {protectedPct}%
          </span>
        </motion.div>
      )}

      <div className="mt-6 flex gap-3">
        {locked == null ? (
          <button
            onClick={() => {
              setLocked(market);
              log(`Rate locked @ $${market.toLocaleString()}`);
            }}
            className="rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow"
          >
            Lock this rate →
          </button>
        ) : (
          <button
            onClick={() => {
              setLocked(null);
              log("Rate lock released");
            }}
            className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/80 transition-colors hover:bg-white/5"
          >
            Release lock
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Gas Window                                                            */
/* -------------------------------------------------------------------------- */

function GasWindow({ log }: { log: (s: string) => void }) {
  const bars = useMemo(() => {
    // Lower gas overnight, peaks midday — convincing 24h curve.
    return Array.from({ length: 24 }, (_, h) => {
      const peak = 14 + 22 * Math.max(0, Math.sin(((h - 6) / 24) * Math.PI * 2));
      return Math.round(peak + Math.random() * 6);
    });
  }, []);
  const min = Math.min(...bars);
  const max = Math.max(...bars);
  const optimal = bars.indexOf(min);
  const peak = bars.indexOf(max);
  const savedPct = Math.round((1 - min / max) * 100);
  const [targeted, setTargeted] = useState(false);
  const fmtHr = (h: number) => `${String(h).padStart(2, "0")}:00 UTC`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Heading sub="AERO forecasts network gas across the next 24 hours and schedules settlement for the cheapest window.">
        Gas Window · next 24h
      </Heading>

      <div className="relative mt-7 flex h-40 items-end gap-1">
        {bars.map((v, h) => {
          const isOpt = h === optimal;
          const isPeak = h === peak;
          return (
            <div key={h} className="group relative flex-1">
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: `${(v / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ delay: h * 0.015, duration: 0.5 }}
                className={cn(
                  "w-full rounded-t",
                  isOpt
                    ? "bg-rail-gradient shadow-glow"
                    : isPeak
                      ? "bg-amber-400/70"
                      : "bg-white/12"
                )}
                style={{ minHeight: 4 }}
              />
            </div>
          );
        })}
        {/* sweep */}
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-px bg-cyan/60"
          animate={{ left: ["0%", "100%"] }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Tile label="Cheapest window" value={fmtHr(optimal)} accent="green" />
        <Tile label="Below peak" value={`${savedPct}%`} accent="green" />
        <Tile label="Peak gas" value={`${max} gwei`} accent="amber" />
      </div>

      <button
        onClick={() => {
          setTargeted(true);
          log(`Settlement scheduled · ${fmtHr(optimal)} (${savedPct}% below peak)`);
        }}
        className={cn(
          "mt-6 rounded-full px-6 py-3 text-sm font-semibold transition-all",
          targeted
            ? "border border-rail-500/40 bg-rail-500/10 text-rail-400"
            : "bg-rail-500 text-void hover:shadow-glow"
        )}
      >
        {targeted ? `✓ Targeting ${fmtHr(optimal)}` : "Target cheapest window →"}
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tab: Conditional Release                                                   */
/* -------------------------------------------------------------------------- */

const CONDITIONS = [
  "Delivery confirmed (signed)",
  "BTC > $120,000",
  "Grid kWh verified (IoT oracle)",
  "Invoice approved by payer",
];

function Conditional({ log }: { log: (s: string) => void }) {
  const [cond, setCond] = useState(CONDITIONS[0]);
  const [met, setMet] = useState(false);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Heading sub="Bind settlement to a verified future event. Value sits in non-custodial escrow and releases the instant the condition is cryptographically confirmed.">
        Conditional Release
      </Heading>

      <div className="mt-7">
        <Label>Release when</Label>
        <select
          value={cond}
          onChange={(e) => {
            setCond(e.target.value);
            setMet(false);
          }}
          className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none focus:border-rail-400/50"
        >
          {CONDITIONS.map((c) => (
            <option key={c} value={c} className="bg-surface">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "mt-5 flex items-center gap-3 rounded-2xl border p-5 transition-colors",
          met ? "border-rail-500/40 bg-rail-500/[0.07]" : "border-white/8 bg-white/[0.02]"
        )}
      >
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-full",
            met ? "bg-rail-500/20 text-rail-400" : "bg-white/5 text-white/50"
          )}
        >
          {met ? "✓" : <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />}
        </span>
        <div>
          <div className="text-sm font-medium text-white">
            {met ? "Condition met · settlement released" : "Escrow armed · awaiting confirmation"}
          </div>
          <div className="font-mono text-xs text-white/45">{cond}</div>
        </div>
      </div>

      <button
        onClick={() => {
          if (met) {
            setMet(false);
            log("Escrow re-armed");
          } else {
            setMet(true);
            log(`Condition confirmed · released (${cond})`);
          }
        }}
        className={cn(
          "mt-6 rounded-full px-6 py-3 text-sm font-semibold transition-all",
          met
            ? "border border-white/15 text-white/80 hover:bg-white/5"
            : "bg-rail-500 text-void hover:shadow-glow"
        )}
      >
        {met ? "Reset" : "Simulate confirmation →"}
      </button>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Shared bits                                                                */
/* -------------------------------------------------------------------------- */

function Heading({ children, sub }: { children: React.ReactNode; sub: string }) {
  return (
    <div>
      <h3 className="text-xl font-semibold tracking-tight text-white">{children}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/45">{sub}</p>
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
      {children}
    </span>
  );
}
function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <Label>{label}</Label>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight",
          accent === "green" && "text-rail-gradient",
          accent === "amber" && "text-amber-400",
          !accent && "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}
