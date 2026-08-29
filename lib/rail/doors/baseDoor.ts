/**
 * Shared door mechanics: in-memory intake registry, idempotent create,
 * webhook handling with the certification hard gate.
 *
 * The certification gate lives HERE, in the base class, so no door can
 * forget it: a door whose certification() is not CLEARED refuses to confirm
 * an intake, period. Partner transaction ids are only ever copied from the
 * webhook event — nothing in this class or its subclasses mints one.
 */
import type {
  CertificationStatus,
  DoorAdapter,
  DoorCandidate,
  DoorCreateRequest,
  DoorIntake,
  DoorKind,
  DoorWebhookEvent,
  PaymentIntent,
} from "../types";
import { CertificationGateError } from "../errors";
import { newInternalRef } from "../ids";

export abstract class BaseDoor implements DoorAdapter {
  abstract readonly id: string;
  abstract readonly kind: DoorKind;
  abstract readonly label: string;

  private readonly intakes = new Map<string, DoorIntake>();
  private readonly byIdempotencyKey = new Map<string, string>();
  /** How many intakes were actually created (replays excluded) — for tests. */
  createCalls = 0;

  abstract certification(): CertificationStatus;
  abstract candidate(intent: PaymentIntent): DoorCandidate | null;

  /** Human instructions attached to a fresh intake (door-specific). */
  protected instructions(_req: DoorCreateRequest): string | undefined {
    return undefined;
  }

  /** Hook for doors that must refuse creation outright (e.g. stubs). */
  protected beforeCreate(_req: DoorCreateRequest): void {}

  async create(req: DoorCreateRequest): Promise<DoorIntake> {
    const existingRef = this.byIdempotencyKey.get(req.idempotencyKey);
    if (existingRef) return this.intakes.get(existingRef)!;

    this.beforeCreate(req);
    this.createCalls += 1;
    const intake: DoorIntake = {
      internalRef: newInternalRef(),
      doorId: this.id,
      paymentId: req.paymentId,
      amountUsd: req.amountUsd,
      status: "pending",
      partnerTxId: null,
      createdAt: new Date().toISOString(),
      instructions: this.instructions(req),
    };
    this.intakes.set(intake.internalRef, intake);
    this.byIdempotencyKey.set(req.idempotencyKey, intake.internalRef);
    return intake;
  }

  async status(internalRef: string): Promise<DoorIntake> {
    const intake = this.intakes.get(internalRef);
    if (!intake) throw new Error(`unknown intake ${internalRef} at door ${this.id}`);
    return intake;
  }

  async webhook(event: DoorWebhookEvent): Promise<DoorIntake> {
    const intake = await this.status(event.internalRef);
    if (event.type === "intake_confirmed") {
      if (this.certification() !== "CLEARED") {
        throw new CertificationGateError(
          this.id,
          `${this.label}: certification is IN FLIGHT — refusing to confirm real customer money. ` +
            `The intake stays pending until the owner explicitly clears certification for this door.`
        );
      }
      intake.status = "confirmed";
      // Partner tx id comes from the partner's webhook or not at all.
      if (event.partnerTxId) intake.partnerTxId = event.partnerTxId;
    } else if (event.type === "intake_failed") {
      intake.status = "failed";
    }
    return intake;
  }

  async cancel(internalRef: string): Promise<DoorIntake> {
    const intake = await this.status(internalRef);
    if (intake.status === "pending") intake.status = "cancelled";
    return intake;
  }
}
