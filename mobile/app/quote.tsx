import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { getRoute, type HQRouteQuote } from "@/lib/api";
import { isRailOwner } from "@/lib/config";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * LIVE HQ QUOTE — "the money app that proves it got you the best price."
 * The receipt IS the interface: one glowing best-route card with the number
 * huge, everything else recedes. Sandbox mode badge is never hidden.
 */

const VIOLET = "#9D8CFF";
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Quote() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const params = useLocalSearchParams<{ asset?: string; amount?: string; payMethod?: string }>();
  const asset = (params.asset || "BTC").toString().toUpperCase();
  const amount = Math.max(1, parseFloat(String(params.amount)) || 100);
  const payMethod = (params.payMethod || "").toString();

  const [quote, setQuote] = useState<HQRouteQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = await getRoute(amount, asset, payMethod);
        if (cancelled) return;
        if (q.best) setQuote(q);
        else setError(q.reason === "not_configured"
          ? "Live quotes aren't switched on for this build yet."
          : "No live quotes right now — you can still buy through a licensed partner.");
      } catch {
        if (!cancelled) setError("Couldn't reach the quote service — check your connection.");
      }
    })();
    return () => { cancelled = true; };
  }, [amount, asset, payMethod]);

  if (ready && !session) return <Redirect href="/login" />;

  // Cash intents continue on the rail for the owner's account (server-gated):
  // HQ locks the quote at the MoneyGram door on the cash → crypto screen.
  const railCash =
    session?.kind === "hylaq" && isRailOwner(session.email) && payMethod.toLowerCase() === "cash";

  const best = quote?.best;
  const others = (quote?.quotes || []).filter((q) => q.provider !== best?.provider);
  const routesChecked = quote?.quotes?.length || 0;

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* header */}
        <View style={styles.headRow}>
          <Text style={styles.kicker}>Live quote</Text>
          {routesChecked > 0 && (
            <Text style={styles.routesLabel}>● {routesChecked} routes compared</Text>
          )}
          {quote?.mode === "sandbox" && (
            <View style={styles.testBadge}><Text style={styles.testBadgeText}>TEST MODE</Text></View>
          )}
        </View>
        <Text style={styles.h1}>
          {money(amount).replace(".00", "")} <Text style={styles.h1Arrow}>→</Text> {asset}
        </Text>

        {!quote && !error && (
          <View style={styles.loading}>
            <ActivityIndicator color={t.accentText} />
            <Text style={styles.loadingText}>HQ is comparing live routes…</Text>
          </View>
        )}

        {error && (
          <View style={styles.card}>
            <Text style={styles.body}>{error}</Text>
            <TouchableOpacity
              style={styles.cta}
              onPress={() => router.push({ pathname: "/buy", params: { asset, amount: String(amount) } })}
            >
              <Text style={styles.ctaText}>Continue to buy {asset}</Text>
              <Feather name="chevron-right" size={16} color={t.onAccent} />
            </TouchableOpacity>
          </View>
        )}

        {best && (
          <>
            {/* best-route hero */}
            <LinearGradient
              colors={[rgba(t.accent, 0.14), "rgba(255,255,255,0.03)"]}
              start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroTop}>
                <Text style={quote?.quantum ? styles.quantumTag : styles.bestTag}>
                  {quote?.quantum ? "◈ QUANTUM ROUTE" : "BEST ROUTE"}
                </Text>
                <View style={styles.providerChip}>
                  <Text style={styles.providerChipText}>{best.provider}</Text>
                </View>
              </View>
              <Text style={styles.receiveLabel}>You receive</Text>
              <Text style={styles.receiveNum}>
                {best.assetOut} <Text style={styles.receiveAsset}>{asset}</Text>
              </Text>
              <View style={styles.statsRow}>
                <Text style={styles.stat}>Fee <Text style={styles.statVal}>{money(best.feeUsd)}</Text></Text>
                <Text style={styles.stat}>Spread <Text style={styles.statVal}>{best.spreadPct}%</Text></Text>
                <Text style={styles.stat}>ETA <Text style={styles.statVal}>~{best.etaMinutes} min</Text></Text>
              </View>
              {typeof quote?.savingsUsd === "number" && quote.savingsUsd > 0 && (
                <View style={styles.savingsRow}>
                  <Feather name="check" size={14} color={t.accentText} />
                  <Text style={styles.savings}>Beats the next-best offer by {money(quote.savingsUsd)}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.cta}
                onPress={() =>
                  railCash
                    ? router.push({ pathname: "/moneygram", params: { asset, amount: String(amount) } })
                    : router.push({ pathname: "/buy", params: { asset, amount: String(amount) } })
                }
              >
                <Text style={styles.ctaText}>
                  {railCash ? "Continue — cash at MoneyGram" : `Confirm — buy ${asset}`}
                </Text>
                <Feather name="chevron-right" size={16} color={t.onAccent} />
              </TouchableOpacity>
              {railCash && (
                <Text style={styles.railNote}>
                  HQ locks the route on the next screen — MoneyGram is door one. Cash-in
                  certification is still in flight, not live.
                </Text>
              )}
            </LinearGradient>

            {/* also checked */}
            {others.length > 0 && (
              <View style={styles.alsoWrap}>
                <Text style={styles.microlabel}>Also checked</Text>
                {others.map((q) => (
                  <View key={q.provider} style={styles.quoteRow}>
                    <Text style={styles.quoteProvider}>{q.provider}</Text>
                    <Text style={styles.quoteMeta}>
                      {money(q.feeUsd)} · {q.spreadPct}% · {q.assetOut}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* signed receipt statement */}
            {quote?.receipt?.statement && (
              <View style={styles.card}>
                <Text style={styles.microlabel}>Proof — signed receipt</Text>
                <Text style={styles.receiptText}>{quote.receipt.statement}</Text>
              </View>
            )}

            {/* quantum receipt jewel */}
            {quote?.quantum && (
              <LinearGradient
                colors={["rgba(157,140,255,0.13)", "rgba(157,140,255,0.03)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.quantumCard}
              >
                <View style={styles.quantumHead}>
                  <Text style={styles.quantumDiamond}>◈</Text>
                  <Text style={styles.quantumSectionTag}>QUANTUM-PROOF RECEIPT</Text>
                </View>
                <Text style={styles.quantumMeta}>
                  Sealed with {quote.quantum.alg} · {quote.quantum.calibration}
                </Text>
                <Text style={styles.quantumMeta}>
                  Signed before you pay. Verifiable by anyone, forever.
                </Text>
                <TouchableOpacity
                  style={styles.quantumVerifyRow}
                  onPress={() => Linking.openURL(quote.quantum!.url)}
                >
                  <Text style={styles.quantumVerify}>Verify publicly</Text>
                  <Feather name="external-link" size={14} color={VIOLET} />
                </TouchableOpacity>
              </LinearGradient>
            )}
          </>
        )}

        <Text style={styles.disclaimer}>
          Quotes move with the market. Purchases complete via a licensed provider straight
          to your own wallet — Loadit never holds funds.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 22, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    kicker: { color: t.dim, fontSize: 15, fontWeight: "500", flex: 1 },
    routesLabel: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase" },
    testBadge: { backgroundColor: rgba(t.warn, 0.12), borderColor: t.warn, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    testBadgeText: { color: t.warn, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    h1: { color: t.text, fontSize: 36, fontWeight: "800", letterSpacing: -1.2, marginTop: 6 },
    h1Arrow: { color: t.faint, fontSize: 26, fontWeight: "600" },
    loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26 },
    loadingText: { color: t.dim, fontSize: 14 },
    hero: {
      marginTop: 20, borderRadius: 28, padding: 24,
      borderColor: rgba(t.accent, 0.3), borderWidth: 1, overflow: "hidden",
    },
    heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumTag: { color: VIOLET, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    providerChip: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    providerChipText: { color: t.dim, fontSize: 11, fontWeight: "600" },
    receiveLabel: { color: t.dim, fontSize: 13, fontWeight: "500", marginTop: 16 },
    receiveNum: { color: t.text, fontSize: 40, fontWeight: "800", letterSpacing: -1.4, marginTop: 2, fontVariant: ["tabular-nums"] },
    receiveAsset: { fontSize: 21, fontWeight: "700", color: t.dim, letterSpacing: 0 },
    statsRow: { flexDirection: "row", gap: 18, marginTop: 14 },
    stat: { color: t.dim, fontSize: 13, fontWeight: "500" },
    statVal: { color: t.text, fontWeight: "700", fontVariant: ["tabular-nums"] },
    savingsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 13 },
    savings: { color: t.accentText, fontSize: 13, fontWeight: "700" },
    railNote: { color: t.dim, fontSize: 11, lineHeight: 16, marginTop: 10, textAlign: "center" },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16, marginTop: 17,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 16, letterSpacing: -0.2 },
    alsoWrap: { marginTop: 20 },
    microlabel: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 },
    quoteRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 11, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth,
    },
    quoteProvider: { color: t.dim, fontSize: 14, fontWeight: "500" },
    quoteMeta: { color: t.faint, fontSize: 13, fontVariant: ["tabular-nums"] },
    card: { marginTop: 16, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 18 },
    body: { color: t.text, fontSize: 14, lineHeight: 21 },
    receiptText: { color: t.dim, fontSize: 12, lineHeight: 18, fontFamily: "Courier" },
    quantumCard: {
      marginTop: 16, borderRadius: 24, padding: 20,
      borderColor: "rgba(157,140,255,0.3)", borderWidth: 1, overflow: "hidden",
    },
    quantumHead: { flexDirection: "row", alignItems: "center", gap: 8 },
    quantumDiamond: { color: VIOLET, fontSize: 16 },
    quantumSectionTag: { color: VIOLET, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumMeta: { color: t.dim, fontSize: 13, lineHeight: 19, marginTop: 8 },
    quantumVerifyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
    quantumVerify: { color: VIOLET, fontSize: 13, fontWeight: "700" },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
  });
