/** Typed failures for the rail runtime. */
import type { PaymentState } from "./stateMachine";

/**
 * Raised when a door is asked to confirm real customer money while its
 * certification is still IN FLIGHT. This is a hard gate, not a warning.
 */
export class CertificationGateError extends Error {
  readonly doorId: string;
  constructor(doorId: string, message: string) {
    super(message);
    this.name = "CertificationGateError";
    this.doorId = doorId;
  }
}

/** Raised by doors that exist behind the interface but are not wired yet. */
export class StubDoorError extends Error {
  constructor(doorId: string) {
    super(`door "${doorId}" is a stub behind the door interface — not wired to a live provider`);
    this.name = "StubDoorError";
  }
}

/** Raised when the scorer finds no route satisfying the intent. */
export class NoViableRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NoViableRouteError";
  }
}

/** Raised when acting on a quote past its TTL. */
export class QuoteExpiredError extends Error {
  constructor(quoteId: string) {
    super(`quote ${quoteId} expired — re-score for a fresh quote (same payment id)`);
    this.name = "QuoteExpiredError";
  }
}

/** Raised on a transition the state machine does not allow. */
export class IllegalTransitionError extends Error {
  readonly from: PaymentState;
  readonly to: PaymentState;
  constructor(from: PaymentState, to: PaymentState) {
    super(`illegal payment transition: ${from} → ${to}`);
    this.name = "IllegalTransitionError";
    this.from = from;
    this.to = to;
  }
}

/** A downstream pipe (converter, payout rail, anchor) died mid-flight. */
export class DeadPipeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeadPipeError";
  }
}

/**
 * Raised when Heal is asked to run on a payment it cannot recover —
 * a cert-in-flight confirm refusal, or any state that is not a failed
 * payment. The payment is left untouched (same id, same quote, same error).
 */
export class HealRefusedError extends Error {
  readonly refusal: "certification_gate" | "illegal_transition";
  constructor(refusal: "certification_gate" | "illegal_transition", message: string) {
    super(message);
    this.name = "HealRefusedError";
    this.refusal = refusal;
  }
}
