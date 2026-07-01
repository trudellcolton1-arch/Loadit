import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOnramp, preferredProvider, type OnrampProvider } from "@/lib/api";
import { BRAND } from "@/lib/config";

export default function Buy() {
  const { asset = "USDC", amount = "100" } = useLocalSearchParams<{ asset: string; amount: string }>();
  const router = useRouter();
  const [wallet, setWallet] = useState("");
  const [provider, setProvider] = useState<OnrampProvider>(preferredProvider(String(asset)));
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

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

  // In-app licensed-provider checkout.
  if (url) {
    return (
      <SafeAreaView style={styles.wrap} edges={["bottom"]}>
        <View style={styles.webHead}>
          <Text style={styles.webTitle}>{provider === "coinbase" ? "Coinbase" : "Stripe"} · secure checkout</Text>
          <TouchableOpacity onPress={() => setUrl(null)}><Text style={styles.close}>Close</Text></TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={{ flex: 1, backgroundColor: BRAND.bg }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <View style={styles.body}>
        <Text style={styles.summary}>Buy <Text style={styles.hl}>${Number(amount).toLocaleString()}</Text> of <Text style={styles.hl}>{asset}</Text></Text>

        <Text style={styles.label}>Your wallet address ({asset})</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste the address you control"
          placeholderTextColor={BRAND.faint}
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
              <Text style={[styles.providerText, provider === p && { color: BRAND.text }]}>
                {p === "coinbase" ? "Coinbase" : "Stripe"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cta} onPress={cont} disabled={loading}>
          {loading ? <ActivityIndicator color="#04060B" /> : <Text style={styles.ctaText}>Continue to secure checkout →</Text>}
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

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BRAND.bg },
  body: { padding: 20, gap: 8 },
  summary: { color: BRAND.text, fontSize: 22, fontWeight: "700", marginBottom: 8 },
  hl: { color: BRAND.railLight },
  label: { color: BRAND.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 12 },
  input: { backgroundColor: BRAND.card, borderColor: BRAND.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: BRAND.text, fontSize: 14, marginTop: 6 },
  hint: { color: BRAND.faint, fontSize: 12, marginTop: 6, lineHeight: 17 },
  providerRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  provider: { flex: 1, borderColor: BRAND.border, borderWidth: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center" },
  providerOn: { borderColor: BRAND.rail, backgroundColor: "rgba(34,169,92,0.08)" },
  providerText: { color: BRAND.dim, fontWeight: "600" },
  cta: { backgroundColor: BRAND.rail, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  ctaText: { color: "#04060B", fontWeight: "700", fontSize: 16 },
  back: { color: BRAND.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
  legal: { color: BRAND.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
  webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: BRAND.border, borderBottomWidth: 1 },
  webTitle: { color: BRAND.text, fontWeight: "600" },
  close: { color: BRAND.railLight, fontWeight: "600" },
});
