/**
 * MONEYGRAM CASH DOOR — the first real door behind the adapter interface.
 *
 * STATUS (do not soften this): MoneyGram cash-in is NOT live. Certification
 * is still in flight with MoneyGram (Tim Dugan). Until the owner explicitly
 * sets MONEYGRAM_CASH_IN_CERT=CLEARED, this door will open intakes (plan,
 * quote, reference instructions) but it will REFUSE to confirm real customer
 * cash — the certification gate in BaseDoor throws before any confirm.
 *
 * The default is IN_FLIGHT. Unset, empty, or any other value = IN_FLIGHT.
 *
 * No fake transaction ids: intakes carry a Loadit-internal `ldi_…` reference
 * only. `partnerTxId` stays null until MoneyGram's anchor webhook delivers a
 * real one. This module never generates one, in any environment.
 *
 * Route planning reuses lib/moneygram.ts (planMoneyGram) — the same cash →
 * USDC-on-Stellar → HQ-swap plan the rest of the site describes, kept
 * non-custodial: MoneyGram is the licensed money transmitter, HQ orchestrates,
 * Loadit never holds keys or funds.
 */
import { planMoneyGram, MONEYGRAM_LOCATIONS } from "../../moneygram";
import type {
  CertificationStatus,
  DoorCandidate,
  DoorCreateRequest,
  DoorKind,
  PaymentIntent,
} from "../types";
import { BaseDoor } from "./baseDoor";
import { calcLoaditFee } from "../../aero";

export const MONEYGRAM_CERT_ENV = "MONEYGRAM_CASH_IN_CERT";

/**
 * Owner/cert flag. IN_FLIGHT unless the env var is exactly "CLEARED"
 * (case-insensitive) — an explicit act by the owner, never a default.
 */
export function moneygramCertification(): CertificationStatus {
  const flag = (process.env[MONEYGRAM_CERT_ENV] || "").trim().toUpperCase();
  return flag === "CLEARED" ? "CLEARED" : "IN_FLIGHT";
}

export interface MoneyGramDoorOptions {
  /** Test-only certification override. Production reads the env flag. */
  certification?: () => CertificationStatus;
}

export class MoneyGramDoor extends BaseDoor {
  readonly id = "moneygram_cash";
  readonly kind: DoorKind = "cash";
  readonly label = "MoneyGram (cash)";

  constructor(private readonly opts: MoneyGramDoorOptions = {}) {
    super();
  }

  certification(): CertificationStatus {
    return this.opts.certification?.() ?? moneygramCertification();
  }

  candidate(intent: PaymentIntent): DoorCandidate | null {
    // Cash intake estimate: Loadit's 0.75% ($1 min) convenience fee; the
    // licensed MoneyGram leg's own pricing is surfaced at the counter.
    return {
      doorId: this.id,
      kind: this.kind,
      label: this.label,
      feeUsd: calcLoaditFee(intent.amountUsd),
      etaSeconds: 15 * 60, // walk to a counter, hand over cash
      liquidity: 0.9, // 350,000+ locations
      risk: 0.25, // cash carries more intake risk than bank rails
      certification: this.certification(),
    };
  }

  protected instructions(req: DoorCreateRequest): string {
    const plan = planMoneyGram(req.amountUsd, req.asset, "");
    const firstStep = plan.steps[0]?.detail ?? "";
    const gate =
      this.certification() === "CLEARED"
        ? ""
        : " NOTE: MoneyGram cash-in certification is in flight — this intake cannot be confirmed with real customer cash yet.";
    return `Cash intake at any of ${MONEYGRAM_LOCATIONS} MoneyGram locations. ${firstStep}${gate}`;
  }
}
