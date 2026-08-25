"use client";

import { useEffect, useRef, useState } from "react";

/**
 * FOUNDER PRACTICE CONSOLE (desktop) — MoneyGram's new Ramps UI currently only
 * renders on Chromium (Chrome/Edge); every iOS browser is WebKit, so the
 * in-app/Safari path is blocked until MoneyGram ships a fix. This page lets
 * the founder run the full sandbox deposit from a desktop browser: start a
 * SEP-24 test deposit, open MoneyGram's hosted flow, watch live status.
 */

const AMOUNTS = [50, 100, 200, 500];

interface Dep { id: string; url: string }
interface Status { status?: string; amountIn?: string; amountOut?: string; message?: string }

function statusLabel(s?: string): string {
  switch (s) {
    case "incomplete": return "Started — finish the steps in the MoneyGram tab";
    case "pending_user_transfer_start": return "MoneyGram is waiting for the cash (test) at the counter";
    case "pending_anchor": return "MoneyGram is processing the deposit";
    case "pending_stellar": return "USDC is on its way on the Stellar test network";
    case "completed": return "Complete — test USDC delivered ✓";
    case "refunded": return "Refunded by the anchor";
    case "expired": return "Expired — start a fresh run";
    case "error": return "The anchor reported an error";
    default: return s || "Waiting…";
  }
}

export function PracticeConsole() {
  const [amount, setAmount] = useState(200);
  const [busy, setBusy] = useState(false);
  const [dep, setDep] = useState<Dep | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!dep) return;
    const tick = async () => {
      try {
        const r = await fetch(`/api/practice/moneygram?id=${encodeURIComponent(dep.id)}`);
        const j = (await r.json()) as Status & { ok?: boolean };
        if (j.ok) setStatus(j);
      } catch { /* keep last */ }
    };
    tick();
    timer.current = setInterval(tick, 5000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [dep]);

  const start = async () => {
    setBusy(true); setErr(null); setDep(null); setStatus(null);
    try {
      const r = await fetch("/api/practice/moneygram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountUsd: amount }),
      });
      const j = (await r.json()) as { ok?: boolean; url?: string; id?: string; reason?: string };
      if (j.ok && j.url && j.id) {
        setDep({ id: j.id, url: j.url });
        window.open(j.url, "_blank", "noopener");
      } else {
        setErr(j.reason === "not_configured" ? "Sandbox wallet not configured." : "MoneyGram's sandbox didn't respond — try again.");
      }
    } catch {
      setErr("Couldn't reach the backend — try again.");
    } finally {
      setBusy(false);
    }
  };

  const done = status?.status === "completed";

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-20">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-black tracking-tight text-white">Practice run</h1>
        <span className="rounded-lg border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300">
          Sandbox · desktop
        </span>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/55">
        Runs a real SEP-24 deposit at MoneyGram&apos;s testnet anchor — real flow, test money.
        Use <b className="text-white/80">Chrome or Edge</b>: MoneyGram&apos;s new Ramps UI currently
        doesn&apos;t render in Safari (reported to their team).
      </p>

      <div className="mt-8">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Cash amount (test USD)</div>
        <div className="mt-3 flex gap-2">
          {AMOUNTS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
                amount === v ? "border-rail-400 bg-rail-400/10 text-white" : "border-white/15 text-white/60 hover:border-white/30"
              }`}
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={start}
        disabled={busy}
        className="mt-8 w-full rounded-2xl bg-rail px-8 py-4 text-base font-bold text-black shadow-[0_8px_32px_rgba(61,227,131,0.3)] transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {busy ? "Starting…" : dep ? "Start another test deposit →" : "Start test deposit → opens MoneyGram"}
      </button>
      {err && <p className="mt-4 text-sm text-amber-300">{err}</p>}

      {dep && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <div className="border-b border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-rail-400">
            ● Live status — MoneyGram anchor
          </div>
          <div className="space-y-3 bg-[#0B0F0D] px-5 py-5">
            <div className={`text-lg font-bold ${done ? "text-rail-400" : "text-white"}`}>{statusLabel(status?.status)}</div>
            <div className="font-mono text-xs text-white/45">
              anchor status: {status?.status || "…"}
              {status?.amountIn ? ` · in ${status.amountIn}` : ""}
              {status?.amountOut ? ` · out ${status.amountOut}` : ""}
            </div>
            <div className="break-all rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-xs text-white/60">
              SEP-24 transaction: {dep.id}
            </div>
            {status?.message && <div className="text-sm text-white/60">{status.message}</div>}
            <a href={dep.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm font-semibold text-rail-400 hover:underline">
              Reopen the MoneyGram tab →
            </a>
            {done && (
              <div className="rounded-xl border border-rail-400/30 bg-rail-400/5 px-4 py-3 text-sm text-white/70">
                🎉 Playground evidence: screenshot this panel + the MoneyGram confirmation. Transaction id above is the reference for the Go-live checklist.
              </div>
            )}
          </div>
        </div>
      )}

      <p className="mt-10 text-center text-xs leading-relaxed text-white/30">
        Founder practice mode · Stellar test network · no real funds move.
      </p>
    </div>
  );
}
