"use client";

import { useState } from "react";

/** Sandbox tester — one real POST to /api/v1/route with the demo key. */
export function LiveCall() {
  const [out, setOut] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [asset, setAsset] = useState("USDC");
  const [method, setMethod] = useState("Bank Transfer");
  const [amount, setAmount] = useState(1000);

  const run = async () => {
    setBusy(true);
    setOut("");
    try {
      const r = await fetch("/api/v1/route", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": "demo" },
        body: JSON.stringify({ amount_usd: amount, asset, payment_method: method }),
      });
      setOut(JSON.stringify(await r.json(), null, 2));
    } catch (e) {
      setOut(`// request failed: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const field = "rounded-lg border border-white/12 bg-[#0B0F1A] px-3 py-2 text-sm text-white outline-none focus:border-rail-400/60";

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-white/10 bg-[#070A12]">
      <div className="flex flex-wrap items-end gap-3 border-b border-white/8 p-4">
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-[0.15em] text-white/40">
          amount_usd
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${field} w-28`} />
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-[0.15em] text-white/40">
          payment_method
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={field}>
            {["Cash", "Debit Card", "Credit Card", "Bank Transfer"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[10px] font-mono uppercase tracking-[0.15em] text-white/40">
          asset
          <select value={asset} onChange={(e) => setAsset(e.target.value)} className={field}>
            {["USDC", "USDT", "BTC", "ETH", "SOL", "XRP"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <button onClick={run} disabled={busy} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-void disabled:opacity-60">
          {busy ? "Calling…" : "Send request"}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-rail-400">x-api-key: demo</span>
      </div>
      <pre className="min-h-[120px] overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-white/85">
        <code>{out || "// response appears here"}</code>
      </pre>
    </div>
  );
}
