import { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { signInWithHylaq, signInGuest, hylaqConfigured } from "@/lib/auth";
import { useAuth } from "@/lib/authContext";
import { BRAND } from "@/lib/config";

export default function Login() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [busy, setBusy] = useState(false);

  const withHylaq = async () => {
    setBusy(true);
    try {
      const s = await signInWithHylaq();
      setSession(s);
      router.replace("/");
    } catch (e) {
      Alert.alert("Sign in", (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const asGuest = async () => {
    setBusy(true);
    const s = await signInGuest();
    setSession(s);
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.center}>
        <Text style={styles.logo}>Loadit</Text>
        <Text style={styles.tag}>Cash & card to crypto — routed the cheapest way by AERO.</Text>

        <TouchableOpacity style={styles.primary} onPress={withHylaq} disabled={busy}>
          {busy ? <ActivityIndicator color="#04060B" /> : <Text style={styles.primaryText}>Login with Hylaq</Text>}
        </TouchableOpacity>
        {!hylaqConfigured() && (
          <Text style={styles.note}>Hylaq SSO isn&apos;t wired yet — you can continue as guest for now.</Text>
        )}

        <TouchableOpacity style={styles.ghost} onPress={asGuest} disabled={busy}>
          <Text style={styles.ghostText}>Continue as guest</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.legal}>
        Loadit is non-custodial. Purchases are completed by licensed partners (Stripe, Coinbase) who deliver crypto to your own wallet.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BRAND.bg, padding: 24, justifyContent: "space-between" },
  center: { flex: 1, justifyContent: "center", gap: 14 },
  logo: { color: BRAND.text, fontSize: 40, fontWeight: "800", letterSpacing: -1 },
  tag: { color: BRAND.dim, fontSize: 15, marginBottom: 24, lineHeight: 22 },
  primary: { backgroundColor: BRAND.rail, borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  primaryText: { color: "#04060B", fontWeight: "700", fontSize: 16 },
  note: { color: BRAND.faint, fontSize: 12, textAlign: "center" },
  ghost: { borderColor: BRAND.border, borderWidth: 1, borderRadius: 999, paddingVertical: 16, alignItems: "center" },
  ghostText: { color: BRAND.text, fontWeight: "600", fontSize: 15 },
  legal: { color: BRAND.faint, fontSize: 11, lineHeight: 16, textAlign: "center" },
});
