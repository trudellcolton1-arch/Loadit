import { getDeviceId, type ProximityEvidence, type ClaimPacket } from "./pulse";
import { publicKeySpkiBase64, signBase64, verifyBase64 } from "./deviceKey";

/**
 * PULSE NOTE — the offline money envelope.
 *
 * When there is no internet, this is what actually moves between two phones
 * (over QR today, BLE/NFC as the tap layer). The sender's device key signs it;
 * the receiver verifies the signature against the sender's public key carried
 * INSIDE the note, so trust needs no server at the moment of handoff. The note
 * is a claim on money the sender locked in escrow while last online — it settles
 * the instant either phone touches the internet again (`syncPackets`).
 *
 * The signable body is a deterministic, fixed-order string so both phones hash
 * exactly the same bytes.
 */

export const PULSE_PROTOCOL = 1;

export interface PulseNote {
  v: number;
  /** unique note id — doubles as the settlement nonce. */
  id: string;
  from: {
    handle?: string;
    handleId?: string;
    deviceId: string;
    /** base64 SPKI of the sender's device public key. */
    pub: string;
  };
  /** recipient handle hint (optional — a note can be bearer/cash-like). */
  to?: string;
  amountUsd: number;
  asset: string;
  memo?: string;
  createdAt: number;
  evidence?: ProximityEvidence;
  /** base64 DER signature over canonicalBody(note) by the sender device key. */
  sig: string;
}

/** Deterministic bytes both phones sign/verify — everything but the signature. */
function canonicalBody(n: Omit<PulseNote, "sig">): string {
  return JSON.stringify([
    n.v,
    n.id,
    n.from.handle ?? "",
    n.from.handleId ?? "",
    n.from.deviceId,
    n.from.pub,
    n.to ?? "",
    n.amountUsd,
    n.asset,
    n.memo ?? "",
    n.createdAt,
  ]);
}

/** A short, collision-resistant id without needing crypto.randomUUID everywhere. */
async function noteId(deviceId: string, createdAt: number): Promise<string> {
  // deviceId is already random+stable; combine with time + a signed nonce tail.
  const tail = await signBase64(`${deviceId}:${createdAt}`);
  return `pn_${createdAt.toString(36)}_${tail.replace(/[^A-Za-z0-9]/g, "").slice(0, 12)}`;
}

export interface MakeNoteParams {
  fromHandle?: string;
  fromHandleId?: string;
  amountUsd: number;
  asset?: string;
  memo?: string;
  to?: string;
  createdAt: number; // caller supplies the clock (Date.now unavailable in some contexts)
  evidence?: ProximityEvidence;
}

/** Build + sign a Pulse note ready to beam. */
export async function makePulseNote(p: MakeNoteParams): Promise<PulseNote> {
  const deviceId = await getDeviceId();
  const pub = await publicKeySpkiBase64();
  const id = await noteId(deviceId, p.createdAt);
  const body: Omit<PulseNote, "sig"> = {
    v: PULSE_PROTOCOL,
    id,
    from: { handle: p.fromHandle, handleId: p.fromHandleId, deviceId, pub },
    to: p.to,
    amountUsd: Math.round(p.amountUsd * 100) / 100,
    asset: p.asset || "USDC",
    memo: p.memo,
    createdAt: p.createdAt,
    evidence: p.evidence,
  };
  const sig = await signBase64(canonicalBody(body));
  return { ...body, sig };
}

/** Verify a received note's signature against the sender key it carries. */
export function verifyPulseNote(n: PulseNote): boolean {
  if (!n || n.v !== PULSE_PROTOCOL || !n.from?.pub || !n.sig) return false;
  if (!(n.amountUsd > 0)) return false;
  const { sig, ...body } = n;
  return verifyBase64(canonicalBody(body), sig, n.from.pub);
}

/* ------------------------------------------------------------ QR wire format */

const PREFIX = "LOADIT-PULSE:";

/** Encode a note for a QR code / BLE payload (URL-safe, no server needed). */
export function encodeNote(n: PulseNote): string {
  return PREFIX + encodeURIComponent(JSON.stringify(n));
}

/** Decode a scanned/received payload back into a note (null if not ours). */
export function decodeNote(raw: string): PulseNote | null {
  try {
    const s = raw.trim();
    if (!s.startsWith(PREFIX)) return null;
    return JSON.parse(decodeURIComponent(s.slice(PREFIX.length))) as PulseNote;
  } catch {
    return null;
  }
}

/* --------------------------------------------- map a note → a claim packet */

/**
 * Turn a note the receiver accepted into the ClaimPacket the sync endpoint
 * settles. The collector signs the packet with THEIR device key (attesting they
 * are the one redeeming it); the sender's original note travels in evidence so
 * the server can match it to the escrow lock.
 */
export async function noteToClaimPacket(
  n: PulseNote,
  collectorHandleId: string,
  monotonicClock: number
): Promise<ClaimPacket> {
  const deviceId = await getDeviceId();
  const packet: Omit<ClaimPacket, "signature"> = {
    pulseId: n.id,
    handleId: collectorHandleId,
    deviceId,
    nonce: n.id,
    monotonicClock,
    evidence: { ...(n.evidence || {}), beaconToken: n.sig },
    integritySignals: {},
    amountUsd: n.amountUsd,
    createdAt: n.createdAt,
  };
  const signature = await signBase64(JSON.stringify(packet));
  return { ...packet, signature };
}
