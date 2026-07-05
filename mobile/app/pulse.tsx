import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Platform, Alert,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import { useAuth } from "@/lib/authContext";
import { getMyHandle, resolveHandle, type HandleProfile } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { mintApiToken } from "@/lib/hylaqWallet";
import { publicKeySpkiBase64 } from "@/lib/deviceKey";
import {
  getDeviceId, registerDevice, syncPackets, dropPulse, fetchManifest, cancelDrop,
  readQueue, enqueueClaim, clearSettled,
  type ClaimPacket, type ProximityEvidence,
} from "@/lib/pulse";
import {
  makePulseNote, verifyPulseNote, encodeNote, decodeNote, noteToClaimPacket,
  type PulseNote,
} from "@/lib/pulseClaim";
import { scanNearby, bleReady, type NearbyPeer } from "@/lib/pulseNearby";
import { tapAvailable, startScanning, armSend } from "@/lib/pulseBle";
import { onPulseReceived } from "@/lib/pulsePresence";
import { ingestPayload } from "@/lib/pulseInbox";
import { useTheme, type Theme } from "@/lib/theme";
import { HandleAvatar } from "@/components/HandleAvatar";
import * as SecureStore from "expo-secure-store";

/**
 * PULSE — send money to any phone nearby, even with no internet.
 *
 * Beam: your device signs a Pulse note (a claim on money you locked in escrow)
 * and shows it as a QR. Collect: the other phone scans it, verifies the
 * signature offline, and holds it as pending. The moment either phone is back
 * online, `sync` settles it into the real wallet. Bearer-cash for the internet.
 */

const AMOUNTS = [5, 20, 50, 100] as const;
const REGISTERED_KEY = "loadit_pulse_registered_v1";
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Rough proximity readout from BLE RSSI (closer = stronger = more bars). */
function signalBars(rssi: number): string {
  if (rssi >= -55) return "right here";
  if (rssi >= -70) return "very close";
  if (rssi >= -85) return "nearby";
  return "in range";
}

/** Best-effort GPS for claim evidence — never blocks, never throws. */
async function captureEvidence(): Promise<ProximityEvidence> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") return { qr: true };
    const loc = await Location.getLastKnownPositionAsync({});
    if (!loc) return { qr: true };
    return {
      qr: true,
      gps: { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracy: loc.coords.accuracy ?? undefined, capturedAt: loc.timestamp },
    };
  } catch {
    return { qr: true };
  }
}

export default function Pulse() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [me, setMe] = useState<HandleProfile | null>(null);
  const [online, setOnline] = useState(true);
  const [mode, setMode] = useState<"send" | "receive">("send");

  const [amountText, setAmountText] = useState("20");
  const amount = Math.max(0, parseFloat(amountText) || 0);
  const [memo, setMemo] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<PulseNote | null>(null);
  const [escrowLocked, setEscrowLocked] = useState(false);
  const [dropId, setDropId] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  // Tap-first handoff: "tap" = Bluetooth (MultipeerConnectivity), "qr" = fallback.
  const [handoff, setHandoff] = useState<"tap" | "qr">("qr");
  const [sent, setSent] = useState(false);
  const [tapStatus, setTapStatus] = useState("");

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [collected, setCollected] = useState<PulseNote | null>(null);
  const scanLock = useRef(false);

  const [queue, setQueue] = useState<ClaimPacket[]>([]);
  const pendingSum = queue.reduce((s, p) => s + (p.amountUsd || 0), 0);

  const [nearby, setNearby] = useState<NearbyPeer[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<Array<{ profile: HandleProfile; rssi: number | null }>>([]);
  const [toUser, setToUser] = useState<HandleProfile | null>(null);
  const [bleState, setBleState] = useState<"idle" | "scanning" | "off">("idle");

  const refreshQueue = useCallback(async () => setQueue(await readQueue()), []);

  const scanForPhones = useCallback(async () => {
    if (bleState === "scanning") return;
    const on = await bleReady();
    if (!on) { setBleState("off"); setNearby([]); setNearbyUsers([]); return; }
    setBleState("scanning");
    const peers = await scanNearby(4000);
    setNearby(peers);
    // Resolve the peers that advertised a Loadit @handle to real profiles + photos.
    const withHandle = peers.filter((p) => p.handle).slice(0, 6);
    const resolved = await Promise.all(
      withHandle.map(async (p) => {
        const r = await resolveHandle(p.handle!).catch(() => null);
        return r?.ok && r.profile ? { profile: r.profile, rssi: p.rssi } : null;
      })
    );
    setNearbyUsers(resolved.filter(Boolean) as Array<{ profile: HandleProfile; rssi: number | null }>);
    setBleState("idle");
  }, [bleState]);

  useEffect(() => {
    if (!ready || !session) return;
    getMyHandle(session.accessToken).then((r) => { if (r.linked && r.profile) setMe(r.profile); }).catch(() => {});
    refreshQueue();
    // Lightweight reachability probe.
    (async () => {
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 3500);
        const res = await fetch(`${API_BASE}/api/health`, { signal: ctrl.signal }).catch(() => null);
        clearTimeout(to);
        setOnline(Boolean(res));
      } catch {
        setOnline(false);
      }
    })();
  }, [ready, session, refreshQueue]);

  // Discovery: on tap-capable phones, MultipeerConnectivity presence surfaces
  // nearby Loadit users (by @handle) with their Hylaq profile. Falls back to a
  // BLE scan on phones without the tap module.
  const addFace = useCallback(async (handle: string) => {
    const h = handle.replace(/^@/, "").toLowerCase();
    if (!h || h === "loadit" || h === me?.handle?.toLowerCase()) return;
    const r = await resolveHandle(h).catch(() => null);
    if (r?.ok && r.profile) {
      setNearbyUsers((prev) => (prev.some((u) => u.profile.handle.toLowerCase() === r.profile!.handle.toLowerCase())
        ? prev : [...prev, { profile: r.profile!, rssi: null }]));
    }
  }, [me?.handle]);
  const removeFace = useCallback((handle: string) => {
    const h = handle.replace(/^@/, "").toLowerCase();
    setNearbyUsers((prev) => prev.filter((u) => u.profile.handle.toLowerCase() !== h));
  }, []);

  useEffect(() => {
    if (mode !== "send") return;
    if (tapAvailable()) {
      let cancelled = false;
      let cleanup: (() => void) | null = null;
      setNearbyUsers([]);
      startScanning(me?.handle || "loadit", { onPeer: addFace, onLost: removeFace })
        .then((c) => { if (cancelled) c(); else cleanup = c; });
      return () => { cancelled = true; cleanup?.(); };
    }
    if (!note) scanForPhones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, addFace, removeFace]);

  // Money can arrive on any screen (global presence). Surface it here too.
  useEffect(() => {
    const off = onPulseReceived(({ note: received }) => {
      refreshQueue();
      setCollected(received);
      if (mode === "send") setMode("receive");
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Beam over Bluetooth: send the signed note across the live presence session
  // — directly to the picked person, or to whoever taps if none is chosen.
  useEffect(() => {
    if (mode !== "send" || !note || handoff !== "tap" || !tapAvailable()) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    setSent(false);
    setTapStatus(toUser ? `Reaching @${toUser.handle}…` : "Hold the phones together…");
    armSend(toUser?.handle ?? null, encodeNote(note), {
      onStatus: (s) => { if (!cancelled) setTapStatus(s); },
      onSent: () => { if (!cancelled) setSent(true); },
      onError: (m) => { if (!cancelled) setTapStatus(m); },
    }).then((c) => { if (cancelled) c(); else cleanup = c; });
    return () => { cancelled = true; cleanup?.(); };
  }, [mode, note, handoff, toUser?.handle]);

  if (ready && !session) return <Redirect href="/login" />;

  const resetBeam = () => {
    setNote(null); setSent(false); setTapStatus(""); setDropId(null);
    setAmountText("20"); setMemo(""); setToUser(null);
  };

  /** Cancel an unclaimed drop and refund the escrow back to the sender. */
  const cancelBeam = async () => {
    if (!dropId || !me) { resetBeam(); return; }
    setBusy(true);
    try {
      const token = tokenRef.current || (await ensureToken());
      if (!token) { resetBeam(); return; }
      const r = await cancelDrop(token, me.id, dropId);
      if (r?.canceled || r?.refundTxHash) Alert.alert("Refunded", "The funds were returned to your wallet.");
      else if (r?.error) Alert.alert("Couldn't cancel", r.error);
      resetBeam();
    } catch {
      Alert.alert("Couldn't cancel", "Try again from your wallet.");
    } finally {
      setBusy(false);
    }
  };

  /** Mint a Hylaq token from the wallet password and register the device once. */
  const ensureToken = async (): Promise<string | null> => {
    if (!me) { Alert.alert("Hylaq needed", "Log in with Hylaq to use Pulse."); return null; }
    if (!password) { Alert.alert("Wallet password", "Enter your Hylaq wallet password."); return null; }
    const token = await mintApiToken(me.id, password);
    if (!token) { Alert.alert("Couldn't authorize", "Check your wallet password and try again."); return null; }
    try {
      const already = await SecureStore.getItemAsync(REGISTERED_KEY);
      if (!already) {
        const publicKey = await publicKeySpkiBase64();
        const deviceId = await getDeviceId();
        const r = await registerDevice(token, {
          handleId: me.id, deviceId, platform: Platform.OS === "ios" ? "ios" : "android",
          publicKey, keyOrigin: "keystore", deviceLabel: `Loadit ${Platform.OS}`,
        });
        if (r?.registered) await SecureStore.setItemAsync(REGISTERED_KEY, "1");
      }
    } catch { /* registration is best-effort; a note is still valid offline */ }
    return token;
  };

  /**
   * Beam: lock the funds in Hylaq escrow (POST /api/wallet/pulse-drop, one-shot
   * with the wallet password + GPS), fetch the signed manifest, and sign a note
   * that carries the pulseId + manifest so the receiver can claim fully offline.
   */
  const beam = async () => {
    if (amount < 1) { Alert.alert("Amount", "Enter at least $1."); return; }
    if (!online) { Alert.alert("Go online to lock funds", "Beaming needs a connection to lock the money in escrow. Reconnect and try again."); return; }
    if (!me) { Alert.alert("Hylaq needed", "Log in with Hylaq to send."); return; }
    if (!password) { Alert.alert("Wallet password", "Enter your Hylaq wallet password to lock the funds."); return; }
    setBusy(true);
    try {
      const token = await ensureToken();
      if (!token) return; // ensureToken already alerted
      tokenRef.current = token; // kept for a cancel/refund of this same drop

      // GPS is required by the drop (proximity is enforced server-side).
      let coords: { lat: number; lng: number } | null = null;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
        }
      } catch { /* handled below */ }
      if (!coords) { Alert.alert("Location needed", "Turn on location so Loadit can lock the funds in escrow for the person nearby."); return; }

      const deviceId = await getDeviceId();
      const drop = await dropPulse(token, {
        handleId: me.id, password,
        lat: coords.lat, lng: coords.lng,
        recipientHandle: toUser?.handle, // omitted → public drop
        amountUsd: amount, currency: "USDC",
        message: memo.trim() || undefined,
        offlinePolicy: "proximity_offline_settle_online",
        offlineClaimWindow: 86400,
        verificationMode: "gps",
        radiusMeters: 100,
      });
      if (!drop || drop.error || !drop.id) {
        Alert.alert("Couldn't lock funds", drop?.error || "Hylaq didn't confirm the escrow. Check your balance and password.");
        return;
      }

      // Fetch the signed manifest to beam alongside the note (offline claiming).
      const manifest = await fetchManifest(token, { pulseId: drop.id, handleId: me.id, deviceId });

      const evidence = await captureEvidence();
      if (nearby[0]) { evidence.bleRssi = nearby[0].rssi ?? undefined; evidence.bleDeviceId = nearby[0].id; }
      const n = await makePulseNote({
        fromHandle: me.handle, fromHandleId: me.id, to: toUser?.handle,
        amountUsd: amount, asset: "USDC", memo: memo.trim() || undefined,
        createdAt: Date.now(), pulseId: drop.id, manifest: manifest ?? undefined, evidence,
      });
      setDropId(drop.id);
      setEscrowLocked(drop.status === "LOCKED" || Boolean(drop.id));
      setHandoff(tapAvailable() ? "tap" : "qr");
      setSent(false);
      setNote(n);
      setPassword("");
    } catch {
      Alert.alert("Couldn't create Pulse", "Try again.");
    } finally {
      setBusy(false);
    }
  };

  /** Collect: a QR was scanned — verify offline and queue it as pending. */
  const onScan = async (data: string) => {
    if (scanLock.current) return;
    scanLock.current = true;
    try {
      const collectorId = me?.id || (await getDeviceId());
      const n = await ingestPayload(data, collectorId);
      if (!n) {
        if (queue.some((p) => decodeNote(data)?.id === p.nonce)) Alert.alert("Already collected", "You already have this Pulse.");
        else Alert.alert("Couldn't collect", "That code isn't a valid Loadit Pulse.");
        return;
      }
      await refreshQueue();
      setCollected(n);
      setScanning(false);
    } catch {
      Alert.alert("Couldn't collect", "Try scanning again.");
    } finally {
      setTimeout(() => { scanLock.current = false; }, 1200);
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) { Alert.alert("Camera needed", "Allow the camera to scan a Pulse code."); return; }
    }
    setCollected(null);
    setScanning(true);
  };

  /** Sync: settle every queued note into real wallets (needs online + auth). */
  const syncNow = async () => {
    if (!queue.length) return;
    setBusy(true);
    try {
      const token = await ensureToken();
      if (!token) return;
      const deviceId = await getDeviceId();
      const res = await syncPackets(token, queue, deviceId, me!.id);
      if (!res) { Alert.alert("Offline", "Couldn't reach Hylaq — your Pulses stay pending and will settle later."); return; }
      const results = res.results || [];
      const settled = results.filter((r) => r.status === "accepted").map((r) => r.nonce);
      if (settled.length) await clearSettled(settled);
      await refreshQueue();
      setPassword("");
      if (settled.length) {
        Alert.alert("Synced", `${settled.length} Pulse${settled.length === 1 ? "" : "s"} settled into your wallet.`);
      } else {
        // Surface exactly why Hylaq didn't settle, so we can see if it's a
        // missing escrow (no drop) vs a verification failure.
        const why = results.length
          ? results.map((r) => `• ${r.status}${r.verificationResult ? ` · ${r.verificationResult}` : ""}${r.resolutionOutcome ? ` — ${r.resolutionOutcome}` : ""}`).join("\n")
          : "Hylaq returned no result for these Pulses — the matching escrow wasn't found (the pulse-drop lock hasn't happened server-side yet).";
        Alert.alert("Not settled yet", `Hylaq didn't accept ${queue.length} pending Pulse${queue.length === 1 ? "" : "s"}:\n\n${why}`);
      }
    } catch {
      Alert.alert("Sync failed", "Try again when you have a stronger connection.");
    } finally {
      setBusy(false);
    }
  };

  /* -------------------------------------------------------------- scanner */
  if (scanning) {
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.scanHead}>
          <Text style={styles.scanTitle}>Scan a Pulse</Text>
          <TouchableOpacity onPress={() => setScanning(false)}><Text style={styles.close}>Cancel</Text></TouchableOpacity>
        </View>
        <View style={styles.cameraBox}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onScan(data)}
          />
          <View style={styles.reticle} />
        </View>
        <Text style={styles.scanHint}>Point at the other phone's Pulse code. Works fully offline.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.h1}>Pulse</Text>
            <Text style={styles.sub}>Send money to any phone nearby — even with no internet.</Text>
          </View>
          <View style={[styles.netPill, { backgroundColor: online ? t.accentSoft : t.surface, borderColor: online ? t.accentTint : t.border }]}>
            <View style={[styles.dot, { backgroundColor: online ? t.accent : t.faint }]} />
            <Text style={[styles.netText, { color: online ? t.accentText : t.dim }]}>{online ? "Online" : "Offline"}</Text>
          </View>
        </View>

        <View style={styles.segment}>
          {(["send", "receive"] as const).map((m) => (
            <TouchableOpacity key={m} style={[styles.segBtn, mode === m && styles.segBtnOn]} onPress={() => { resetBeam(); setMode(m); }}>
              <Text style={[styles.segText, mode === m && styles.segTextOn]}>{m === "send" ? "Beam money" : "Collect"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === "send" && !note && tapAvailable() && (
          <View style={[styles.blePill, { borderColor: t.accentTint, backgroundColor: t.accentSoft }]}>
            <View style={[styles.bleDot, { backgroundColor: t.accent }]} />
            <Text style={[styles.bleText, { color: t.accentText }]}>
              {nearbyUsers.length ? `${nearbyUsers.length} Loadit ${nearbyUsers.length === 1 ? "user" : "users"} nearby` : "Bluetooth on · looking for people near you"}
            </Text>
          </View>
        )}

        {mode === "send" && !note && !tapAvailable() && (
          <TouchableOpacity style={styles.blePill} onPress={scanForPhones} activeOpacity={0.8}>
            <View style={[styles.bleDot, {
              backgroundColor: bleState === "scanning" ? t.warn : nearby.length ? t.accent : t.faint,
            }]} />
            {bleState === "scanning" ? (
              <>
                <ActivityIndicator size="small" color={t.dim} style={{ marginRight: 2 }} />
                <Text style={styles.bleText}>Scanning for phones…</Text>
              </>
            ) : bleState === "off" ? (
              <Text style={styles.bleText}>Bluetooth off · tap to retry</Text>
            ) : nearby.length ? (
              <Text style={[styles.bleText, { color: t.accentText }]}>
                {nearby.length} phone{nearby.length === 1 ? "" : "s"} nearby
                {nearby[0]?.rssi != null ? ` · ${signalBars(nearby[0].rssi)}` : ""}
              </Text>
            ) : (
              <Text style={styles.bleText}>No phones nearby · tap to rescan</Text>
            )}
          </TouchableOpacity>
        )}

        {mode === "send" && !note && nearbyUsers.length > 0 && (
          <View style={styles.facesWrap}>
            <Text style={styles.facesLabel}>Loadit users near you — tap to send</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.facesRow}>
              {nearbyUsers.map(({ profile, rssi }) => {
                const on = toUser?.handle === profile.handle;
                return (
                  <TouchableOpacity key={profile.handle} style={[styles.face, on && styles.faceOn]} onPress={() => setToUser(on ? null : profile)}>
                    <HandleAvatar handle={profile.handle} avatarUrl={profile.avatarUrl} size={54} />
                    <Text style={styles.faceHandle} numberOfLines={1}>@{profile.handle}</Text>
                    <Text style={styles.faceMeta}>{rssi != null ? signalBars(rssi) : "nearby"}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {mode === "send" ? (
          note ? (
            <View style={styles.noteWrap}>
              {handoff === "tap" ? (
                sent ? (
                  <>
                    <View style={styles.successCircle}><Text style={styles.successTick}>✓</Text></View>
                    <Text style={styles.noteAmount}>Sent {money(note.amountUsd)}</Text>
                    {note.to ? <Text style={styles.noteTo}>to @{note.to}</Text> : null}
                    <Text style={styles.noteSub}>Delivered over Bluetooth. It settles into their wallet when either of you is back online.</Text>
                    <TouchableOpacity style={styles.secondaryCta} onPress={resetBeam}><Text style={styles.secondaryText}>New Pulse</Text></TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.tapRing}><ActivityIndicator size="large" color={t.accent} /></View>
                    <Text style={styles.noteAmount}>{money(note.amountUsd)} USDC</Text>
                    {note.to ? <Text style={styles.noteTo}>to @{note.to}</Text> : null}
                    {escrowLocked ? <View style={styles.lockPill}><Text style={styles.lockText}>🔒 Locked in escrow</Text></View> : null}
                    <Text style={styles.tapStatus}>{tapStatus}</Text>
                    <Text style={styles.noteSub}>Hold your phone against theirs. The money crosses over Bluetooth + Wi-Fi — no internet needed.</Text>
                    <TouchableOpacity style={styles.secondaryCta} onPress={() => setHandoff("qr")}><Text style={styles.secondaryText}>Show QR instead</Text></TouchableOpacity>
                    <TouchableOpacity onPress={cancelBeam} disabled={busy}><Text style={styles.back}>Cancel &amp; refund</Text></TouchableOpacity>
                  </>
                )
              ) : (
                <>
                  <View style={styles.qrCard}>
                    <QRCode value={encodeNote(note)} size={236} backgroundColor="#FFFFFF" color="#0B0D12" />
                  </View>
                  <Text style={styles.noteAmount}>{money(note.amountUsd)} USDC</Text>
                  {note.to ? <Text style={styles.noteTo}>to @{note.to}</Text> : null}
                  <Text style={styles.noteSub}>
                    {escrowLocked ? "Locked in escrow · " : ""}Have them open Pulse → Collect and scan this.
                  </Text>
                  {note.memo ? <Text style={styles.noteMemo}>“{note.memo}”</Text> : null}
                  {tapAvailable() ? (
                    <TouchableOpacity style={styles.secondaryCta} onPress={() => { setSent(false); setHandoff("tap"); }}>
                      <Text style={styles.secondaryText}>Tap over Bluetooth instead</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity onPress={resetBeam}><Text style={styles.back}>New Pulse</Text></TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            <>
              {toUser ? (
                <View style={styles.toBanner}>
                  <HandleAvatar handle={toUser.handle} avatarUrl={toUser.avatarUrl} size={34} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toText}>Sending to @{toUser.handle}</Text>
                    <Text style={styles.toSub}>{toUser.displayName || "Loadit user nearby"}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setToUser(null)}><Text style={styles.toClear}>✕</Text></TouchableOpacity>
                </View>
              ) : me ? (
                <View style={styles.meRow}>
                  <HandleAvatar handle={me.handle} avatarUrl={me.avatarUrl} size={38} />
                  <Text style={styles.meHandle}>@{me.handle}</Text>
                </View>
              ) : null}
              <Text style={styles.label}>Amount (USD)</Text>
              <View style={styles.amountBox}>
                <Text style={styles.amountCurrency}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amountText}
                  onChangeText={(v) => setAmountText(v.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={t.faint}
                  maxLength={9}
                  selectionColor={t.accent}
                />
              </View>
              <View style={styles.row}>
                {AMOUNTS.map((v) => (
                  <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmountText(String(v))}>
                    <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Note (optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Coffee, split, etc."
                placeholderTextColor={t.faint}
                value={memo}
                onChangeText={setMemo}
                maxLength={40}
              />

              {online && (
                <>
                  <Text style={styles.label}>Wallet password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your Hylaq wallet password"
                    placeholderTextColor={t.faint}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.hint}>Locks {money(amount)} in escrow so the note always settles. Password goes straight to Hylaq — never to Loadit.</Text>
                </>
              )}
              {!online && (
                <Text style={styles.hint}>You're offline — beaming a note you'll back with escrow the moment you reconnect.</Text>
              )}

              <TouchableOpacity style={styles.cta} onPress={beam} disabled={busy}>
                {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Create Pulse →</Text>}
              </TouchableOpacity>
            </>
          )
        ) : (
          <>
            {collected ? (
              <View style={styles.collectedCard}>
                <View style={styles.successCircle}><Text style={styles.successTick}>✓</Text></View>
                <Text style={styles.collectedAmount}>+{money(collected.amountUsd)}</Text>
                <Text style={styles.collectedFrom}>{collected.from.handle ? `from @${collected.from.handle}` : "collected offline"}</Text>
                {collected.memo ? <Text style={styles.noteMemo}>“{collected.memo}”</Text> : null}
                <Text style={styles.noteSub}>Held as pending. It lands in your wallet on your next sync.</Text>
                <TouchableOpacity style={styles.secondaryCta} onPress={() => setCollected(null)}>
                  <Text style={styles.secondaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.collectHero}>
                {tapAvailable() ? (
                  <>
                    <View style={styles.tapRing}><ActivityIndicator size="large" color={t.accent} /></View>
                    <Text style={styles.collectTitle}>You're discoverable</Text>
                    <Text style={styles.collectSub}>
                      Anyone nearby with Loadit can send you money over Bluetooth — you don't have to do anything. It just arrives here.
                    </Text>
                    <TouchableOpacity style={styles.secondaryCta} onPress={openScanner}>
                      <Text style={styles.secondaryText}>Scan a QR instead</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Text style={styles.collectEmoji}>📡</Text>
                    <Text style={styles.collectTitle}>Collect a Pulse</Text>
                    <Text style={styles.collectSub}>Scan a nearby phone's Pulse code to receive money offline.</Text>
                    <TouchableOpacity style={styles.cta} onPress={openScanner}>
                      <Text style={styles.ctaText}>Open scanner →</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Pending / sync */}
        {queue.length > 0 && (
          <View style={styles.pendingCard}>
            <View style={styles.pendingHead}>
              <View>
                <Text style={styles.pendingLabel}>Pending Pulses</Text>
                <Text style={styles.pendingSum}>+{money(pendingSum)}</Text>
              </View>
              <TouchableOpacity style={styles.syncBtn} onPress={syncNow} disabled={busy}>
                {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.syncText}>Sync now</Text>}
              </TouchableOpacity>
            </View>
            {online && me && (
              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Wallet password to settle"
                placeholderTextColor={t.faint}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
            )}
            {queue.slice(0, 6).map((p) => (
              <View key={p.nonce} style={styles.pendingRow}>
                <Text style={styles.pendingRowAmt}>+{money(p.amountUsd || 0)}</Text>
                <Text style={styles.pendingRowMeta}>USDC · offline</Text>
              </View>
            ))}
            <Text style={styles.legal}>Non-custodial: Pulses settle straight into your Hylaq wallet. Loadit never holds funds.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    h1: { color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, marginTop: 6, lineHeight: 20 },
    netPill: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, marginTop: 4 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    netText: { fontSize: 12, fontWeight: "700" },
    segment: { flexDirection: "row", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 999, padding: 4, marginTop: 22 },
    segBtn: { flex: 1, paddingVertical: 11, borderRadius: 999, alignItems: "center" },
    segBtnOn: { backgroundColor: t.button },
    segText: { color: t.dim, fontWeight: "700", fontSize: 14 },
    segTextOn: { color: t.buttonText },
    blePill: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginTop: 14 },
    bleDot: { width: 8, height: 8, borderRadius: 4 },
    bleText: { color: t.dim, fontSize: 12, fontWeight: "600" },
    facesWrap: { marginTop: 16 },
    facesLabel: { color: t.faint, fontSize: 10.5, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 },
    facesRow: { gap: 14, paddingRight: 8 },
    face: { alignItems: "center", width: 66, gap: 5, opacity: 0.9 },
    faceOn: { opacity: 1 },
    faceHandle: { color: t.text, fontSize: 11, fontWeight: "700", maxWidth: 66 },
    faceMeta: { color: t.accentText, fontSize: 9.5, fontWeight: "600" },
    toBanner: { flexDirection: "row", alignItems: "center", gap: 11, marginTop: 20, backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 16, padding: 12 },
    toText: { color: t.text, fontSize: 15, fontWeight: "800" },
    toSub: { color: t.accentText, fontSize: 11.5, fontWeight: "600", marginTop: 1 },
    toClear: { color: t.dim, fontSize: 16, fontWeight: "700", paddingHorizontal: 4 },
    noteTo: { color: t.accentText, fontSize: 14, fontWeight: "700", marginTop: 3 },
    meRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
    meHandle: { color: t.text, fontSize: 15, fontWeight: "700" },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 20 },
    amountBox: { flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
    amountCurrency: { color: t.text, fontSize: 26, fontWeight: "800", marginRight: 2 },
    amountInput: { flex: 1, color: t.text, fontSize: 26, fontWeight: "800", padding: 0 },
    row: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    input: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 15, marginTop: 8 },
    hint: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 8 },
    cta: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 22 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    secondaryCta: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 18, paddingHorizontal: 28 },
    secondaryText: { color: t.text, fontWeight: "700", fontSize: 14 },
    // beamed note
    noteWrap: { alignItems: "center", marginTop: 24 },
    tapRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 3, borderColor: t.accentTint, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    tapStatus: { color: t.accentText, fontSize: 14, fontWeight: "700", marginTop: 10, textAlign: "center" },
    lockPill: { backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
    lockText: { color: t.accentText, fontSize: 11, fontWeight: "700" },
    back: { color: t.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
    qrCard: { backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 },
    noteAmount: { color: t.text, fontSize: 26, fontWeight: "800", marginTop: 20 },
    noteSub: { color: t.dim, fontSize: 13, textAlign: "center", lineHeight: 19, marginTop: 8, paddingHorizontal: 12 },
    noteMemo: { color: t.accentText, fontSize: 14, fontStyle: "italic", marginTop: 8, textAlign: "center" },
    // collect
    collectHero: { alignItems: "center", marginTop: 40, paddingHorizontal: 12 },
    collectEmoji: { fontSize: 44 },
    collectTitle: { color: t.text, fontSize: 20, fontWeight: "800", marginTop: 12 },
    collectSub: { color: t.dim, fontSize: 14, textAlign: "center", lineHeight: 20, marginTop: 8 },
    collectedCard: { alignItems: "center", marginTop: 30, gap: 4 },
    collectedAmount: { color: t.text, fontSize: 30, fontWeight: "800", marginTop: 8 },
    collectedFrom: { color: t.dim, fontSize: 14 },
    successCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" },
    successTick: { color: t.onAccent, fontSize: 36, fontWeight: "800" },
    // scanner
    scanHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
    scanTitle: { color: t.text, fontSize: 18, fontWeight: "800" },
    close: { color: t.accentText, fontWeight: "700" },
    cameraBox: { flex: 1, margin: 16, borderRadius: 28, overflow: "hidden", backgroundColor: "#000" },
    reticle: { position: "absolute", top: "50%", left: "50%", width: 220, height: 220, marginLeft: -110, marginTop: -110, borderColor: t.accent, borderWidth: 3, borderRadius: 28 },
    scanHint: { color: t.dim, fontSize: 13, textAlign: "center", padding: 20 },
    // pending
    pendingCard: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 22, padding: 18, marginTop: 28 },
    pendingHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    pendingLabel: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
    pendingSum: { color: t.accentText, fontSize: 22, fontWeight: "800", marginTop: 4 },
    syncBtn: { backgroundColor: t.button, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12 },
    syncText: { color: t.buttonText, fontWeight: "700" },
    pendingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
    pendingRowAmt: { color: t.text, fontSize: 15, fontWeight: "700" },
    pendingRowMeta: { color: t.faint, fontSize: 12 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: "center" },
  });
