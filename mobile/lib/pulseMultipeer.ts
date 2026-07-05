import { Platform } from "react-native";
import * as MP from "@/modules/pulse-multipeer";

/**
 * PULSE TAP — offline phone-to-phone handoff over MultipeerConnectivity.
 *
 * `hostNote` (sender) advertises and, the instant a peer connects, pushes the
 * signed note. `receiveNote` (receiver) browses, auto-invites the first Loadit
 * peer it sees, and surfaces the note when it arrives. Both return a cleanup
 * function that tears the session down. If the native module isn't present the
 * caller should fall back to QR (`tapAvailable()` tells you up front).
 */

export function tapAvailable(): boolean {
  // iOS ships MultipeerConnectivity; Android tap lands with the Nearby module.
  return Platform.OS === "ios" && MP.isMultipeerAvailable();
}

export interface HostHandlers {
  onStatus: (s: string) => void;
  onSent: () => void;
  onError: (m: string) => void;
}

/** Sender: advertise, then beam the payload the moment a phone connects. */
export async function hostNote(displayName: string, payload: string, h: HostHandlers): Promise<() => void> {
  let delivered = false;
  const subs = [
    MP.onPeerStateChange(({ peer, state }) => {
      if (state === "connecting") h.onStatus(`Pairing with ${peer}…`);
      else if (state === "connected" && !delivered) {
        h.onStatus(`Connected — sending…`);
        MP.sendNote(payload).then((ok) => {
          if (ok) { delivered = true; h.onSent(); }
          else h.onError("Couldn't hand it over. Try again.");
        });
      }
    }),
    MP.onError(({ message }) => h.onError(message)),
  ];
  await MP.start(displayName);
  await MP.advertise();
  h.onStatus("Hold the phones together…");
  return () => { subs.forEach((s) => s?.remove()); MP.stop(); };
}

export interface ReceiveHandlers {
  onStatus: (s: string) => void;
  onNote: (payload: string) => void;
  onError: (m: string) => void;
}

/** Receiver: browse, auto-invite the first Loadit peer, surface the note. */
export async function receiveNote(displayName: string, h: ReceiveHandlers): Promise<() => void> {
  let got = false;
  const subs = [
    MP.onPeerFound(({ peer }) => { h.onStatus(`Found ${peer} — connecting…`); MP.invite(peer); }),
    MP.onPeerStateChange(({ state }) => {
      if (state === "connected") h.onStatus("Connected — waiting for the money…");
    }),
    MP.onReceiveNote(({ payload }) => { if (!got) { got = true; h.onNote(payload); } }),
    MP.onError(({ message }) => h.onError(message)),
  ];
  await MP.start(displayName);
  await MP.browse();
  h.onStatus("Looking for a nearby Loadit…");
  return () => { subs.forEach((s) => s?.remove()); MP.stop(); };
}
