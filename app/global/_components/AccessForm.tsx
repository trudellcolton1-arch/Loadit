"use client";

import { useState } from "react";

/**
 * API access / contact capture. Posts to the existing /api/waitlist backend,
 * which emails the lead to the company inbox (Resend) and/or forwards to a
 * configured webhook — real delivery, no new service.
 */
export function AccessForm({ source, cta = "Request API access" }: { source: string; cta?: string }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [need, setNeed] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: `loaditglobal:${source}${company ? ` · ${company}` : ""}${need ? ` · ${need}` : ""}`,
        }),
      });
      const data = await res.json();
      setState(data.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-rail-400/30 bg-rail-400/[0.06] p-6">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-rail-400">Received</p>
        <p className="mt-2 text-white">Thanks — we&apos;ll reply from a Loadit address with next steps.</p>
        <p className="mt-2 text-sm text-white/50">Meanwhile, the sandbox works today with the <code className="font-mono text-white/80">demo</code> key.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Work email</span>
        <input
          required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="rounded-xl border border-white/12 bg-[#0B0F1A] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-rail-400/60"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Company</span>
        <input
          value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company or project"
          className="rounded-xl border border-white/12 bg-[#0B0F1A] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-rail-400/60"
        />
      </label>
      <label className="grid gap-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">What needs to move</span>
        <input
          value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. USD → USDC for merchant settlement"
          className="rounded-xl border border-white/12 bg-[#0B0F1A] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-rail-400/60"
        />
      </label>
      <button
        type="submit" disabled={state === "loading"}
        className="mt-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-void transition-colors hover:bg-white/90 disabled:opacity-60"
      >
        {state === "loading" ? "Sending…" : cta}
      </button>
      {state === "error" && <p className="text-xs text-rose-300">That didn&apos;t send — try again or email colt@loadit.net.</p>}
      <p className="text-[11px] text-white/35">No spam. A person replies.</p>
    </form>
  );
}
