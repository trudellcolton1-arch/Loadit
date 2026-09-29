"use client";

import { useState } from "react";
import { Section, Kicker, H2, Lede, StatusTag, Cta } from "./Bits";

/**
 * DEVELOPER EXPERIENCE — one API, tell us where the value needs to go.
 *
 * Two code surfaces, labeled honestly:
 *  - LIVE · SANDBOX: the real HQ routing endpoint (POST /api/v1/route, demo key).
 *  - CONCEPTUAL: the planned transactions SDK shape. Not an implemented client.
 */

const CURL = `curl -X POST https://loaditglobal.com/api/v1/route \\
  -H "x-api-key: demo" \\
  -H "Content-Type: application/json" \\
  -d '{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC" }'`;

const RESPONSE = `{
  "ok": true,
  "route": {
    "network": "solana",
    "asset": "USDC",
    "amount_usd": 1000,
    "loadit_fee_usd": 7.50,
    "total_usd": 1007.50,
    "eta": "~4s",
    "confidence": 0.94,
    "settlement": "non_custodial",
    "path": ["Bank Transfer", "HQ", "Solana", "USDC"]
  },
  "meta": { "engine": "HQ", "version": "v1", "fees_live": true }
}`;

const SDK = `// Conceptual — the planned transactions interface. Not yet an SDK.
const transaction = await loadit.transactions.create({
  amount: 100,
  input:  { asset: "USD" },
  output: { asset: "USDC", network: "stellar" }
});

// { status: "routing", origin: "USD",
//   destination: "USDC", route_status: "selected" }`;

type Tab = "request" | "response" | "sdk";

export function DeveloperExperience() {
  const [tab, setTab] = useState<Tab>("request");
  const [copied, setCopied] = useState(false);
  const code = tab === "request" ? CURL : tab === "response" ? RESPONSE : SDK;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <Section id="developers">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <Kicker>Developer experience</Kicker>
          <H2>
            One API.
            <br />
            Tell us where the value needs to go.
          </H2>
          <Lede>
            State the origin and the destination. The response is the selected supported
            route — network, cost, expected time, confidence — and a normalized settlement
            object your ledger can reconcile without knowing which rail carried the value.
          </Lede>
          <ul className="mt-8 space-y-3 text-sm text-white/65">
            <li className="flex gap-3"><span className="text-rail-400">—</span> Live sandbox today with the <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-white">demo</code> key, rate-limited</li>
            <li className="flex gap-3"><span className="text-rail-400">—</span> Production keys are provisioned through API access requests</li>
            <li className="flex gap-3"><span className="text-rail-400">—</span> CORS-open, JSON in, JSON out, no SDK required</li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Cta href="/developers/quickstart">Quickstart</Cta>
            <Cta href="/developers/api" variant="secondary">API reference</Cta>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070A12] shadow-glass">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
            <div className="flex gap-1">
              {(["request", "response", "sdk"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-md px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors ${tab === t ? "bg-white/[0.08] text-white" : "text-white/45 hover:text-white"}`}
                >
                  {t === "sdk" ? "SDK" : t}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <StatusTag status={tab === "sdk" ? "CONCEPTUAL" : "LIVE · SANDBOX"} />
              <button onClick={copy} className="rounded-md border border-white/10 px-2.5 py-1 font-mono text-[11px] text-white/60 hover:text-white">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-white/85">
            <code>{code}</code>
          </pre>
          <div className="border-t border-white/8 px-5 py-3 text-[11px] text-white/40">
            {tab === "sdk"
              ? "Illustrates the intended shape of the transactions interface. Not an implemented client library."
              : "Real endpoint. Estimates depend on live market and network conditions. Demo key: 30 req/min."}
          </div>
        </div>
      </div>
    </Section>
  );
}
