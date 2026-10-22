/**
 * MoneyGram Ramps anchor endpoints (SEP-1/10/24), by network.
 *
 * Testnet (sandbox) values are the ones MoneyGram provisioned for Loadit; prod
 * values switch in when STELLAR_NETWORK=public. The interactive SEP-24 deposit
 * webview is hosted by MoneyGram — Loadit only authenticates and initiates.
 */
export const MG_ANCHOR = {
  // extstellar (stellaradapterservice) is the adapter MoneyGram's live wallet
  // partners run on — rates/fees are fully provisioned there, and its
  // interactive URLs carry correct deposit params. The newer extmgxanchor
  // (Anchor Platform + Ramps UI) is mid-migration: root-format URLs, an
  // unprovisioned rate service, and a CDN that mangles /config.js on mobile.
  // Requires SEP-10 client_domain (loadit.net) co-signing — which we do.
  testnet: {
    toml: "https://extstellar.moneygram.com/.well-known/stellar.toml",
    webAuth: "https://extstellar.moneygram.com/stellaradapterservice/auth",
    sep24: "https://extstellar.moneygram.com/stellaradapterservice/sep24",
    homeDomain: "extstellar.moneygram.com",
    usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  public: {
    toml: "https://mgxanchor.moneygram.com/.well-known/stellar.toml",
    webAuth: "https://mgxanchor.moneygram.com/stellarsepservice/auth",
    sep24: "https://mgxanchor.moneygram.com/stellarsepservice/sep24",
    homeDomain: "mgxanchor.moneygram.com",
    usdcIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
} as const;

export type StellarNet = "testnet" | "public";

/** Which Stellar network this deployment runs on. Public only when STELLAR_NETWORK=public. */
export function stellarNetwork(): StellarNet {
  return (process.env.STELLAR_NETWORK || "testnet").toLowerCase() === "public" ? "public" : "testnet";
}

export function mgAnchor() {
  return stellarNetwork() === "public" ? MG_ANCHOR.public : MG_ANCHOR.testnet;
}

export const HORIZON: Record<StellarNet, string> = {
  testnet: "https://horizon-testnet.stellar.org",
  public: "https://horizon.stellar.org",
};

export const NETWORK_PASSPHRASE: Record<StellarNet, string> = {
  testnet: "Test SDF Network ; September 2015",
  public: "Public Global Stellar Network ; September 2015",
};

/** Everything the browser wallet needs to know about the network — no secrets. */
export interface WalletNetworkConfig {
  network: StellarNet;
  horizon: string;
  passphrase: string;
  usdcIssuer: string;
  anchorHomeDomain: string;
  /** True when a server-side funder exists for new accounts (Friendbot on testnet). */
  activationAvailable: boolean;
}

export function walletNetworkConfig(): WalletNetworkConfig {
  const net = stellarNetwork();
  const anchor = net === "public" ? MG_ANCHOR.public : MG_ANCHOR.testnet;
  return {
    network: net,
    horizon: HORIZON[net],
    passphrase: NETWORK_PASSPHRASE[net],
    usdcIssuer: anchor.usdcIssuer,
    anchorHomeDomain: anchor.homeDomain,
    activationAvailable: net === "testnet" ? true : Boolean(process.env.STELLAR_FUNDING_SECRET),
  };
}

/**
 * MoneyGram's rebuilt Ramps UI (extramps/ramps.moneygram.com) routes deposits
 * at /ramps/deposit and withdrawals at /ramps/withdraw, and defaults
 * `operation` to WITHDRAW when absent — but the anchor still hands out bare
 * root URLs (?transaction_id&token), which render a blank page in the new
 * portal. Rewrite to the shape the new UI expects; leave any non-Ramps URL
 * untouched.
 */
export function fixRampsUrl(raw: string, amountUsd?: number, operation: "deposit" | "withdraw" = "deposit"): string {
  try {
    const u = new URL(raw);
    if (!/(^|\.)ramps\.(aws\.)?moneygram\.com$/.test(u.hostname) && !/^(ext)?ramps\.moneygram\.com$/.test(u.hostname)) {
      return raw;
    }
    if (u.pathname !== "/" && u.pathname !== "") return raw; // already routed
    u.pathname = `/ramps/${operation}`;
    if (!u.searchParams.get("operation")) u.searchParams.set("operation", operation);
    if (!u.searchParams.get("asset_code")) u.searchParams.set("asset_code", "USDC");
    if (!u.searchParams.get("lang")) u.searchParams.set("lang", "en");
    if (amountUsd && !u.searchParams.get("amount")) u.searchParams.set("amount", String(amountUsd));
    return u.toString();
  } catch {
    return raw;
  }
}
