import { useMemo, useState } from "react";
import { sanitizeAmountInput } from "@/lib/money";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useAuth } from "@/lib/authContext";
import { getOnramp, getRoute, preferredProvider } from "@/lib/api";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme, rgba, type Theme } from "@/lib/theme";
import { Mark } from "@/components/Mark";

/**
 * LOAD — the signature stepped flow:
 * Payment Method → Amount + Cryptocurrency → Wallet → licensed checkout → Success.
 * Clean card UI; every accent follows the user's chosen theme color.
 */

type Step = "method" | "amount" | "wallet" | "success" | "submitted";

// URL fragments providers redirect to when a payment completes / is cancelled.
const SUCCESS_HINTS = ["success", "complete", "completed", "confirmed", "thank", "return"];
const CANCEL_HINTS = ["cancel", "canceled", "cancelled", "failed", "declined"];

const METHODS = [
  { id: "Cash", label: "Cash", icon: "cash" },
  { id: "Debit Card", label: "Debit", icon: "credit-card-outline" },
  { id: "Credit Card", label: "Credit", icon: "bank-outline" },
] as const;

const COINS = [
  { id: "BTC", label: "Bitcoin", logo: require("../assets/coins/btc.png") },
  { id: "SOL", label: "Solana", logo: require("../assets/coins/sol.png") },
  { id: "ETH", label: "Ethereum", logo: require("../assets/coins/eth.png") },
  { id: "USDC", label: "USDC", logo: require("../assets/coins/usdc.png") },
] as const;

export default function Load() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();

  const [step, setStep] = useState<Step>("method");
  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("Cash");
  const [coin, setCoin] = useState<(typeof COINS)[number]["id"]>("BTC");
  const [amount, setAmount] = useState("100");
  const [wallet, setWallet] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [estOut, setEstOut] = useState<number | null>(null);
  const provider = preferredProvider(coin);

  if (ready && !session) return <Redirect href="/login" />;

  const amt = Math.max(1, parseFloat(amount) || 0);
  const fee = Math.round(Math.max(1, amt * 0.0075) * 100) / 100;

  const startCheckout = async () => {
    if (!wallet.trim()) {
      Alert.alert("Wallet needed", "Paste the wallet address where your crypto should land. Loadit is non-custodial — it goes straight to you.");
      return;
    }
    setBusy(true);
    try {
      // Best-effort estimate of what they'll receive, for the success screen.
      getRoute(amt, coin, method, wallet.trim())
        .then((q) => q.best?.assetOut && setEstOut(q.best.assetOut))
        .catch(() => {});
      const r = await getOnramp(provider, { amount_usd: amt, asset: coin, wallet: wallet.trim() });
      if (r.ok && r.url) setCheckoutUrl(r.url);
      else if (r.configured === false)
        Alert.alert("Not set up yet", `The ${provider} on-ramp isn't configured in the backend yet.`);
      else Alert.alert("Couldn't start", r.message || r.reason || "Try again in a moment.");
    } catch {
      Alert.alert("Network", "Couldn't reach the on-ramp. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // Licensed-provider checkout in-app. We only claim SUCCESS when the provider
  // itself redirects to a success URL; a manual close lands on an honest
  // "submitted — we'll confirm in your wallet" screen, never a fake receipt.
  if (checkoutUrl) {
    const onNav = (navUrl: string) => {
      const u = navUrl.toLowerCase();
      if (u === checkoutUrl.toLowerCase()) return;
      if (CANCEL_HINTS.some((h) => u.includes(h))) { setCheckoutUrl(null); setStep("wallet"); return; }
      if (SUCCESS_HINTS.some((h) => u.includes(h))) { setCheckoutUrl(null); setStep("success"); }
    };
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.webHead}>
          <Text style={styles.webTitle}>{provider === "coinbase" ? "Coinbase" : "Stripe"} · secure checkout</Text>
          <TouchableOpacity onPress={() => { setCheckoutUrl(null); setStep("submitted"); }}>
            <Text style={styles.webDone}>Close</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: checkoutUrl }}
          style={{ flex: 1, backgroundColor: t.bg }}
          onNavigationStateChange={(s) => onNav(s.url)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {step !== "success" && step !== "submitted" && (
            <TouchableOpacity
              onPress={() => (step === "method" ? router.back() : setStep(step === "wallet" ? "amount" : "method"))}
            >
              <Text style={styles.cancel}>{step === "method" ? "Cancel" : "← Back"}</Text>
            </TouchableOpacity>
          )}

          {step === "method" && (
            <>
              <View style={styles.brand}>
                <Mark size={96} color={t.accent} />
                <Text style={styles.wordmark}>Loadit</Text>
              </View>
              <Text style={styles.sectionTitle}>Payment Method</Text>
              <View style={styles.list}>
                {METHODS.map((m, i) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.rowItem, i > 0 && styles.rowDivider]}
                    onPress={() => setMethod(m.id)}
                  >
                    <View style={styles.rowIcon}>
                      <MaterialCommunityIcons name={m.icon as never} size={19} color={t.accentText} />
                    </View>
                    <Text style={styles.rowLabel}>{m.label}</Text>
                    {method === m.id && (
                      <View style={styles.check}><Feather name="check" size={14} color={t.onAccent} /></View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.cta} onPress={() => setStep("amount")}>
                <Text style={styles.ctaText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "amount" && (
            <>
              <Text style={styles.h1}>Enter Amount</Text>
              <View style={styles.amountCard}>
                <Text style={styles.amountCurrency}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={(v) => setAmount(sanitizeAmountInput(v))}
                  keyboardType="decimal-pad"
                  maxLength={8}
                  selectionColor={t.accent}
                />
              </View>
              <Text style={styles.caption}>Enter amount to load</Text>

              <Text style={styles.sectionTitle}>Select Cryptocurrency</Text>
              <View style={styles.list}>
                {COINS.map((c, i) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.rowItem, i > 0 && styles.rowDivider]}
                    onPress={() => setCoin(c.id)}
                  >
                    <View style={styles.coinWrap}>
                      <Image source={c.logo} style={styles.coinLogo} />
                    </View>
                    <Text style={styles.rowLabel}>{c.label}</Text>
                    {coin === c.id && (
                      <View style={styles.check}><Feather name="check" size={14} color={t.onAccent} /></View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.cta, amt < 1 && styles.ctaDisabled]}
                onPress={() => amt >= 1 && setStep("wallet")}
              >
                <Text style={styles.ctaText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}

          {step === "wallet" && (
            <>
              <Text style={styles.h1}>Enter Wallet Address</Text>
              <TextInput
                style={styles.walletInput}
                placeholder="Paste wallet address"
                placeholderTextColor={t.faint}
                value={wallet}
                onChangeText={setWallet}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.feeCard}>
                <View style={styles.feeRow}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeVal}>${amt.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
                <View style={styles.feeRow}><Text style={styles.feeLabel}>Loadit fee (0.75%, $1 min)</Text><Text style={styles.feeVal}>${fee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
                <View style={[styles.feeRow, styles.feeTotal]}><Text style={styles.feeTotalLabel}>You pay</Text><Text style={styles.feeTotalVal}>${(amt + fee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></View>
              </View>
              <View style={styles.qrHero}>
                <Mark size={170} color={t.accent} />
                <Text style={styles.caption}>
                  {coin} delivered straight to this wallet. Loadit never holds your funds.
                </Text>
              </View>
              <TouchableOpacity style={styles.cta} onPress={startCheckout} disabled={busy}>
                {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Continue</Text>}
              </TouchableOpacity>
              <Text style={styles.legal}>
                Checkout, KYC and delivery are completed by {provider === "coinbase" ? "Coinbase" : "Stripe"}, a licensed provider.
              </Text>
            </>
          )}

          {step === "success" && (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}><Feather name="check" size={40} color={t.onAccent} /></View>
              <Text style={styles.successAmount}>
                {estOut ? `${estOut} ${coin}` : `$${amt.toLocaleString()} → ${coin}`}
              </Text>
              <Text style={styles.successNote}>
                {COINS.find((c) => c.id === coin)?.label} loading{estOut ? " — estimated amount" : ""}
              </Text>
              <View style={styles.txCard}>
                <Text style={styles.txTitle}>Delivery</Text>
                <Text style={styles.txDetail}>
                  {wallet.length > 14 ? `${wallet.slice(0, 8)} …. ${wallet.slice(-6)}` : wallet}
                </Text>
                <Text style={styles.txSub}>
                  Completed by {provider === "coinbase" ? "Coinbase" : "Stripe"} — watch your wallet for the arrival.
                </Text>
              </View>
              <TouchableOpacity style={styles.cta} onPress={() => router.replace("/")}>
                <Text style={styles.ctaText}>Success</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "submitted" && (
            <View style={styles.successWrap}>
              <View style={styles.pendingCircle}><Feather name="clock" size={34} color={t.warn} /></View>
              <Text style={styles.successAmount}>Payment submitted</Text>
              <Text style={styles.successNote}>
                If you completed the {provider === "coinbase" ? "Coinbase" : "Stripe"} checkout, your {coin} is on its way to your wallet — watch for it there. If you closed it without paying, nothing was charged.
              </Text>
              <TouchableOpacity style={styles.cta} onPress={() => router.replace("/")}>
                <Text style={styles.ctaText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 24, paddingBottom: 48, flexGrow: 1 },
    cancel: { color: t.dim, fontSize: 15, marginBottom: 8 },
    brand: { alignItems: "center", marginTop: 12, marginBottom: 20 },
    mark: { width: 96, height: 96 },
    wordmark: { color: t.text, fontSize: 34, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, textAlign: "center", marginTop: 12, marginBottom: 18 },
    sectionTitle: { color: t.text, fontSize: 17, fontWeight: "700", marginTop: 18, marginBottom: 10 },
    list: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, overflow: "hidden" },
    rowItem: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
    rowDivider: { borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth },
    rowIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: rgba(t.accent, 0.12), alignItems: "center", justifyContent: "center" },
    coinWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#FFFFFF", borderColor: t.border, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    coinLogo: { width: 22, height: 22, resizeMode: "contain" },
    rowLabel: { color: t.text, fontSize: 16, fontWeight: "600", flex: 1 },
    check: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" },
    amountCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16 },
    amountCurrency: { color: t.text, fontSize: 34, fontWeight: "800", marginRight: 2 },
    amountInput: { color: t.text, fontSize: 34, fontWeight: "800", minWidth: 120, textAlign: "left", padding: 0 },
    caption: { color: t.dim, fontSize: 13, textAlign: "center", marginTop: 10, lineHeight: 19 },
    walletInput: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 15 },
    feeCard: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 14 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeVal: { color: t.text, fontSize: 13, fontWeight: "600" },
    feeTotal: { borderTopColor: t.border, borderTopWidth: 1, marginTop: 4, paddingTop: 9 },
    feeTotalLabel: { color: t.text, fontSize: 14, fontWeight: "700" },
    feeTotalVal: { color: t.accentText, fontSize: 15, fontWeight: "800" },
    qrHero: { alignItems: "center", marginTop: 26, gap: 6 },
    qrMark: { width: 170, height: 170 },
    cta: { backgroundColor: t.button, borderRadius: 18, paddingVertical: 16, alignItems: "center", marginTop: 26, shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 16 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: "center" },
    successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 6 },
    successCircle: { width: 84, height: 84, borderRadius: 42, backgroundColor: t.accent, alignItems: "center", justifyContent: "center", marginBottom: 10, shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
    pendingCircle: { width: 74, height: 74, borderRadius: 37, backgroundColor: rgba(t.warn, 0.12), alignItems: "center", justifyContent: "center", marginBottom: 8 },
    successAmount: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    successNote: { color: t.dim, fontSize: 14 },
    txCard: { alignSelf: "stretch", backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 18 },
    txTitle: { color: t.text, fontSize: 15, fontWeight: "700" },
    txDetail: { color: t.dim, fontSize: 14, marginTop: 6 },
    txSub: { color: t.faint, fontSize: 12, marginTop: 6, lineHeight: 17 },
    webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webTitle: { color: t.text, fontWeight: "600" },
    webDone: { color: t.accentText, fontWeight: "700" },
  });
