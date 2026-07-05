import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { resolveHandle, getOnramp, preferredProvider, type HandleProfile, type OnrampProvider } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * SEND TO A @HANDLE — pay anyone by their Hylaq name.
 *
 * Type @colt, Loadit resolves their receive addresses from Hylaq, you pick an
 * amount and asset, and a licensed partner delivers the crypto straight to
 * their wallet. Non-custodial: Loadit routes, it never holds the funds.
 */

const AMOUNTS = [20, 50, 100, 250] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Assets the recipient can actually receive, mapped to their address. */
function receivable(p: HandleProfile): { asset: string; address: string }[] {
  const a = p.addresses;
  const out: { asset: string; address: string }[] = [];
  if (a.bitcoin) out.push({ asset: "BTC", address: a.bitcoin });
  if (a.solana) out.push({ asset: "SOL", address: a.solana });
  if (a.evm) out.push({ asset: "ETH", address: a.evm });
  const usdc = a.usdc || a.solana || a.evm;
  if (usdc) out.push({ asset: "USDC", address: usdc });
  return out;
}

export default function Send() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [query, setQuery] = useState("");
  const [looking, setLooking] = useState(false);
  const [recipient, setRecipient] = useState<HandleProfile | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [asset, setAsset] = useState<string>("");
  const [amount, setAmount] = useState(50);
  const [sending, setSending] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  if (ready && !session) return <Redirect href="/login" />;

  const options = recipient ? receivable(recipient) : [];
  const fee = Math.round(amount * 0.0075 * 100) / 100;
  const activeAddress = options.find((o) => o.asset === asset)?.address;

  const lookup = async () => {
    const clean = query.replace(/^@/, "").trim();
    if (!clean || looking) return;
    setLooking(true);
    setRecipient(null);
    setNotFound(false);
    try {
      const r = await resolveHandle(clean);
      if (r.ok && r.profile) {
        setRecipient(r.profile);
        const opts = receivable(r.profile);
        const pref = opts.find((o) => o.asset === r.profile!.preferredReceiveAsset);
        setAsset((pref || opts[0])?.asset || "");
      } else {
        setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLooking(false);
    }
  };

  const send = async () => {
    if (!recipient || !activeAddress) return;
    setSending(true);
    try {
      const provider = preferredProvider(asset) as OnrampProvider;
      const r = await getOnramp(provider, { amount_usd: amount, asset, wallet: activeAddress });
      if (r.ok && r.url) setUrl(r.url);
      else if (r.configured === false)
        Alert.alert("Not set up yet", `The ${provider} on-ramp isn't configured in the backend yet.`);
      else Alert.alert("Couldn't start", r.message || r.reason || "Try again in a moment.");
    } catch {
      Alert.alert("Network", "Couldn't reach the on-ramp. Try again.");
    } finally {
      setSending(false);
    }
  };

  if (url && recipient) {
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.webHead}>
          <Text style={styles.webTitle}>Secure checkout · to @{recipient.handle}</Text>
          <TouchableOpacity onPress={() => setUrl(null)}><Text style={styles.close}>Close</Text></TouchableOpacity>
        </View>
        <WebView source={{ uri: url }} style={{ flex: 1, backgroundColor: t.bg }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.h1}>Send to a @handle</Text>
          <Text style={styles.sub}>Pay anyone by their Hylaq name — the crypto lands straight in their wallet.</Text>

          <View style={styles.lookupRow}>
            <View style={styles.atWrap}>
              <Text style={styles.at}>@</Text>
              <TextInput
                style={styles.atInput}
                placeholder="colt"
                placeholderTextColor={t.faint}
                value={query}
                onChangeText={(v) => { setQuery(v.replace(/^@/, "")); setRecipient(null); setNotFound(false); }}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={lookup}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity style={styles.lookBtn} onPress={lookup} disabled={looking}>
              {looking ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.lookText}>Find</Text>}
            </TouchableOpacity>
          </View>

          {notFound && <Text style={styles.notFound}>No Hylaq handle @{query}. Check the spelling.</Text>}

          {recipient && (
            <>
              <View style={styles.recipient}>
                <Image source={require("../assets/hylaq-logo.png")} style={styles.recipientLogo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.recipientHandle}>@{recipient.handle}</Text>
                  <Text style={styles.recipientMeta}>
                    Hylaq handle{recipient.accountType ? ` · ${recipient.accountType}` : ""}
                  </Text>
                </View>
              </View>

              {options.length === 0 ? (
                <Text style={styles.notFound}>@{recipient.handle} hasn&apos;t set up a receive address yet.</Text>
              ) : (
                <>
                  <Text style={styles.label}>Send</Text>
                  <View style={styles.row}>
                    {options.map((o) => (
                      <TouchableOpacity key={o.asset} style={[styles.chip, asset === o.asset && styles.chipOn]} onPress={() => setAsset(o.asset)}>
                        <Text style={[styles.chipText, asset === o.asset && styles.chipTextOn]}>{o.asset}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Amount (USD)</Text>
                  <View style={styles.row}>
                    {AMOUNTS.map((v) => (
                      <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
                        <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.feeCard}>
                    <View style={styles.feeRow}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeVal}>{money(amount)}</Text></View>
                    <View style={styles.feeRow}><Text style={styles.feeLabel}>Loadit fee (0.75%)</Text><Text style={styles.feeVal}>{money(fee)}</Text></View>
                    <View style={[styles.feeRow, styles.feeTotal]}><Text style={styles.feeTotalLabel}>You pay</Text><Text style={styles.feeTotalVal}>{money(amount + fee)}</Text></View>
                  </View>

                  <TouchableOpacity style={styles.cta} onPress={send} disabled={sending || !activeAddress}>
                    {sending ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Send {money(amount)} of {asset} to @{recipient.handle} →</Text>}
                  </TouchableOpacity>
                  <Text style={styles.legal}>
                    A licensed partner completes the purchase and delivers {asset} straight to @{recipient.handle}&apos;s wallet.
                    Loadit routes and hands off — it never holds funds.
                  </Text>
                </>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
    lookupRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    atWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
    at: { color: t.accentText, fontSize: 18, fontWeight: "800" },
    atInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 4, color: t.text, fontSize: 16 },
    lookBtn: { backgroundColor: t.button, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15 },
    lookText: { color: t.buttonText, fontWeight: "700" },
    notFound: { color: t.dim, fontSize: 13, marginTop: 14 },
    recipient: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 14 },
    recipientLogo: { width: 44, height: 44, borderRadius: 14 },
    recipientHandle: { color: t.text, fontSize: 20, fontWeight: "800" },
    recipientMeta: { color: t.accentText, fontSize: 12, fontWeight: "600", marginTop: 2 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    feeCard: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeVal: { color: t.text, fontSize: 13, fontWeight: "600" },
    feeTotal: { borderTopColor: t.border, borderTopWidth: 1, marginTop: 4, paddingTop: 9 },
    feeTotalLabel: { color: t.text, fontSize: 14, fontWeight: "700" },
    feeTotalVal: { color: t.accentText, fontSize: 15, fontWeight: "800" },
    cta: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 20 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: "center" },
    webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webTitle: { color: t.text, fontWeight: "600" },
    close: { color: t.accentText, fontWeight: "600" },
  });
