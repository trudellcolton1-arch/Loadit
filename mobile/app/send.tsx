import { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeAmountInput } from "@/lib/money";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Image, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import {
  resolveHandle, getOnramp, getMyHandle, preferredProvider,
  type HandleProfile, type OnrampProvider,
} from "@/lib/api";
import {
  mintApiToken, buildSend, signAndSubmit, type SendAsset, type SendBuild,
} from "@/lib/hylaqWallet";
import { useTheme, type Theme } from "@/lib/theme";
import { HandleAvatar } from "@/components/HandleAvatar";

/**
 * SEND — pay a @handle or a raw crypto address, two ways:
 *   • "I have crypto" → send from your own Hylaq wallet (Hylaq builds, you
 *     approve, Hylaq signs — your wallet password goes straight to Hylaq,
 *     never to Loadit).
 *   • "Buy & send"    → a licensed partner mints new crypto to the recipient.
 */

const ASSETS: SendAsset[] = ["USDC", "SOL", "BTC", "ETH", "BNB"];
const AMOUNTS = [20, 50, 100, 250] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const shortAddr = (a: string) => (a.length > 18 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a);

/** A raw address looks nothing like a handle: 0x…, or long base58. */
function looksLikeAddress(v: string): boolean {
  const s = v.trim();
  if (s.startsWith("@")) return false;
  return /^0x[a-fA-F0-9]{40}$/.test(s) || (s.length >= 26 && /^[a-zA-Z0-9]+$/.test(s) && !/^[a-z0-9_.-]{1,20}$/.test(s));
}

/** Recipient address for a given asset from a resolved handle (for Buy & send). */
function addressFor(p: HandleProfile, asset: SendAsset): string | null {
  const a = p.addresses;
  if (asset === "BTC") return a.bitcoin;
  if (asset === "SOL") return a.solana;
  if (asset === "ETH" || asset === "BNB") return a.evm;
  return a.usdc || a.solana || a.evm; // USDC
}

export default function Send() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [me, setMe] = useState<HandleProfile | null>(null);
  const [query, setQuery] = useState("");
  const [looking, setLooking] = useState(false);
  const [recipient, setRecipient] = useState<HandleProfile | null>(null);
  const [externalAddr, setExternalAddr] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [asset, setAsset] = useState<SendAsset>("USDC");
  const [amountText, setAmountText] = useState("50");
  const amount = Math.max(0, parseFloat(amountText) || 0);
  const [btcLightning, setBtcLightning] = useState(true);
  const mintedFor = useRef<string | null>(null);
  const [source, setSource] = useState<"wallet" | "buy">("wallet");
  const [password, setPassword] = useState("");

  const [phase, setPhase] = useState<"form" | "review" | "success" | "pending">("form");
  const sendLock = useRef(false); // synchronous guard against double-broadcast
  const [busy, setBusy] = useState(false);
  const [build, setBuild] = useState<SendBuild | null>(null);
  const [tokenHold, setTokenHold] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !session) return;
    getMyHandle(session.accessToken).then((r) => { if (r.linked && r.profile) setMe(r.profile); }).catch(() => {});
  }, [ready, session]);

  if (ready && !session) return <Redirect href="/login" />;

  const targetLabel = recipient ? `@${recipient.handle}` : externalAddr ? shortAddr(externalAddr) : "";
  const fee = Math.round(Math.max(1, amount * 0.0075) * 100) / 100;

  const lookup = async () => {
    const v = query.trim();
    if (!v || looking) return;
    setLooking(true);
    setRecipient(null); setExternalAddr(null); setNotFound(false);
    try {
      if (looksLikeAddress(v)) {
        setExternalAddr(v);
      } else {
        const r = await resolveHandle(v);
        if (r.ok && r.profile) setRecipient(r.profile);
        else setNotFound(true);
      }
    } catch {
      setNotFound(true);
    } finally {
      setLooking(false);
    }
  };

  const hasTarget = Boolean(recipient || externalAddr);

  // "I have crypto": phase 1 — mint token + build tx.
  const preview = async () => {
    if (!me) { Alert.alert("Hylaq needed", "Log in with Hylaq to send from your wallet."); return; }
    if (!password) { Alert.alert("Wallet password", "Enter your Hylaq wallet password to sign."); return; }
    if (amount < 1) { Alert.alert("Amount", "Enter an amount of at least $1."); return; }
    setBusy(true);
    try {
      // Reuse the minted token across previews for the same password — fewer
      // calls, so we don't trip Hylaq's transaction rate limit while adjusting.
      let token = tokenHold;
      if (!token || mintedFor.current !== password) {
        token = await mintApiToken(me.id, password);
        if (!token) { Alert.alert("Couldn't authorize", "Check your wallet password and try again."); return; }
        setTokenHold(token);
        mintedFor.current = password;
      }
      const b = await buildSend(token, {
        fromHandleId: me.id,
        toHandle: recipient ? recipient.handle : undefined,
        toExternalAddress: externalAddr ?? undefined,
        amount,
        recipientAsset: asset,
        btcNetworkType: asset === "BTC" ? (btcLightning ? "lightning" : "onchain") : undefined,
      });
      if (!b.success) { Alert.alert("Couldn't build", friendlyError(b.errorType, b.error)); return; }
      setBuild(b);
      setPhase("review");
    } catch {
      Alert.alert("Network", "Couldn't reach Hylaq. Try again.");
    } finally {
      setBusy(false);
    }
  };

  // "I have crypto": phase 2 — sign + broadcast.
  const confirm = async () => {
    if (!me || !tokenHold || !build) return;
    if (sendLock.current) return; // synchronous guard — never broadcast twice
    sendLock.current = true;
    setBusy(true);
    try {
      const r = await signAndSubmit(tokenHold, me.id, build, password);
      if (r.success && r.signature) {
        setSignature(r.signature);
        setPhase("success");
        setPassword("");
      } else if (r.errorType === "RPC_TIMEOUT" || r.errorType === "RPC_FAILURE") {
        // Ambiguous: the tx may already be broadcasting. Do NOT invite a blind
        // retry that could double-spend — send them to a "check your wallet"
        // terminal state and require a fresh build before any resend.
        setBuild(null);
        setPhase("pending");
      } else {
        Alert.alert("Couldn't send", friendlyError(r.errorType, r.error));
      }
    } catch {
      setBuild(null);
      setPhase("pending");
    } finally {
      setBusy(false);
      sendLock.current = false;
    }
  };

  // "Buy & send": on-ramp mints to the recipient's address.
  const buyAndSend = async () => {
    if (amount < 1) { Alert.alert("Amount", "Enter an amount of at least $1."); return; }
    const dest = externalAddr || (recipient ? addressFor(recipient, asset) : null);
    if (!dest) {
      Alert.alert("No address", recipient ? `@${recipient.handle} can't receive ${asset} yet.` : "Enter a valid recipient.");
      return;
    }
    setBusy(true);
    try {
      const provider = preferredProvider(asset) as OnrampProvider;
      const r = await getOnramp(provider, { amount_usd: amount, asset, wallet: dest });
      if (r.ok && r.url) setUrl(r.url);
      else if (r.configured === false) Alert.alert("Not set up yet", `The ${provider} on-ramp isn't configured yet.`);
      else Alert.alert("Couldn't start", r.message || r.reason || "Try again.");
    } catch {
      Alert.alert("Network", "Couldn't reach the on-ramp. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (url) {
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.webHead}>
          <Text style={styles.webTitle}>Secure checkout · to {targetLabel}</Text>
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

          {phase === "pending" ? (
            <View style={styles.successWrap}>
              <Text style={{ fontSize: 44 }}>⏳</Text>
              <Text style={styles.successTitle}>Send may be processing</Text>
              <Text style={styles.successSub}>
                The network didn&apos;t confirm in time, so your {asset} transfer may have gone through. Check your wallet before trying again — don&apos;t re-send unless you&apos;re sure it didn&apos;t arrive, to avoid paying twice.
              </Text>
              <TouchableOpacity style={styles.cta} onPress={() => { setPhase("form"); setBuild(null); setSignature(null); setTokenHold(null); }}>
                <Text style={styles.ctaText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : phase === "success" && build ? (
            <View style={styles.successWrap}>
              <View style={styles.successCircle}><Text style={styles.successTick}>✓</Text></View>
              <Text style={styles.successTitle}>Sent {money(amount)} to {targetLabel}</Text>
              <Text style={styles.successSub}>{asset} is on its way. {build.feeSponsored ? "Network fee sponsored by Loadit." : ""}</Text>
              {signature && (
                <View style={styles.card}><Text style={styles.label}>Transaction</Text><Text style={styles.sig}>{shortAddr(signature)}</Text></View>
              )}
              <TouchableOpacity style={styles.cta} onPress={() => { setPhase("form"); setBuild(null); setSignature(null); setTokenHold(null); }}>
                <Text style={styles.ctaText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : phase === "review" && build ? (
            <>
              <Text style={styles.h1}>Review</Text>
              <Text style={styles.reviewMsg}>{build.message || `Send ${money(amount)} to ${targetLabel}`}</Text>
              <View style={styles.card}>
                <Row styles={styles} k="To" v={build.to?.handle ? `@${build.to.handle}` : shortAddr(build.to?.address || targetLabel)} />
                <Row styles={styles} k="They receive" v={`${asset}`} />
                <Row styles={styles} k="Amount" v={build.amountFormatted || money(amount)} />
                <Row styles={styles} k="Route" v={build.route?.provider || build.type || "Direct"} />
                <Row styles={styles} k="Network fee" v={build.feeSponsored ? "Sponsored" : (build.fee?.formatted || "—")} />
              </View>
              <TouchableOpacity style={styles.cta} onPress={confirm} disabled={busy}>
                {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Confirm & send →</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPhase("form")}><Text style={styles.back}>Back</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.h1}>Send</Text>
              <Text style={styles.sub}>Pay a @handle or a wallet address — from your crypto, or buy it on the spot.</Text>

              <View style={styles.lookupRow}>
                <View style={styles.atWrap}>
                  <TextInput
                    style={styles.atInput}
                    placeholder="@colt or a wallet address"
                    placeholderTextColor={t.faint}
                    value={query}
                    onChangeText={(v) => { setQuery(v); setRecipient(null); setExternalAddr(null); setNotFound(false); }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={lookup}
                    returnKeyType="search"
                  />
                </View>
                <TouchableOpacity style={styles.lookBtn} onPress={lookup} disabled={looking}>
                  {looking ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.lookText}>Set</Text>}
                </TouchableOpacity>
              </View>
              {notFound && <Text style={styles.notFound}>No Hylaq handle @{query.replace(/^@/, "")}. Check the spelling, or paste a wallet address.</Text>}

              {hasTarget && (
                <>
                  <View style={styles.recipient}>
                    {recipient
                      ? <HandleAvatar handle={recipient.handle} avatarUrl={recipient.avatarUrl} size={44} />
                      : <Image source={require("../assets/hylaq-logo.png")} style={styles.recipientLogo} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recipientHandle}>{recipient?.displayName || targetLabel}</Text>
                      <Text style={styles.recipientMeta}>
                        {recipient ? `Hylaq handle${recipient.accountType ? ` · ${recipient.accountType}` : ""}` : "External wallet address"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.label}>They receive</Text>
                  <View style={styles.row}>
                    {ASSETS.map((a) => (
                      <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
                        <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {asset === "BTC" && (
                    <View style={[styles.row, { marginTop: 8 }]}>
                      {[["Lightning", true], ["On-chain", false]].map(([lbl, on]) => (
                        <TouchableOpacity key={String(lbl)} style={[styles.chip, btcLightning === on && styles.chipOn]} onPress={() => setBtcLightning(on as boolean)}>
                          <Text style={[styles.chipText, btcLightning === on && styles.chipTextOn]}>{lbl}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text style={styles.label}>Amount (USD)</Text>
                  <View style={styles.amountBox}>
                    <Text style={styles.amountCurrency}>$</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={amountText}
                      onChangeText={(v) => setAmountText(sanitizeAmountInput(v))}
                      keyboardType="decimal-pad"
                      placeholder="0"
                      placeholderTextColor={t.faint}
                      maxLength={9}
                      selectionColor={t.accent}
                    />
                  </View>
                  <View style={styles.row}>
                    {AMOUNTS.map((v) => (
                      <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmountText(String(v))}>
                        <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Pay with</Text>
                  <View style={styles.sourceRow}>
                    <TouchableOpacity style={[styles.source, source === "wallet" && styles.sourceOn]} onPress={() => setSource("wallet")}>
                      <Text style={[styles.sourceTitle, source === "wallet" && styles.sourceTitleOn]}>I have crypto</Text>
                      <Text style={styles.sourceSub}>From your Hylaq wallet</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.source, source === "buy" && styles.sourceOn]} onPress={() => setSource("buy")}>
                      <Text style={[styles.sourceTitle, source === "buy" && styles.sourceTitleOn]}>Buy & send</Text>
                      <Text style={styles.sourceSub}>Card / cash on the spot</Text>
                    </TouchableOpacity>
                  </View>

                  {source === "wallet" ? (
                    !me ? (
                      <Text style={styles.notFound}>Log in with Hylaq to send from your wallet.</Text>
                    ) : (
                      <>
                        <Text style={styles.label}>Wallet password</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="Your Hylaq wallet password"
                          placeholderTextColor={t.faint}
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry
                          autoCapitalize="none"
                        />
                        <Text style={styles.hint}>Sent straight to Hylaq to sign — never stored, never seen by Loadit.</Text>
                        <TouchableOpacity style={styles.cta} onPress={preview} disabled={busy}>
                          {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Preview send →</Text>}
                        </TouchableOpacity>
                      </>
                    )
                  ) : (
                    <>
                      <View style={styles.feeCard}>
                        <View style={styles.feeRow}><Text style={styles.feeLabel}>Amount</Text><Text style={styles.feeVal}>{money(amount)}</Text></View>
                        <View style={styles.feeRow}><Text style={styles.feeLabel}>Loadit fee (0.75%, $1 min)</Text><Text style={styles.feeVal}>{money(fee)}</Text></View>
                        <View style={[styles.feeRow, styles.feeTotal]}><Text style={styles.feeTotalLabel}>You pay</Text><Text style={styles.feeTotalVal}>{money(amount + fee)}</Text></View>
                      </View>
                      <TouchableOpacity style={styles.cta} onPress={buyAndSend} disabled={busy}>
                        {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Buy {asset} & send to {targetLabel} →</Text>}
                      </TouchableOpacity>
                    </>
                  )}

                  <Text style={styles.legal}>
                    Non-custodial: {source === "wallet" ? "Hylaq signs from your own wallet; Loadit never sees your keys or password." : "a licensed partner completes the purchase and delivers straight to the recipient's wallet."}
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

function Row({ styles, k, v }: { styles: ReturnType<typeof makeStyles>; k: string; v: string }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvK}>{k}</Text>
      <Text style={styles.kvV}>{v}</Text>
    </View>
  );
}

function friendlyError(errorType?: string, error?: string): string {
  switch (errorType) {
    case "INSUFFICIENT_SOL": return "Not enough balance to cover this send and the network fee.";
    case "RATE_LIMITED": return "Too many sends too fast — wait a moment and try again.";
    case "RPC_TIMEOUT":
    case "RPC_FAILURE": return "The network is congested right now. Try again in a moment.";
    case "TX_BUILD_FAILED":
    case "BRIDGE_BUILD_FAILED": return "Couldn't build this route right now. Try a different asset or amount.";
    default: return error || "Something went wrong. Try again.";
  }
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
    lookupRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    atWrap: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14 },
    atInput: { flex: 1, paddingVertical: 14, color: t.text, fontSize: 16 },
    lookBtn: { backgroundColor: t.button, borderRadius: 16, paddingHorizontal: 20, paddingVertical: 15 },
    lookText: { color: t.buttonText, fontWeight: "700" },
    notFound: { color: t.dim, fontSize: 13, marginTop: 14 },
    recipient: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 20, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 14 },
    recipientLogo: { width: 44, height: 44, borderRadius: 14 },
    recipientHandle: { color: t.text, fontSize: 18, fontWeight: "800" },
    recipientMeta: { color: t.accentText, fontSize: 12, fontWeight: "600", marginTop: 2 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 15, paddingVertical: 9 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    sourceRow: { flexDirection: "row", gap: 10, marginTop: 8 },
    source: { flex: 1, borderColor: t.border, borderWidth: 1, borderRadius: 16, padding: 14 },
    sourceOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    sourceTitle: { color: t.dim, fontWeight: "700", fontSize: 14 },
    sourceTitleOn: { color: t.text },
    sourceSub: { color: t.faint, fontSize: 11, marginTop: 3 },
    input: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 15, marginTop: 8 },
    amountBox: { flexDirection: "row", alignItems: "center", backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
    amountCurrency: { color: t.text, fontSize: 22, fontWeight: "800", marginRight: 2 },
    amountInput: { flex: 1, color: t.text, fontSize: 22, fontWeight: "800", padding: 0 },
    hint: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 8 },
    feeCard: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 18 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeVal: { color: t.text, fontSize: 13, fontWeight: "600" },
    feeTotal: { borderTopColor: t.border, borderTopWidth: 1, marginTop: 4, paddingTop: 9 },
    feeTotalLabel: { color: t.text, fontSize: 14, fontWeight: "700" },
    feeTotalVal: { color: t.accentText, fontSize: 15, fontWeight: "800" },
    cta: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 20 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    back: { color: t.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
    legal: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 14, textAlign: "center" },
    reviewMsg: { color: t.text, fontSize: 16, marginTop: 8, marginBottom: 4 },
    card: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
    kv: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth },
    kvK: { color: t.dim, fontSize: 13 },
    kvV: { color: t.text, fontSize: 13, fontWeight: "700" },
    successWrap: { alignItems: "center", justifyContent: "center", paddingTop: 40, gap: 6 },
    successCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: t.accent, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    successTick: { color: t.onAccent, fontSize: 38, fontWeight: "800" },
    successTitle: { color: t.text, fontSize: 20, fontWeight: "800", textAlign: "center" },
    successSub: { color: t.dim, fontSize: 13, textAlign: "center", lineHeight: 19, paddingHorizontal: 20 },
    sig: { color: t.text, fontSize: 13, fontFamily: "Courier", marginTop: 6 },
    webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webTitle: { color: t.text, fontWeight: "600" },
    close: { color: t.accentText, fontWeight: "600" },
  });
