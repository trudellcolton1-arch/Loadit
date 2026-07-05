import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { routeIntent, type IntentResult } from "@/lib/api";
import { BRAND } from "@/lib/config";

const EXAMPLES = [
  "Turn $500 cash into Bitcoin",
  "Buy $250 of Solana with my debit card",
  "Move $1,000 from my bank into USDC",
];
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Home() {
  const { session, ready, signOut } = useAuth();
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
            <Text style={styles.h1}>Just say it.</Text>
            <TouchableOpacity onPress={signOut}><Text style={styles.signout}>Sign out</Text></TouchableOpacity>
          </View>
          <Text style={styles.sub}>Tell AERO what you want to do with your money. HQ finds the cheapest real route.</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Turn $500 cash into Bitcoin"
              placeholderTextColor={BRAND.faint}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => run(text)}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.go} onPress={() => run(text)} disabled={loading}>
              {loading ? <ActivityIndicator color="#04060B" /> : <Text style={styles.goText}>Route</Text>}
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

          <TouchableOpacity style={styles.hqCard} onPress={() => router.push("/hq")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cashQrTitle}>🧠 HQ — your AI</Text>
              <Text style={styles.cashQrSub}>
                Chat with the brain behind your money. Ask anything, or say a
                move and HQ routes it — cheapest real way, every time.
              </Text>
            </View>
            <Text style={styles.hqArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cashQr} onPress={() => router.push("/register")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cashQrTitle}>🏪 Cash at any register</Text>
              <Text style={styles.cashQrSub}>
                Deposit paper cash at 90k+ stores, then buy crypto through
                Coinbase or Stripe — straight to your wallet.
              </Text>
            </View>
            <Text style={styles.cashQrArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cashQr} onPress={() => router.push("/receive")}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cashQrTitle}>💵 Cash QR</Text>
              <Text style={styles.cashQrSub}>
                Taking cash in hand? Show a QR — they scan, pay via Coinbase or
                Stripe, and the crypto lands in your wallet.
              </Text>
            </View>
            <Text style={styles.cashQrArrow}>→</Text>
          </TouchableOpacity>

          {result && (
            <View style={styles.card}>
              <Text style={styles.aero}>AERO</Text>
              <Text style={styles.explain}>{result.explanation}</Text>

              <View style={styles.statsRow}>
                <Stat label="Route" value={result.route.network_name} />
                <Stat label="Settles" value={result.route.eta} />
              </View>
              <View style={styles.statsRow}>
                <Stat label="Loadit cost" value={money(result.route.loadit_fee_usd)} />
                <Stat label="You save" value={money(result.route.savings_usd)} sub={`${result.route.savings_pct}% cheaper`} accent />
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

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && { color: BRAND.railLight }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BRAND.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { color: BRAND.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  signout: { color: BRAND.faint, fontSize: 13 },
  sub: { color: BRAND.dim, fontSize: 14, marginTop: 6, marginBottom: 18, lineHeight: 20 },
  inputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: { flex: 1, backgroundColor: BRAND.card, borderColor: BRAND.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: BRAND.text, fontSize: 15 },
  go: { backgroundColor: BRAND.rail, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15 },
  goText: { color: "#04060B", fontWeight: "700" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: { borderColor: BRAND.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: BRAND.dim, fontSize: 12 },
  card: { marginTop: 20, backgroundColor: BRAND.card, borderColor: BRAND.border, borderWidth: 1, borderRadius: 24, padding: 18 },
  aero: { color: BRAND.railLight, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  explain: { color: BRAND.text, fontSize: 15, lineHeight: 22 },
  statsRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  stat: { flex: 1, backgroundColor: "rgba(255,255,255,0.02)", borderColor: BRAND.border, borderWidth: 1, borderRadius: 16, padding: 12 },
  statLabel: { color: BRAND.faint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  statValue: { color: BRAND.text, fontSize: 16, fontWeight: "700", marginTop: 4 },
  statSub: { color: BRAND.faint, fontSize: 11, marginTop: 2 },
  cashQr: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, backgroundColor: "rgba(34,169,92,0.06)", borderColor: "rgba(34,169,92,0.35)", borderWidth: 1, borderRadius: 20, padding: 16 },
  hqCard: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, backgroundColor: "rgba(124,92,255,0.08)", borderColor: "rgba(124,92,255,0.4)", borderWidth: 1, borderRadius: 20, padding: 16 },
  hqArrow: { color: "#A78BFF", fontSize: 20, fontWeight: "700" },
  cashQrTitle: { color: BRAND.text, fontSize: 16, fontWeight: "700" },
  cashQrSub: { color: BRAND.dim, fontSize: 12, lineHeight: 17, marginTop: 3 },
  cashQrArrow: { color: BRAND.railLight, fontSize: 20, fontWeight: "700" },
  buy: { backgroundColor: BRAND.rail, borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: 16 },
  buyText: { color: "#04060B", fontWeight: "700", fontSize: 16 },
  disclaimer: { color: BRAND.faint, fontSize: 11, lineHeight: 16, marginTop: 12, textAlign: "center" },
});
