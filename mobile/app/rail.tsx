import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Switch, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { isRailOwner } from "@/lib/config";
import { railAction, type RailMode, type RailPayment, type RailResponse } from "@/lib/api";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * RAIL — the one machine, owner only.
 *
 * Amount + outcome in (no chain picker — HQ scores fee, time, liquidity,
 * risk, certification and locks a TTL quote), MoneyGram cash is door one,
 * and the whole lifecycle runs on ONE payment id with self-heal and
 * idempotent payout. Non-custodial: delivery only to a wallet you control.
 *
 * Honesty rails, hard-coded:
 *  - MoneyGram cash-in is NOT live; certification is in flight. The live
 *    door REFUSES to confirm cash and this screen shows that refusal.
 *  - The "test the machine" mode is simulated money and says so everywhere.
 *  - This screen is only visible to the rail owner's Hylaq account, and the
 *    backend enforces the same gate on every call — hiding UI is not the gate.
 */

const MGRED = "#E8453C";
const ASSETS = ["BTC", "SOL", "ETH", "USDC"] as const;
const AMOUNTS = [50, 150, 500] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATE_LABEL: Record<RailPayment["state"], string> = {
  quoted: "Quoted",
  intake_pending: "Intake pending",
  intake_confirmed: "Intake confirmed",
  converting: "Converting",
  paying_out: "Paying out",
  settled: "Settled",
  failed: "Failed",
  healing: "Healing",
};

const HAPPY_PATH: RailPayment["state"][] = [
  "quoted", "intake_pending", "intake_confirmed", "converting", "paying_out", "settled",
];

export default function Rail() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [mode, setMode] = useState<RailMode>("live");
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDC");
  const [amount, setAmount] = useState(150);
  const [wallet, setWallet] = useState("");
  const [payment, setPayment] = useState<RailPayment | null>(null);
  const [meta, setMeta] = useState<RailResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gate, setGate] = useState<string | null>(null);
  const [killPayout, setKillPayout] = useState(false);
  const [, setTick] = useState(0);

  // 1s re-render for the quote TTL countdown.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (ready && !session) return <Redirect href="/login" />;
  // Client-side visibility gate — the SERVER enforces the same allowlist on
  // every /api/rail call, so this redirect is UX, not security.
  if (ready && session && !(session.kind === "hylaq" && isRailOwner(session.email))) {
    return <Redirect href="/" />;
  }

  const act = async (body: Parameters<typeof railAction>[1]): Promise<RailResponse | null> => {
    setBusy(true);
    setErr(null);
    setGate(null);
    try {
      const r = await railAction(session?.accessToken, body);
      if (r.payment) setPayment(r.payment);
      setMeta(r);
      if (!r.ok) {
        if (r.reason === "certification_gate") {
          setGate(r.message || "Certification is in flight — cash confirm refused.");
          // Refresh the record so the state strip stays truthful.
          const g = await railAction(session?.accessToken, { action: "get", mode: body.mode, paymentId: body.paymentId });
          if (g.payment) setPayment(g.payment);
        } else if (r.status === 401 || r.status === 403) {
          setErr("This account is not authorized for the rail.");
        } else {
          setErr(r.message || "That didn't work — try again.");
        }
      }
      return r;
    } catch {
      setErr("Couldn't reach the backend — check your connection.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const lockQuote = () =>
    act({
      action: "create",
      mode,
      intent: {
        amountUsd: amount,
        outcome: { asset, wallet: wallet.trim() || "wallet-you-control" },
      },
    });

  const beginIntake = () => payment && act({ action: "intake", mode, paymentId: payment.id });
  const confirmIntake = () => payment && act({ action: "confirm", mode, paymentId: payment.id });
  const heal = () => payment && act({ action: "heal", mode, paymentId: payment.id });

  const settle = async () => {
    if (!payment) return;
    if (mode === "sim" && killPayout) {
      await act({ action: "kill_pipe", mode, paymentId: payment.id, pipe: "payout" });
      setKillPayout(false);
    }
    await act({ action: "settle", mode, paymentId: payment.id });
  };

  const switchMode = (m: RailMode) => {
    setMode(m);
    setPayment(null);
    setMeta(null);
    setErr(null);
    setGate(null);
  };

  const ttlLeft = payment ? Math.max(0, Math.ceil((payment.quote.expiresAt - Date.now()) / 1000)) : 0;
  const passed = new Set(payment?.history.map((h) => h.to) ?? []);
  const canConfirm = payment?.state === "intake_pending";
  const canSettle = payment ? ["intake_confirmed", "converting", "paying_out"].includes(payment.state) : false;

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* header + honest badges */}
        <View style={styles.headRow}>
          <Text style={styles.h1}>One machine</Text>
          <View style={styles.ownerBadge}><Text style={styles.ownerBadgeText}>OWNER ONLY</Text></View>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.certBadge}>
            <Text style={styles.certBadgeText}>MONEYGRAM CASH-IN: CERT IN FLIGHT — NOT LIVE</Text>
          </View>
          {mode === "sim" && (
            <View style={styles.simBadge}><Text style={styles.simBadgeText}>SIMULATED · TEST MONEY</Text></View>
          )}
        </View>
        <Text style={styles.sub}>
          Say what goes in and what should come out. No chains, no pickers — HQ scores every door on
          fee, speed, liquidity, risk and certification, locks a quote, and drives one payment id end
          to end. Non-custodial: it lands in a wallet you control.
        </Text>

        {/* mode toggle */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.modeChip, mode === "live" && styles.modeChipOn]}
            onPress={() => switchMode("live")}
          >
            <Text style={[styles.chipText, mode === "live" && styles.chipTextOn]}>MoneyGram door</Text>
            <Text style={styles.modeChipSub}>cert in flight</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeChip, mode === "sim" && styles.modeChipOn]}
            onPress={() => switchMode("sim")}
          >
            <Text style={[styles.chipText, mode === "sim" && styles.chipTextOn]}>Test the machine</Text>
            <Text style={styles.modeChipSub}>simulated money</Text>
          </TouchableOpacity>
        </View>

        {/* intent */}
        <Text style={styles.label}>Outcome — what should arrive</Text>
        <View style={styles.row}>
          {ASSETS.map((a) => (
            <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
              <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Amount in (USD)</Text>
        <View style={styles.row}>
          {AMOUNTS.map((v) => (
            <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
              <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.label}>Deliver to — a wallet you control</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste your wallet address"
          placeholderTextColor={t.faint}
          value={wallet}
          onChangeText={setWallet}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.cta} onPress={lockQuote} disabled={busy}>
          {busy && !payment ? <ActivityIndicator color={t.onAccent} /> : (
            <>
              <Text style={styles.ctaText}>Lock quote — HQ scores the route</Text>
              <Feather name="chevron-right" size={16} color={t.onAccent} />
            </>
          )}
        </TouchableOpacity>

        {err && <Text style={styles.err}>{err}</Text>}

        {payment && (
          <>
            {/* state strip */}
            <View style={styles.stateStrip}>
              {HAPPY_PATH.map((s) => (
                <View
                  key={s}
                  style={[
                    styles.stateChip,
                    passed.has(s) && styles.stateChipDone,
                    payment.state === s && styles.stateChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.stateChipText,
                      passed.has(s) && { color: t.dim },
                      payment.state === s && { color: t.accentText },
                    ]}
                  >
                    {STATE_LABEL[s]}
                  </Text>
                </View>
              ))}
              {(payment.state === "failed" || payment.state === "healing") && (
                <View style={[styles.stateChip, styles.stateChipFailed]}>
                  <Text style={[styles.stateChipText, { color: t.warn }]}>
                    {STATE_LABEL[payment.state]}{payment.healCount > 0 ? ` · heals ${payment.healCount}` : ""}
                  </Text>
                </View>
              )}
            </View>

            {/* quote card */}
            <LinearGradient
              colors={[rgba(t.accent, 0.13), "rgba(255,255,255,0.03)"]}
              start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.quoteHead}>
                <Text style={styles.bestTag}>
                  {payment.quote.healed ? "HEALED QUOTE — SAME PAYMENT ID" : "LOCKED QUOTE"}
                </Text>
                <Text style={[styles.ttl, ttlLeft <= 15 && { color: t.warn }]}>TTL {ttlLeft}s</Text>
              </View>
              <Text style={styles.provider}>{payment.quote.route.doorLabel}</Text>
              <Text style={styles.body}>
                {money(payment.intent.amountUsd)} in → {payment.intent.outcome.asset} out · fee{" "}
                {money(payment.quote.route.feeUsd)} · score {payment.quote.route.score.toFixed(1)}
              </Text>
              <Text style={styles.meta}>{payment.quote.route.legs.map((l) => l.detail).join(" → ")}</Text>
              <Text style={styles.meta}>
                Non-custodial → {payment.intent.outcome.wallet}
              </Text>
              {!payment.quote.route.confirmable && (
                <Text style={styles.certLine}>
                  This door cannot confirm real money yet — certification in flight.
                </Text>
              )}
              <Text style={styles.mono}>payment {payment.id}</Text>
              <Text style={styles.mono}>quote {payment.quote.quoteId} · #{payment.quoteCount}</Text>
              {payment.lastError && <Text style={styles.err}>last error: {payment.lastError}</Text>}
            </LinearGradient>

            {/* MoneyGram intake instructions */}
            {payment.intake?.instructions && (
              <View style={styles.card}>
                <View style={styles.mgHead}>
                  {payment.intake.doorId === "moneygram_cash" && (
                    <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
                  )}
                  <Text style={styles.cardTitle}>Intake</Text>
                </View>
                <Text style={styles.body}>{payment.intake.instructions}</Text>
                <Text style={styles.mono}>
                  ref {payment.intake.internalRef} · partner tx id: {payment.intake.partnerTxId ?? "none (never invented)"}
                </Text>
              </View>
            )}

            {/* certification refusal, verbatim */}
            {gate && (
              <View style={styles.gateCard}>
                <Feather name="shield-off" size={16} color={t.warn} />
                <Text style={styles.gateText}>{gate}</Text>
              </View>
            )}

            {/* step buttons */}
            <View style={styles.btnRow}>
              <StepBtn styles={styles} t={t} disabled={payment.state !== "quoted" || busy} onPress={beginIntake} label="Begin intake" />
              <StepBtn
                styles={styles} t={t} disabled={!canConfirm || busy} onPress={confirmIntake}
                label={mode === "live" ? "Confirm cash (will refuse)" : "Confirm intake (simulated)"}
              />
              <StepBtn styles={styles} t={t} disabled={!canSettle || busy} onPress={settle} label="Convert + pay out" />
              <StepBtn styles={styles} t={t} disabled={payment.state !== "failed" || busy} onPress={heal} label="Heal — same payment id" warn />
            </View>

            {mode === "sim" && (
              <View style={styles.killRow}>
                <Switch
                  value={killPayout}
                  onValueChange={setKillPayout}
                  trackColor={{ true: rgba(t.warn, 0.5), false: t.border }}
                />
                <Text style={styles.killText}>Kill the payout pipe on the next step (test heal)</Text>
              </View>
            )}

            {/* receipt */}
            {payment.receipt && (
              <View style={[styles.card, { borderColor: rgba(t.accent, 0.3) }]}>
                <Text style={styles.cardTitle}>Delivered</Text>
                <Text style={styles.body}>
                  {money(payment.receipt.amountUsd)} → {payment.receipt.deliveredTo}
                  {payment.receipt.replayed ? " · receipt replayed on retry (idempotent — paid once)" : ""}
                </Text>
                <Text style={styles.mono}>receipt {payment.receipt.receiptRef}</Text>
                {typeof meta?.payouts_recorded === "number" && (
                  <Text style={styles.meta}>
                    Payouts recorded for this machine: {meta.payouts_recorded} — a heal can never pay twice.
                  </Text>
                )}
              </View>
            )}
          </>
        )}

        {meta?.notice && <Text style={styles.disclaimer}>{meta.notice}</Text>}
        <Text style={styles.disclaimer}>
          Owner-only surface, enforced server-side against your Hylaq login. MoneyGram cash-in is not
          live — certification is in flight with MoneyGram — and no partner transaction ids are ever
          generated by Loadit. Loadit never holds your keys.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function StepBtn({ styles, t, label, onPress, disabled, warn }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; label: string;
  onPress: () => void; disabled: boolean; warn?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.stepBtn, warn && { borderColor: rgba(t.warn, 0.45) }, disabled && { opacity: 0.35 }]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.stepBtnText, warn && { color: t.warn }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 22, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
    ownerBadge: {
      backgroundColor: t.accentSoft, borderColor: rgba(t.accent, 0.4), borderWidth: 1,
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    },
    ownerBadgeText: { color: t.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    certBadge: {
      backgroundColor: rgba(MGRED, 0.1), borderColor: rgba(MGRED, 0.4), borderWidth: 1,
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    },
    certBadgeText: { color: MGRED, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    simBadge: {
      backgroundColor: rgba(t.warn, 0.1), borderColor: rgba(t.warn, 0.4), borderWidth: 1,
      borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    },
    simBadgeText: { color: t.warn, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    sub: { color: t.dim, fontSize: 13, marginTop: 8, lineHeight: 19 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    modeChip: {
      flex: 1, borderColor: t.border, borderWidth: 1, borderRadius: 16,
      paddingHorizontal: 14, paddingVertical: 12, marginTop: 10,
    },
    modeChipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    modeChipSub: { color: t.faint, fontSize: 11, marginTop: 2 },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    input: {
      marginTop: 8, backgroundColor: t.card, borderColor: t.border, borderWidth: 1,
      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13, color: t.text, fontSize: 14,
    },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16, marginTop: 18,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    stateStrip: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 18 },
    stateChip: {
      borderColor: t.border, borderWidth: 1, borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 5,
    },
    stateChipDone: { backgroundColor: t.card },
    stateChipActive: { borderColor: t.accent, backgroundColor: t.accentSoft },
    stateChipFailed: { borderColor: rgba(t.warn, 0.5), backgroundColor: rgba(t.warn, 0.08) },
    stateChipText: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    hero: {
      marginTop: 14, borderRadius: 24, padding: 20,
      borderColor: rgba(t.accent, 0.28), borderWidth: 1, overflow: "hidden",
    },
    quoteHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 },
    ttl: { color: t.dim, fontSize: 12, fontWeight: "700" },
    provider: { color: t.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.4, marginTop: 8 },
    body: { color: t.text, fontSize: 14, lineHeight: 21, marginTop: 6 },
    meta: { color: t.dim, fontSize: 12, marginTop: 6, lineHeight: 17 },
    certLine: { color: MGRED, fontSize: 12, fontWeight: "600", marginTop: 8 },
    mono: { color: t.faint, fontSize: 11, fontFamily: "Courier", marginTop: 6 },
    card: { marginTop: 12, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 18 },
    cardTitle: { color: t.text, fontSize: 15, fontWeight: "800" },
    mgHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
    mgLogo: { width: 28, height: 28, borderRadius: 14 },
    gateCard: {
      flexDirection: "row", gap: 10, alignItems: "flex-start",
      marginTop: 12, backgroundColor: rgba(MGRED, 0.07), borderColor: rgba(MGRED, 0.35),
      borderWidth: 1, borderRadius: 20, padding: 16,
    },
    gateText: { flex: 1, color: t.text, fontSize: 13, lineHeight: 19 },
    btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
    stepBtn: {
      borderColor: t.border, borderWidth: 1, borderRadius: 14,
      paddingHorizontal: 14, paddingVertical: 11,
    },
    stepBtnText: { color: t.text, fontSize: 13, fontWeight: "700" },
    killRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
    killText: { color: t.dim, fontSize: 12, flex: 1 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: "center" },
  });
