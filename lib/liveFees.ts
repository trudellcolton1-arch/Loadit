/**
 * LIVE NETWORK FEES
 *
 * Replaces HQ's static per-network fee estimates with real on-chain data so
 * the routing API quotes live economics, not a simulation.
 *
 * - Ethereum + Base: live `eth_gasPrice` via public RPC × 21,000 gas × live ETH
 *   price (both chains pay gas in ETH). Base adds a small L1 data-fee buffer.
 * - Solana / XRPL / Lightning / Polygon: fees are tiny and stable, so we keep
 *   the static estimates from NETWORKS.
 *
 * Everything degrades gracefully: any failed fetch falls back to the static
 * baseFee, so callers always get a usable number. Result is cached ~30s to stay
 * within free public-RPC limits.
 */
import { NETWORKS, type NetworkId } from "./aero";

export interface LiveFees {
  fees: Partial<Record<NetworkId, number>>;
  live: boolean;
  ethPriceUsd: number | null;
  ts: number;
  sources: string[];
}

const TTL_MS = 30_000;
let cache: LiveFees | null = null;

const RPCS: Partial<Record<NetworkId, string>> = {
  ethereum: "https://ethereum.publicnode.com",
  base: "https://base.publicnode.com",
};

/** fetch with a hard timeout — a stalled public RPC must not hang the router. */
async function fetchT(url: string, opts: RequestInit = {}, ms = 4000): Promise<Response | null> {
  const c = new AbortController();
  const to = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: c.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(to);
  }
}

async function gasPriceWei(rpc: string): Promise<number | null> {
  const r = await fetchT(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_gasPrice", params: [] }),
    next: { revalidate: 30 },
  });
  if (!r || !r.ok) return null;
  try {
    const d = await r.json();
    const wei = parseInt(d?.result, 16);
    return Number.isFinite(wei) ? wei : null;
  } catch {
    return null;
  }
}

async function ethPrice(): Promise<number | null> {
  const r = await fetchT("https://api.coinbase.com/v2/exchange-rates?currency=ETH", {
    next: { revalidate: 30 },
  });
  if (!r || !r.ok) return null;
  try {
    const d = await r.json();
    const usd = Number(d?.data?.rates?.USD);
    return usd > 0 ? usd : null;
  } catch {
    return null;
  }
}

const TRANSFER_GAS = 21_000;

export async function getLiveFees(): Promise<LiveFees> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache;

  const [ethGas, baseGas, ethUsd] = await Promise.all([
    gasPriceWei(RPCS.ethereum!),
    gasPriceWei(RPCS.base!),
    ethPrice(),
  ]);

  const fees: Partial<Record<NetworkId, number>> = {};
  const sources: string[] = [];

  if (ethGas && ethUsd) {
    fees.ethereum = round4((ethGas * TRANSFER_GAS * ethUsd) / 1e18);
    sources.push("ethereum:publicnode");
  }
  if (baseGas && ethUsd) {
    // L2 execution gas + a small L1 data-fee buffer.
    fees.base = round4((baseGas * TRANSFER_GAS * ethUsd) / 1e18 + 0.003);
    sources.push("base:publicnode");
  }

  const live = sources.length > 0;
  cache = { fees, live, ethPriceUsd: ethUsd, ts: Date.now(), sources };
  return cache;
}

/** Merge live fees over the static defaults for every network. */
export async function getMergedFees(): Promise<{
  fees: Record<NetworkId, number>;
  live: boolean;
  ethPriceUsd: number | null;
  sources: string[];
}> {
  const live = await getLiveFees();
  const merged = {} as Record<NetworkId, number>;
  (Object.keys(NETWORKS) as NetworkId[]).forEach((id) => {
    merged[id] = live.fees[id] ?? NETWORKS[id].baseFee;
  });
  return { fees: merged, live: live.live, ethPriceUsd: live.ethPriceUsd, sources: live.sources };
}

function round4(n: number) {
  return Math.round(n * 10000) / 10000;
}
