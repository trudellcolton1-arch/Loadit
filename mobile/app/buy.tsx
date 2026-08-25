import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOnramp, preferredProvider, type OnrampProvider } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

export default function Buy() {
  const { asset = "USDC", amount = "100" } = useLocalSearchParams<{ asset: string; amount: string }>();
  const router = useRouter();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [wallet, setWallet] = useState("");
  const [provider, setProvider] = useState<OnrampProvider>(preferredProvider(String(asset)));
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const amt = Math.max(1, Number(amount) || 0);
  const fee = Math.round(Math.max(1, amt * 0.0075) * 100) / 100;
  const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const cont = async () => {
    if (!wallet.trim()) {
      Alert.alert("Wallet needed", "Enter the wallet address where you want to receive your crypto. Loadit is non-custodial — the asset goes straight to you.");
      return;
    }
    setLoading(true);
    try {
      const r = await getOnramp(provider, { amount_usd: Number(amount), asset: String(asset), wallet: wallet.trim() });
      if (r.ok && r.url) {
        setUrl(r.url);
      } else if (r.configured === false) {
        Alert.alert("Not set up yet", `The ${provider} on-ramp isn't configured in the backend yet. Add its keys, then try again.`);
      } else {
        Alert.alert("Couldn't start", r.message || r.reason || "Try the other provider.");
      }
    } catch {
      Alert.alert("Network", "Couldn't reach the on-ramp. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Honest post-checkout state — never a fabricated success.
  if (submitted) {
    return (
      <SafeAreaView style={styles.wrap} edges={["bottom"]}>
        <View style={styles.submittedWrap}>
          <Text style={{ fontSize: 44 }}>⏳</Text>
          <Text style={styles.submittedTitle}>Payment submitted</Text>
          <Text style={styles.submittedNote}>
            If you completed the {provider === "coinbase" ? "Coinbase" : "Stripe"} checkout, your {String(asset)} is on its way to your wallet. If you closed it without paying, nothing was charged.
          </Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.replace("/")}>
            <Text style={styles.ctaText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // In-app licensed-provider checkout.
  if (url) {
    const onNav = (navUrl: string) => {
      const u = navUrl.toLowerCase();
      if (u === url.toLowerCase()) return;
      if (/(cancel|failed|declined)/.test(u)) { setUrl(null); return; }
      if (/(success|complete|confirmed|thank|return)/.test(u)) { setUrl(null); setSubmitted(true); }
    };
    return (
      <SafeAreaView style={styles.wrap} edges={["bottom"]}>
        <View style={styles.webHead}>
          <Text style={styles.webTitle}>{provider === "coinbase" ? "Coinbase" : "Stripe"} · secure checkout</Text>
          <TouchableOpacity onPress={() => { setUrl(null); setSubmitted(true); }}><Text style={styles.close}>Close</Text></TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={{ flex: 1, backgroundColor: t.bg }} onNavigationStateChange={(s) => onNav(s.url)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <View style={styles.body}>
        <Text style={styles.summary}>Buy <Text style={styles.hl}>${Number(amount).toLocaleString()}</Text> of <Text style={styles.hl}>{asset}</Text></Text>

        <View style={styles.feeCard}>
          <View style={styles.feeRow}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeVal}>{fmt(amt)}</Text></View>
          <View style={styles.feeRow}><Text style={styles.feeLabel}>Loadit fee (0.75%, $1 min)</Text><Text style={styles.feeVal}>{fmt(fee)}</Text></View>
          <View style={[styles.feeRow, styles.feeTotal]}><Text style={styles.feeTotalLabel}>You pay</Text><Text style={styles.feeTotalVal}>{fmt(amt + fee)}</Text></View>
        </View>

        <Text style={styles.label}>Your wallet address ({asset})</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste the address you control"
          placeholderTextColor={t.faint}
          value={wallet}
          onChangeText={setWallet}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>Non-custodial: the crypto is delivered straight to this address. Loadit never holds it.</Text>

        <Text style={styles.label}>Provider (HQ recommends {preferredProvider(String(asset))})</Text>
        <View style={styles.providerRow}>
          {(["coinbase", "stripe"] as OnrampProvider[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.provider, provider === p && styles.providerOn]}
              onPress={() => setProvider(p)}
            >
              <Text style={[styles.providerText, provider === p && styles.providerTextOn]}>
                {p === "coinbase" ? "Coinbase" : "Stripe"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={cont} disabled={loading}>
          {loading ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Continue to secure checkout →</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Payment, identity verification (KYC), and settlement are handled by the licensed provider. Loadit routes and hands off — it is not a money transmitter and never custodies funds.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    body: { padding: 20, gap: 8 },
    summary: { color: t.text, fontSize: 22, fontWeight: "700", marginBottom: 8 },
    hl: { color: t.accentText },
    feeCard: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 4 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeVal: { color: t.text, fontSize: 13, fontWeight: "600" },
    feeTotal: { borderTopColor: t.border, borderTopWidth: 1, marginTop: 4, paddingTop: 9 },
    feeTotalLabel: { color: t.text, fontSize: 14, fontWeight: "700" },
    feeTotalVal: { color: t.accentText, fontSize: 15, fontWeight: "800" },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 12 },
    input: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 14, marginTop: 6 },
    hint: { color: t.faint, fontSize: 12, marginTop: 6, lineHeight: 17 },
    providerRow: { flexDirection: "row", gap: 10, marginTop: 6 },
    provider: { flex: 1, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
    providerOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    providerText: { color: t.dim, fontWeight: "600" },
    providerTextOn: { color: t.text },
    cta: { backgroundColor: t.button, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 20, shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 16 },
    submittedWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 28 },
    submittedTitle: { color: t.text, fontSize: 22, fontWeight: "800", marginTop: 6 },
    submittedNote: { color: t.dim, fontSize: 14, textAlign: "center", lineHeight: 20 },
    back: { color: t.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
    webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webTitle: { color: t.text, fontWeight: "600" },
    close: { color: t.accentText, fontWeight: "600" },
  });
