/**
 * PROVIDER-AGNOSTIC CROSS-CHAIN SWAP LAYER.
 *
 * MoneyGram Ramps only ever delivers USDC on Stellar. HQ plans the last mile:
 * turn that Stellar USDC into whatever asset the user actually chose (BTC, SOL,
 * ETH, …) and deliver it to their own wallet. This module plans that route;
 * a registered provider (Allbridge, THORChain, a DEX aggregator, …) executes
 * it. No provider is hard-wired — set SWAP_PROVIDER when one is chosen and the
 * plan names it; until then the plan is grounded and demoable with the
 * integration point made explicit.
 *
 * Non-custodial invariant: the user never has to hold Stellar USDC or own a
 * Stellar wallet. The swap fires on the earmarked deposit and the target asset
 * lands in the wallet they pasted. Loadit orchestrates; it never custodies.
 */

export type SwapAsset = "BTC" | "ETH" | "SOL" | "XRP" | "USDC" | "USDT";

/** Where the user ultimately receives each asset. */
const DEST_CHAIN: Record<SwapAsset, string> = {
  BTC: "Lightning",
  ETH: "Base",
  SOL: "Solana",
  XRP: "XRPL",
  USDC: "Solana",
  USDT: "Solana",
};

export interface SwapStep {
  kind: "bridge" | "dex" | "deliver";
  detail: string;
}

export interface SwapPlan {
  fromAsset: "USDC";
  fromChain: "Stellar";
  toAsset: SwapAsset;
  toChain: string;
  steps: SwapStep[];
  /** Illustrative bridge+DEX cost as a fraction (not Loadit's fee). */
  estCostPct: number;
  /** Configured executor, or null while provider-agnostic. */
  provider: string | null;
  note: string;
}

export function isStableTarget(asset: SwapAsset): boolean {
  return asset === "USDC" || asset === "USDT";
}

/** Plan the Stellar-USDC → target-asset route. Provider-agnostic. */
export function planSwap(toAsset: SwapAsset): SwapPlan {
  const provider = process.env.SWAP_PROVIDER || null;
  const toChain = DEST_CHAIN[toAsset];
  const steps: SwapStep[] = [];

  if (isStableTarget(toAsset)) {
    // Same asset, different chain — a single bridge, no DEX hop.
    steps.push({ kind: "bridge", detail: `Bridge USDC from Stellar to ${toChain}` });
  } else {
    steps.push({ kind: "bridge", detail: `Bridge USDC from Stellar to ${toChain}` });
    steps.push({ kind: "dex", detail: `Swap USDC → ${toAsset} on ${toChain}` });
  }
  steps.push({ kind: "deliver", detail: `Deliver ${toAsset} to your wallet` });

  return {
    fromAsset: "USDC",
    fromChain: "Stellar",
    toAsset,
    toChain,
    steps,
    estCostPct: isStableTarget(toAsset) ? 0.003 : 0.006,
    provider,
    note: provider
      ? `Swap executed by ${provider}, non-custodial.`
      : "Swap executed by Loadit's connected liquidity provider (integration pending). Loadit never holds the funds.",
  };
}
