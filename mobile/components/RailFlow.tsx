import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/lib/authContext";
import { railAction, type RailPayment, type RailResponse } from "@/lib/api";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * RAIL FLOW — the lib/rail machine inside the Loadit customer flow.
 *
 * Embedded by the cash/card → crypto screens (not a separate console): the
 * customer states amount + outcome + their own wallet, HQ scores and locks a
 * TTL quote (no chain picker anywhere), MoneyGram cash is door one, and one
 * payment id carries the whole lifecycle — including heal, which re-scores
 * under the SAME id when a quote dies.
 *
 * Honesty, hard-coded:
 *  - MoneyGram cash-in is NOT live (certification in flight). Confirming the
 *    cash intake is refused by the server door and the refusal is shown
 *    verbatim. No copy here claims cash-in is live.
 *  - Partner transaction ids are never invented — the intake card says so.
 *  - Server-gated: /api/rail only answers the rail owner's verified Hylaq
 *    token. Anyone else gets 401/403, whatever the UI does.
 */

const MGRED = "#E8453C";
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

export function RailFlow({ amountUsd, asset, wallet }: {
  amountUsd: number;
  asset: string;
  wallet: string;
}) {
  const { session } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [payment, setPayment] = useState<RailPayment | null>(null);
  const [meta, setMeta] = useState<RailResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [gate, setGate] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const locked = useRef(false);

  // 1s re-render so the TTL counts down live.
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const act = async (body: Parameters<typeof railAction>[1]) => {
    setBusy(true);
    setErr(null);
    setGate(null);
    try {
      const r = await railAction(session?.accessToken, body);
      if (r.payment) setPayment(r.payment);
      setMeta(r);
      if (!r.ok) {
        if (r.reason === "certification_gate") {
          setGate(r.message || "MoneyGram cash-in certification is in flight — confirm refused.");
          const g = await railAction(session?.accessToken, { action: "get", mode: "live", paymentId: body.paymentId });
          if (g.payment) setPayment(g.payment);
        } else if (r.status === 401 || r.status === 403) {
          setErr("This account isn't authorized for the rail.");
        } else if (r.reason === "quote_expired") {
          const g = await railAction(session?.accessToken, { action: "get", mode: "live", paymentId: body.paymentId });
          if (g.payment) setPayment(g.payment);
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

  // Lock the quote as soon as the flow mounts (the customer already gave
  // amount + outcome + wallet on the screen embedding this).
  useEffect(() => {
    if (locked.current) return;
    locked.current = true;
    act({
      action: "create",
      mode: "live",
      intent: { amountUsd, outcome: { asset, wallet } },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!payment) {
    return (
      <View style={styles.loading}>
        {err ? (
          <Text style={styles.err}>{err}</Text>
        ) : (
          <>
            <ActivityIndicator color={t.accentText} />
            <Text style={styles.loadingText}>HQ is scoring the doors…</Text>
          </>
        )}
      </View>
    );
  }

  const ttlLeft = Math.max(0, Math.ceil((payment.quote.expiresAt - Date.now()) / 1000));
  const quoteExpired = payment.state === "quoted" && ttlLeft === 0;
  const passed = new Set(payment.history.map((h) => h.to));

  return (
    <View>
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

      {/* locked quote */}
      <LinearGradient
        colors={[rgba(t.accent, 0.13), "rgba(255,255,255,0.03)"]}
        start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.quoteHead}>
          <Text style={styles.bestTag}>
            {payment.quote.healed ? "HEALED QUOTE — SAME PAYMENT ID" : "LOCKED QUOTE — HQ SCORED"}
          </Text>
          <Text style={[styles.ttl, ttlLeft <= 15 && { color: t.warn }]}>TTL {ttlLeft}s</Text>
        </View>
        <View style={styles.doorRow}>
          {payment.quote.route.doorId === "moneygram_cash" && (
            <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
          )}
          <Text style={styles.provider}>{payment.quote.route.doorLabel}</Text>
        </View>
        <Text style={styles.body}>
          {money(payment.intent.amountUsd)} in → {payment.intent.outcome.asset} out · fee{" "}
          {money(payment.quote.route.feeUsd)} · score {payment.quote.route.score.toFixed(1)}
        </Text>
        <Text style={styles.meta}>{payment.quote.route.legs.map((l) => l.detail).join(" → ")}</Text>
        <Text style={styles.meta}>Non-custodial — delivered to {payment.intent.outcome.wallet}</Text>
        {!payment.quote.route.confirmable && (
          <Text style={styles.certLine}>
            Cash-in isn&apos;t live yet — MoneyGram certification is in flight, so this intake can&apos;t
            be confirmed with real cash.
          </Text>
        )}
        <Text style={styles.mono}>payment {payment.id}</Text>
        <Text style={styles.mono}>quote {payment.quote.quoteId} · #{payment.quoteCount}</Text>
        {payment.lastError && <Text style={styles.err}>last error: {payment.lastError}</Text>}
      </LinearGradient>

      {/* intake instructions */}
      {payment.intake?.instructions && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cash intake</Text>
          <Text style={styles.body}>{payment.intake.instructions}</Text>
          <Text style={styles.mono}>
            ref {payment.intake.internalRef} · partner tx id: {payment.intake.partnerTxId ?? "none (never invented)"}
          </Text>
        </View>
      )}

      {/* the certification refusal, verbatim from the door */}
      {gate && (
        <View style={styles.gateCard}>
          <Feather name="shield-off" size={16} color={MGRED} />
          <Text style={styles.gateText}>{gate}</Text>
        </View>
      )}

      {err && <Text style={styles.err}>{err}</Text>}

      {/* actions for where the payment actually is */}
      <View style={styles.btnRow}>
        {payment.state === "quoted" && !quoteExpired && (
          <TouchableOpacity
            style={styles.cta}
            disabled={busy}
            onPress={() => act({ action: "intake", mode: "live", paymentId: payment.id })}
          >
            {busy ? <ActivityIndicator color={t.onAccent} /> : (
              <>
                <Text style={styles.ctaText}>Begin cash intake</Text>
                <Feather name="chevron-right" size={16} color={t.onAccent} />
              </>
            )}
          </TouchableOpacity>
        )}
        {quoteExpired && (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: t.card, borderColor: rgba(t.warn, 0.5), borderWidth: 1 }]}
            disabled={busy}
            onPress={async () => {
              // An expired quote fails honestly, then heal re-scores what is
              // left under the SAME payment id.
              await act({ action: "intake", mode: "live", paymentId: payment.id });
              await act({ action: "heal", mode: "live", paymentId: payment.id });
            }}
          >
            <Text style={[styles.ctaText, { color: t.warn }]}>Quote expired — heal (same payment id)</Text>
          </TouchableOpacity>
        )}
        {payment.state === "intake_pending" && (
          <TouchableOpacity
            style={styles.cta}
            disabled={busy}
            onPress={() => act({ action: "confirm", mode: "live", paymentId: payment.id })}
          >
            {busy ? <ActivityIndicator color={t.onAccent} /> : (
              <Text style={styles.ctaText}>I paid cash — confirm intake</Text>
            )}
          </TouchableOpacity>
        )}
        {payment.state === "failed" && (
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: t.card, borderColor: rgba(t.warn, 0.5), borderWidth: 1 }]}
            disabled={busy}
            onPress={() => act({ action: "heal", mode: "live", paymentId: payment.id })}
          >
            <Text style={[styles.ctaText, { color: t.warn }]}>Heal — re-score, same payment id</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* receipt (only reachable once certification clears) */}
      {payment.receipt && (
        <View style={[styles.card, { borderColor: rgba(t.accent, 0.3) }]}>
          <Text style={styles.cardTitle}>Delivered</Text>
          <Text style={styles.body}>
            {money(payment.receipt.amountUsd)} → {payment.receipt.deliveredTo}
          </Text>
          <Text style={styles.mono}>receipt {payment.receipt.receiptRef}</Text>
        </View>
      )}

      {meta?.notice && <Text style={styles.disclaimer}>{meta.notice}</Text>}
      <Text style={styles.disclaimer}>
        Loadit never holds your keys or funds. No partner transaction ids are ever generated by
        Loadit — they only come from the partner&apos;s own system.
      </Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
    loadingText: { color: t.dim, fontSize: 14 },
    stateStrip: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 18 },
    stateChip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    stateChipDone: { backgroundColor: t.card },
    stateChipActive: { borderColor: t.accent, backgroundColor: t.accentSoft },
    stateChipFailed: { borderColor: rgba(t.warn, 0.5), backgroundColor: rgba(t.warn, 0.08) },
    stateChipText: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
    hero: {
      marginTop: 14, borderRadius: 24, padding: 20,
      borderColor: rgba(t.accent, 0.28), borderWidth: 1, overflow: "hidden",
    },
    quoteHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 1.4, flex: 1 },
    ttl: { color: t.dim, fontSize: 12, fontWeight: "700" },
    doorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
    mgLogo: { width: 30, height: 30, borderRadius: 15 },
    provider: { color: t.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
    body: { color: t.text, fontSize: 14, lineHeight: 21, marginTop: 6 },
    meta: { color: t.dim, fontSize: 12, marginTop: 6, lineHeight: 17 },
    certLine: { color: MGRED, fontSize: 12, fontWeight: "600", marginTop: 8, lineHeight: 17 },
    mono: { color: t.faint, fontSize: 11, fontFamily: "Courier", marginTop: 6 },
    card: { marginTop: 12, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 18 },
    cardTitle: { color: t.text, fontSize: 15, fontWeight: "800" },
    gateCard: {
      flexDirection: "row", gap: 10, alignItems: "flex-start",
      marginTop: 12, backgroundColor: rgba(MGRED, 0.07), borderColor: rgba(MGRED, 0.35),
      borderWidth: 1, borderRadius: 20, padding: 16,
    },
    gateText: { flex: 1, color: t.text, fontSize: 13, lineHeight: 19 },
    btnRow: { marginTop: 6 },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 15, marginTop: 12,
      shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: "center" },
  });
