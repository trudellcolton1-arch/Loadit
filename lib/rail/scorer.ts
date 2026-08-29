/**
 * HQ SCORER — ranks candidate routes and locks a quote with a TTL.
 *
 * Dimensions: fee, time, liquidity, risk, and whether the door is certified
 * to confirm real customer money. The intent carries no chain field — the
 * scorer (HQ) owns the routing decision end to end, reusing the same swap
 * planner the MoneyGram flow uses (lib/swap.ts) for the convert/payout legs.
 */
import { planSwap } from "../swap";
import { calcLoaditFee } from "../aero";
import type {
  DoorCandidate,
  LockedQuote,
  PaymentIntent,
  RouteLeg,
  ScoredRoute,
} from "./types";
import { NoViableRouteError } from "./errors";
import { newQuoteId, newRouteId } from "./ids";

/** Default quote lock TTL — 90 seconds. */
export const DEFAULT_QUOTE_TTL_MS = 90_000;

/** Blended-score weights (sum to 1). Certification is a scored dimension on
 *  top of the hard confirmability gate applied at intake time. */
export const SCORE_WEIGHTS = {
  fee: 0.3,
  time: 0.2,
  liquidity: 0.2,
  risk: 0.15,
  certification: 0.15,
} as const;

export interface ScoreOptions {
  ttlMs?: number;
  now?: () => number;
  /** Door ids to exclude — used by heal to route around a dead door. */
  excludeDoorIds?: string[];
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round2 = (n: number) => Math.round(n * 100) / 100;

function buildLegs(candidate: DoorCandidate, intent: PaymentIntent): RouteLeg[] {
  const swap = planSwap(intent.outcome.asset);
  const legs: RouteLeg[] = [
    {
      kind: "intake",
      via: candidate.label,
      detail: `${candidate.kind} intake via ${candidate.label}`,
    },
  ];
  for (const step of swap.steps) {
    legs.push({
      kind: step.kind === "deliver" ? "payout" : "convert",
      via: "HQ",
      detail: step.detail,
    });
  }
  return legs;
}

/** Score every viable candidate for an intent, best first. */
export function scoreRoutes(
  intent: PaymentIntent,
  candidates: DoorCandidate[],
  opts: ScoreOptions = {}
): ScoredRoute[] {
  const excluded = new Set(opts.excludeDoorIds ?? []);
  const constraints = intent.constraints ?? {};

  const viable = candidates.filter((c) => {
    if (excluded.has(c.doorId)) return false;
    if (constraints.maxFeeUsd !== undefined && c.feeUsd > constraints.maxFeeUsd) return false;
    if (constraints.maxEtaSeconds !== undefined && c.etaSeconds > constraints.maxEtaSeconds) return false;
    if (constraints.maxRisk !== undefined && c.risk > constraints.maxRisk) return false;
    return true;
  });
  if (!viable.length) {
    throw new NoViableRouteError(
      "no door can serve this intent within its constraints — nothing to quote"
    );
  }

  // Normalize fee/time across the viable set so scores compare candidates,
  // not absolute magnitudes.
  const maxFee = Math.max(...viable.map((c) => c.feeUsd), 0.01);
  const maxEta = Math.max(...viable.map((c) => c.etaSeconds), 1);

  const scored = viable.map((c): ScoredRoute => {
    const breakdown = {
      fee: clamp01(1 - c.feeUsd / maxFee) * 100,
      time: clamp01(1 - c.etaSeconds / maxEta) * 100,
      liquidity: clamp01(c.liquidity) * 100,
      risk: clamp01(1 - c.risk) * 100,
      certification: c.certification === "CLEARED" ? 100 : 0,
    };
    const score = round2(
      breakdown.fee * SCORE_WEIGHTS.fee +
        breakdown.time * SCORE_WEIGHTS.time +
        breakdown.liquidity * SCORE_WEIGHTS.liquidity +
        breakdown.risk * SCORE_WEIGHTS.risk +
        breakdown.certification * SCORE_WEIGHTS.certification
    );
    return {
      routeId: newRouteId(),
      doorId: c.doorId,
      doorLabel: c.label,
      legs: buildLegs(c, intent),
      feeUsd: round2(c.feeUsd),
      etaSeconds: c.etaSeconds,
      score,
      breakdown,
      confirmable: c.certification === "CLEARED",
      settlement: "non_custodial",
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

/** Pick the best route and lock a quote with a TTL. */
export function lockQuote(
  paymentId: string,
  intent: PaymentIntent,
  candidates: DoorCandidate[],
  opts: ScoreOptions & { healed?: boolean } = {}
): LockedQuote {
  const [best] = scoreRoutes(intent, candidates, opts);
  const now = opts.now?.() ?? Date.now();
  const ttlMs = opts.ttlMs ?? DEFAULT_QUOTE_TTL_MS;
  return {
    quoteId: newQuoteId(),
    paymentId,
    route: best,
    amountUsd: intent.amountUsd,
    loaditFeeUsd: calcLoaditFee(intent.amountUsd),
    ttlMs,
    lockedAt: now,
    expiresAt: now + ttlMs,
    healed: opts.healed || undefined,
  };
}

export function isQuoteExpired(quote: LockedQuote, now: number = Date.now()): boolean {
  return now >= quote.expiresAt;
}
