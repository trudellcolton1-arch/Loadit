import { decodeNote, verifyPulseNote, noteToClaimPacket, type PulseNote } from "./pulseClaim";
import { readQueue, enqueueClaim } from "./pulse";

/**
 * One place to accept an incoming note payload — from BLE, QR, whatever. Decodes,
 * verifies the signature offline, dedupes against the queue, and enqueues the
 * claim. Returns the note if it was newly accepted (so the UI can celebrate it),
 * or null if invalid/duplicate.
 */
export async function ingestPayload(payload: string, collectorHandleId: string): Promise<PulseNote | null> {
  const n = decodeNote(payload);
  if (!n || !verifyPulseNote(n)) return null;
  const q = await readQueue();
  if (q.some((p) => p.nonce === n.id)) return null;
  const packet = await noteToClaimPacket(n, collectorHandleId, Date.now());
  await enqueueClaim(packet);
  return n;
}
