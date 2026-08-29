/**
 * STUB DOORS — card, bank, and the next cash network, behind the SAME door
 * interface as MoneyGram. They bid honest candidate numbers so HQ can score
 * them, but they are not wired to a live provider: create() refuses, and
 * their certification is IN_FLIGHT (an unwired door can never be cleared to
 * confirm real customer money).
 */
import type {
  CertificationStatus,
  DoorCandidate,
  DoorCreateRequest,
  DoorKind,
  PaymentIntent,
} from "../types";
import { BaseDoor } from "./baseDoor";
import { StubDoorError } from "../errors";

interface StubProfile {
  id: string;
  kind: DoorKind;
  label: string;
  feePct: number;
  feeFloorUsd: number;
  etaSeconds: number;
  liquidity: number;
  risk: number;
}

class StubDoor extends BaseDoor {
  readonly id: string;
  readonly kind: DoorKind;
  readonly label: string;

  constructor(private readonly profile: StubProfile) {
    super();
    this.id = profile.id;
    this.kind = profile.kind;
    this.label = profile.label;
  }

  certification(): CertificationStatus {
    return "IN_FLIGHT";
  }

  candidate(intent: PaymentIntent): DoorCandidate | null {
    const p = this.profile;
    return {
      doorId: p.id,
      kind: p.kind,
      label: p.label,
      feeUsd: Math.max(p.feeFloorUsd, intent.amountUsd * p.feePct),
      etaSeconds: p.etaSeconds,
      liquidity: p.liquidity,
      risk: p.risk,
      certification: this.certification(),
      stub: true,
    };
  }

  protected beforeCreate(_req: DoorCreateRequest): void {
    throw new StubDoorError(this.id);
  }
}

export function cardDoorStub(): StubDoor {
  return new StubDoor({
    id: "card_stub",
    kind: "card",
    label: "Card (stub)",
    feePct: 0.029,
    feeFloorUsd: 0.3,
    etaSeconds: 60,
    liquidity: 0.95,
    risk: 0.35,
  });
}

export function bankDoorStub(): StubDoor {
  return new StubDoor({
    id: "bank_stub",
    kind: "bank",
    label: "Bank transfer (stub)",
    feePct: 0.008,
    feeFloorUsd: 0.1,
    etaSeconds: 60 * 60 * 8,
    liquidity: 0.98,
    risk: 0.1,
  });
}

export function nextCashNetworkDoorStub(): StubDoor {
  return new StubDoor({
    id: "next_cash_network_stub",
    kind: "cash_network",
    label: "Next cash network (stub)",
    feePct: 0.0075,
    feeFloorUsd: 1,
    etaSeconds: 20 * 60,
    liquidity: 0.5,
    risk: 0.3,
  });
}
