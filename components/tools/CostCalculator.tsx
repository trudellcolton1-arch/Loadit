"use client";

import { useState } from "react";

/** Comparative fee model. Illustrative, transparent rates for education. */
const METHODS = [
  { id: "card", label: "Card processor", pct: 0.029, flat: 0.3, note: "≈2.9% + $0.30, settles in 1–3 days" },
  { id: "wire", label: "Bank wire", pct: 0, flat: 25, note: "≈$25 flat, same/next day" },
  { id: "intl", label: "International card", pct: 0.039, flat: 0.3, note: "≈3.9% + $0.30 with FX markup" },
] as const;

const LOADIT_PCT = 0.0075; // 0.75% flat

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function CostCalculator() {
  const [amount, setAmount] = useState(500);
  const [methodId, setMethodId] = useState<(typeof METHODS)[number]["id"]>("card");
  const method = METHODS.find((m) => m.id === methodId)!;

  const a = Math.max(0, amount || 0);
  const legacy = a * method.pct + method.flat;
  const loadit = a * LOADIT_PCT;
  const savings = Math.max(0, legacy - loadit);
  const savingsPct = legacy > 0 ? Math.round((savings / legacy) * 100) : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Amount (USD)</span>
          <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-surface px-4 py-3">
            <span className="text-2xl font-bold text-white">$</span>
            <input
              type="number"
              inputMode="decimal"
              value={amount}
              min={0}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="w-full bg-transparent pl-1 text-2xl font-bold text-white outline-none"
            />
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/40">Compare against</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  methodId === m.id ? "border-rail bg-rail/15 text-white" : "border-white/10 text-white/55 hover:text-white"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-white/40">{method.note}</p>
        </label>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-surface p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-white/40">{method.label}</div>
          <div className="mt-1 text-3xl font-bold text-white tabular-nums">{money(legacy)}</div>
          <div className="mt-1 text-xs text-white/40">in fees on {money(a)}</div>
        </div>
        <div className="rounded-2xl border border-rail/30 bg-rail/10 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-rail-400">Loadit · 0.75% AI-routed</div>
          <div className="mt-1 text-3xl font-bold text-white tabular-nums">{money(loadit)}</div>
          <div className="mt-1 text-xs text-white/50">settles on-chain in seconds</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-gradient-to-r from-rail/10 to-transparent px-5 py-4">
        <span className="text-sm text-white/60">You save</span>
        <span className="text-2xl font-bold text-rail-400 tabular-nums">
          {money(savings)} <span className="text-base font-medium text-white/50">({savingsPct}%)</span>
        </span>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-white/35">
        Illustrative estimate. Legacy rates are typical published fees; actual costs vary by provider, region, and card
        type. Loadit charges a flat 0.75% and its HQ engine routes underlying network fees to the cheapest available
        path.
      </p>
    </div>
  );
}
