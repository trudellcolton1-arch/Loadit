import { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Linking, Image, Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
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
 * REAL: live HQ quote, quantum receipt, MoneyGram SEP-24 on their testnet.
 * TEST: the money. Labels say so on every step — never pretend otherwise.
 */

const VIOLET = "#9D8CFF";
const MGRED = "#E8453C";
const ASSETS = ["BTC", "SOL", "ETH", "USDC"] as const;
const AMOUNTS = [50, 100, 200, 500] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  const [showWeb, setShowWeb] = useState(false);
  const [webErr, setWebErr] = useState<string | null>(null);
  const [diag, setDiag] = useState<string[]>([]);
  const [status, setStatus] = useState<MgSandboxStatus | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        setWebErr(null);
        setShowWeb(false);
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

  // Diagnostic probe injected into MoneyGram's page: reports JS errors,
  // unhandled rejections, and a boot status back to the app so a blank
  // screen tells us WHY instead of nothing.
  const DIAG_JS = `
    // BOOT SHIM: MoneyGram's staging CDN intermittently serves HTML for
    // /config.js on mobile network paths, killing their app at line 1. The
    // real file only sets an empty auto-detect config — predefine the same
    // value so their app boots even when their CDN serves the wrong bytes.
    window.RAMPS_CONFIG = window.RAMPS_CONFIG || {};
    // Loadit co-brand ribbon pinned above MoneyGram's flow (our container).
    (function () {
      var addRibbon = function () {
        if (document.getElementById("loadit-ribbon") || !document.body) return;
        var r = document.createElement("div");
        r.id = "loadit-ribbon";
        r.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;background:#05070C;border-bottom:1px solid rgba(61,227,131,.35);font-family:-apple-system,Roboto,sans-serif;";
        r.innerHTML = '<img src="https://loadit.net/icon-512.png" style="width:20px;height:20px;border-radius:6px;"/>' +
          '<span style="color:#fff;font-weight:700;font-size:13px;letter-spacing:-0.2px;">Loadit</span>' +
          '<span style="color:rgba(255,255,255,.45);font-size:12px;">non-custodial cash-in</span>' +
          '<span style="margin-left:auto;color:#F5B84B;border:1px solid rgba(245,184,75,.5);border-radius:6px;padding:2px 7px;font-size:9px;font-weight:800;letter-spacing:1px;">SANDBOX</span>';
        document.body.appendChild(r);
        document.body.style.paddingTop = (parseFloat(getComputedStyle(document.body).paddingTop) || 0) + 40 + "px";
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addRibbon);
      else addRibbon();
      setTimeout(addRibbon, 1500);
    })();
    (function () {
      var send = function (m) {
        try { window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch (e) {}
      };
      window.addEventListener("error", function (e) {
        send({ diag: "js-error", msg: String(e.message || e.error).slice(0, 300), src: String(e.filename || "").slice(-80) + ":" + e.lineno });
      });
      window.addEventListener("unhandledrejection", function (e) {
        send({ diag: "promise-rejection", msg: String(e.reason && (e.reason.stack || e.reason.message) || e.reason).slice(0, 300) });
      });
      var origErr = console.error;
      console.error = function () {
        try { send({ diag: "console-error", msg: Array.prototype.map.call(arguments, String).join(" ").slice(0, 300) }); } catch (e) {}
        return origErr.apply(console, arguments);
      };
      setTimeout(function () {
        var failed = [];
        try {
          performance.getEntriesByType("resource").forEach(function (r) {
            if (r.transferSize === 0 && r.decodedBodySize === 0 && !/data:/.test(r.name)) failed.push(r.name.slice(-70));
          });
        } catch (e) {}
        send({
          diag: "boot-status",
          ready: document.readyState,
          appChildren: (document.getElementById("app") || {}).childElementCount,
          bodyLen: (document.body && document.body.innerText || "").length,
          failedResources: failed.slice(0, 5),
        });
      }, 6000);
    })(); true;`;

  // MoneyGram's hosted sandbox UI, full screen (in-app fallback path).
  if (step === "moneygram" && mgUrl && showWeb) {
    return (
      <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
        <View style={styles.webHead}>
          <View style={styles.webBrandRow}>
            <Image source={require("../assets/mark.png")} style={styles.webBrandLogo} />
            <Text style={styles.webBrandX}>×</Text>
            <Image source={require("../assets/moneygram-logo.jpg")} style={[styles.webBrandLogo, { borderRadius: 13 }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.webTitle}>Sandbox deposit</Text>
            <Text style={styles.webSub}>Test network — no real money</Text>
          </View>
          <TouchableOpacity onPress={() => { setShowWeb(false); setStep("status"); }}>
            <Text style={styles.close}>I&apos;m done →</Text>
          </TouchableOpacity>
        </View>
        {webErr ? (
          <View style={styles.webErrWrap}>
            <Text style={styles.err}>MoneyGram&apos;s page couldn&apos;t load in-app: {webErr}</Text>
            <TouchableOpacity style={styles.cta} onPress={() => Linking.openURL(mgUrl)}>
              <Text style={styles.ctaText}>Open in {Platform.OS === "ios" ? "Safari" : "Chrome"} instead</Text>
              <Feather name="external-link" size={16} color={t.onAccent} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              source={{ uri: mgUrl }}
              // White bg + 0.99 opacity: works around the Android WebView
              // hardware-acceleration bug that paints content as black.
              style={{ flex: 1, backgroundColor: "#FFFFFF", opacity: 0.99 }}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              geolocationEnabled
              setSupportMultipleWindows={false}
              injectedJavaScriptBeforeContentLoaded={DIAG_JS}
              onMessage={(e) => {
                try {
                  const m = JSON.parse(e.nativeEvent.data) as Record<string, unknown>;
                  if (m.diag) {
                    setDiag((d) => [...d.slice(-11), `${m.diag}: ${JSON.stringify({ ...m, diag: undefined })}`.slice(0, 220)]);
                  }
                } catch { /* not ours */ }
              }}
              onRenderProcessGone={() => setWebErr("Android WebView renderer crashed — update 'Android System WebView' in the Play Store and retry")}
              onContentProcessDidTerminate={() => setWebErr("iOS web content process terminated — retry")}
              startInLoadingState
              renderLoading={() => (
                <View style={[styles.webLoading, { backgroundColor: "#FFFFFF" }]}>
                  <ActivityIndicator color={t.accentText} />
                  <Text style={styles.loadingText}>Loading MoneyGram…</Text>
                </View>
              )}
              onError={(e) => setWebErr(e.nativeEvent.description || "load error")}
              onHttpError={(e) => setWebErr(`HTTP ${e.nativeEvent.statusCode}`)}
            />
            {diag.length > 0 && (
              <ScrollView style={styles.diagStrip}>
                {diag.map((d, i) => (
                  <Text key={i} style={styles.diagText} selectable>{d}</Text>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </SafeAreaView>
    );
  }

  const stepIndex = step === "intro" || step === "quote" ? 0 : step === "moneygram" ? 1 : 2;
  const delivered = status?.status === "completed";

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* header */}
        <View style={styles.headRow}>
          <Text style={styles.h1}>Practice run</Text>
          <View style={styles.sandboxBadge}><Text style={styles.sandboxBadgeText}>SANDBOX</Text></View>
        </View>
        <Text style={styles.sub}>
          The full cash → crypto journey. Quote and quantum receipt are live and real; the
          MoneyGram leg runs in their official test sandbox — real flow, test money.
        </Text>

        {/* stepper */}
        <View style={styles.stepper}>
          <StepDot styles={styles} t={t} label="Quote" state={stepIndex > 0 || Boolean(quote?.best) ? "done" : stepIndex === 0 ? "active" : "todo"} />
          <View style={[styles.stepLine, stepIndex >= 1 && { backgroundColor: t.accent }]} />
          <StepDot styles={styles} t={t} label="MoneyGram" mg state={stepIndex === 1 ? "active" : stepIndex > 1 ? "done" : "todo"} />
          <View style={[styles.stepLine, delivered && { backgroundColor: t.accent }]} />
          <StepDot styles={styles} t={t} label="Delivered" state={delivered ? "done" : stepIndex === 2 ? "active" : "todo"} />
        </View>

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
              {busy ? <ActivityIndicator color={t.onAccent} /> : (
                <>
                  <Text style={styles.ctaText}>Start — get the live quote</Text>
                  <Feather name="chevron-right" size={16} color={t.onAccent} />
                </>
              )}
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
                <TouchableOpacity style={styles.cta} onPress={runQuote}>
                  <Text style={styles.ctaText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            {quote?.best && (
              <>
                <LinearGradient
                  colors={[rgba(t.accent, 0.14), "rgba(255,255,255,0.03)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
                  style={styles.hero}
                >
                  <Text style={quote.quantum ? styles.quantumTag : styles.bestTag}>
                    {quote.quantum ? "◈ QUANTUM ROUTE — LIVE" : "BEST ROUTE — LIVE"}
                  </Text>
                  <Text style={styles.provider}>{quote.best.provider}</Text>
                  <Text style={styles.body}>
                    You&apos;d receive ~{quote.best.assetOut} {asset} for {money(amount)}
                  </Text>
                </LinearGradient>
                {quote.quantum && (
                  <LinearGradient
                    colors={["rgba(157,140,255,0.13)", "rgba(157,140,255,0.03)"]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.quantumCard}
                  >
                    <Text style={styles.quantumSectionTag}>◈ QUANTUM-PROOF RECEIPT — REAL</Text>
                    <Text style={styles.meta}>
                      Sealed with {quote.quantum.alg} · {quote.quantum.calibration}
                    </Text>
                    <TouchableOpacity
                      style={styles.quantumVerifyRow}
                      onPress={() => Linking.openURL(quote.quantum!.url)}
                    >
                      <Text style={styles.quantumVerify}>Verify publicly</Text>
                      <Feather name="external-link" size={13} color={VIOLET} />
                    </TouchableOpacity>
                  </LinearGradient>
                )}
                {mgErr && <Text style={styles.err}>{mgErr}</Text>}
                <TouchableOpacity style={styles.cta} onPress={startMoneyGram} disabled={busy}>
                  {busy ? <ActivityIndicator color={t.onAccent} /> : (
                    <>
                      <Text style={styles.ctaText}>Pay cash at MoneyGram (sandbox)</Text>
                      <Feather name="chevron-right" size={16} color={t.onAccent} />
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep("intro")}>
                  <Text style={styles.back}>Back</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {step === "moneygram" && mgUrl && !showWeb && (
          <>
            <View style={styles.card}>
              <View style={styles.mgHead}>
                <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.mgTitle}>Test deposit created</Text>
                  <View style={styles.statusRow}>
                    <View style={styles.statusDot} />
                    <Text style={styles.meta}>Finish it in MoneyGram&apos;s hosted sandbox</Text>
                  </View>
                </View>
              </View>
              {mgId && (
                <View style={styles.monoBox}>
                  <Text style={styles.mono}>SEP-24 · {mgId}</Text>
                </View>
              )}
              <Text style={[styles.body, { marginTop: 12 }]}>
                {Platform.OS === "android"
                  ? "Complete it right here in the app. Status updates live from their system when you're done."
                  : "MoneyGram's new page currently only renders on Chromium browsers (reported to their team) — on iPhone, run this practice from a desktop Chrome, or wait for their fix. Status still updates here live."}
              </Text>
            </View>
            {Platform.OS === "android" ? (
              <>
                <TouchableOpacity style={styles.cta} onPress={() => { setWebErr(null); setShowWeb(true); }}>
                  <Text style={styles.ctaText}>Continue in app</Text>
                  <Feather name="chevron-right" size={16} color={t.onAccent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => Linking.openURL(mgUrl)}>
                  <Text style={styles.quantumVerify}>Or open in Chrome</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.cta} onPress={() => Linking.openURL(mgUrl)}>
                  <Text style={styles.ctaText}>Try in Safari anyway</Text>
                  <Feather name="external-link" size={16} color={t.onAccent} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setWebErr(null); setShowWeb(true); }}>
                  <Text style={styles.quantumVerify}>Or try it in-app</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={[styles.cta, styles.ctaSecondary]} onPress={() => setStep("status")}>
              <Text style={styles.ctaSecondaryText}>I&apos;ve finished — show live status</Text>
            </TouchableOpacity>
          </>
        )}

        {step === "status" && (
          <>
            <LinearGradient
              colors={[rgba(t.accent, 0.12), "rgba(255,255,255,0.03)"]}
              start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
              style={styles.hero}
            >
              <Text style={styles.bestTag}>MONEYGRAM SANDBOX — LIVE STATUS</Text>
              <Text style={styles.provider}>{statusLabel(status?.status)}</Text>
              <Text style={styles.meta}>
                Anchor status: {status?.status || "…"}
                {status?.amountIn ? ` · in ${status.amountIn}` : ""}
                {status?.amountOut ? ` · out ${status.amountOut}` : ""}
              </Text>
              {mgId && <Text style={styles.meta}>SEP-24 transaction: {mgId}</Text>}
              {status?.message && <Text style={styles.meta}>{status.message}</Text>}
            </LinearGradient>

            <View style={styles.realTestGrid}>
              <View style={[styles.rtCard, { borderColor: rgba(t.accent, 0.25) }]}>
                <Text style={[styles.microlabel, { color: t.accentText }]}>Real</Text>
                <Text style={styles.rtBody}>Live HQ quote{"\n"}Quantum receipt{"\n"}MoneyGram SEP-24 rails</Text>
              </View>
              <View style={[styles.rtCard, { borderColor: rgba(t.warn, 0.3) }]}>
                <Text style={[styles.microlabel, { color: t.warn }]}>Test</Text>
                <Text style={styles.rtBody}>The money itself{"\n"}Stellar test network{"\n"}Nothing charged</Text>
              </View>
            </View>

            {mgUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(mgUrl)}>
                <Text style={styles.quantumVerify}>Reopen MoneyGram in {Platform.OS === "ios" ? "Safari" : "Chrome"} →</Text>
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

function StepDot({ styles, t, label, state, mg }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; label: string;
  state: "done" | "active" | "todo"; mg?: boolean;
}) {
  return (
    <View style={styles.stepCol}>
      {state === "done" ? (
        <View style={[styles.stepDot, { backgroundColor: t.accent }]}>
          <Feather name="check" size={14} color={t.onAccent} />
        </View>
      ) : state === "active" ? (
        <View style={[styles.stepDot, styles.stepDotActive, mg && { borderColor: MGRED, backgroundColor: rgba(MGRED, 0.15) }]}>
          <View style={[styles.stepDotCore, mg && { backgroundColor: MGRED }]} />
        </View>
      ) : (
        <View style={[styles.stepDot, styles.stepDotTodo]} />
      )}
      <Text style={[styles.stepLabel, state !== "todo" && { color: t.text }]}>{label}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 22, paddingBottom: 48 },
    headRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.8 },
    sandboxBadge: { backgroundColor: rgba(t.warn, 0.1), borderColor: rgba(t.warn, 0.4), borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
    sandboxBadgeText: { color: t.warn, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
    sub: { color: t.dim, fontSize: 13, marginTop: 6, lineHeight: 19 },
    stepper: { flexDirection: "row", alignItems: "flex-start", marginTop: 22 },
    stepCol: { alignItems: "center", width: 84 },
    stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
    stepDotActive: { borderWidth: 2, borderColor: t.accent, backgroundColor: rgba(t.accent, 0.12) },
    stepDotCore: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent },
    stepDotTodo: { borderWidth: 2, borderColor: t.border },
    stepLabel: { color: t.faint, fontSize: 11, fontWeight: "600", marginTop: 7 },
    stepLine: { flex: 1, height: 2, backgroundColor: t.border, marginTop: 14 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    loading: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24 },
    loadingText: { color: t.dim, fontSize: 14 },
    card: { marginTop: 16, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 24, padding: 20 },
    hero: {
      marginTop: 16, borderRadius: 26, padding: 22,
      borderColor: rgba(t.accent, 0.28), borderWidth: 1, overflow: "hidden",
    },
    bestTag: { color: t.accentText, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumTag: { color: VIOLET, fontSize: 10, fontWeight: "700", letterSpacing: 2 },
    quantumCard: {
      marginTop: 12, borderRadius: 24, padding: 18,
      borderColor: "rgba(157,140,255,0.3)", borderWidth: 1, overflow: "hidden",
    },
    quantumSectionTag: { color: VIOLET, fontSize: 10, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
    quantumVerifyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 },
    quantumVerify: { color: VIOLET, fontSize: 13, fontWeight: "700", marginTop: 12, textAlign: "center" },
    microlabel: { fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
    provider: { color: t.text, fontSize: 19, fontWeight: "800", letterSpacing: -0.4, marginTop: 8 },
    body: { color: t.text, fontSize: 14, lineHeight: 21, marginTop: 4 },
    meta: { color: t.dim, fontSize: 12, marginTop: 6 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    mgHead: { flexDirection: "row", alignItems: "center", gap: 14 },
    mgLogo: {
      width: 46, height: 46, borderRadius: 23,
      shadowColor: MGRED, shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    },
    mgTitle: { color: t.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
    statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: t.warn },
    monoBox: {
      backgroundColor: "rgba(0,0,0,0.3)", borderColor: t.border, borderWidth: 1,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16,
    },
    mono: { color: t.dim, fontSize: 12, fontFamily: "Courier" },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16, marginTop: 18,
      shadowColor: t.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    ctaSecondary: { backgroundColor: "transparent", borderColor: t.border, borderWidth: 1, shadowOpacity: 0, elevation: 0, marginTop: 10 },
    ctaSecondaryText: { color: t.text, fontWeight: "700", fontSize: 15 },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
    back: { color: t.faint, textAlign: "center", marginTop: 14, fontSize: 14 },
    realTestGrid: { flexDirection: "row", gap: 12, marginTop: 16 },
    rtCard: { flex: 1, backgroundColor: t.card, borderWidth: 1, borderRadius: 20, padding: 16 },
    rtBody: { color: t.dim, fontSize: 12, lineHeight: 20, marginTop: 8 },
    disclaimer: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 18, textAlign: "center" },
    webHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    webBrandLogo: { width: 26, height: 26, borderRadius: 8 },
    webBrandX: { color: t.faint, fontSize: 13, fontWeight: "700" },
    webTitle: { color: t.text, fontWeight: "600" },
    webSub: { color: t.warn, fontSize: 11, marginTop: 2 },
    close: { color: t.accentText, fontWeight: "600" },
    webErrWrap: { padding: 20 },
    diagStrip: { maxHeight: 160, backgroundColor: "#12060A", borderTopColor: "#5A2430", borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
    diagText: { color: "#FF9AA8", fontSize: 10, fontFamily: "Courier", lineHeight: 15 },
    webLoading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 10 },
  });
