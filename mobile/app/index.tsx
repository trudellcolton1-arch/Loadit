import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { routeIntent, type IntentResult } from "@/lib/api";
import { isFounder, isRailOwner } from "@/lib/config";
import { useTheme, rgba, type Theme } from "@/lib/theme";
import { Mark } from "@/components/Mark";

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function initials(email?: string, name?: string): string {
  const src = (name || email || "").trim();
  if (!src) return "•";
  const parts = src.split(/[\s._@-]+/).filter(Boolean);
  const a = parts[0]?.[0] || "";
  const b = parts[1]?.[0] || "";
  return (a + b).toUpperCase() || a.toUpperCase();
}

export default function Home() {
  const { session, ready, hylaqStatus, signOut } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);

  if (ready && !session) return <Redirect href="/login" />;

  // Only a server-VERIFIED, handle-linked Hylaq session counts as signed in.
  // A stale or unlinked session must never surface gated tiles or a profile.
  const linkedHylaq = session?.kind === "hylaq" && hylaqStatus === "linked";
  // While the probe is in flight keep the avatar (no sign-in flash for a real
  // account), but gated tiles stay hidden until "linked" is confirmed.
  const showProfileControl =
    session?.kind === "hylaq" && (hylaqStatus === "linked" || hylaqStatus === "checking");

  const run = async (message: string) => {
    const q = message.trim();
    if (!q || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await routeIntent(q);
      if (data.ok) setResult(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* header */}
          <View style={styles.headRow}>
            <View style={styles.brandRow}>
              <Mark size={34} color={t.accent} />
              <Text style={styles.wordmark}>Loadit</Text>
            </View>
            <View style={styles.headActions}>
              <TouchableOpacity onPress={() => router.push("/appearance")} hitSlop={8}>
                <Feather name="droplet" size={19} color={t.faint} />
              </TouchableOpacity>
              {showProfileControl ? (
                <TouchableOpacity onPress={() => router.push("/profile")} onLongPress={signOut}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(session?.email, session?.name)}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                /* signed out, guest, or unlinked — an obvious way in, never a
                   fake profile */
                <TouchableOpacity style={styles.signInPill} onPress={() => router.push("/login")} hitSlop={6}>
                  <Feather name="log-in" size={14} color={t.onAccent} />
                  <Text style={styles.signInPillText}>Sign in</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* hero */}
          <Text style={styles.greeting}>{greeting()}{showProfileControl && session?.name ? `, ${session.name.split(" ")[0]}` : ""}</Text>
          <Text style={styles.h1}>Just say it.</Text>

          {/* intent input */}
          <View style={styles.inputRow}>
            <Feather name="zap" size={17} color={t.accentText} />
            <TextInput
              style={styles.input}
              placeholder="Turn $500 cash into Bitcoin…"
              placeholderTextColor={t.faint}
              value={text}
              onChangeText={setText}
              onSubmitEditing={() => run(text)}
              returnKeyType="go"
            />
            <TouchableOpacity style={styles.go} onPress={() => run(text)} disabled={loading} hitSlop={6}>
              {loading
                ? <ActivityIndicator color={t.onAccent} size="small" />
                : <Feather name="arrow-up" size={17} color={t.onAccent} />}
            </TouchableOpacity>
          </View>

          {/* intent result */}
          {result && (
            <View style={styles.card}>
              <Text style={styles.microlabel}>HQ</Text>
              <Text style={styles.explain}>{result.explanation}</Text>
              {result.hq && (
                <Text style={styles.liveQuote}>
                  Live: {result.hq.provider} — you receive ~{result.hq.asset_out} {result.intent.asset}
                </Text>
              )}
              <View style={styles.statsRow}>
                <Text style={styles.statInline}>
                  {result.route.network_name} · settles {result.route.eta} · fee {money(result.route.loadit_fee_usd)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cta}
                onPress={() => router.push({ pathname: "/buy", params: { asset: result.intent.asset, amount: String(result.intent.amount_usd) } })}
              >
                <Text style={styles.ctaText}>Buy {result.intent.asset} now</Text>
                <Feather name="chevron-right" size={16} color={t.onAccent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push({ pathname: "/quote", params: { asset: result.intent.asset, amount: String(result.intent.amount_usd), payMethod: result.intent.payment_method } })}
              >
                <Text style={styles.quoteLink}>See live provider quotes + receipt →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* LOAD hero card */}
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/load")}>
            <LinearGradient
              colors={[rgba(t.accent, 0.16), rgba(t.accent, 0.04), "rgba(255,255,255,0.02)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.loadCard}
            >
              <Text style={[styles.microlabel, { color: t.accentText }]}>LOADIT</Text>
              <Text style={styles.loadTitle}>Cash or card → crypto</Text>
              <Text style={styles.loadSub}>
                Bitcoin, Solana, Ethereum, USDC. Best price across licensed partners — proven.
              </Text>
              <View style={styles.loadPill}>
                <Text style={styles.loadPillText}>Start loading</Text>
                <Feather name="chevron-right" size={15} color={t.onAccent} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* action grid */}
          <View style={styles.grid}>
            <Tile styles={styles} t={t} icon="arrow-up-right" title="Send" sub="@handles & wallets" onPress={() => router.push("/send")} />
            <Tile styles={styles} t={t} icon="radio" title="Pulse" sub="Pay with no internet" onPress={() => router.push("/pulse")} />
            <Tile styles={styles} t={t} icon="message-circle" title="HQ" sub="The brain behind it" onPress={() => router.push("/hq")} />
            <Tile
              styles={styles} t={t} icon="◈" title="Quantum" sub="Proof on every quote" violet
              onPress={() => router.push("/quantum")}
            />
          </View>

          {/* MoneyGram banner */}
          <TouchableOpacity style={styles.mgBanner} activeOpacity={0.85} onPress={() => router.push("/moneygram")}>
            <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
            <View style={{ flex: 1 }}>
              <Text style={styles.mgTitle}>Cash at MoneyGram</Text>
              <Text style={styles.mgSub}>350,000+ locations · in integration</Text>
            </View>
            <Feather name="chevron-right" size={18} color={t.faint} />
          </TouchableOpacity>

          {/* rail runtime — the owner's VERIFIED, handle-linked Hylaq account
              ONLY. Guest, stale, or unlinked sessions never see this (the
              server enforces the same gate on /api/rail). */}
          {linkedHylaq && isRailOwner(session?.email) && (
            <TouchableOpacity style={styles.practiceBanner} activeOpacity={0.85} onPress={() => router.push("/rail")}>
              <View style={styles.practiceIcon}>
                <Feather name="cpu" size={16} color={t.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mgTitle}>Rail</Text>
                <Text style={styles.mgSub}>Owner only · one machine: quote → door → payout · cert in flight</Text>
              </View>
              <Feather name="chevron-right" size={18} color={t.faint} />
            </TouchableOpacity>
          )}

          {/* founder practice — requires a VERIFIED, handle-linked Hylaq
              founder account; stale or unlinked sessions don't qualify */}
          {linkedHylaq && isFounder(session?.email) && (
            <TouchableOpacity style={styles.practiceBanner} activeOpacity={0.85} onPress={() => router.push("/practice")}>
              <View style={styles.practiceIcon}>
                <Feather name="play" size={16} color={t.warn} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mgTitle}>Practice run</Text>
                <Text style={styles.mgSub}>Founder only · full flow in the MoneyGram sandbox</Text>
              </View>
              <Feather name="chevron-right" size={18} color={t.faint} />
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Tile({ styles, t, icon, title, sub, onPress, violet }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; icon: string; title: string; sub: string;
  onPress: () => void; violet?: boolean;
}) {
  const tint = violet ? "#9D8CFF" : t.accentText;
  const chipBg = violet ? "rgba(157,140,255,0.13)" : rgba(t.accent, 0.12);
  return (
    <TouchableOpacity style={[styles.tile, violet && styles.tileViolet]} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.tileIcon, { backgroundColor: chipBg }]}>
        {icon === "◈"
          ? <Text style={{ color: tint, fontSize: 17, fontWeight: "700" }}>◈</Text>
          : <Feather name={icon as never} size={18} color={tint} />}
      </View>
      <Text style={styles.tileTitle}>{title}</Text>
      <Text style={styles.tileSub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 22, paddingBottom: 48 },
    headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    wordmark: { color: t.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.4 },
    headActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    avatar: {
      width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
      backgroundColor: t.surface, borderColor: t.border, borderWidth: 1,
    },
    avatarText: { color: t.dim, fontSize: 12, fontWeight: "700" },
    signInPill: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    },
    signInPillText: { color: t.onAccent, fontWeight: "700", fontSize: 13 },
    greeting: { color: t.faint, fontSize: 13, fontWeight: "500", marginTop: 24 },
    h1: { color: t.text, fontSize: 32, fontWeight: "800", letterSpacing: -1, marginTop: 4 },
    inputRow: {
      flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14,
      backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18,
      paddingLeft: 18, paddingRight: 8, paddingVertical: 7,
    },
    input: { flex: 1, color: t.text, fontSize: 15, paddingVertical: 8 },
    go: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.accent, alignItems: "center", justifyContent: "center" },
    microlabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase", color: t.faint },
    loadCard: {
      marginTop: 16, borderRadius: 26, padding: 22,
      borderColor: rgba(t.accent, 0.25), borderWidth: 1, overflow: "hidden",
    },
    loadTitle: { color: t.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 6 },
    loadSub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 5 },
    loadPill: {
      flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
      backgroundColor: t.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 14,
      shadowColor: t.accent, shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 6,
    },
    loadPillText: { color: t.onAccent, fontWeight: "700", fontSize: 14 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 11, marginTop: 12 },
    tile: {
      width: "48%", flexGrow: 1, backgroundColor: t.card, borderColor: t.border, borderWidth: 1,
      borderRadius: 24, padding: 16,
    },
    tileViolet: { borderColor: "rgba(157,140,255,0.25)" },
    tileIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
    tileTitle: { color: t.text, fontSize: 15, fontWeight: "700", marginTop: 10 },
    tileSub: { color: t.faint, fontSize: 12, marginTop: 3 },
    mgBanner: {
      flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12,
      backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24,
      paddingHorizontal: 18, paddingVertical: 15,
    },
    mgLogo: { width: 40, height: 40, borderRadius: 20 },
    mgTitle: { color: t.text, fontSize: 15, fontWeight: "700" },
    mgSub: { color: t.faint, fontSize: 12, marginTop: 2 },
    practiceBanner: {
      flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12,
      backgroundColor: t.card, borderColor: rgba(t.warn, 0.35), borderWidth: 1, borderRadius: 24,
      paddingHorizontal: 18, paddingVertical: 15,
    },
    practiceIcon: {
      width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center",
      backgroundColor: rgba(t.warn, 0.12),
    },
    card: { marginTop: 16, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 18 },
    explain: { color: t.text, fontSize: 15, lineHeight: 22, marginTop: 8 },
    liveQuote: { color: t.accentText, fontSize: 13, fontWeight: "600", marginTop: 8 },
    statsRow: { marginTop: 10 },
    statInline: { color: t.dim, fontSize: 13 },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 15, marginTop: 14,
      shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
    quoteLink: { color: t.accentText, fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 12 },
  });
