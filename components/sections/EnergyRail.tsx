"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const STAGES = ["Generation", "Grid", "IoT Meter", "Tokenized kWh", "Settlement"];
// Illustrative: tokenized kWh price.
const PRICE_PER_KWH = 0.14;

export function EnergyRail() {
  const [amount, setAmount] = useState(500);
  const [pct, setPct] = useState(40);
  const [confirmed, setConfirmed] = useState(false);

  const energyUsd = (amount * pct) / 100;
  const kwh = Math.round((energyUsd / PRICE_PER_KWH) * 10) / 10;

  return (
    <section id="energy" className="relative section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Energy Rails · Patent Pending"
          title="Settle in electrons, not just dollars."
          description="Part of any payment can ride on real electricity — converted into tokenized kWh backed by production data. Settlement clears only when IoT meters confirm the energy was generated."
        />

        {/* Pipeline */}
        <div className="glass mt-12 rounded-4xl p-6 sm:p-10">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            {STAGES.map((s, i) => {
              const reached = !confirmed ? i <= 2 : true;
              const isMeter = i === 2;
              return (
                <div key={s} className="flex flex-1 items-center gap-3">
                  <div
                    className={cn(
                      "flex-1 rounded-2xl border px-4 py-4 text-center transition-colors",
                      reached
                        ? "border-rail-500/40 bg-rail-500/[0.06]"
                        : "border-white/8 bg-white/[0.02]"
                    )}
                  >
                    <div className="font-mono text-[0.58rem] uppercase tracking-widest text-white/40">
                      Stage {i + 1}
                    </div>
                    <div
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        reached ? "text-white" : "text-white/45"
                      )}
                    >
                      {s}
                    </div>
                    {isMeter && (
                      <div
                        className={cn(
                          "mt-1 font-mono text-[0.6rem]",
                          confirmed ? "text-signal" : "text-amber-400/80"
                        )}
                      >
                        {confirmed ? "✓ verified" : "awaiting"}
                      </div>
                    )}
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className="relative hidden h-px w-6 shrink-0 bg-white/10 sm:block">
                      <motion.span
                        className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-rail-400 shadow-glow"
                        animate={
                          reached ? { left: ["0%", "100%"], opacity: [0, 1, 0] } : { opacity: 0 }
                        }
                        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls + readout */}
        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="glass rounded-4xl p-6 sm:p-8">
            <div>
              <Label>Payment amount</Label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl font-semibold text-white/40">$</span>
                <input
                  type="number"
                  value={amount}
                  min={1}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-transparent text-xl font-semibold text-white outline-none"
                />
              </div>
            </div>
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Label>Share on energy rail</Label>
                <span className="font-mono text-sm text-rail-gradient">{pct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={pct}
                onChange={(e) => setPct(Number(e.target.value))}
                className="mt-3 w-full accent-rail-500"
              />
            </div>
            <button
              onClick={() => setConfirmed((v) => !v)}
              className={cn(
                "mt-7 rounded-full px-6 py-3 text-sm font-semibold transition-all",
                confirmed
                  ? "border border-rail-500/40 bg-rail-500/10 text-rail-400"
                  : "bg-rail-500 text-void hover:shadow-glow"
              )}
            >
              {confirmed ? "✓ Generation confirmed" : "Confirm generation (IoT) →"}
            </button>
          </div>

          <div className="glass flex flex-col justify-center rounded-4xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4">
              <Stat label="On energy rail" value={`$${energyUsd.toFixed(2)}`} />
              <Stat label="Tokenized" value={`${kwh} kWh`} accent />
              <Stat label="On fiat/crypto" value={`$${(amount - energyUsd).toFixed(2)}`} />
              <Stat
                label="Settlement"
                value={confirmed ? "Cleared" : "Held"}
                accent={confirmed}
              />
            </div>
            <AnimatePresence>
              {confirmed && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-5 rounded-2xl border border-signal/25 bg-signal/[0.06] p-4 text-sm text-white/75"
                >
                  Meter confirmed {kwh} kWh generated — settlement released against
                  verified production. Energy became money.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">
      {children}
    </span>
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
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
      <Label>{label}</Label>
      <div
        className={cn(
          "mt-1 text-lg font-semibold tracking-tight",
          accent ? "text-rail-gradient" : "text-white"
        )}
      >
        {value}
      </div>
    </div>
  );
}
