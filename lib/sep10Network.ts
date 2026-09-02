import { Networks, type Transaction } from "@stellar/stellar-sdk";
import { MG_ANCHOR } from "./anchor";

/** MoneyGram production home_domain — public-network SEP-10 only. */
export const MONEYGRAM_PRODUCTION_HOME_DOMAIN = MG_ANCHOR.public.homeDomain;

export const PUBLIC_PASSPHRASE = Networks.PUBLIC;
export const TESTNET_PASSPHRASE = Networks.TESTNET;

/**
 * Pick the Stellar network passphrase for a SEP-10 client_domain co-sign.
 *
 * Public passphrase is used only for MoneyGram production
 * (mgxanchor.moneygram.com). Sandbox / playground / extstellar stay on
 * testnet so we do not break testnet SEP-10 when the canonical stellar.toml
 * is the public-network file.
 */
export function passphraseForHomeDomain(homeDomain: string | null | undefined): string {
  const host = (homeDomain || "").trim().toLowerCase();
  if (host === MONEYGRAM_PRODUCTION_HOME_DOMAIN) return PUBLIC_PASSPHRASE;
  return TESTNET_PASSPHRASE;
}

/** First ManageData op on a SEP-10 challenge is "<home_domain> auth". */
export function homeDomainFromChallenge(tx: Transaction): string | null {
  const first = tx.operations[0];
  if (!first || first.type !== "manageData") return null;
  const name = first.name || "";
  if (!name.endsWith(" auth")) return null;
  const domain = name.slice(0, -" auth".length).trim();
  return domain || null;
}

export function passphraseForChallenge(tx: Transaction): string {
  return passphraseForHomeDomain(homeDomainFromChallenge(tx));
}
