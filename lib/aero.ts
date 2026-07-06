/**
 * LOADIT HQ™ — AI Settlement Router engine.
 * Deterministic, realistic route simulation so the investor demo "feels real"
 * without any backend. All numbers are derived from the inputs.
 */

export type PaymentMethod =
  | "Cash"
  | "Debit Card"
  | "Credit Card"
  | "Bank Transfer";

export type Asset = "BTC" | "ETH" | "SOL" | "XRP" | "USDC" | "USDT";

export type NetworkId =
  | "solana"
  | "base"
  | "ethereum"
  | "polygon"
  | "xrpl"
  | "lightning";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "Debit Card",
  "Credit Card",
  "Bank Transfer",
];

export const ASSETS: { id: Asset; name: string; stable: boolean }[] = [
  { id: "BTC", name: "Bitcoin", stable: false },
  { id: "ETH", name: "Ethereum", stable: false },
  { id: "SOL", name: "Solana", stable: false },
  { id: "XRP", name: "XRP", stable: false },
  { id: "USDC", name: "USDC", stable: true },
  { id: "USDT", name: "USDT", stable: true },
];

export interface NetworkMeta {
  id: NetworkId;
  name: string;
  /** Representative on-chain fee in USD for a transfer. */
  baseFee: number;
  etaSeconds: number;
  speedWord: string;
  liquidityWord: string;
}

export const NETWORKS: Record<NetworkId, NetworkMeta> = {
  lightning: {
    id: "lightning",
    name: "Lightning",
    baseFee: 0.0001,
    etaSeconds: 0.4,
    speedWord: "instant",
    liquidityWord: "routed",
  },
  solana: {
    id: "solana",
    name: "Solana",
    baseFee: 0.0008,
    etaSeconds: 1.8,
    speedWord: "sub-second",
    liquidityWord: "deep",
  },
  xrpl: {
    id: "xrpl",
    name: "XRPL",
    baseFee: 0.0002,
    etaSeconds: 3.5,
    speedWord: "fast",
    liquidityWord: "deep",
  },
  polygon: {
    id: "polygon",
    name: "Polygon",
    baseFee: 0.002,
    etaSeconds: 2.4,
    speedWord: "fast",
    liquidityWord: "deep",
  },
  base: {
    id: "base",
    name: "Base",
    baseFee: 0.004,
    etaSeconds: 3.2,
    speedWord: "fast",
    liquidityWord: "deep",
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    baseFee: 2.1,
    etaSeconds: 14,
    speedWord: "standard",
    liquidityWord: "the deepest",
  },
};

/** Optional preferred-network choices for the input. */
export const PREFERRED_NETWORKS: { id: "auto" | NetworkId; label: string }[] = [
  { id: "auto", label: "Auto (HQ decides)" },
  { id: "solana", label: "Solana" },
  { id: "base", label: "Base" },
  { id: "ethereum", label: "Ethereum" },
  { id: "polygon", label: "Polygon" },
  { id: "xrpl", label: "XRPL" },
  { id: "lightning", label: "Lightning" },
];

export const ANALYSIS_STEPS = [
  "Analyzing Liquidity…",
  "Checking Networks…",
  "Comparing Fees…",
  "Scanning Settlement Paths…",
  "Generating Optimal Route…",
] as const;

export interface RouteInput {
  paymentMethod: PaymentMethod;
  asset: Asset;
  amount: number;
  wallet: string;
  preferred: "auto" | NetworkId;
  /** Optional live per-network USD fees that override the static estimates. */
  feeOverrides?: Partial<Record<NetworkId, number>>;
}

/** Loadit's flat convenience fee on every conversion. */
export const LOADIT_FEE_PCT = 0.0075;

export interface RouteResult {
  /** Visual chain: User → HQ → … → Wallet */
  path: { label: string; kind: "origin" | "engine" | "asset" | "network" | "wallet" }[];
  network: NetworkMeta;
  /** What the user pays Loadit — the 0.75% convenience fee. */
  loaditFee: number;
  /** Fraction charged (0.0075). */
  feePct: number;
  /** Order amount + convenience fee. */
  total: number;
  /** Underlying on-chain settlement cost (informational). */
  networkCost: number;
  legacyFee: number;
  savingsPct: number;
  savingsAbs: number;
  eta: string;
  successProbability: number;
  risk: { value: number; label: string };
  confidence: number;
  explanation: string;
  metrics: {
    networksScanned: number;
    poolsChecked: number;
    estSavings: number;
    settlementSpeed: string;
    confidence: number;
  };
  investor: {
    routeLogic: string[];
    costBreakdown: { label: string; value: string }[];
    settlementAnalysis: string;
    feeComparison: { rail: string; fee: number; best?: boolean }[];
    aiReasoning: string;
    networkDecisions: { network: string; status: "selected" | "rejected"; reason: string }[];
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Legacy rail cost for the chosen funding method (what a customer pays today). */
function legacyCost(method: PaymentMethod, amount: number): number {
  switch (method) {
    case "Cash": // Bitcoin-ATM style spread — the status quo for cash-to-crypto.
      return amount * 0.1 + 1.5;
    case "Credit Card":
      return amount * 0.045 + 0.3;
    case "Debit Card":
      return amount * 0.022 + 0.25;
    case "Bank Transfer":
      return amount * 0.015 + 0.1;
  }
}

/** Pick the optimal settlement network given the asset + preference. */
function pickNetwork(asset: Asset, preferred: "auto" | NetworkId): NetworkId {
  if (preferred !== "auto") return preferred;
  switch (asset) {
    case "BTC":
      return "lightning";
    case "ETH":
      return "base";
    case "SOL":
      return "solana";
    case "XRP":
      return "xrpl";
    case "USDC":
    case "USDT":
      return "solana";
  }
}

export function computeRoute(input: RouteInput): RouteResult {
  const amount = Math.max(1, input.amount || 0);
  const assetMeta = ASSETS.find((a) => a.id === input.asset)!;
  const netId = pickNetwork(input.asset, input.preferred);
  const network = NETWORKS[netId];
  const eth = NETWORKS.ethereum;

  // Per-network base fee — live override when provided, else the static estimate.
  const ov = input.feeOverrides;
  const baseFeeOf = (id: NetworkId) => ov?.[id] ?? NETWORKS[id].baseFee;
  const networkFee = baseFeeOf(netId);

  // Costs. Loadit charges a flat 0.75% convenience fee; the on-chain settlement
  // cost is tracked separately for transparency. Savings compare that flat fee
  // to the legacy rail's all-in cost for the chosen funding method.
  const legacyFee = round2(legacyCost(input.paymentMethod, amount));
  const networkCost = round2(networkFee + Math.max(0.05, amount * 0.001));
  const loaditFee = round2(amount * LOADIT_FEE_PCT);
  const total = round2(amount + loaditFee);
  const savingsAbs = round2(Math.max(0, legacyFee - loaditFee));
  const savingsPct = clamp(Math.round((1 - loaditFee / legacyFee) * 100), 0, 99);

  // Timing.
  const eta =
    network.etaSeconds < 1
      ? `~${network.etaSeconds.toFixed(1)}s`
      : `~${network.etaSeconds.toFixed(network.etaSeconds < 10 ? 1 : 0)}s`;

  // Risk + success — credit cards and very large tickets carry more risk.
  let risk = 4;
  if (input.paymentMethod === "Credit Card") risk += 6;
  if (input.paymentMethod === "Cash") risk += 2;
  if (amount > 2500) risk += 5;
  if (amount > 10000) risk += 6;
  if (!input.wallet) risk += 3;
  risk = clamp(risk, 1, 100);
  const riskLabel = risk <= 8 ? "Low" : risk <= 18 ? "Moderate" : "Elevated";

  const successProbability = round2(clamp(99.8 - risk * 0.12, 95, 99.9));
  const confidence = clamp(Math.round(99 - risk * 0.4), 88, 99);

  // Visual route chain.
  const path: RouteResult["path"] = [
    { label: "User", kind: "origin" },
    { label: "Loadit HQ", kind: "engine" },
  ];
  if (!assetMeta.stable) {
    path.push({ label: "USDC", kind: "asset" });
    path.push({ label: network.name, kind: "network" });
    path.push({ label: assetMeta.name, kind: "asset" });
  } else {
    path.push({ label: assetMeta.name, kind: "asset" });
    path.push({ label: network.name, kind: "network" });
  }
  path.push({ label: "Wallet", kind: "wallet" });

  // Dynamic explanation.
  const pctVsEth = clamp(Math.round((1 - networkFee / baseFeeOf("ethereum")) * 100), 1, 99);
  const explanation =
    netId === "ethereum"
      ? `HQ selected Ethereum for its ${eth.liquidityWord} liquidity and settlement assurances on a ${formatUSD(amount)} transfer, accepting higher fees where finality matters most.`
      : `HQ selected ${network.name} because current network fees are ${pctVsEth}% lower than Ethereum while maintaining ${network.speedWord} settlement and ${network.liquidityWord} liquidity.`;

  // Live metrics.
  const poolsChecked = 24 + (amount.toString().length + input.asset.length) * 2;
  const metrics = {
    networksScanned: 14,
    poolsChecked,
    estSavings: savingsAbs,
    settlementSpeed: eta,
    confidence,
  };

  // Fee comparison across rails (for investor mode).
  const railOrder: NetworkId[] = ["ethereum", "base", "polygon", "solana", "xrpl", "lightning"];
  const feeComparison = railOrder.map((id) => {
    const n = NETWORKS[id];
    return {
      rail: n.name,
      fee: round2(baseFeeOf(id) + Math.max(0.05, amount * 0.001)),
      best: id === netId,
    };
  });

  const investor = {
    routeLogic: [
      `Funding rail: ${input.paymentMethod} tokenized at point of capture.`,
      assetMeta.stable
        ? `Target is a stablecoin — settled directly on ${network.name}.`
        : `Bridged via USDC, then settled to ${assetMeta.name} on ${network.name}.`,
      `${network.name} won on a blended score of fee, speed, and liquidity depth.`,
    ],
    costBreakdown: [
      { label: "Loadit fee (0.75%)", value: formatUSD(loaditFee) },
      { label: "Network settlement", value: formatUSD(networkCost) },
      { label: "You pay", value: formatUSD(total) },
      { label: "Legacy equivalent", value: formatUSD(legacyFee) },
    ],
    settlementAnalysis: `Median settlement on ${network.name} is ${eta} with ${network.liquidityWord} liquidity at this ticket size. Non-custodial release fires on on-chain confirmation; no intermediary holds funds.`,
    feeComparison,
    aiReasoning: `Across 14 networks and ${poolsChecked} liquidity pools, HQ scored each candidate path on real-time fee, expected settlement time, slippage, and liquidity depth. ${network.name} maximized value retained (${savingsPct}% vs. the legacy ${input.paymentMethod.toLowerCase()} rail) without sacrificing settlement assurance.`,
    networkDecisions: [
      ...railOrder
        .filter((id) => id !== netId)
        .slice(0, 3)
        .map(
          (id): RouteResult["investor"]["networkDecisions"][number] => {
            const n = NETWORKS[id];
            return {
              network: n.name,
              status: "rejected",
              reason:
                baseFeeOf(id) > networkFee
                  ? `Higher fees (${formatUSD(baseFeeOf(id))}) at comparable assurance.`
                  : `Thinner liquidity for ${assetMeta.name} at this size.`,
            };
          }
        ),
      {
        network: network.name,
        status: "selected",
        reason: `Best blended fee/speed/liquidity score.`,
      } as RouteResult["investor"]["networkDecisions"][number],
    ],
  };

  return {
    path,
    network,
    loaditFee,
    feePct: LOADIT_FEE_PCT,
    total,
    networkCost,
    legacyFee,
    savingsPct,
    savingsAbs,
    eta,
    successProbability,
    risk: { value: risk, label: riskLabel },
    confidence,
    explanation,
    metrics,
    investor,
  };
}

export function formatUSD(n: number): string {
  if (n < 0.01 && n > 0)
    return `$${n.toFixed(4)}`;
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
