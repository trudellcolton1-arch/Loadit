/**
 * AFFILIATE PROVIDER REGISTRY
 *
 * Loadit's router is a non-custodial *recommendation* engine: HQ computes the
 * cheapest path, and we hand the user off to a real provider to complete it.
 * Each click-through carries our referral code, which is how this page earns
 * revenue without holding funds or needing a money-transmitter license.
 *
 * ⚠️ SWAP THE PLACEHOLDER REFERRAL CODES BELOW for your real ones before going
 * live. Sign up for each program (links in `signup`), drop your code into
 * `ref`, and the CTA links update automatically.
 */
import type { Asset, PaymentMethod } from "./aero";

export interface Provider {
  id: string;
  name: string;
  kind: "On-ramp" | "Exchange" | "Remittance";
  blurb: string;
  /** Funding methods this provider handles well. */
  methods: PaymentMethod[];
  /** Supported target assets, or "all". */
  assets: Asset[] | "all";
  /** Typical affiliate payout — for your reference, not shown to users. */
  payout: string;
  /** Where you sign up for their affiliate/referral program. */
  signup: string;
  /** Affiliate link template — {REF} is replaced with `ref`. */
  url: string;
  /** Your referral code. Replace the placeholders. */
  ref: string;
  /** Relative fit weight when multiple providers match (higher = preferred). */
  weight: number;
}

export const PROVIDERS: Provider[] = [
  {
    id: "moonpay",
    name: "MoonPay",
    kind: "On-ramp",
    blurb: "Card & Apple Pay to crypto in minutes, 160+ countries.",
    methods: ["Debit Card", "Credit Card"],
    assets: "all",
    payout: "~1% of order / rev-share",
    signup: "https://www.moonpay.com/business/affiliate",
    url: "https://www.moonpay.com/buy?ref={REF}",
    ref: "YOUR_MOONPAY_REF",
    weight: 8,
  },
  {
    id: "transak",
    name: "Transak",
    kind: "On-ramp",
    blurb: "Bank & card on-ramp with low fees and wide asset support.",
    methods: ["Debit Card", "Credit Card", "Bank Transfer"],
    assets: "all",
    payout: "Up to 0.5–1% rev-share",
    signup: "https://transak.com/partners",
    url: "https://global.transak.com/?ref={REF}",
    ref: "YOUR_TRANSAK_REF",
    weight: 7,
  },
  {
    id: "coinbase",
    name: "Coinbase",
    kind: "Exchange",
    blurb: "Trusted US exchange — bank transfers, deep liquidity.",
    methods: ["Bank Transfer", "Debit Card"],
    assets: ["BTC", "ETH", "SOL", "USDC", "XRP"],
    payout: "$10+ per funded signup",
    signup: "https://www.coinbase.com/affiliates",
    url: "https://www.coinbase.com/join/{REF}",
    ref: "YOUR_COINBASE_REF",
    weight: 9,
  },
  {
    id: "kraken",
    name: "Kraken",
    kind: "Exchange",
    blurb: "Low-fee exchange, strong for bank funding & stablecoins.",
    methods: ["Bank Transfer"],
    assets: ["BTC", "ETH", "SOL", "USDC", "USDT", "XRP"],
    payout: "Rev-share on trading fees",
    signup: "https://www.kraken.com/features/affiliate-program",
    url: "https://www.kraken.com/sign-up?ref={REF}",
    ref: "YOUR_KRAKEN_REF",
    weight: 6,
  },
  {
    id: "wise",
    name: "Wise",
    kind: "Remittance",
    blurb: "Cheapest way to send fiat across borders at the real rate.",
    methods: ["Bank Transfer", "Debit Card"],
    assets: ["USDC", "USDT"],
    payout: "Per-invite bounty",
    signup: "https://wise.com/invite",
    url: "https://wise.com/invite/u/{REF}",
    ref: "YOUR_WISE_REF",
    weight: 5,
  },
];

export interface ProviderMatch extends Provider {
  href: string;
  /** True if the referral code hasn't been set yet. */
  needsSetup: boolean;
}

function supports(p: Provider, method: PaymentMethod, asset: Asset): boolean {
  const methodOk = p.methods.includes(method);
  const assetOk = p.assets === "all" || p.assets.includes(asset);
  return methodOk && assetOk;
}

/** Rank matching providers for a given funding method + target asset. */
export function matchProviders(
  method: PaymentMethod,
  asset: Asset
): ProviderMatch[] {
  return PROVIDERS.filter((p) => supports(p, method, asset))
    .sort((a, b) => b.weight - a.weight)
    .map((p) => ({
      ...p,
      href: p.url.replace("{REF}", p.ref),
      needsSetup: p.ref.startsWith("YOUR_"),
    }));
}
