import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND } from "@/lib/config";

const ASSETS = ["BTC", "ETH", "SOL", "USDC"] as const;
const AMOUNTS = [20, 50, 100, 250] as const;

/**
 * CASH AT ANY REGISTER — the free, no-partnership route.
 * The user deposits physical cash to their own Cash App (or similar) at the
 * register of ~100k retailers (Walmart, Walgreens, 7-Eleven, CVS, Dollar
 * General…) using that app's built-in deposit code. Back in Loadit, we route
 * the purchase through a licensed on-ramp (Coinbase / Stripe) paid with their
 * cash-funded card or Apple Pay. Crypto lands in their own wallet.
 *
 * Native register integration (our own QR scanned by the POS) ships when a
 * retail cash-network partnership (InComm / Green Dot / PayNearMe) is signed.
 */
export default function Register() {
  const router = useRouter();
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC");
  const [amount, setAmount] = useState(100);

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.h1}>Cash at any register</Text>
        <Text style={styles.sub}>
          Turn paper cash into {asset} using registers you already walk past —
          no bank account needed.
        </Text>

        <Step n="1" title="Deposit your cash at the register">
          Open Cash App → Money → <Text style={styles.hl}>Deposit paper money</Text>.
          Show its deposit code at the register of Walmart, Walgreens, 7-Eleven,
          CVS, Dollar General and 90k+ other stores, and hand the cashier your
          cash. It lands on your balance in seconds.
          {"\n"}
          <Text style={styles.link} onPress={() => Linking.openURL("https://cash.app/launch")}>
            Open Cash App →
          </Text>
        </Step>

        <Step n="2" title="Pick what you want">
          <View style={styles.row}>
            {ASSETS.map((a) => (
              <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
                <Text style={[styles.chipText, asset === a && { color: BRAND.text }]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.row, { marginTop: 8 }]}>
            {AMOUNTS.map((v) => (
              <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
                <Text style={[styles.chipText, amount === v && { color: BRAND.text }]}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Step>

        <Step n="3" title="Buy through a licensed partner">
          Pay with your Cash App card or Apple Pay in Coinbase or Stripe&apos;s
          secure checkout. The {asset} is delivered straight to your own wallet —
          Loadit never holds your money.
        </Step>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push({ pathname: "/buy", params: { asset, amount: String(amount) } })}
        >
          <Text style={styles.ctaText}>Buy ${amount} of {asset} →</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          Cash deposit is a feature of your own Cash App account under Block,
          Inc.&apos;s retail network and terms; retailer fees (typically ~$1) may
          apply. Checkout, KYC, and settlement are handled by the licensed
          provider. Native register scanning of a Loadit QR arrives with our
          retail-network launch.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHead}>
        <View style={styles.badge}><Text style={styles.badgeText}>{n}</Text></View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <Text style={styles.stepBody}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: BRAND.bg },
  scroll: { padding: 20, paddingBottom: 48 },
  h1: { color: BRAND.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  sub: { color: BRAND.dim, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 6 },
  step: { marginTop: 14, backgroundColor: BRAND.card, borderColor: BRAND.border, borderWidth: 1, borderRadius: 20, padding: 16 },
  stepHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(34,169,92,0.15)", alignItems: "center", justifyContent: "center" },
  badgeText: { color: BRAND.railLight, fontWeight: "800", fontSize: 13 },
  stepTitle: { color: BRAND.text, fontWeight: "700", fontSize: 15, flex: 1 },
  stepBody: { color: BRAND.dim, fontSize: 13, lineHeight: 19, marginTop: 8 },
  hl: { color: BRAND.text, fontWeight: "600" },
  link: { color: BRAND.railLight, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: { borderColor: BRAND.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  chipOn: { borderColor: BRAND.rail, backgroundColor: "rgba(34,169,92,0.08)" },
  chipText: { color: BRAND.dim, fontWeight: "600" },
  cta: { backgroundColor: BRAND.rail, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 20 },
  ctaText: { color: "#04060B", fontWeight: "700", fontSize: 16 },
  legal: { color: BRAND.faint, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: "center" },
});
