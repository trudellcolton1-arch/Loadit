import { Platform } from "react-native";
import type { PulseNote } from "./pulseClaim";
import { encodeNote, decodeNote } from "./pulseClaim";
import { tapAvailable } from "./pulseMultipeer";

/**
 * PULSE TRANSPORT — how a signed note actually crosses from phone to phone.
 *
 * Priority order (per product): tap first, QR only as the universal backup.
 *   1. Bluetooth (primary, cross-platform)
 *   2. NFC tap    (Android phone↔phone via HCE; iOS = tag/terminal only)
 *   3. QR         (works on literally any phone with a camera — the fallback)
 *
 * IMPORTANT capability reality this file encodes so the UI never lies:
 *  - react-native-ble-plx is CENTRAL-only: it can scan/connect/read, but it
 *    cannot advertise or run a GATT server. So the SENDER (who must serve the
 *    note payload) needs a peripheral/GATT native module that ble-plx doesn't
 *    provide. Until that module ships, `bluetooth.canServe` is false.
 *  - iOS does NOT allow phone↔phone peer NFC (Apple restricts CoreNFC to tag
 *    reading + the system Wallet). So NFC tap-to-send is Android-only; on iOS
 *    the tap transport is Bluetooth. `nfc.canSend` reflects this per platform.
 *
 * The note payload itself is transport-agnostic: `encodeNote` produces the same
 * bytes whether they travel over BLE GATT, an NFC NDEF record, or a QR code.
 */

export type TransportKind = "bluetooth" | "nfc" | "qr";

export interface TransportCapability {
  kind: TransportKind;
  /** Can THIS device hand a note TO another phone over this transport? */
  canSend: boolean;
  /** Can THIS device RECEIVE a note over this transport? */
  canReceive: boolean;
  /** Short, honest reason shown in the UI when a leg isn't available yet. */
  note: string;
}

const isIOS = Platform.OS === "ios";

/**
 * What each transport can do on this device, today. This is intentionally
 * conservative — a leg is only `true` when it genuinely works end to end.
 */
export function transportCapabilities(): TransportCapability[] {
  return [
    {
      kind: "bluetooth",
      // Real, full-duplex offline tap via MultipeerConnectivity (iOS). Android
      // tap lands with the Nearby module; until then Android uses QR.
      canSend: tapAvailable(),
      canReceive: tapAvailable(),
      note: tapAvailable()
        ? "Hold two phones together — money crosses over Bluetooth + Wi-Fi, no internet."
        : isIOS
        ? "Bluetooth tap initializes on this device at runtime."
        : "Android Bluetooth tap lands with the Nearby module; QR works now.",
    },
    {
      kind: "nfc",
      canSend: !isIOS, // Android HCE can push; iOS cannot do phone↔phone NFC.
      canReceive: !isIOS,
      note: isIOS
        ? "iPhone can't tap money to another phone over NFC — Apple limits NFC to tags. Bluetooth is the iPhone tap."
        : "NFC tap uses Android HCE.",
    },
    {
      kind: "qr",
      canSend: true,
      canReceive: true, // via expo-camera scanner
      note: "Works on any phone with a camera. The universal backup.",
    },
  ];
}

/** The best available SEND transport, tap-first with QR as the guaranteed fallback. */
export function preferredSendTransport(): TransportKind {
  const caps = transportCapabilities();
  const bt = caps.find((c) => c.kind === "bluetooth");
  const nfc = caps.find((c) => c.kind === "nfc");
  if (bt?.canSend) return "bluetooth";
  if (nfc?.canSend) return "nfc";
  return "qr";
}

/** Serialize a note for whichever transport carries it (all share one format). */
export function payloadForTransport(note: PulseNote): string {
  return encodeNote(note);
}

/** Parse an incoming payload from any transport back into a note. */
export function noteFromPayload(raw: string): PulseNote | null {
  return decodeNote(raw);
}
