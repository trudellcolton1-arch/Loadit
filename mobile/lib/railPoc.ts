/**
 * Shared copy + helpers for the owner-only Rail POC.
 *
 * Honesty: patent pending (never "patented"). Cash-in is NOT live.
 * Cert is approved at 4/5 — final go-live step pending. Never imply
 * cert has not happened. MoneyGram sandbox is a playground.
 */

export const RAIL_FEE_PCT = 0.0075;
export const RAIL_FEE_MIN_USD = 1;

export const CERT_PILL = "CERT APPROVED 4/5";
export const CERT_LINE =
  "Cert approved (4/5) — final go-live step pending; cash-in not live yet.";
export const PATENT_PILL = "PATENT PENDING";
export const PLAYGROUND_PILL = "PLAYGROUND";
export const OWNER_PILL = "OWNER";

export function loaditFeeUsd(amountUsd: number): number {
  return Math.round(Math.max(RAIL_FEE_MIN_USD, amountUsd * RAIL_FEE_PCT) * 100) / 100;
}

export const RAIL_STORY = [
  {
    n: "1",
    title: "Intake",
    detail: "Cash or card enters a licensed door. MoneyGram is door one. Cert approved (4/5) — final go-live step pending; cash-in not live yet. This walk uses their playground.",
  },
  {
    n: "2",
    title: "UVCE",
    detail: "Universal value conversion. Loadit orchestrates the hop and never takes custody — no keys, no balance, no holding the funds.",
  },
  {
    n: "3",
    title: "Door / router",
    detail: "HQ scores every door on fee, time, liquidity, risk, and certification, then locks a quote on one payment id.",
  },
  {
    n: "4",
    title: "Settle",
    detail: "Crypto lands in a wallet you control. If a pipe dies, self-heal retries under the same payment id — it does not pay twice.",
  },
] as const;

export function playgroundStatusLabel(s?: string): string {
  switch (s) {
    case "incomplete":
      return "Playground started — finish the steps in the MoneyGram window";
    case "pending_user_transfer_start":
      return "Playground: MoneyGram is waiting for test cash at the counter";
    case "pending_anchor":
      return "Playground: MoneyGram is processing the test deposit";
    case "pending_stellar":
      return "Playground: test USDC is moving on the Stellar test network";
    case "completed":
      return "Playground complete — test USDC delivered (not live cash)";
    case "refunded":
      return "Playground: refunded by the test anchor";
    case "expired":
      return "Playground expired — start a fresh run";
    case "error":
      return "Playground: the test anchor reported an error";
    default:
      return s || "Checking playground status…";
  }
}

export function walletForAsset(
  asset: string,
  addresses?: {
    solana?: string | null;
    evm?: string | null;
    bitcoin?: string | null;
    usdc?: string | null;
  } | null
): string {
  if (!addresses) return "";
  const a = asset.toUpperCase();
  if (a === "SOL") return addresses.solana || "";
  if (a === "ETH") return addresses.evm || "";
  if (a === "BTC") return addresses.bitcoin || "";
  if (a === "USDC") return addresses.usdc || addresses.solana || addresses.evm || "";
  return "";
}
