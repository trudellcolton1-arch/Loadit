"use client";

import { useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";

const PARAMS = [
  { name: "amount_usd", type: "number", req: true, desc: "Amount to move, in USD." },
  { name: "asset", type: "string", req: false, desc: "Target asset: BTC, ETH, SOL, XRP, USDC, USDT. Default USDC." },
  { name: "payment_method", type: "string", req: false, desc: "Cash, Debit Card, Credit Card, Bank Transfer. Default Debit Card." },
  { name: "preferred", type: "string", req: false, desc: "Force a network (solana, base, ethereum…) or 'auto'. Default auto." },
  { name: "destination", type: "string", req: false, desc: "Optional wallet address; sharpens the risk score." },
];

const TIERS = [
  { name: "Demo", price: "Free", calls: "30 req/min", note: "Key: demo. For testing & the playground.", cta: false },
  { name: "Startup", price: "$49/mo", calls: "100k calls/mo", note: "Production key, email support.", cta: true },
  { name: "Scale", price: "Usage", calls: "Metered", note: "Volume pricing + SLA. Talk to us.", cta: true },
];

export function ApiDocs() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const [checkout, setCheckout] = useState<"idle" | "loading">("idle");

  // Start a Stripe subscription. If Stripe isn't configured yet, fall back to
  // the key-request form so the CTA always does something useful.
  const subscribe = async (plan: string) => {
    setCheckout("loading");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: email || undefined }),
      });
      const data = await res.json();
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
    } catch {
      /* fall through */
    }
    setCheckout("idle");
    document.getElementById("get-key")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const curl = `curl -X POST https://loadit.net/api/v1/route \\
  -H "x-api-key: demo" \\
  -H "Content-Type: application/json" \\
  -d '{"amount_usd": 500, "asset": "USDC", "payment_method": "Cash"}'`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "api_key" }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  return (
    <section id="docs" className="relative section-py">
      <div className="container-px mx-auto max-w-6xl">
        <SectionHeading
          align="center"
          eyebrow="HQ API · v1"
          title="Routing intelligence, one HTTP call."
          description="The patented HQ engine as a metered API. Send a funding method and a target asset; get the cheapest, fastest non-custodial route back as JSON. No SDK required."
        />

        {/* quickstart */}
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06080e]">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="font-mono text-xs text-white/55">Quickstart · try it with key <span className="text-rail-400">demo</span></span>
              <button
                onClick={() => { navigator.clipboard?.writeText(curl); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                className="font-mono text-[0.62rem] text-white/40 hover:text-white"
              >
                {copied ? "copied ✓" : "copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-rail-400/90">{curl}</pre>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#06080e]">
            <div className="border-b border-white/8 px-4 py-3 font-mono text-xs text-white/55">200 · response</div>
            <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-white/55">{`{
  "ok": true,
  "route": {
    "network": "solana",
    "loadit_fee_usd": 0.5,
    "legacy_fee_usd": 51.5,
    "savings_usd": 51,
    "savings_pct": 99,
    "eta": "~1.8s",
    "settlement": "non_custodial",
    "confidence": 0.95
  },
  "meta": { "engine": "HQ", "version": "v1" }
}`}</pre>
          </div>
        </div>

        {/* params */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10">
          <div className="border-b border-white/8 bg-white/[0.02] px-5 py-3">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/45">POST /api/v1/route · parameters</span>
          </div>
          <div className="divide-y divide-white/5">
            {PARAMS.map((p) => (
              <div key={p.name} className="grid grid-cols-[1fr] gap-1 px-5 py-3 sm:grid-cols-[180px_90px_1fr] sm:items-center sm:gap-4">
                <span className="font-mono text-sm text-rail-400">
                  {p.name}
                  {p.req && <span className="ml-1 text-[0.6rem] text-amber">*</span>}
                </span>
                <span className="font-mono text-xs text-white/40">{p.type}</span>
                <span className="text-sm text-white/55">{p.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* pricing */}
        <div className="mt-12">
          <h3 className="text-center font-mono text-[0.62rem] uppercase tracking-[0.25em] text-white/40">Pricing</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div key={t.name} className={cn("flex flex-col rounded-3xl border p-6", t.name === "Startup" ? "border-rail-500/35 bg-rail-500/[0.05]" : "border-white/10 bg-white/[0.02]")}>
                <div className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-white/40">{t.name}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{t.price}</div>
                <div className="mt-1 font-mono text-xs text-rail-400">{t.calls}</div>
                <p className="mt-3 flex-1 text-sm text-white/50">{t.note}</p>
                {t.name === "Startup" && (
                  <button
                    onClick={() => subscribe("startup")}
                    disabled={checkout === "loading"}
                    className="mt-4 w-full rounded-full bg-rail-500 px-5 py-2.5 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
                  >
                    {checkout === "loading" ? "Redirecting…" : "Subscribe →"}
                  </button>
                )}
                {t.name === "Scale" && (
                  <button
                    onClick={() => document.getElementById("get-key")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="mt-4 w-full rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/5"
                  >
                    Contact us
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* key request */}
        <div id="get-key" className="mx-auto mt-12 max-w-xl scroll-mt-24 rounded-4xl border border-white/10 bg-white/[0.02] p-7 text-center">
          <h3 className="text-lg font-semibold text-white">Get a production API key</h3>
          <p className="mt-1 text-sm text-white/50">Drop your email — we&apos;ll send a live key and onboarding.</p>
          {state === "done" ? (
            <p className="mt-5 font-mono text-sm text-signal">✓ You&apos;re on the list. We&apos;ll be in touch.</p>
          ) : (
            <form onSubmit={submit} className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="flex-1 rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rail-400/50"
              />
              <button
                type="submit" disabled={state === "loading"}
                className="rounded-full bg-rail-500 px-6 py-3 text-sm font-semibold text-void transition-all hover:shadow-glow disabled:opacity-60"
              >
                {state === "loading" ? "Sending…" : "Request key"}
              </button>
            </form>
          )}
          {state === "error" && <p className="mt-3 text-sm text-amber">Something went wrong — try again.</p>}
        </div>
      </div>
    </section>
  );
}
