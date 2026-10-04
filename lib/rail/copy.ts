/**
 * User-facing cash-cert copy. Certification with the licensed cash network is
 * COMPLETE (5/5) and cleared for go-live. Consumer cash-in is not live yet —
 * it launches with the production application (the current app is a prototype).
 * So: never say cert is pending/"in flight"/"awaiting"; never say cash-in is
 * available to customers today; always frame it as certified and launching.
 * Never "patented" — patent pending only.
 */
/** The app itself: a prototype exists; the production build is being engineered. */
export const APP_STATUS_LINE =
  "The Loadit app is in development — the production build is being engineered now. Card and cash launch with it; nothing is live for customers yet.";

export const APP_STATUS_SHORT = "Production app in build — launching soon, not live yet.";

export const CASH_CERT_LINE =
  "certification complete (5/5) — launching soon, not live yet.";

export const CASH_CERT_GATE =
  `Certification complete (5/5). This demo never moves real customer cash — consumer cash-in launches with the production build.`;

export const CASH_CERT_NOTICE =
  `Certification complete (5/5). No real customer cash moves here — consumer cash-in launches with the production build.`;
