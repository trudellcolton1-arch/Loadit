import { AppState, type AppStateStatus } from "react-native";
import { startAdvertising } from "./pulseBle";
import { ingestPayload } from "./pulseInbox";
import type { PulseNote } from "./pulseClaim";

/**
 * GLOBAL PULSE PRESENCE — a singleton that keeps this phone discoverable and
 * receiving for as long as the app is running, no matter which screen is open.
 * Incoming notes are ingested into the offline queue and broadcast to any UI
 * listeners so a "+$X arrived" can surface anywhere. Re-arms on foreground.
 */

export interface PulseReceivedEvent {
  amount: number;
  from?: string;
  note: PulseNote;
}

type Listener = (e: PulseReceivedEvent) => void;

const listeners = new Set<Listener>();
let cleanup: (() => void) | null = null;
let current: { handleId: string; handle: string } | null = null;
let appStateSub: { remove: () => void } | null = null;

export function onPulseReceived(cb: Listener): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

async function arm() {
  if (!current) return;
  cleanup?.();
  cleanup = await startAdvertising(current.handle, {
    onNote: async (payload) => {
      const note = await ingestPayload(payload, current!.handleId);
      if (note) listeners.forEach((l) => l({ amount: note.amountUsd, from: note.from.handle, note }));
    },
  });
}

/** Begin being discoverable as this handle. Idempotent; safe to call on login. */
export async function startGlobalPresence(handleId: string, handle: string): Promise<void> {
  const same = current && current.handleId === handleId && current.handle === handle;
  current = { handleId, handle };
  if (!same) await arm();
  if (!appStateSub) {
    appStateSub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s === "active") arm();
    });
  }
}

export async function stopGlobalPresence(): Promise<void> {
  cleanup?.();
  cleanup = null;
  current = null;
  appStateSub?.remove();
  appStateSub = null;
}
