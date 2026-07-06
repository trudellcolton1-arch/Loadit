"use client";

import { useState } from "react";

/** Typical settlement characteristics per rail (illustrative, seconds). */
const RAILS = [
  { id: "btc", label: "Bitcoin (on-chain)", seconds: 1800, hint: "1–6 confirmations" },
  { id: "ln", label: "Lightning", seconds: 1, hint: "instant, off-chain" },
  { id: "eth", label: "Ethereum L1", seconds: 180, hint: "congestion-dependent" },
  { id: "base", label: "Base (L2)", seconds: 6, hint: "rollup finality" },
  { id: "sol", label: "Solana", seconds: 2, hint: "sub-second blocks" },
  { id: "xrpl", label: "XRPL", seconds: 4, hint: "3–5s ledger close" },
  { id: "matic", label: "Polygon", seconds: 15, hint: "fast, low fee" },
  { id: "ach", label: "Bank ACH", seconds: 172800, hint: "1–3 business days" },
  { id: "wire", label: "Bank wire", seconds: 43200, hint: "same/next business day" },
] as const;

function fmt(seconds: number): string {
  if (seconds < 2) return "~1 second";
  if (seconds < 90) return `~${Math.round(seconds)} seconds`;
  if (seconds < 5400) return `~${Math.round(seconds / 60)} minutes`;
  if (seconds < 172800) return `~${Math.round(seconds / 3600)} hours`;
  return `~${Math.round(seconds / 86400)} days`;
}

const ASSETS = [
  { id: "usdc", label: "USDC", rails: ["ln", "sol", "base", "matic", "xrpl", "eth"] },
  { id: "btc", label: "Bitcoin", rails: ["ln", "btc"] },
  { id: "eth", label: "Ethereum", rails: ["base", "eth"] },
  { id: "sol", label: "Solana", rails: ["sol"] },
] as const;

export function SettlementEstimator() {
  const [assetId, setAssetId] = useState<(typeof ASSETS)[number]["id"]>("usdc");
  const asset = ASSETS.find((a) => a.id === assetId)!;
  const options = asset.rails.map((rid) => RAILS.find((r) => r.id === rid)!).sort((a, b) => a.seconds - b.seconds);
  const fastest = options[0];
  const slowest = options[options.length - 1];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Deliver as</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {ASSETS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAssetId(a.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              assetId === a.id ? "border-rail bg-rail/15 text-white" : "border-white/10 text-white/55 hover:text-white"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-rail/30 bg-rail/10 p-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-rail-400">Loadit (HQ-routed)</div>
        <div className="mt-1 text-3xl font-bold text-white">{fmt(fastest.seconds)}</div>
        <div className="mt-1 text-xs text-white/50">
          HQ auto-selects the fastest viable path — here, {fastest.label.toLowerCase()}.
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/40">Available paths, fastest first</div>
        <div className="flex flex-col gap-2">
          {options.map((r, i) => (
            <div
              key={r.id}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                i === 0 ? "border-rail/30 bg-rail/[0.06]" : "border-white/10 bg-surface"
              }`}
            >
              <div>
                <span className="text-sm font-medium text-white">{r.label}</span>
                <span className="ml-2 text-xs text-white/40">{r.hint}</span>
              </div>
              <span className="text-sm font-semibold text-white/80 tabular-nums">{fmt(r.seconds)}</span>
            </div>
          ))}
        </div>
      </div>

      {slowest.seconds > fastest.seconds * 4 && (
        <p className="mt-4 text-sm text-white/55">
          A naive path could take <strong className="text-white">{fmt(slowest.seconds)}</strong>. Routing picks the{" "}
          <strong className="text-rail-400">{fmt(fastest.seconds)}</strong> path automatically.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-white/35">
        Illustrative estimates of typical settlement/finality under normal conditions. Actual times vary with network
        congestion and confirmation requirements. Loadit&apos;s HQ engine selects the fastest viable route per
        transaction.
      </p>
    </div>
  );
}
