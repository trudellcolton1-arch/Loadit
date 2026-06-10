import { NextResponse } from "next/server";
import {
  ASSETS,
  PAYMENT_METHODS,
  PREFERRED_NETWORKS,
  computeRoute,
  type Asset,
  type NetworkId,
  type PaymentMethod,
} from "@/lib/aero";
import { getMergedFees } from "@/lib/liveFees";
import { verifyApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC AERO ROUTING API — POST/GET /api/v1/route
 *
 * The patented AERO engine as a metered HTTP endpoint. Returns the cheapest,
 * fastest non-custodial settlement route for a given funding method + asset.
 *
 * Auth: send an API key via `x-api-key` header or `?key=`.
 *   - `demo` always works (rate-limited) so the public playground + docs run.
 *   - Production keys are configured in the AERO_API_KEYS env var
 *     (comma-separated). Wire these to Stripe metered billing to charge.
 *
 * NOTE: route economics are derived deterministically today; swap computeRoute's
 * inputs for live network-fee + on-ramp quote feeds to make pricing real.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

// Best-effort in-memory rate limiter (per key). On serverless this is per
// instance, not global — good enough to deter abuse; move to Redis for hard limits.
const WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function rateLimited(key: string, limit: number): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(key, arr);
  return arr.length > limit;
}

function validKeys(): Set<string> {
  const env = (process.env.AERO_API_KEYS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return new Set(["demo", ...env]);
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: CORS });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  return handle(req, Object.fromEntries(url.searchParams.entries()));
}

export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* allow empty body → validation will report what's missing */
  }
  return handle(req, body as Record<string, string | number>);
}

async function handle(req: Request, params: Record<string, unknown>) {
  // ---- auth ---- (accept key via header, JSON body, or query string)
  const queryKey = new URL(req.url).searchParams.get("key") || "";
  const key =
    (req.headers.get("x-api-key") || (params.key as string) || queryKey || "").trim();
  if (!key) {
    return json(
      { ok: false, error: "missing_api_key", message: "Provide an API key via the x-api-key header or ?key=. Use 'demo' to try it." },
      401
    );
  }
  const signed = verifyApiKey(key);
  if (!validKeys().has(key) && !signed) {
    return json({ ok: false, error: "invalid_api_key" }, 401);
  }
  const isDemo = key === "demo";
  const plan = signed?.plan ?? (isDemo ? "demo" : "static");
  if (rateLimited(key, isDemo ? 30 : 600)) {
    return json(
      { ok: false, error: "rate_limited", message: isDemo ? "Demo key is limited to 30 req/min. Request a production key for higher limits." : "Rate limit exceeded." },
      429
    );
  }

  // ---- validate inputs ----
  const method = (params.payment_method as PaymentMethod) || "Debit Card";
  const asset = (params.asset as Asset) || "USDC";
  const amount = Number(params.amount_usd ?? params.amount);
  const preferred = (params.preferred as "auto" | NetworkId) || "auto";

  if (!PAYMENT_METHODS.includes(method)) {
    return json({ ok: false, error: "invalid_payment_method", allowed: PAYMENT_METHODS }, 422);
  }
  if (!ASSETS.some((a) => a.id === asset)) {
    return json({ ok: false, error: "invalid_asset", allowed: ASSETS.map((a) => a.id) }, 422);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ ok: false, error: "invalid_amount", message: "amount_usd must be a positive number." }, 422);
  }
  if (!PREFERRED_NETWORKS.some((p) => p.id === preferred)) {
    return json({ ok: false, error: "invalid_preferred", allowed: PREFERRED_NETWORKS.map((p) => p.id) }, 422);
  }

  // ---- route (with live network fees) ----
  const live = await getMergedFees();
  const r = computeRoute({
    paymentMethod: method,
    asset,
    amount,
    wallet: (params.destination as string) || "",
    preferred,
    feeOverrides: live.fees,
  });

  return json({
    ok: true,
    route: {
      id: "rt_" + Math.random().toString(36).slice(2, 12),
      network: r.network.id,
      network_name: r.network.name,
      asset,
      amount_usd: amount,
      payment_method: method,
      loadit_fee_usd: r.loaditFee,
      legacy_fee_usd: r.legacyFee,
      savings_usd: r.savingsAbs,
      savings_pct: r.savingsPct,
      eta: r.eta,
      eta_seconds: r.network.etaSeconds,
      success_probability: r.successProbability,
      confidence: r.confidence / 100,
      risk: r.risk,
      settlement: "non_custodial",
      path: r.path.map((p) => p.label),
      explanation: r.explanation,
    },
    meta: {
      engine: "AERO",
      version: "v1",
      plan,
      networks_scanned: r.metrics.networksScanned,
      pools_checked: r.metrics.poolsChecked,
      fees_live: live.live,
      fee_sources: live.sources,
      eth_price_usd: live.ethPriceUsd,
      disclaimer: "Estimates dependent on live market and network conditions.",
    },
  });
}
