import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code, Table } from "../../_components/PageShell";
import { StatusTag } from "../../_components/Bits";

export const metadata: Metadata = {
  title: "API Reference",
  description: "Reference for the Loadit routing endpoint: authentication, parameters, response fields, errors, and rate limits.",
  alternates: { canonical: "/developers/api" },
};

const NAVI = [
  { label: "Base URL & auth", href: "#auth" },
  { label: "POST /api/v1/route", href: "#route" },
  { label: "Parameters", href: "#params" },
  { label: "Response", href: "#response" },
  { label: "Errors", href: "#errors" },
  { label: "Rate limits", href: "#limits" },
  { label: "Planned endpoints", href: "#planned" },
];

export default function ApiReference() {
  return (
    <PageShell eyebrow="API reference" title="One endpoint. The route." lede="Everything the live sandbox accepts and returns, exactly as implemented. Planned endpoints are listed separately and labeled." status="LIVE · SANDBOX">
      <Prose>
        <div>
          <H3 id="auth">Base URL &amp; authentication</H3>
          <P>Base URL: <code className="font-mono text-white">https://loaditglobal.com</code>. Authenticate with an API key in the <code className="font-mono text-white">x-api-key</code> header (also accepted as <code className="font-mono text-white">key</code> in the JSON body or <code className="font-mono text-white">?key=</code> query). The sandbox key is <code className="font-mono text-white">demo</code>. CORS is open for browser use.</P>

          <H3 id="route">POST /api/v1/route</H3>
          <P>Returns the selected, supported settlement route for a stated origin (funding method), destination (asset), and amount. <code className="font-mono text-white">GET</code> with query parameters is also accepted.</P>
          <Code title="Request">{`POST /api/v1/route
x-api-key: demo
Content-Type: application/json

{ "amount_usd": 1000, "payment_method": "Bank Transfer", "asset": "USDC", "preferred": "auto" }`}</Code>

          <H3 id="params">Parameters</H3>
          <Table
            head={["Field", "Type", "Required", "Description"]}
            rows={[
              ["amount_usd", "number", "yes", "Amount to move, in USD. Must be positive."],
              ["asset", "string", "no", "Destination asset: BTC, ETH, SOL, XRP, USDC, USDT. Default USDC."],
              ["payment_method", "string", "no", "Origin: Cash, Debit Card, Credit Card, Bank Transfer. Default Debit Card."],
              ["preferred", "string", "no", "auto (HQ decides) or force a network: solana, base, ethereum, polygon, xrpl, lightning."],
              ["destination", "string", "no", "Optional wallet address; sharpens the risk score."],
            ]}
          />

          <H3 id="response">Response</H3>
          <Code title="200 OK">{`{
  "ok": true,
  "route": {
    "id": "rt_…",
    "network": "solana",
    "network_name": "Solana",
    "asset": "USDC",
    "amount_usd": 1000,
    "payment_method": "Bank Transfer",
    "loadit_fee_usd": 7.5,
    "swap_fee_usd": 0,
    "total_usd": 1007.5,
    "legacy_fee_usd": 45,
    "savings_usd": 37.5,
    "savings_pct": 83,
    "eta": "~4s",
    "eta_seconds": 4,
    "success_probability": 0.99,
    "confidence": 0.94,
    "risk": "low",
    "settlement": "non_custodial",
    "path": ["Bank Transfer", "HQ", "Solana", "USDC"],
    "explanation": "…"
  },
  "meta": {
    "engine": "HQ", "version": "v1", "plan": "demo",
    "networks_scanned": 6, "pools_checked": 18,
    "fees_live": true, "fee_sources": ["…"],
    "disclaimer": "Estimates dependent on live market and network conditions."
  }
}`}</Code>
          <Table
            head={["Field", "Meaning"]}
            rows={[
              ["route.network", "Selected rail identifier; network_name is the display name."],
              ["route.loadit_fee_usd", "Loadit's convenience fee (0.75%, $1 minimum)."],
              ["route.swap_fee_usd", "Loadit's visible swap fee (0.25%) when the destination differs from the received asset."],
              ["route.total_usd", "All-in estimate for the amount plus Loadit fees."],
              ["route.eta / eta_seconds", "Expected end-to-end settlement time."],
              ["route.confidence", "HQ's confidence in this selection, 0–1."],
              ["route.path", "Ordered legs from origin to destination."],
              ["route.settlement", "Always non_custodial — delivery to a destination the customer controls."],
              ["meta.fees_live", "Whether live network-fee feeds informed this response."],
            ]}
          />

          <H3 id="errors">Errors</H3>
          <Table
            head={["Status", "error", "When"]}
            rows={[
              ["401", "missing_api_key / invalid_api_key", "No key, or a key that is neither demo nor a provisioned key."],
              ["422", "invalid_amount", "amount_usd missing, non-numeric, or ≤ 0."],
              ["422", "invalid_asset / invalid_payment_method / invalid_preferred", "Value not in the allowed list; the response includes allowed."],
              ["429", "rate_limited", "Demo: 30 requests/min. Production keys: 600/min."],
            ]}
          />

          <H3 id="limits">Rate limits</H3>
          <P>Demo key: 30 requests per minute. Production keys: 600 per minute, with volume tiers by agreement. Limits are enforced per key.</P>

          <H3 id="planned">Planned endpoints</H3>
          <div className="mt-3 flex items-center gap-2"><StatusTag status="PLANNED" /><span className="text-sm text-white/50">Shapes shown for design review. Not callable.</span></div>
          <Code title="Conceptual">{`POST   /api/v1/transactions            create a transaction (origin, destination, amount, constraints)
GET    /api/v1/transactions/:id        state machine: quoted → intake → converting → paying_out → settled
POST   /api/v1/transactions/:id/heal   re-score remaining legs under the same id
GET    /api/v1/routes                  list supported corridors and their status`}</Code>
        </div>
        <Aside title="On this page" items={NAVI} />
      </Prose>
    </PageShell>
  );
}
