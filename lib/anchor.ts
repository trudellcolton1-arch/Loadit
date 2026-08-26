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

export function mgAnchor() {
  const net = (process.env.STELLAR_NETWORK || "testnet").toLowerCase();
  return net === "public" ? MG_ANCHOR.public : MG_ANCHOR.testnet;
}
