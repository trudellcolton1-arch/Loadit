import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P, Code, Table } from "../../_components/PageShell";
import { StatusTag, Cta } from "../../_components/Bits";

export const metadata: Metadata = {
  title: "API Reference (preview)",
  description: "Preview of the Loadit routing interface: authentication, parameters, response fields, errors, and limits. Pre-launch — not yet open.",
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
    <PageShell eyebrow="API reference · preview" title="One endpoint. The route." lede="The intended interface, published early for review. The endpoint is not open to integrators yet — keys go to early-access partners first." status="PREVIEW">
      <Prose>
        <div>
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <StatusTag status="COMING SOON" />
            <span className="text-sm text-white/60">Pre-launch. Review the interface now; integrate when access opens.</span>
            <Cta href="/access" variant="secondary" className="ml-auto px-3 py-1.5 text-xs">Join the list</Cta>
          </div>

          <H3 id="auth">Base URL &amp; authentication</H3>
          <P>Base URL: <code className="font-mono text-white">https://loaditglobal.com</code>. Authenticate with a partner API key in the <code className="font-mono text-white">x-api-key</code> header. Keys are issued to early-access partners.</P>

          <H3 id="route">POST /api/v1/route</H3>
          <P>Returns the selected, supported settlement route for a stated origin (funding method), destination (asset), and amount.</P>
          <Code title="Request · preview">{`POST /api/v1/route
x-api-key: $LOADIT_API_KEY
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
          <Code title="200 OK · preview">{`{
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
    "eta": "~4s",
    "eta_seconds": 4,
    "confidence": 0.94,
    "risk": "low",
    "settlement": "non_custodial",
    "path": ["Bank Transfer", "HQ", "Solana", "USDC"],
    "explanation": "…"
  },
  "meta": {
    "engine": "HQ", "version": "v1",
    "fees_live": true,
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
            ]}
          />

          <H3 id="errors">Errors</H3>
          <Table
            head={["Status", "error", "When"]}
            rows={[
              ["401", "missing_api_key / invalid_api_key", "No key, or a key that is not provisioned."],
              ["422", "invalid_amount", "amount_usd missing, non-numeric, or ≤ 0."],
              ["422", "invalid_asset / invalid_payment_method / invalid_preferred", "Value not in the allowed list; the response includes allowed."],
              ["429", "rate_limited", "Per-key limit exceeded."],
            ]}
          />

          <H3 id="limits">Rate limits</H3>
          <P>Per-key limits are set with each early-access partner. Volume tiers follow by agreement.</P>

          <H3 id="planned">Planned endpoints</H3>
          <div className="mt-3 flex items-center gap-2"><StatusTag status="PLANNED" /><span className="text-sm text-white/50">Shapes shown for design review.</span></div>
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
