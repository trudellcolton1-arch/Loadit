import { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Linking,
} from "react-native";
import { WebView } from "react-native-webview";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { isFounder } from "@/lib/config";
import {
  getRoute, startMgSandboxDeposit, getMgSandboxStatus,
  type HQRouteQuote, type MgSandboxStatus,
} from "@/lib/api";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * PRACTICE RUN — founder-only walkthrough of the full cash→crypto journey.
 *
 * What's REAL: the live HQ quote, the quantum-proof receipt, and the
 * MoneyGram leg — a genuine SEP-24 deposit at MoneyGram's TESTNET anchor,
 * in their hosted sandbox UI, with a checkable transaction id.
 * What's TEST: the money. Stellar test network, test USDC, nothing charged.
 * The labels say so on every step — never pretend test is production.
 */

const ASSETS = ["BTC", "SOL", "ETH", "USDC"] as const;
const AMOUNTS = [50, 100, 200, 500] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Plain-English meaning of the SEP-24 statuses the sandbox walks through. */
function statusLabel(s?: string): string {
  switch (s) {
    case "incomplete": return "Started — finish the steps in the MoneyGram window";
    case "pending_user_transfer_start": return "MoneyGram is waiting for the cash (test) at the counter";
    case "pending_anchor": return "MoneyGram is processing the deposit";
    case "pending_stellar": return "USDC is on its way on the Stellar test network";
    case "completed": return "Complete — test USDC delivered";
    case "refunded": return "Refunded by the anchor";
    case "expired": return "Expired — start a fresh practice run";
    case "error": return "The anchor reported an error";
    default: return s || "Checking…";
  }
}

export default function Practice() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();

  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("BTC");
  const [amount, setAmount] = useState(200);
  const [step, setStep] = useState<"intro" | "quote" | "moneygram" | "status">("intro");
  const [quote, setQuote] = useState<HQRouteQuote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mgUrl, setMgUrl] = useState<string | null>(null);
  const [mgId, setMgId] = useState<string | null>(null);
  const [mgErr, setMgErr] = useState<string | null>(null);
  const [status, setStatus] = useState<MgSandboxStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the anchor while on the status step.
  useEffect(() => {
    if (step !== "status" || !mgId) return;
    let live = true;
    const tick = async () => {
      try {
        const s = await getMgSandboxStatus(mgId);
        if (live && s.ok) setStatus(s);
      } catch { /* keep last status */ }
    };
    tick();
    pollRef.current = setInterval(tick, 5000);
    return () => { live = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, mgId]);

  if (ready && !session) return <Redirect href="/login" />;
  if (ready && session && !isFounder(session.email)) return <Redirect href="/" />;

  const runQuote = async () => {
    setBusy(true); setQuoteErr(null); setQuote(null);
    setStep("quote");
    try {
      const q = await getRoute(amount, asset, "cash");
      if (q.best) setQuote(q);
      else setQuoteErr("No live quotes right now — try again in a moment.");
    } catch {
      setQuoteErr("Couldn't reach the quote service — check your connection.");
    } finally {
      setBusy(false);
    }
  };

  const startMoneyGram = async () => {
    setBusy(true); setMgErr(null);
    try {
      const r = await startMgSandboxDeposit(amount);
      if (r.ok && r.url && r.id) {
        setMgId(r.id);
        setMgUrl(r.url);
        setStep("moneygram");
      } else {
        setMgErr(r.reason === "not_configured"
          ? "The sandbox wallet isn't configured on the backend yet."
          : "MoneyGram's sandbox didn't respond — try again.");
      }
    } catch {
      setMgErr("Couldn't reach the backend — try again.");
    } finally {
      setBusy(false);
    }
  };

  // MoneyGram's hosted sandbox UI, full screen.
  if (step === "moneygram" && mgUrl) {
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.webHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.webTitle}>MoneyGram · sandbox deposit</Text>
            <Text style={styles.webSub}>Test network — no real money</Text>
          </View>
          <TouchableOpacity onPress={() => setStep("status")}>
            <Text style={styles.close}>I&apos;m done →</Text>
          </TouchableOpacity>
        </View>
        <WebView source={{ uri: mgUrl }} style={{ flex: 1, backgroundColor: t.bg }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headRow}>
          <Text style={styles.h1}>Practice run</Text>
          <View style={styles.sandboxBadge}><Text style={styles.sandboxBadgeText}>SANDBOX</Text></View>
        </View>
        <Text style={styles.sub}>
          The full cash → crypto journey. The quote and quantum receipt are live and real;
          the MoneyGram leg runs in their official test sandbox — real flow, test money.
        </Text>

        {step === "intro" && (
          <>
            <Text style={styles.label}>You want</Text>
            <View style={styles.row}>
              {ASSETS.map((a) => (
                <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
                  <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Cash amount (test USD)</Text>
            <View style={styles.row}>
              {AMOUNTS.map((v) => (
                <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
                  <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.cta} onPress={runQuote} disabled={busy}>
              {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Start — get the live quote →</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === "quote" && (
          <>
            {!quote && !quoteErr && (
              <View style={styles.loading}>
                <ActivityIndicator color={t.accentText} />
                <Text style={styles.loadingText}>HQ is comparing live routes…</Text>
              </View>
            )}
            {quoteErr && (
              <View style={styles.card}>
                <Text style={styles.body}>{quoteErr}</Text>
                <TouchableOpacity style={styles.cta} onPress={runQuote}><Text style={styles.ctaText}>Retry</Text></TouchableOpacity>
              </View>
            )}
            {quote?.best && (
              <>
                <View style={[styles.card, styles.bestCard]}>
                  <Text style={quote.quantum ? styles.quantumTag : styles.bestTag}>
                    {quote.quantum ? "◈ QUANTUM ROUTE — LIVE" : "BEST ROUTE — LIVE"}
                  </Text>
                  <Text style={styles.provider}>{quote.best.provider}</Text>
                  <Text style={styles.body}>You&apos;d receive ~{quote.best.assetOut} {asset} for {money(amount)}</Text>
                </View>
                {quote.quantum && (
                  <View style={[styles.card, styles.quantumCard]}>
                    <Text style={styles.quantumSectionTag}>◈ QUANTUM-PROOF RECEIPT — REAL</Text>
                    <Text style={styles.meta}>
                      Sealed with {quote.quantum.alg} · {quote.quantum.calibration}
                    </Text>
                    <TouchableOpacity onPress={() => Linking.openURL(quote.quantum!.url)}>
                      <Text style={styles.quantumVerify}>Verify publicly → {quote.quantum.url.replace("https://", "")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {mgErr && <Text style={styles.err}>{mgErr}</Text>}
                <TouchableOpacity style={styles.cta} onPress={startMoneyGram} disabled={busy}>
                  {busy ? <ActivityIndicator color={t.buttonText} /> : <Text style={styles.ctaText}>Pay cash at MoneyGram (sandbox) →</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep("intro")}><Text style={styles.back}>Back</Text></TouchableOpacity>
              </>
            )}
          </>
        )}

        {step === "status" && (
          <>
            <View style={[styles.card, styles.bestCard]}>
              <Text style={styles.bestTag}>MONEYGRAM SANDBOX — LIVE STATUS</Text>
              <Text style={styles.provider}>{statusLabel(status?.status)}</Text>
              <Text style={styles.meta}>
                Anchor status: {status?.status || "…"}{status?.amountIn ? ` · in ${status.amountIn}` : ""}{status?.amountOut ? ` · out ${status.amountOut}` : ""}
              </Text>
              {mgId && <Text style={styles.meta}>SEP-24 transaction: {mgId}</Text>}
              {status?.message && <Text style={styles.meta}>{status.message}</Text>}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTag}>WHAT WAS REAL</Text>
              <Text style={styles.body}>• Live HQ quote across licensed providers{"\n"}• Quantum-proof receipt (ML-DSA-65, IBM-calibrated){"\n"}• A genuine MoneyGram SEP-24 deposit at their testnet anchor</Text>
              <Text style={[styles.sectionTag, { marginTop: 14 }]}>WHAT WAS TEST</Text>
              <Text style={styles.body}>• The money — Stellar test network, test USDC, nothing charged{"\n"}• In production, MoneyGram gives a reference code and takes real cash at the counter</Text>
            </View>

            {mgUrl && (
              <TouchableOpacity onPress={() => setStep("moneygram")}>
                <Text style={styles.quantumVerify}>Reopen the MoneyGram window →</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cta} onPress={() => router.replace("/")}>
              <Text style={styles.ctaText}>Done</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.disclaimer}>
          Founder practice mode. Runs on the Stellar test network against MoneyGram&apos;s official
          sandbox anchor — no real funds move, and nothing here is shown to customers.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    sandboxBadge: { backgroundColor: rgba(t.warn, 0.12), borderColor: t.warn, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    sandboxBadgeText: { color: t.warn, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
    sub: { color: t.dim, fontSize: 13, marginTop: 6, marginBottom: 16, lineHeight: 19 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
    loadingText: { color: t.dim, fontSize: 14 },
    card: { marginTop: 14, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 20, padding: 16 },
    bestCard: { borderColor: t.accentTint, backgroundColor: t.accentSoft },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumTag: { color: "#9D8CFF", fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumCard: { borderColor: "#4A3F8F" },
    quantumSectionTag: { color: "#9D8CFF", fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
    quantumVerify: { color: "#9D8CFF", fontSize: 13, fontWeight: "600", marginTop: 10 },
    sectionTag: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 8 },
    provider: { color: t.text, fontSize: 19, fontWeight: "800", marginTop: 6 },
    body: { color: t.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
    meta: { color: t.dim, fontSize: 12, marginTop: 6 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    cta: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 18 },
    ctaText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    back: { color: t.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
    webHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webTitle: { color: t.text, fontWeight: "600" },
    webSub: { color: t.warn, fontSize: 11, marginTop: 2 },
    close: { color: t.accentText, fontWeight: "600" },
  });
