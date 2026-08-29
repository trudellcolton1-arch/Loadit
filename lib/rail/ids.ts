/**
 * Internal reference ids for the rail runtime.
 *
 * HARD RULE: this runtime never invents partner/production transaction ids.
 * Everything minted here is a Loadit-internal reference with an unmistakable
 * prefix, so nothing generated locally can ever be mistaken for (or presented
 * as) a MoneyGram / anchor / bank transaction id. Partner ids only ever
 * arrive via a partner webhook and are stored verbatim in `partnerTxId`.
 */

/** Isomorphic UUID (Node ≥19 and every modern browser expose crypto.randomUUID). */
function randomUUID(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Non-cryptographic fallback for exotic runtimes — internal refs only.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/** Prefix for every Loadit-internal reference. */
export const INTERNAL_REF_PREFIX = "ldi_";

export function newPaymentId(): string {
  return `pay_${randomUUID()}`;
}

export function newQuoteId(): string {
  return `q_${randomUUID()}`;
}

export function newRouteId(): string {
  return `route_${randomUUID()}`;
}

/** A Loadit-internal reference — NOT a partner transaction id. */
export function newInternalRef(): string {
  return `${INTERNAL_REF_PREFIX}${randomUUID()}`;
}

/** True when an id was minted by this runtime (vs. a partner system). */
export function isInternalRef(id: string): boolean {
  return id.startsWith(INTERNAL_REF_PREFIX);
}
