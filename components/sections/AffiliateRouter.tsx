"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import {
  ASSETS,
  PAYMENT_METHODS,
  computeRoute,
  formatUSD,
  type Asset,
  type PaymentMethod,
} from "@/lib/aero";
import { matchProviders, type ProviderMatch } from "@/lib/providers";
import { track, fetchLiveFees } from "@/lib/track";
import type { NetworkId } from "@/lib/aero";
import { cn } from "@/lib/utils";

interface Outcome {
  network: string;
  eta: string;
  legacy: number;
  loadit: number;
  savings: number;
  savingsPct: number;
  providers: ProviderMatch[];
  live: boolean;
}

export function AffiliateRouter() {
  const [method, setMethod] = useState<PaymentMethod>("Debit Card");
  const [asset, setAsset] = useState<Asset>("USDC");
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<Outcome | null>(null);

  const run = async () => {
    setLoading(true);
    setOut(null);
    const live = await fetchLiveFees();
    const r = computeRoute({
      paymentMethod: method,
      asset,
      amount,
      wallet: "",
      preferred: "auto",
      feeOverrides: live?.fees as Partial<Record<NetworkId, number>> | undefined,
    });
    setOut({
      network: r.network.name,
      eta: r.eta,
      legacy: r.legacyFee,
      loadit: r.loaditFee,
      savings: r.savingsAbs,
      savingsPct: r.savingsPct,
      providers: matchProviders(method, asset),
      live: Boolean(live?.live),
    });
    setLoading(false);
    track("route_computed", { method, asset, amount, savings: r.savingsAbs });
  };

  return (
    <section id="compare" className="relative bg-black section-py">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Loadit Router · Free"
          title="The cheapest way to move your money."
          description="Tell us what you're moving. AERO scores every network and on-ramp in real time, shows you exactly how much you'd save versus the old way, and routes you to the best provider to finish the job."
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          {/* input */}
          <div className="glass rounded-4xl p-6 sm:p-8">
            <Label>Paying with</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((m) => (
                <Chip key={m} active={method === m} onClick={() => setMethod(m)}>{m}</Chip>
              ))}
            </div>
            <div className="mt-5">
              <Label>You want</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {ASSETS.map((a) => (
                  <Chip key={a.id} active={asset === a.id} onClick={() => setAsset(a.id)}>{a.id}</Chip>
                ))}
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <Label>Amount (USD)</Label>
                <span className="font-mono text-sm text-white">${amount.toLocaleString()}</span>
              </div>
              <input
                type="range" min={20} max={10000} step={20} value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-3 w-full accent-rail-500"
              />
            </div>
            <button
              onClick={run} disabled={loading}
              className="mt-6 w-full rounded-full bg-rail-500 px-6 py-3.5 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
            >
              {loading ? "Scanning networks…" : "Find the cheapest route →"}
            </button>
          </div>

          {/* results */}
          <div className="glass relative flex min-h-[460px] flex-col overflow-hidden rounded-4xl p-6 sm:p-8">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="m-auto text-center">
                  <div className="mx-auto h-12 w-12 animate-spin-slow rounded-full border-2 border-white/10 border-t-rail-400" />
                  <p className="mt-4 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Comparing 14 networks &amp; on-ramps</p>
                </motion.div>
              )}

              {!loading && !out && (
                <motion.div key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="m-auto max-w-sm text-center text-sm text-white/45">
                  Pick how you&apos;re paying and what you want. We&apos;ll show your savings and the best place to complete the move.
                </motion.div>
              )}

              {!loading && out && (
                <motion.div key="r" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full">
                  {/* savings headline */}
                  <div className="rounded-3xl border border-rail-500/30 bg-rail-500/[0.07] p-5 text-center">
                    <div className="flex items-center justify-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-rail-400">
                      You save vs. the old way
                      {out.live && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-signal/10 px-2 py-0.5 text-signal">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal" /> live fees
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-4xl font-semibold tracking-tight text-rail-gradient">
                      {formatUSD(out.savings)}
                    </div>
                    <div className="mt-1 text-xs text-white/50">
                      {formatUSD(out.legacy)} → <span className="text-white">{formatUSD(out.loadit)}</span> · {out.savingsPct}% cheaper · settles in {out.eta} on {out.network}
                    </div>
                  </div>

                  {/* providers */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-white/40">Complete your move with</span>
                    </div>
                    <div className="space-y-2.5">
                      {out.providers.length === 0 && (
                        <p className="text-sm text-white/45">No partner matches that exact combo yet — try a different asset or funding method.</p>
                      )}
                      {out.providers.map((p, i) => (
                        <a
                          key={p.id}
                          href={p.needsSetup ? undefined : p.href}
                          target="_blank"
                          rel="sponsored nofollow noopener noreferrer"
                          onClick={(e) => {
                            if (p.needsSetup) {
                              e.preventDefault();
                              return;
                            }
                            track("provider_click", { provider: p.id, asset, method, amount });
                          }}
                          className={cn(
                            "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                            i === 0
                              ? "border-rail-500/35 bg-rail-500/[0.05] hover:bg-rail-500/[0.09]"
                              : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]",
                            p.needsSetup && "cursor-not-allowed opacity-70"
                          )}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{p.name}</span>
                              {i === 0 && (
                                <span className="rounded-full bg-rail-500/15 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-rail-400">Best match</span>
                              )}
                              <span className="font-mono text-[0.55rem] uppercase tracking-wider text-white/35">{p.kind}</span>
                            </div>
                            <p className="mt-0.5 text-xs text-white/50">{p.blurb}</p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white">
                            {p.needsSetup ? "Set ref" : "Continue →"}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <p className="mt-4 text-[0.7rem] leading-relaxed text-white/30">
                    Loadit may earn a commission when you sign up through these links, at no extra cost to you. Routing figures are estimates that depend on live network and market conditions.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-white/40">{children}</span>;
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-xl border px-2 py-2 text-xs transition-all sm:text-sm",
        active ? "border-rail-500/40 bg-rail-500/10 text-white" : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
      )}
    >
      {children}
    </button>
  );
}
