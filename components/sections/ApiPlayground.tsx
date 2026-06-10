"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { computeRoute, formatUSD, ASSETS, type Asset } from "@/lib/aero";

export function ApiPlayground() {
  const [amount, setAmount] = useState(500);
  const [asset, setAsset] = useState<Asset>("USDC");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<string | null>(null);

  // Local fallback if the live endpoint is unreachable, so the demo never breaks.
  const localRoute = () => {
    const r = computeRoute({
      paymentMethod: "Debit Card",
      asset,
      amount,
      wallet: "0xA1…f9",
      preferred: "auto",
    });
    return {
      ok: true,
      route: {
        network: r.network.name.toLowerCase(),
        amount_usd: amount,
        asset,
        loadit_fee_usd: r.loaditFee,
        savings_pct: r.savingsPct,
        eta: r.eta,
        confidence: r.confidence / 100,
        settlement: "non_custodial",
      },
      meta: { engine: "AERO", version: "v1" },
    };
  };

  // Hit the real public API (key: demo). This is the same endpoint customers call.
  const send = async () => {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/v1/route?key=demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount_usd: amount, asset, payment_method: "Debit Card", destination: "0xA1…f9" }),
      });
      const data = await r.json();
      setRes(JSON.stringify(data, null, 2));
    } catch {
      setRes(JSON.stringify(localRoute(), null, 2));
    } finally {
      setLoading(false);
    }
  };

  const reqBody = `{
  "amount_usd": ${amount},
  "asset": "${asset}",
  "destination": "0xA1…f9",
  "optimize": "auto"
}`;

  return (
    <section id="api" className="relative section-py border-t border-white/5">
      <div className="container-px mx-auto max-w-7xl">
        <SectionHeading
          align="center"
          eyebrow="Developers"
          title="Routing-as-an-API."
          description="The same AERO engine, one HTTP call. Build Loadit into any product — checkout, payroll, treasury, remittance."
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 lg:grid-cols-2">
          {/* request */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06080e]">
            <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
              <span className="rounded-md bg-rail-500/15 px-2 py-0.5 font-mono text-[0.62rem] font-semibold text-rail-400">
                POST
              </span>
              <span className="font-mono text-xs text-white/55">
                api.loadit.net/v1/route
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="font-mono text-[0.58rem] uppercase tracking-widest text-white/40">
                    amount_usd
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white outline-none focus:border-rail-400/50"
                  />
                </label>
                <label className="block">
                  <span className="font-mono text-[0.58rem] uppercase tracking-widest text-white/40">
                    asset
                  </span>
                  <select
                    value={asset}
                    onChange={(e) => setAsset(e.target.value as Asset)}
                    className="mt-1 w-full appearance-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 font-mono text-sm text-white outline-none focus:border-rail-400/50"
                  >
                    {ASSETS.map((a) => (
                      <option key={a.id} value={a.id} className="bg-surface">
                        {a.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/55">
                {reqBody}
              </pre>
              <button
                onClick={send}
                disabled={loading}
                className="w-full rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
              >
                {loading ? "Routing…" : "Send request →"}
              </button>
            </div>
          </div>

          {/* response */}
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06080e]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="font-mono text-xs text-white/55">Response</span>
              <span
                className={`font-mono text-[0.62rem] ${res ? "text-signal" : "text-white/35"}`}
              >
                {res ? "200 OK" : loading ? "···" : "—"}
              </span>
            </div>
            <div className="p-5">
              <AnimatePresence mode="wait">
                {res ? (
                  <motion.pre
                    key="res"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="overflow-x-auto font-mono text-xs leading-relaxed text-rail-400/90"
                  >
                    {res}
                  </motion.pre>
                ) : (
                  <p key="empty" className="font-mono text-xs text-white/35">
                    {loading ? "AERO scoring routes…" : "// run a request to see the route"}
                  </p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-md text-center text-xs text-white/30">
          Illustrative. {formatUSD(0.45)} median settlement fee across 14 networks.
        </p>
      </div>
    </section>
  );
}
