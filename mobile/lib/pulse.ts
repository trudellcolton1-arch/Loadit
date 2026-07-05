import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { HYLAQ } from "./config";

/**
 * PULSE (offline) — client for Hylaq's offline person-to-person payment engine.
 *
 * Money is locked in escrow while the sender is online; what moves offline is a
 * cryptographically signed *claim* on that escrow, guaranteed to settle the
 * moment either phone touches the internet (same model as offline card taps).
 *
 * This module is the Phase-1 backbone: stable device id, the device-register /
 * manifest-cache / sync API calls, and the local offline claim queue +
 * pending-balance store. Proximity evidence starts with cached GPS + QR handoff;
 * BLE/NFC evidence fields are already in the packet shape for later phases.
 *
 * All endpoints use the same Bearer JWT that wallet sends use
 * (mintApiToken in hylaqWallet.ts) and enforce handleId === token.handleId.
 */

const BASE = (HYLAQ.issuer || "https://www.hylaq.com").replace(/\/$/, "");
const DEVICE_ID_KEY = "loadit_pulse_device_id";
const QUEUE_KEY = "loadit_pulse_queue";

/* ------------------------------------------------------------- device id */

/** Stable per-install device id (persisted). */
export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

/* ------------------------------------------------------------- API types */

export type Platform = "ios" | "android";
export type KeyOrigin = "secure_enclave" | "keystore" | "webcrypto";

export interface RegisterDeviceParams {
  handleId: string;
  deviceId: string;
  platform: Platform;
  /** base64 SPKI of the ECDSA P-256 public key. */
  publicKey: string;
  keyOrigin: KeyOrigin;
  deviceLabel?: string;
  appVersion?: string;
}

/** Evidence gathered at claim time; extra fields feed higher trust scores. */
export interface ProximityEvidence {
  gps?: { lat: number; lng: number; accuracy?: number; capturedAt: number };
  bleRssi?: number;
  bleDeviceId?: string;
  nfcTag?: string;
  qr?: boolean;
  beaconToken?: string;
}

export interface ClaimPacket {
  pulseId: string;
  handleId: string;
  deviceId: string;
  nonce: string;
  monotonicClock: number;
  evidence: ProximityEvidence;
  integritySignals: {
    appIntegrityToken?: string;
    isRooted?: boolean;
    isEmulator?: boolean;
    mockLocation?: boolean;
  };
  /** base64 signature of the packet body by the device key. */
  signature?: string;
  amountUsd?: number;
  createdAt: number;
}

export interface SyncResult {
  nonce: string;
  status: "accepted" | "rejected" | "conflict";
  verificationResult?: "valid" | "suspicious" | "invalid" | "expired";
  resolutionOutcome?: string;
}

/* ------------------------------------------------------------- API calls */

async function authed<T>(method: "GET" | "POST", path: string, token: string, body?: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      console.warn(`[pulse] ${method} ${path} -> ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[pulse] ${method} ${path} failed`, String(e));
    return null;
  }
}

/** Register this device's public key with Hylaq (once, while online). */
export async function registerDevice(token: string, p: RegisterDeviceParams) {
  return authed<{ id: string; registered: boolean; serverTime: string }>(
    "POST",
    "/api/wallet/pulse-offline/device",
    token,
    p
  );
}

/** Pre-cache a pulse's signed manifest (unlock rules) for offline verification. */
export async function cacheManifest(
  token: string,
  q: { pulseId: string; handleId: string; deviceId: string; currentVersion?: number }
) {
  const params = new URLSearchParams({
    pulseId: q.pulseId,
    handleId: q.handleId,
    deviceId: q.deviceId,
    currentVersion: String(q.currentVersion ?? 0),
  });
  return authed<{ manifest: unknown; notModified: boolean; serverTime: string }>(
    "GET",
    `/api/wallet/pulse-offline/manifest?${params.toString()}`,
    token
  );
}

/** Upload queued claim packets (max 10) — where USDC leaves escrow. */
export async function syncPackets(token: string, packets: ClaimPacket[], deviceId: string, handleId: string) {
  return authed<{ results: SyncResult[]; serverTime: string }>(
    "POST",
    "/api/wallet/pulse-offline/sync",
    token,
    { packets: packets.slice(0, 10), deviceId, handleId }
  );
}

/* ------------------------------------------ local offline claim queue */

/** Read the locally-queued (not-yet-synced) claim packets. */
export async function readQueue(): Promise<ClaimPacket[]> {
  try {
    const raw = await SecureStore.getItemAsync(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ClaimPacket[]) : [];
  } catch {
    return [];
  }
}

async function writeQueue(q: ClaimPacket[]) {
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(q.slice(-50)));
}

/** Queue a signed claim packet locally; the UI shows it as pending immediately. */
export async function enqueueClaim(packet: ClaimPacket): Promise<void> {
  const q = await readQueue();
  if (q.some((p) => p.nonce === packet.nonce)) return;
  q.push(packet);
  await writeQueue(q);
}

/** Remove packets that have settled (by nonce). */
export async function clearSettled(nonces: string[]): Promise<void> {
  const set = new Set(nonces);
  const q = (await readQueue()).filter((p) => !set.has(p.nonce));
  await writeQueue(q);
}

/** Sum of USD across still-pending claims — the local "+$X incoming" total. */
export async function pendingTotal(): Promise<number> {
  const q = await readQueue();
  return q.reduce((s, p) => s + (p.amountUsd || 0), 0);
}
