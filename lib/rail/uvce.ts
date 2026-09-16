/**
 * UVCE — UNIVERSAL VALUE CONVERSION ENGINE (patent §7.2), governed by HQ.
 *
 * The UVCE transforms one form of value into another UNDER THE GOVERNANCE of
 * the orchestration layer (HQ). It is the subsystem between intake and
 * routing: it normalizes the heterogeneous value coming in (cash, card fiat)
 * into a standardized, rail-compatible settlement object, sources liquidity
 * venues for the conversion legs, consults its market-forecasting layer for
 * an execution window, normalizes every fee in one breakdown, and emits a
 * settlement-ready `uvce.v1` object back to HQ for routing.
 *
 * The HQ↔UVCE exchange is recorded as a directive transcript so the product
 * can SHOW the governance loop instead of asserting it.
 *
 * Honesty: everything here is a PLAN — deterministic estimates, simulated
 * venues, no live market data and no real execution. `estimates: true` is
 * stamped on the plan and every consumer must label it that way. The plan is
 * a pure function of its inputs so demos, tests, and replays agree.
 */
import { planSwap, isStableTarget, HQ_SWAP_FEE_PCT } from "../swap";
import { calcLoaditFee } from "../aero";
import type { PaymentIntent, RouteLeg } from "./types";
import { SCORE_WEIGHTS } from "./scorer";

export type UvceVenueKind = "sdex" | "bridge" | "amm" | "rfq_desk";

/** One sourced liquidity venue — the Liquidity Sourcing & Allocation Engine's bid. */
export interface UvceVenue {
  venueId: string;
  label: string;
  kind: UvceVenueKind;
  /** Estimated execution slippage, basis points. */
  slippageBps: number;
  /** Liquidity depth, 0..1 (higher = deeper). */
  depth: number;
  /** Short-horizon volatility exposure at this venue, basis points. */
  volatilityBps: number;
  /** Counterparty/bridge risk, 0..1 (higher = riskier). */
  counterpartyRisk: number;
  /** Blended 0..100 score under HQ's weights (higher wins). */
  score: number;
  /** True for the venue HQ approved. */
  selected: boolean;
}

/** AI-Driven Market Forecasting Layer output — estimates, never a promise. */
export interface UvceForecast {
  volatilityBps: number;
  driftBps: number;
  liquidityOutlook: "deep" | "normal" | "thin";
  /** UVCE's recommended execution timing for the conversion legs. */
  action: "execute_now" | "brief_defer";
  /** When deferring, how long UVCE would hold the leg (ms). */
  deferMs: number;
  /** Model confidence, 0..1. */
  confidence: number;
  summary: string;
}

/** Fee Normalization & Optimization Module — every cost in one place, USD. */
export interface UvceFees {
  /** Loadit's convenience fee (0.75%, $1 min). */
  loaditFeeUsd: number;
  /** Loadit's visible swap fee (0.25%) — zero when no cross-asset swap runs. */
  swapFeeUsd: number;
  /** Estimated venue cost (spread/slippage) at the selected venue. */
  venueCostUsd: number;
  /** Estimated network/gas cost on the destination chain. */
  networkFeeUsd: number;
  totalUsd: number;
  /** Total as a fraction of the amount in. */
  totalPct: number;
}

/** One line of the HQ↔UVCE governance exchange. */
export interface UvceDirective {
  seq: number;
  from: "HQ" | "UVCE";
  note: string;
}

/** The normalized, settlement-ready transaction object UVCE emits to HQ. */
export interface UvceNormalizedObject {
  schema: "uvce.v1";
  valueIn: { form: "cash" | "card_fiat" | "bank_fiat"; amountUsd: number; via: string };
  valueOut: { asset: string; chain: string; wallet: string };
  settlement: "non_custodial";
}

export interface ConversionPlan {
  normalized: UvceNormalizedObject;
  legs: RouteLeg[];
  venues: UvceVenue[];
  forecast: UvceForecast;
  fees: UvceFees;
  directives: UvceDirective[];
  program: {
    targetAsset: string;
    splitSettlement: false;
    deferral: "none" | "brief";
  };
  /** Always true — this is a plan of estimates, not an execution record. */
  estimates: true;
}

export interface UvceContext {
  doorId: string;
  doorLabel: string;
  doorKind: "cash" | "card" | "bank" | "cash_network";
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Tiny deterministic PRNG (mulberry32) so a plan is a pure function of its inputs. */
function seeded(seedText: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function valueInForm(kind: UvceContext["doorKind"]): UvceNormalizedObject["valueIn"]["form"] {
  if (kind === "card") return "card_fiat";
  if (kind === "bank") return "bank_fiat";
  return "cash";
}

/** Generic venue set for a destination chain — mechanisms, not partner claims. */
function sourceVenues(toChain: string, needsDex: boolean, rand: () => number): Omit<UvceVenue, "score" | "selected">[] {
  const base: Omit<UvceVenue, "score" | "selected">[] = [
    {
      venueId: "sdex_corridor",
      label: "Stellar SDEX corridor",
      kind: "sdex",
      slippageBps: 3 + Math.round(rand() * 4),
      depth: clamp01(0.82 + rand() * 0.1),
      volatilityBps: 8 + Math.round(rand() * 6),
      counterpartyRisk: 0.12,
    },
    {
      venueId: "direct_bridge",
      label: `Direct bridge → ${toChain}`,
      kind: "bridge",
      slippageBps: 5 + Math.round(rand() * 5),
      depth: clamp01(0.75 + rand() * 0.12),
      volatilityBps: 10 + Math.round(rand() * 8),
      counterpartyRisk: 0.2,
    },
    {
      venueId: "rfq_desk",
      label: "Liquidity desk (RFQ)",
      kind: "rfq_desk",
      slippageBps: 2 + Math.round(rand() * 3),
      depth: clamp01(0.9 + rand() * 0.08),
      volatilityBps: 6 + Math.round(rand() * 5),
      counterpartyRisk: 0.18,
    },
  ];
  if (needsDex) {
    base.push({
      venueId: "dest_amm",
      label: `Native AMM on ${toChain}`,
      kind: "amm",
      slippageBps: 4 + Math.round(rand() * 6),
      depth: clamp01(0.8 + rand() * 0.12),
      volatilityBps: 9 + Math.round(rand() * 7),
      counterpartyRisk: 0.15,
    });
  }
  return base;
}

/** Score venues under HQ's blended weights (same dimensions HQ uses on doors). */
function scoreVenues(raw: Omit<UvceVenue, "score" | "selected">[]): UvceVenue[] {
  const maxSlip = Math.max(...raw.map((v) => v.slippageBps), 1);
  const maxVol = Math.max(...raw.map((v) => v.volatilityBps), 1);
  const scored = raw.map((v): UvceVenue => {
    const fee = clamp01(1 - v.slippageBps / maxSlip) * 100;
    const time = clamp01(1 - v.volatilityBps / maxVol) * 100;
    const liquidity = clamp01(v.depth) * 100;
    const risk = clamp01(1 - v.counterpartyRisk) * 100;
    const score = round2(
      fee * SCORE_WEIGHTS.fee +
        time * SCORE_WEIGHTS.time +
        liquidity * SCORE_WEIGHTS.liquidity +
        risk * SCORE_WEIGHTS.risk +
        100 * SCORE_WEIGHTS.certification // simulated venues are all demo-cleared
    );
    return { ...v, score, selected: false };
  });
  scored.sort((a, b) => b.score - a.score);
  scored[0] = { ...scored[0], selected: true };
  return scored;
}

/**
 * Plan a conversion for an intent through a door — the UVCE run HQ invokes
 * while locking a quote. Pure and deterministic for the same inputs.
 */
export function planConversion(intent: PaymentIntent, ctx: UvceContext): ConversionPlan {
  const asset = intent.outcome.asset;
  const swap = planSwap(asset);
  const needsDex = !isStableTarget(asset);
  const rand = seeded(`${intent.amountUsd}|${asset}|${ctx.doorId}`);

  const venues = scoreVenues(sourceVenues(swap.toChain, needsDex, rand));
  const best = venues[0];

  const volatilityBps = Math.max(4, Math.round(best.volatilityBps * (0.8 + rand() * 0.4)));
  const brief = volatilityBps > 14;
  const forecast: UvceForecast = {
    volatilityBps,
    driftBps: Math.round((rand() - 0.5) * 10),
    liquidityOutlook: best.depth > 0.9 ? "deep" : best.depth > 0.8 ? "normal" : "thin",
    action: brief ? "brief_defer" : "execute_now",
    deferMs: brief ? 400 + Math.round(rand() * 400) : 0,
    confidence: round2(0.78 + rand() * 0.14),
    summary: brief
      ? `Vol ${volatilityBps} bps — hold the swap leg ~half a second for a calmer window (estimate).`
      : `Vol ${volatilityBps} bps, ${best.depth > 0.9 ? "deep" : "steady"} liquidity — execute the conversion now (estimate).`,
  };

  const loaditFeeUsd = calcLoaditFee(intent.amountUsd);
  const swapFeeUsd = needsDex ? round2(intent.amountUsd * HQ_SWAP_FEE_PCT) : 0;
  const venueCostUsd = round2(intent.amountUsd * (best.slippageBps / 10_000));
  const networkFeeUsd = round2(0.02 + rand() * 0.06);
  const totalUsd = round2(loaditFeeUsd + swapFeeUsd + venueCostUsd + networkFeeUsd);
  const fees: UvceFees = {
    loaditFeeUsd,
    swapFeeUsd,
    venueCostUsd,
    networkFeeUsd,
    totalUsd,
    totalPct: round2((totalUsd / intent.amountUsd) * 10000) / 100,
  };

  const normalized: UvceNormalizedObject = {
    schema: "uvce.v1",
    valueIn: { form: valueInForm(ctx.doorKind), amountUsd: intent.amountUsd, via: ctx.doorLabel },
    valueOut: { asset, chain: swap.toChain, wallet: intent.outcome.wallet },
    settlement: "non_custodial",
  };

  const legs: RouteLeg[] = [
    { kind: "intake", via: ctx.doorLabel, detail: `${ctx.doorKind} intake via ${ctx.doorLabel}` },
    ...swap.steps.map((step): RouteLeg => ({
      kind: step.kind === "deliver" ? "payout" : "convert",
      via: step.kind === "deliver" ? "HQ" : `UVCE · ${best.label}`,
      detail: step.detail,
    })),
  ];

  const w = SCORE_WEIGHTS;
  const directives: UvceDirective[] = [
    { seq: 1, from: "HQ", note: `Normalize $${intent.amountUsd} ${normalized.valueIn.form.replace("_", " ")} via ${ctx.doorLabel} → ${asset} on ${swap.toChain}. Non-custodial; no custody at any hop.` },
    { seq: 2, from: "UVCE", note: `Emitted uvce.v1 object. Sourced ${venues.length} liquidity venues; forecasting layer reports vol ${forecast.volatilityBps} bps, ${forecast.liquidityOutlook} liquidity.` },
    { seq: 3, from: "HQ", note: `Constraints hold. Score venues under my weights — fee ${w.fee * 100}, time ${w.time * 100}, liquidity ${w.liquidity * 100}, risk ${w.risk * 100}, cert ${w.certification * 100}.` },
    { seq: 4, from: "UVCE", note: `Proposing ${best.label}: ${best.slippageBps} bps slippage, depth ${best.depth.toFixed(2)}, blended ${best.score.toFixed(1)}. Fees normalized to $${totalUsd.toFixed(2)} all-in (estimate).` },
    { seq: 5, from: "HQ", note: forecast.action === "brief_defer"
        ? `Approved with timing: defer the swap leg ${forecast.deferMs} ms per forecast, then execute. Lock legs under this quote.`
        : "Approved. Execute at settle with no deferral. Lock legs under this quote." },
    { seq: 6, from: "UVCE", note: "Settlement-ready object handed back to HQ for routing. UVCE holds nothing — no keys, no balance, no custody." },
  ];

  return {
    normalized,
    legs,
    venues,
    forecast,
    fees,
    directives,
    program: {
      targetAsset: asset,
      splitSettlement: false,
      deferral: forecast.action === "brief_defer" ? "brief" : "none",
    },
    estimates: true,
  };
}
