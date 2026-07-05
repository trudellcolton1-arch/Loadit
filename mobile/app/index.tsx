import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { routeIntent, type IntentResult } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

const EXAMPLES = [
  "Turn $500 cash into Bitcoin",
  "Buy $250 of Solana with my debit card",
  "Move $1,000 from my bank into USDC",
];
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Home() {
  const { session, ready, signOut } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);

  if (ready && !session) return <Redirect href="/login" />;

  const run = async (message: string) => {
    const q = message.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await routeIntent(q);
      if (data.ok) setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.headRow}>
            <Image source={require("../assets/mark.png")} style={styles.mark} />
            <View style={styles.headActions}>
              <TouchableOpacity onPress={() => router.push("/appearance")}>
                <Text style={styles.headAction}>🎨</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={signOut}><Text style={styles.signout}>Sign out</Text></TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loadCta} onPress={() => router.push("/load")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.loadCtaTitle}>Load crypto</Text>
              <Text style={styles.loadCtaSub}>Cash or card → Bitcoin, Solana, Ethereum, USDC</Text>
            </View>
            <Text style={styles.loadCtaArrow}>→</Text>
          </TouchableOpacity>

          <Text style={styles.h1}>Just say it.</Text>
          <Text style={styles.sub}>Tell HQ what you want to do with your money. He finds the cheapest real route.</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Turn $500 cash into Bitcoin"
              placeholderTextColor={t.faint}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => run(text)}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.go} onPress={() => run(text)} disabled={loading}>
              {loading ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.goText}>Route</Text>}
            </TouchableOpacity>
          </View>

          {!result && !loading && (
            <View style={styles.chips}>
              {EXAMPLES.map((ex) => (
                <TouchableOpacity key={ex} style={styles.chip} onPress={() => { setText(ex); run(ex); }}>
                  <Text style={styles.chipText}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push("/hq")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>🧠 HQ — your AI</Text>
              <Text style={styles.featureSub}>
                Chat with the brain behind your money. Ask anything, or say a
                move and HQ routes it — cheapest real way, every time.
              </Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.featureCard} onPress={() => router.push("/register")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>🏪 Cash at any register</Text>
              <Text style={styles.featureSub}>
                Deposit paper cash at 90k+ stores, then buy crypto through
                Coinbase or Stripe — straight to your wallet.
              </Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.card}>
              <Text style={styles.aero}>HQ</Text>
              <Text style={styles.explain}>{result.explanation}</Text>
              {result.hq && (
                <Text style={styles.liveQuote}>
                  ⚡ Live: {result.hq.provider} — you receive ~{result.hq.asset_out} {result.intent.asset}
                </Text>
              )}

              <View style={styles.statsRow}>
                <Stat styles={styles} label="Route" value={result.route.network_name} />
                <Stat styles={styles} label="Settles" value={result.route.eta} />
              </View>
              <View style={styles.statsRow}>
                <Stat styles={styles} label="Loadit fee (0.75%)" value={money(result.route.loadit_fee_usd)} />
                <Stat
                  styles={styles}
                  label="You pay"
                  value={money(result.route.total_usd ?? result.intent.amount_usd + result.route.loadit_fee_usd)}
                  sub={result.route.savings_pct > 0 ? `${result.route.savings_pct}% cheaper` : "all in"}
                  accent
                />
              </View>

              <TouchableOpacity
                style={styles.buy}
                onPress={() =>
                  router.push({
                    pathname: "/buy",
                    params: {
                      asset: result.intent.asset,
                      amount: String(result.intent.amount_usd),
                    },
                  })
                }
              >
                <Text style={styles.buyText}>Buy {result.intent.asset} now →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: "/quote",
                    params: {
                      asset: result.intent.asset,
                      amount: String(result.intent.amount_usd),
                      payMethod: result.intent.payment_method,
                    },
                  })
                }
              >
                <Text style={styles.quoteLink}>See live provider quotes + receipt →</Text>
              </TouchableOpacity>
              <Text style={styles.disclaimer}>
                Completed by a licensed partner (Stripe / Coinbase) to your own wallet. Loadit never holds funds. Estimates depend on live conditions.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ styles, label, value, sub, accent }: {
  styles: ReturnType<typeof makeStyles>; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    mark: { width: 40, height: 40 },
    headActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    headAction: { fontSize: 20 },
    signout: { color: t.faint, fontSize: 13 },
    loadCta: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, backgroundColor: t.button, borderRadius: 20, padding: 18 },
    loadCtaTitle: { color: t.buttonText, fontSize: 18, fontWeight: "800" },
    loadCtaSub: { color: t.mode === "light" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontSize: 12, marginTop: 3 },
    loadCtaArrow: { color: t.buttonText, fontSize: 22, fontWeight: "700" },
    h1: { color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: 22 },
    sub: { color: t.dim, fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 20 },
    inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    input: { flex: 1, backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 15 },
    go: { backgroundColor: t.button, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15 },
    goText: { color: t.buttonText, fontWeight: "700" },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    chipText: { color: t.dim, fontSize: 12 },
    featureCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16, backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 20, padding: 16 },
    featureTitle: { color: t.text, fontSize: 16, fontWeight: "700" },
    featureSub: { color: t.dim, fontSize: 12, lineHeight: 17, marginTop: 3 },
    featureArrow: { color: t.accentText, fontSize: 20, fontWeight: "700" },
    card: { marginTop: 20, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 18 },
    aero: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
    explain: { color: t.text, fontSize: 15, lineHeight: 22 },
    liveQuote: { color: t.warn, fontSize: 12, fontWeight: "600", marginTop: 8 },
    statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
    stat: { flex: 1, backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 12 },
    statLabel: { color: t.faint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
    statValue: { color: t.text, fontSize: 16, fontWeight: "700", marginTop: 4 },
    statAccent: { color: t.accentText },
    statSub: { color: t.faint, fontSize: 11, marginTop: 2 },
    buy: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: 16 },
    buyText: { color: t.buttonText, fontWeight: "700", fontSize: 16 },
    quoteLink: { color: t.accentText, fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 12 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: "center" },
  });
