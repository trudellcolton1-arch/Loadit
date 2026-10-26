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
import { AERO_CORS, aeroJson, authorizeAeroApi } from "@/lib/aeroApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PUBLIC HQ ROUTING API — POST/GET /api/v1/route
 *
 * The patent-pending HQ engine as a metered HTTP endpoint. Returns the cheapest,
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

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: AERO_CORS });
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
  const auth = authorizeAeroApi(req, params);
  if (!auth.ok) return auth.response;
  const { plan } = auth;

  // ---- validate inputs ----
  const method = (params.payment_method as PaymentMethod) || "Debit Card";
  const asset = (params.asset as Asset) || "USDC";
  const amount = Number(params.amount_usd ?? params.amount);
  const preferred = (params.preferred as "auto" | NetworkId) || "auto";

  if (!PAYMENT_METHODS.includes(method)) {
    return aeroJson({ ok: false, error: "invalid_payment_method", allowed: PAYMENT_METHODS }, 422);
  }
  if (!ASSETS.some((a) => a.id === asset)) {
    return aeroJson({ ok: false, error: "invalid_asset", allowed: ASSETS.map((a) => a.id) }, 422);
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return aeroJson({ ok: false, error: "invalid_amount", message: "amount_usd must be a positive number." }, 422);
  }
  if (!PREFERRED_NETWORKS.some((p) => p.id === preferred)) {
    return aeroJson({ ok: false, error: "invalid_preferred", allowed: PREFERRED_NETWORKS.map((p) => p.id) }, 422);
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

  return aeroJson({
    ok: true,
    route: {
      id: "rt_" + Math.random().toString(36).slice(2, 12),
      network: r.network.id,
      network_name: r.network.name,
      asset,
      amount_usd: amount,
      payment_method: method,
      loadit_fee_usd: r.loaditFee,
      swap_fee_usd: r.swapFee,
      total_usd: r.total,
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
      engine: "HQ",
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
