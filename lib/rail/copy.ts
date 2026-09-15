/**
 * User-facing cash-cert copy. The machine flag is still IN_FLIGHT until
 * MONEYGRAM_CASH_IN_CERT=CLEARED (5/5). Do not say cert hasn't happened.
 */
export const CASH_CERT_LINE =
  "Cert approved (4/5) — final go-live step pending; cash-in not live yet.";

export const CASH_CERT_GATE =
  `${CASH_CERT_LINE} Refusing to confirm real customer cash until go-live (5/5).`;
