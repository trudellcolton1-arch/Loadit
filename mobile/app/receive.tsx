import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE } from "@/lib/config";
import { useTheme, type Theme } from "@/lib/theme";

const ASSETS = ["BTC", "ETH", "SOL", "USDC"] as const;
const AMOUNTS = [20, 50, 100, 250] as const;

/**
 * CASH QR — get paid in crypto, cash-in-hand style.
 * You show this code; whoever is paying you scans it with any camera. They
 * land on loadit.net/pay and complete the purchase through a licensed partner
 * (Coinbase / Stripe — card, Apple Pay, or cash-funded balance). The crypto is
 * delivered straight to YOUR wallet. Loadit never touches the money.
 */
export default function Receive() {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC");
  const [amount, setAmount] = useState(50);
  const [wallet, setWallet] = useState("");

  const payUrl = useMemo(() => {
    if (!wallet.trim()) return null;
    const q = new URLSearchParams({
      asset,
      amount: String(amount),
      wallet: wallet.trim(),
    });
    return `${API_BASE}/pay?${q.toString()}`;
  }, [asset, amount, wallet]);

  const qrUrl = payUrl
    ? `${API_BASE}/api/qr?size=640&data=${encodeURIComponent(payUrl)}`
    : null;

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Cash QR</Text>
        <Text style={styles.sub}>
          Get paid in crypto for cash in hand. Show this code — they scan it with
          any camera, pay through Coinbase or Stripe, and the {asset} lands
          straight in your wallet.
        </Text>

        <Text style={styles.label}>You want</Text>
        <View style={styles.row}>
          {ASSETS.map((a) => (
            <TouchableOpacity
              key={a}
              style={[styles.chip, asset === a && styles.chipOn]}
              onPress={() => setAsset(a)}
            >
              <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Amount (USD)</Text>
        <View style={styles.row}>
          {AMOUNTS.map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.chip, amount === v && styles.chipOn]}
              onPress={() => setAmount(v)}
            >
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
          onChangeText={setWallet}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {qrUrl ? (
          <View style={styles.qrCard}>
            <View style={styles.qrBox}>
              <Image source={{ uri: qrUrl }} style={styles.qr} />
            </View>
            <Text style={styles.qrCaption}>
              ${amount} of {asset} → your wallet
            </Text>
            <TouchableOpacity
              style={styles.share}
              onPress={() => payUrl && Share.share({ message: payUrl })}
            >
              <Text style={styles.shareText}>Share link instead</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.qrCard}>
            <Text style={styles.qrHint}>
              Enter your wallet address and your QR appears here.
            </Text>
          </View>
        )}

        <Text style={styles.legal}>
          The payer completes checkout with a licensed provider (card, Apple Pay,
          or cash-funded balance) and their own identity verification. Crypto is
          delivered directly to your address — Loadit is non-custodial and never
          holds funds. Only accept payments from people you trust.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    h1: { color: t.text, fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 6 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    input: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 14, marginTop: 8 },
    qrCard: { marginTop: 22, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 20, alignItems: "center" },
    qrBox: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 12, borderColor: t.border, borderWidth: t.mode === "light" ? 1 : 0 },
    qr: { width: 240, height: 240, borderRadius: 8 },
    qrCaption: { color: t.text, fontWeight: "700", fontSize: 15, marginTop: 12 },
    share: { marginTop: 8 },
    shareText: { color: t.accentText, fontSize: 13, fontWeight: "600" },
    qrHint: { color: t.faint, fontSize: 13, textAlign: "center", lineHeight: 19, paddingVertical: 30 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
  });
