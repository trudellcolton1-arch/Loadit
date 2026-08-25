import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { getMoneyGramPlan, type MoneyGramPlan } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * CASH → CRYPTO via MONEYGRAM.
 *
 * Cash at 350,000+ MoneyGram locations → USDC on Stellar (MoneyGram is the
 * licensed leg, does the KYC) → HQ swaps into the chosen asset → the user's
 * own wallet. Shows the full grounded route; the swap executor and live anchor
 * are wired server-side.
 */

const ASSETS = ["BTC", "ETH", "SOL", "USDC"] as const;
const AMOUNTS = [40, 100, 250, 500] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MoneyGram() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC");
  const [amount, setAmount] = useState(100);
  const [wallet, setWallet] = useState("");
  const [plan, setPlan] = useState<MoneyGramPlan | null>(null);
  const [loading, setLoading] = useState(false);

  if (ready && !session) return <Redirect href="/login" />;

  const preview = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const p = await getMoneyGramPlan(amount, asset, wallet.trim());
      if (p.ok) setPlan(p);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
            <Text style={styles.h1}>Cash → crypto{"\n"}at MoneyGram</Text>
          </View>
          <Text style={styles.sub}>
            Pay cash at 350,000+ MoneyGram locations. They turn it into USDC and verify you
            at the counter; HQ swaps it into your asset and sends it to your own wallet.
          </Text>

          <Text style={styles.label}>You want</Text>
          <View style={styles.row}>
            {ASSETS.map((a) => (
              <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => { setAsset(a); setPlan(null); }}>
                <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Cash amount (USD)</Text>
          <View style={styles.row}>
            {AMOUNTS.map((v) => (
              <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => { setAmount(v); setPlan(null); }}>
                <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Your wallet address ({asset})</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste the address you control"
            placeholderTextColor={t.faint}
            value={wallet}
            onChangeText={(v) => { setWallet(v); setPlan(null); }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity style={styles.cta} onPress={preview} disabled={loading}>
            {loading ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>See my route</Text>}
          </TouchableOpacity>

          {plan && (
            <View style={styles.planCard}>
              <View style={styles.flowHead}>
                <Text style={styles.flowTitle}>Your route</Text>
                {!plan.configured && <View style={styles.soon}><Text style={styles.soonText}>COMING SOON</Text></View>}
              </View>

              {plan.steps.map((s, i) => (
                <View key={s.n} style={styles.step}>
                  <View style={styles.stepRail}>
                    <View style={styles.stepDot}><Text style={styles.stepDotText}>{s.n}</Text></View>
                    {i < plan.steps.length - 1 && <View style={styles.stepLine} />}
                  </View>
                  <View style={styles.stepBody}>
                    <Text style={styles.stepTitle}>{s.title}</Text>
                    <Text style={styles.stepDetail}>{s.detail}</Text>
                  </View>
                </View>
              ))}

              <View style={styles.feeCard}>
                <View style={styles.feeRow}><Text style={styles.feeLabel}>Cash in</Text><Text style={styles.feeVal}>{money(plan.amountUsd)}</Text></View>
                <View style={styles.feeRow}><Text style={styles.feeLabel}>Loadit fee (0.75%, $1 min)</Text><Text style={styles.feeVal}>{money(plan.loaditFeeUsd)}</Text></View>
                {plan.swapFeeUsd ? <View style={styles.feeRow}><Text style={styles.feeLabel}>HQ swap (0.25%)</Text><Text style={styles.feeVal}>{money(plan.swapFeeUsd)}</Text></View> : null}
                <View style={styles.feeRow}><Text style={styles.feeLabel}>Delivered as</Text><Text style={styles.feeVal}>{asset} → your wallet</Text></View>
              </View>

              <Text style={styles.swapNote}>{plan.swap.note}</Text>
            </View>
          )}

          <Text style={styles.legal}>
            MoneyGram is the licensed money-transmitter and performs identity verification. The
            USDC→{asset} swap is executed by a licensed liquidity provider. Loadit orchestrates the
            route and never holds your funds. Amounts and fees are estimates until you confirm.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    mgLogo: { width: 46, height: 46, borderRadius: 23 },
    h1: { color: t.text, fontSize: 24, fontWeight: "800", letterSpacing: -0.6, lineHeight: 28 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 6 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    input: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 14, marginTop: 8 },
    cta: { backgroundColor: t.button, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 20, shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 16 },
    planCard: { marginTop: 22, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 18 },
    flowHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    flowTitle: { color: t.text, fontSize: 16, fontWeight: "800" },
    soon: { backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    soonText: { color: t.accentText, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
    step: { flexDirection: "row", gap: 12 },
    stepRail: { alignItems: "center", width: 26 },
    stepDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" },
    stepDotText: { color: t.onAccent, fontWeight: "800", fontSize: 12 },
    stepLine: { flex: 1, width: 2, backgroundColor: t.accentTint, marginVertical: 2 },
    stepBody: { flex: 1, paddingBottom: 16 },
    stepTitle: { color: t.text, fontSize: 14, fontWeight: "700" },
    stepDetail: { color: t.dim, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
    feeCard: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 4 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeVal: { color: t.text, fontSize: 13, fontWeight: "600" },
    swapNote: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 12 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
  });
