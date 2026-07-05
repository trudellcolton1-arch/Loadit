import { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type Theme } from "@/lib/theme";

const ASSETS = ["BTC", "ETH", "SOL", "USDC"] as const;
const AMOUNTS = [20, 50, 100, 250] as const;

type Styles = ReturnType<typeof makeStyles>;

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
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
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

        <Step styles={styles} n="1" title="Deposit your cash at the register">
          <Text style={styles.stepBody}>
            Open Cash App → Money → <Text style={styles.hl}>Deposit paper money</Text>.
            Show its deposit code at the register of Walmart, Walgreens, 7-Eleven,
            CVS, Dollar General and 90k+ other stores, and hand the cashier your
            cash. It lands on your balance in seconds.
            {"\n"}
            <Text style={styles.link} onPress={() => Linking.openURL("https://cash.app/launch")}>
              Open Cash App →
            </Text>
          </Text>
        </Step>

        <Step styles={styles} n="2" title="Pick what you want">
          <Text style={styles.stepLabel}>Asset</Text>
          <View style={styles.row}>
            {ASSETS.map((a) => (
              <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
                <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.stepLabel, { marginTop: 12 }]}>Amount</Text>
          <View style={styles.row}>
            {AMOUNTS.map((v) => (
              <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
                <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Step>

        <Step styles={styles} n="3" title="Buy through a licensed partner">
          <Text style={styles.stepBody}>
            Pay with your Cash App card or Apple Pay in Coinbase or Stripe&apos;s
            secure checkout. The {asset} is delivered straight to your own wallet —
            Loadit never holds your money.
          </Text>
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

function Step({ styles, n, title, children }: { styles: Styles; n: string; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepHead}>
        <View style={styles.badge}><Text style={styles.badgeText}>{n}</Text></View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      <View style={styles.stepBodyWrap}>{children}</View>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    h1: { color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 6 },
    step: { marginTop: 14, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 16 },
    stepHead: { flexDirection: "row", alignItems: "center", gap: 10 },
    badge: { width: 26, height: 26, borderRadius: 13, backgroundColor: t.accentTint, alignItems: "center", justifyContent: "center" },
    badgeText: { color: t.accentText, fontWeight: "800", fontSize: 13 },
    stepTitle: { color: t.text, fontWeight: "700", fontSize: 15, flex: 1 },
    stepBodyWrap: { marginTop: 8 },
    stepBody: { color: t.dim, fontSize: 13, lineHeight: 19 },
    stepLabel: { color: t.faint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
    hl: { color: t.text, fontWeight: "600" },
    link: { color: t.accentText, fontWeight: "700" },
    row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    cta: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 20 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 16 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: "center" },
  });
