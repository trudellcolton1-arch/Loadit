import { sha256 } from "@noble/hashes/sha256";
import { getDeviceId, type ProximityEvidence, type ClaimPacket, type PulseManifest } from "./pulse";
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

// v2: the signature now also commits to the manifest + evidence (v1 left them
// unsigned, so a relay could strip/swap them). Bumped so a v1 note cleanly
// fails verification on a v2 phone instead of mis-verifying.
export const PULSE_PROTOCOL = 2;

/** Largest single Pulse we'll accept as a sanity bound on decoded notes. */
const MAX_PULSE_USD = 100_000;

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
  /** Hylaq's LOCKED escrow id (drop.id) — what the claim settles against. */
  pulseId?: string;
  /** The signed manifest Hylaq generated, beamed so the receiver claims offline. */
  manifest?: PulseManifest;
  evidence?: ProximityEvidence;
  /** base64 DER signature over canonicalBody(note) by the sender device key. */
  sig: string;
}

/** Deterministic bytes both phones sign/verify — everything but the signature.
 * Includes a hash of the manifest + evidence so the signature commits to them
 * and a BLE relay can't strip or swap either without invalidating the note. */
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
    n.pulseId ?? "",
    n.manifest ? sha256Hex(JSON.stringify(n.manifest)) : "",
    n.evidence ? sha256Hex(JSON.stringify(n.evidence)) : "",
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
  pulseId?: string;
  manifest?: PulseManifest;
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
    pulseId: p.pulseId,
    manifest: p.manifest,
    evidence: p.evidence,
  };
  const sig = await signBase64(canonicalBody(body));
  return { ...body, sig };
}

/** hex SHA-256 of a UTF-8 string (no TextEncoder — Hermes lacks it). */
function sha256Hex(s: string): string {
  const bytes: number[] = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.charCodeAt(i);
    if (c < 0x80) bytes.push(c);
    else if (c < 0x800) bytes.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
    else if (c >= 0xd800 && c <= 0xdbff) {
      c = 0x10000 + ((c & 0x3ff) << 10) + (s.charCodeAt(++i) & 0x3ff);
      bytes.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 0x3f), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
    } else bytes.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
  }
  const h = sha256(Uint8Array.from(bytes));
  let out = "";
  for (let i = 0; i < h.length; i++) out += h[i].toString(16).padStart(2, "0");
  return out;
}

/** Verify a received note's signature against the sender key it carries. */
export function verifyPulseNote(n: PulseNote): boolean {
  if (!n || n.v !== PULSE_PROTOCOL || !n.from?.pub || !n.sig) return false;
  // Type-check the amount (a string "100" passes `> 0` but corrupts sums).
  if (typeof n.amountUsd !== "number" || !Number.isFinite(n.amountUsd)) return false;
  if (n.amountUsd <= 0 || n.amountUsd > MAX_PULSE_USD) return false;
  // A note with no escrow id can never settle — reject it rather than let it
  // show as phantom "+$X pending" that a receiver mistakes for real money.
  if (!n.pulseId || typeof n.pulseId !== "string") return false;
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
  // Invariant: only verified notes reach here, and verifyPulseNote rejects any
  // without a pulseId — but guard so a future caller can't create a phantom.
  if (!n.pulseId) throw new Error("note has no pulseId");
  const man = n.manifest;
  // payloadHash: prefer the value Hylaq put in the manifest; else derive it from
  // the manifest payloads with the same canonicalization the server uses.
  const payloadHash = man?.payloadHash
    ?? (man?.payloads !== undefined ? sha256Hex(JSON.stringify(man.payloads)) : undefined);
  const packet: Omit<ClaimPacket, "signature"> = {
    pulseId: n.pulseId, // guaranteed present (verifyPulseNote rejects notes without it)
    handleId: collectorHandleId,
    deviceId,
    nonce: n.id,
    monotonicClock,
    manifestId: man?.id,
    manifestVersion: man?.version,
    payloadHash,
    evidence: { ...(n.evidence || {}), beaconToken: n.sig },
    integritySignals: {},
    amountUsd: n.amountUsd,
    createdAt: n.createdAt,
  };
  const signature = await signBase64(JSON.stringify(packet));
  return { ...packet, signature };
}
