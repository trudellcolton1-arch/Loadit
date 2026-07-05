import { Platform } from "react-native";

/**
 * PULSE NEARBY — the Bluetooth "who's around" layer.
 *
 * A thin, defensive wrapper over react-native-ble-plx. Its only jobs right now:
 * bring the radio up, and report how many nearby devices are advertising. The
 * money handoff still travels as a signed Pulse note (QR today); this is the
 * proximity signal that makes tap-to-pay feel instant and feeds claim evidence.
 *
 * Everything here fails soft — Bluetooth off, permission denied, or running in a
 * JS-only context must never crash a screen. We import the native manager lazily
 * so the module only loads on a real device build.
 */

export interface NearbyPeer {
  id: string;
  rssi: number | null;
  name: string | null;
}

type Manager = {
  startDeviceScan: (
    uuids: string[] | null,
    opts: { allowDuplicates: boolean } | null,
    cb: (err: unknown, device: { id: string; rssi: number | null; localName?: string | null; name?: string | null } | null) => void
  ) => void;
  stopDeviceScan: () => void;
  state: () => Promise<string>;
  destroy: () => void;
};

let manager: Manager | null = null;

function getManager(): Manager | null {
  if (manager) return manager;
  try {
    // Lazy require so a missing native module never breaks import-time.
    const { BleManager } = require("react-native-ble-plx");
    manager = new BleManager() as Manager;
    return manager;
  } catch {
    return null;
  }
}

/** True if the BLE radio is powered on and usable. */
export async function bleReady(): Promise<boolean> {
  const m = getManager();
  if (!m) return false;
  try {
    return (await m.state()) === "PoweredOn";
  } catch {
    return false;
  }
}

/**
 * Scan for `ms` and return the distinct nearby peers seen (strongest RSSI kept).
 * Safe to call repeatedly; always stops its own scan.
 */
export function scanNearby(ms = 4000): Promise<NearbyPeer[]> {
  const m = getManager();
  if (!m) return Promise.resolve([]);
  return new Promise((resolve) => {
    const seen = new Map<string, NearbyPeer>();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      try { m.stopDeviceScan(); } catch { /* noop */ }
      resolve([...seen.values()].sort((a, b) => (b.rssi ?? -999) - (a.rssi ?? -999)));
    };
    try {
      m.startDeviceScan(null, { allowDuplicates: false }, (err, d) => {
        if (err || !d) { if (err) finish(); return; }
        const prev = seen.get(d.id);
        const rssi = d.rssi ?? null;
        if (!prev || (rssi ?? -999) > (prev.rssi ?? -999)) {
          seen.set(d.id, { id: d.id, rssi, name: d.localName || d.name || null });
        }
      });
    } catch {
      finish();
      return;
    }
    // Timers are fine in RN; no Date.now needed.
    setTimeout(finish, ms);
  });
}

export const nearbySupported = Platform.OS === "ios" || Platform.OS === "android";
