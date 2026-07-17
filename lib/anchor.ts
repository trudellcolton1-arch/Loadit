/**
 * MoneyGram Ramps anchor endpoints (SEP-1/10/24), by network.
 *
 * Testnet (sandbox) values are the ones MoneyGram provisioned for Loadit; prod
 * values switch in when STELLAR_NETWORK=public. The interactive SEP-24 deposit
 * webview is hosted by MoneyGram — Loadit only authenticates and initiates.
 */
export const MG_ANCHOR = {
  testnet: {
    toml: "https://extmgxanchor.moneygram.com/.well-known/stellar.toml",
    webAuth: "https://extmgxanchor.moneygram.com/stellarsepservice/auth",
    sep24: "https://extmgxanchor.moneygram.com/stellarsepservice/sep24",
    homeDomain: "extmgxanchor.moneygram.com",
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
