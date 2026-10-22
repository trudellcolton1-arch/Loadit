import type { Transaction } from "@stellar/stellar-sdk";

/** The wallet's client_domain — the SIGNING_KEY in loadit.net/.well-known/stellar.toml attests it. */
export const CLIENT_DOMAIN = process.env.LOADIT_CLIENT_DOMAIN || "loadit.net";

/**
 * Validate an anchor's SEP-10 challenge before the server co-signs it:
 *  - sequence number must be 0 (challenge txs are never submitted)
 *  - the first op must be a ManageData auth op ("<home_domain> auth")
 *  - there must be a `client_domain` ManageData op whose value is OUR domain
 * The server never signs anything that isn't clearly a challenge asking for
 * loadit.net's client_domain attestation — that is what stops the co-sign
 * endpoint being abused to sign an arbitrary transaction.
 */
export function validateClientDomainChallenge(tx: Transaction): { ok: true } | { ok: false; reason: string } {
  if (tx.sequence !== "0") return { ok: false, reason: "not_a_challenge" };
  const ops = tx.operations;
  if (!ops.length) return { ok: false, reason: "no_operations" };
  if (ops[0].type !== "manageData") return { ok: false, reason: "bad_challenge_shape" };
  if (!(ops[0].name || "").endsWith(" auth")) return { ok: false, reason: "bad_challenge_shape" };

  let hasClientDomain = false;
  for (const op of ops) {
    if (op.type !== "manageData") continue;
    if (op.name === "client_domain") {
      const val = op.value ? op.value.toString("utf8") : "";
      if (val !== CLIENT_DOMAIN) return { ok: false, reason: "wrong_client_domain" };
      hasClientDomain = true;
    }
  }
  if (!hasClientDomain) return { ok: false, reason: "no_client_domain_op" };
  return { ok: true };
}
