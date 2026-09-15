/**
 * MONEYGRAM RAMPS — the cash on-ramp.
 *
 * Cash at 350,000+ MoneyGram locations → USDC on Stellar (MoneyGram is the
 * licensed money-transmitter and does the KYC at the counter) → HQ swaps the
 * USDC into the user's chosen asset (see lib/swap.ts) → it lands in their own
 * wallet. Loadit orchestrates the route non-custodially; MoneyGram moves the
 * cash, a liquidity provider executes the swap.
 *
 * Integration is via the Stellar SEP standards: SEP-1 (the hosted
 * stellar.toml), SEP-10 (auth), and SEP-24 (interactive deposit). This module
 * plans the route. Cash-in is NOT live: cert approved (4/5), final go-live
 * pending. MONEYGRAM_ANCHOR_URL is unused until go-live (5/5).
 */
import { planSwap, HQ_SWAP_FEE_PCT, type SwapAsset, type SwapPlan } from "./swap";
import { LOADIT_FEE_PCT, calcLoaditFee } from "./aero";
import { CASH_CERT_LINE } from "./rail/copy";

const round2 = (n: number) => Math.round(n * 100) / 100;

/** ~global MoneyGram retail footprint, for copy. */
export const MONEYGRAM_LOCATIONS = "350,000+";

export interface MoneyGramStep {
  n: number;
  title: string;
  detail: string;
}

export interface MoneyGramPlan {
  amountUsd: number;
  asset: SwapAsset;
  wallet: string;
  /** Loadit's flat convenience fee (0.75%, $1 minimum). */
  loaditFeeUsd: number;
  /** Loadit's visible 0.25% fee on the HQ swap leg. */
  swapFeeUsd: number;
  feePct: number;
  swap: SwapPlan;
  steps: MoneyGramStep[];
  /** True once a live MoneyGram anchor is configured. */
  configured: boolean;
  /** Non-custodial, always. */
  settlement: "non_custodial";
}

export function moneygramConfigured(): boolean {
  return Boolean(process.env.MONEYGRAM_ANCHOR_URL);
}

export function planMoneyGram(amountUsd: number, asset: SwapAsset, wallet: string): MoneyGramPlan {
  const swap = planSwap(asset);
  const loaditFeeUsd = calcLoaditFee(amountUsd);
  const swapFeeUsd = round2(amountUsd * HQ_SWAP_FEE_PCT);

  const swapLine = swap.steps
    .filter((s) => s.kind !== "deliver")
    .map((s) => s.detail)
    .join(" → ");

  const steps: MoneyGramStep[] = [
    {
      n: 1,
      title: "Pay cash at MoneyGram (not live yet)",
      detail: `${CASH_CERT_LINE} When go-live (5/5) clears, you'll show a Loadit code at any of ${MONEYGRAM_LOCATIONS} MoneyGram locations and hand over cash. MoneyGram verifies identity at the counter.`,
    },
    {
      n: 2,
      title: "Receive USDC on Stellar",
      detail: "MoneyGram converts your cash to USDC on the Stellar network — the licensed, regulated leg. Loadit never touches it.",
    },
    {
      n: 3,
      title: `HQ swaps to ${asset}`,
      detail: swapLine
        ? `${swapLine}. HQ routes the cheapest path automatically.`
        : `HQ converts the USDC into ${asset}.`,
    },
    {
      n: 4,
      title: "Lands in your wallet",
      detail: `${asset} is delivered to the wallet you control. You never hold Stellar USDC or need a Stellar wallet.`,
    },
  ];

  return {
    amountUsd,
    asset,
    wallet,
    loaditFeeUsd,
    swapFeeUsd,
    feePct: LOADIT_FEE_PCT,
    swap,
    steps,
    configured: moneygramConfigured(),
    settlement: "non_custodial",
  };
}
