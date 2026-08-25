import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Linking,
} from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { getRoute, type HQRouteQuote } from "@/lib/api";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * LIVE HQ QUOTE — "the money app that proves it got you the best price."
 *
 * Fetches real provider quotes through the Loadit backend (/api/quote → HQ;
 * the key never touches the phone) and shows: the best route, every provider
 * compared, the signed receipt as proof, and a test-mode badge whenever HQ is
 * in sandbox — never hidden. Confirm continues into the licensed buy flow;
 * the `execute` handle (Zero Hash / Transak / MoonPay / MoneyGram SDKs) plugs
 * in there as those integrations land.
 */

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

  const best = quote?.best;
  const others = (quote?.quotes || []).filter((q) => q.provider !== best?.provider);

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headRow}>
          <Text style={styles.h1}>{money(amount)} → {asset}</Text>
          {quote?.mode === "sandbox" && (
            <View style={styles.testBadge}><Text style={styles.testBadgeText}>TEST MODE</Text></View>
          )}
        </View>
        <Text style={styles.sub}>HQ compared licensed providers in real time. Best deal first — receipt included.</Text>

        {!quote && !error && (
          <View style={styles.loading}>
            <ActivityIndicator color={t.accentText} />
            <Text style={styles.loadingText}>Getting live quotes…</Text>
          </View>
        )}

        {error && (
          <View style={styles.card}>
            <Text style={styles.explain}>{error}</Text>
            <TouchableOpacity
              style={styles.buy}
              onPress={() => router.push({ pathname: "/buy", params: { asset, amount: String(amount) } })}
            >
              <Text style={styles.buyText}>Continue to buy {asset} →</Text>
            </TouchableOpacity>
          </View>
        )}

        {best && (
          <>
            <View style={[styles.card, styles.bestCard]}>
              <Text style={quote?.quantum ? styles.quantumTag : styles.bestTag}>
                {quote?.quantum ? "◈ QUANTUM ROUTE" : "BEST ROUTE"}
              </Text>
              <Text style={styles.provider}>{best.provider}</Text>
              <Text style={styles.assetOut}>You receive ~{best.assetOut} {asset}</Text>
              <View style={styles.statsRow}>
                <Stat styles={styles} label="Fee" value={money(best.feeUsd)} />
                <Stat styles={styles} label="Spread" value={`${best.spreadPct}%`} />
                <Stat styles={styles} label="ETA" value={`~${best.etaMinutes} min`} />
              </View>
              {typeof quote?.savingsUsd === "number" && quote.savingsUsd > 0 && (
                <Text style={styles.savings}>Beats the next-best offer by {money(quote.savingsUsd)}</Text>
              )}
              <TouchableOpacity
                style={styles.buy}
                onPress={() => router.push({ pathname: "/buy", params: { asset, amount: String(amount) } })}
              >
                <Text style={styles.buyText}>Confirm — buy {asset} →</Text>
              </TouchableOpacity>
            </View>

            {others.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTag}>ALSO CHECKED</Text>
                {others.map((q) => (
                  <View key={q.provider} style={styles.quoteRow}>
                    <Text style={styles.quoteProvider}>{q.provider}</Text>
                    <Text style={styles.quoteMeta}>
                      {money(q.feeUsd)} fee · {q.spreadPct}% · ~{q.assetOut} {asset}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {quote?.receipt?.statement && (
              <View style={styles.card}>
                <Text style={styles.sectionTag}>PROOF — SIGNED RECEIPT</Text>
                <Text style={styles.receipt}>{quote.receipt.statement}</Text>
                <Text style={styles.receiptMeta}>
                  Signed{quote.receipt.attestation?.model ? ` by ${quote.receipt.attestation.model}` : ""} — your proof this was the best available price.
                </Text>
              </View>
            )}

            {quote?.quantum && (
              <View style={[styles.card, styles.quantumCard]}>
                <Text style={styles.quantumSectionTag}>◈ QUANTUM-PROOF RECEIPT</Text>
                <Text style={styles.receiptMeta}>
                  Sealed with {quote.quantum.alg} (NIST post-quantum) · {quote.quantum.calibration}
                </Text>
                <TouchableOpacity onPress={() => Linking.openURL(quote.quantum!.url)}>
                  <Text style={styles.quantumVerify}>Verify publicly → {quote.quantum.url.replace("https://", "")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={styles.disclaimer}>
          Quotes are live estimates and can move with the market. Purchases complete via a licensed
          provider straight to your own wallet — Loadit never holds funds.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ styles, label, value }: { styles: ReturnType<typeof makeStyles>; label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    testBadge: { backgroundColor: rgba(t.warn, 0.12), borderColor: t.warn, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    testBadgeText: { color: t.warn, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    sub: { color: t.dim, fontSize: 13, marginTop: 6, marginBottom: 16, lineHeight: 19 },
    loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
    loadingText: { color: t.dim, fontSize: 14 },
    card: { marginTop: 14, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 16 },
    bestCard: { borderColor: t.accentTint, backgroundColor: t.accentSoft },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumTag: { color: "#9D8CFF", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumCard: { borderColor: "#4A3F8F" },
    quantumSectionTag: { color: "#9D8CFF", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
    quantumVerify: { color: "#9D8CFF", fontSize: 13, fontWeight: "600", marginTop: 10 },
    provider: { color: t.text, fontSize: 20, fontWeight: "800", marginTop: 6 },
    assetOut: { color: t.text, fontSize: 15, marginTop: 4 },
    statsRow: { flexDirection: "row", gap: 8, marginTop: 12 },
    stat: { flex: 1, backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 10 },
    statLabel: { color: t.faint, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" },
    statValue: { color: t.text, fontSize: 14, fontWeight: "700", marginTop: 3 },
    savings: { color: t.accentText, fontSize: 13, fontWeight: "700", marginTop: 12 },
    buy: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 14 },
    buyText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    sectionTag: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
    quoteRow: { paddingVertical: 8, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth },
    quoteProvider: { color: t.text, fontSize: 14, fontWeight: "600" },
    quoteMeta: { color: t.dim, fontSize: 12, marginTop: 2 },
    explain: { color: t.text, fontSize: 14, lineHeight: 20 },
    receipt: { color: t.dim, fontSize: 12, lineHeight: 18, fontFamily: "Courier" },
    receiptMeta: { color: t.faint, fontSize: 11, marginTop: 8 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
  });
