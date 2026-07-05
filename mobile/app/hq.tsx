import { useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { askHQ, type HQMessage, type HQResult } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * HQ — your AI. A personal money copilot living inside the app: chat about
 * anything Loadit, and when you ask for an actual move HQ drops a grounded
 * route card into the thread with a one-tap path to the buy flow.
 */

interface Bubble extends HQMessage {
  route?: HQResult["route"];
  hq?: HQResult["hq"];
}

const GREETING: Bubble = {
  role: "assistant",
  content:
    "I'm HQ — your AI inside Loadit. Ask me anything about your money, or just say the move and I'll route it the cheapest real way.",
};

const SUGGESTIONS = [
  "Turn $200 cash into Bitcoin",
  "What's the cheapest way to buy SOL?",
  "How does Cash at any register work?",
  "Is Loadit safe?",
];

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function HQ() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const [messages, setMessages] = useState<Bubble[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  if (ready && !session) return <Redirect href="/login" />;

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    const next: Bubble[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await askHQ(next.map(({ role, content }) => ({ role, content })));
      setMessages([
        ...next,
        {
          role: "assistant",
          content: data.reply || "I hit a snag reaching HQ — try that again in a moment.",
          route: data.route,
          hq: data.hq,
        },
      ]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "I couldn't reach HQ — check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((m, i) => (
            <View key={i} style={[styles.row, m.role === "user" ? styles.rowUser : styles.rowAI]}>
              <View style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleAI]}>
                {m.role === "assistant" && <Text style={styles.tag}>HQ</Text>}
                <Text style={m.role === "user" ? styles.msgUser : styles.msg}>{m.content}</Text>
                {m.route && (
                  <View style={styles.routeCard}>
                    {m.hq && (
                      <Text style={styles.liveQuote}>
                        ⚡ Live: {m.hq.provider} — you receive ~{m.hq.asset_out} {m.route.asset}
                      </Text>
                    )}
                    <View style={styles.statsRow}>
                      <Stat styles={styles} label="Route" value={m.route.network_name} />
                      <Stat styles={styles} label="Settles" value={m.route.eta} />
                    </View>
                    <View style={styles.statsRow}>
                      <Stat styles={styles} label="Cost" value={money(m.route.loadit_fee_usd)} />
                      <Stat styles={styles} label="You save" value={money(m.route.savings_usd)} sub={`${m.route.savings_pct}% cheaper`} accent />
                    </View>
                    <TouchableOpacity
                      style={styles.buy}
                      onPress={() =>
                        router.push({
                          pathname: "/buy",
                          params: { asset: m.route!.asset, amount: String(m.route!.amount_usd) },
                        })
                      }
                    >
                      <Text style={styles.buyText}>Buy {m.route.asset} now →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: "/quote",
                          params: { asset: m.route!.asset, amount: String(m.route!.amount_usd), payMethod: m.route!.payment_method },
                        })
                      }
                    >
                      <Text style={styles.quoteLink}>See live provider quotes + receipt →</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          ))}

          {loading && (
            <View style={[styles.row, styles.rowAI]}>
              <View style={[styles.bubble, styles.bubbleAI, styles.thinking]}>
                <ActivityIndicator size="small" color={t.accentText} />
                <Text style={styles.thinkingText}>HQ is thinking…</Text>
              </View>
            </View>
          )}

          {messages.length === 1 && !loading && (
            <View style={styles.chips}>
              {SUGGESTIONS.map((s) => (
                <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
                  <Text style={styles.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message HQ…"
            placeholderTextColor={t.faint}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity style={[styles.send, (!input.trim() || loading) && styles.sendDisabled]} onPress={() => send(input)} disabled={!input.trim() || loading}>
            <Text style={styles.sendText}>↑</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.disclaimer}>
          Estimates depend on live conditions. Purchases complete via a licensed partner to your own wallet.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stat({ styles, label, value, sub, accent }: {
  styles: ReturnType<typeof makeStyles>; label: string; value: string; sub?: string; accent?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statAccent]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 16, paddingBottom: 12, gap: 10 },
    row: { flexDirection: "row" },
    rowUser: { justifyContent: "flex-end" },
    rowAI: { justifyContent: "flex-start" },
    bubble: { maxWidth: "86%", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 11 },
    bubbleUser: { backgroundColor: t.accent, borderBottomRightRadius: 6 },
    bubbleAI: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderBottomLeftRadius: 6 },
    tag: { color: t.accentText, fontSize: 9, fontWeight: "700", letterSpacing: 2, marginBottom: 4 },
    msg: { color: t.text, fontSize: 15, lineHeight: 21 },
    msgUser: { color: t.onAccent, fontSize: 15, lineHeight: 21 },
    thinking: { flexDirection: "row", alignItems: "center", gap: 8 },
    thinkingText: { color: t.dim, fontSize: 13 },
    routeCard: { marginTop: 10 },
    liveQuote: { color: t.warn, fontSize: 12, fontWeight: "600", marginTop: 2 },
    statsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
    stat: { flex: 1, backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 10 },
    statLabel: { color: t.faint, fontSize: 9, letterSpacing: 1, textTransform: "uppercase" },
    statValue: { color: t.text, fontSize: 14, fontWeight: "700", marginTop: 3 },
    statAccent: { color: t.accentText },
    statSub: { color: t.faint, fontSize: 10, marginTop: 2 },
    buy: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginTop: 12 },
    buyText: { color: t.buttonText, fontWeight: "700", fontSize: 14 },
    quoteLink: { color: t.accentText, fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 12 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    chipText: { color: t.dim, fontSize: 12 },
    inputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end", paddingHorizontal: 16, paddingTop: 8 },
    input: { flex: 1, backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, color: t.text, fontSize: 15, maxHeight: 110 },
    send: { backgroundColor: t.button, borderRadius: 999, width: 44, height: 44, alignItems: "center", justifyContent: "center" },
    sendDisabled: { opacity: 0.4 },
    sendText: { color: t.buttonText, fontWeight: "800", fontSize: 18 },
    disclaimer: { color: t.faint, fontSize: 10, textAlign: "center", paddingHorizontal: 24, paddingTop: 6, paddingBottom: 4 },
  });
