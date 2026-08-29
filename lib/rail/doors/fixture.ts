/**
 * FIXTURE DOOR — a fully controllable door for tests and the DEMO console.
 *
 * Same interface, same BaseDoor certification gate as the real doors: a
 * fixture door with certification IN_FLIGHT refuses to confirm, exactly like
 * MoneyGram. Tests flip the flag explicitly; nothing clears itself.
 */
import type {
  CertificationStatus,
  DoorCandidate,
  DoorCreateRequest,
  DoorKind,
  PaymentIntent,
} from "../types";
import { BaseDoor } from "./baseDoor";
import { DeadPipeError } from "../errors";

export interface FixtureDoorOptions {
  id: string;
  kind?: DoorKind;
  label?: string;
  feeUsd?: number;
  etaSeconds?: number;
  liquidity?: number;
  risk?: number;
  /** Defaults to IN_FLIGHT — clearing certification is always explicit. */
  certification?: CertificationStatus;
}

export class FixtureDoor extends BaseDoor {
  readonly id: string;
  readonly kind: DoorKind;
  readonly label: string;

  private cert: CertificationStatus;
  private failNextCreate: string | null = null;
  private readonly fixture: Required<
    Pick<FixtureDoorOptions, "feeUsd" | "etaSeconds" | "liquidity" | "risk">
  >;

  constructor(opts: FixtureDoorOptions) {
    super();
    this.id = opts.id;
    this.kind = opts.kind ?? "cash";
    this.label = opts.label ?? `${opts.id} (fixture)`;
    this.cert = opts.certification ?? "IN_FLIGHT";
    this.fixture = {
      feeUsd: opts.feeUsd ?? 1,
      etaSeconds: opts.etaSeconds ?? 300,
      liquidity: opts.liquidity ?? 0.8,
      risk: opts.risk ?? 0.2,
    };
  }

  certification(): CertificationStatus {
    return this.cert;
  }

  /** Explicit flip — the only way a fixture door's cert changes. */
  setCertification(status: CertificationStatus): void {
    this.cert = status;
  }

  /** Make the next create() die mid-pipe (heal tests). */
  killNextCreate(reason = "fixture intake pipe died"): void {
    this.failNextCreate = reason;
  }

  candidate(intent: PaymentIntent): DoorCandidate | null {
    void intent;
    return {
      doorId: this.id,
      kind: this.kind,
      label: this.label,
      feeUsd: this.fixture.feeUsd,
      etaSeconds: this.fixture.etaSeconds,
      liquidity: this.fixture.liquidity,
      risk: this.fixture.risk,
      certification: this.cert,
    };
  }

  protected beforeCreate(_req: DoorCreateRequest): void {
    if (this.failNextCreate) {
      const reason = this.failNextCreate;
      this.failNextCreate = null;
      throw new DeadPipeError(reason);
    }
  }
}
