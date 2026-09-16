import { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView,
  StyleSheet, Image, Platform, Linking, Animated, KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { canSeeRailPoc, isRailOwner } from "@/lib/config";
import {
  getMyHandle, railAction, startMgSandboxDeposit, getMgSandboxStatus,
  type RailPayment, type RailResponse, type MgSandboxStatus,
} from "@/lib/api";
import {
  RAIL_STORY, CERT_LINE, loaditFeeUsd, playgroundStatusLabel, walletForAsset,
} from "@/lib/railPoc";
import { HonestyPills } from "@/components/HonestyPills";
import { UvcePanel } from "@/components/UvcePanel";
import { RailPath, pathIndexForWalk } from "@/components/RailPath";
import { MgPlaygroundWeb } from "@/components/MgPlaygroundWeb";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * RAIL POC — the one machine, owner only. Product demo lives here, not /rail web.
 * Walk: story → intent → quote → MoneyGram playground door → state machine →
 * heal theater → honest outcome. Cert approved (4/5). Cash-in is not live.
 */

const ASSETS = ["BTC", "SOL", "ETH", "USDC"] as const;
const AMOUNTS = [50, 150, 500] as const;
const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

type Walk = "story" | "intent" | "quote" | "uvce" | "door" | "progress" | "heal" | "outcome";

const STATE_ORDER: RailPayment["state"][] = [
  "quoted", "intake_pending", "intake_confirmed", "converting", "paying_out", "settled",
];
const STATE_LABEL: Record<RailPayment["state"], string> = {
  quoted: "Quoted",
  intake_pending: "Intake pending",
  intake_confirmed: "Intake confirmed",
  converting: "Converting",
  paying_out: "Paying out",
  settled: "Settled",
  failed: "Failed",
  healing: "Healing",
};

export default function RailPoc() {
  const { session, ready, hylaqStatus } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const fade = useRef(new Animated.Value(1)).current;

  const [walk, setWalkRaw] = useState<Walk>("story");
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDC");
  const [amount, setAmount] = useState(150);
  const [wallet, setWallet] = useState("");
  const [payment, setPayment] = useState<RailPayment | null>(null);
  const [sim, setSim] = useState<RailPayment | null>(null);
  const [meta, setMeta] = useState<RailResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [healLine, setHealLine] = useState<string | null>(null);
  const [mgUrl, setMgUrl] = useState<string | null>(null);
  const [mgId, setMgId] = useState<string | null>(null);
  const [mgErr, setMgErr] = useState<string | null>(null);
  const [showWeb, setShowWeb] = useState(false);
  const [status, setStatus] = useState<MgSandboxStatus | null>(null);
  const [uvceDone, setUvceDone] = useState(false);
  const [, setTick] = useState(0);

  const setWalk = (next: Walk) => {
    Animated.sequence([
      Animated.timing(fade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setWalkRaw(next);
    setErr(null);
  };

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!session?.accessToken || session.kind !== "hylaq") return;
    getMyHandle(session.accessToken).then((r) => {
      if (r.ok && r.profile) setWallet((w) => w || walletForAsset(asset, r.profile!.addresses));
    }).catch(() => {});
  }, [session, asset]);

  useEffect(() => {
    if ((walk !== "progress" && walk !== "outcome") || !mgId) return;
    let live = true;
    const tick = async () => {
      try {
        const s = await getMgSandboxStatus(mgId, session?.accessToken);
        if (live && s.ok) setStatus(s);
      } catch { /* keep last */ }
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => { live = false; clearInterval(id); };
  }, [walk, mgId, session?.accessToken]);

  if (ready && !session) return <Redirect href="/login" />;
  if (ready && session && hylaqStatus === "checking" && session.kind === "hylaq" && isRailOwner(session.email)) {
    return (
      <SafeAreaView style={styles.wrap} edges={["bottom"]}>
        <View style={styles.centerBox}>
          <ActivityIndicator color={t.accentText} />
          <Text style={styles.dim}>Verifying your Hylaq session…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (ready && session && !canSeeRailPoc(session.email, session.kind, hylaqStatus)) {
    return <Redirect href="/" />;
  }

  const act = async (
    body: Parameters<typeof railAction>[1],
    target: "live" | "sim" = "live"
  ): Promise<RailResponse | null> => {
    setBusy(true);
    try {
      const r = await railAction(session?.accessToken, body);
      if (r.payment) {
        if (target === "sim") setSim(r.payment);
        else setPayment(r.payment);
      }
      setMeta(r);
      if (!r.ok && r.status !== 409) {
        if (r.status === 401 || r.status === 403) setErr("This account is not authorized for the rail.");
        else if (r.reason !== "certification_gate") setErr(r.message || "That didn't work — try again.");
      }
      return r;
    } catch {
      setErr("Couldn't reach the backend — check your connection.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const lockQuote = async () => {
    const dest = wallet.trim();
    if (!dest) {
      setErr("Paste a wallet you control. Crypto lands there — Loadit never holds it.");
      return;
    }
    setWalkRaw("quote");
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const r = await act({
      action: "create",
      mode: "live",
      intent: { amountUsd: amount, outcome: { asset, wallet: dest } },
    });
    if (!r?.ok) setWalkRaw("intent");
  };

  const openDoor = async () => {
    if (!payment) return;
    const r = await act({ action: "intake", mode: "live", paymentId: payment.id });
    if (r?.ok) setWalk("door");
  };

  const openPlayground = async () => {
    setBusy(true);
    setMgErr(null);
    try {
      const r = await startMgSandboxDeposit(amount, session?.accessToken);
      if (r.ok && r.url && r.id) {
        setMgId(r.id);
        setMgUrl(r.url);
        setShowWeb(false);
      } else if (r.reason === "not_rail_owner" || r.reason === "missing_token" || r.reason === "unverified_token") {
        setMgErr("This account is not authorized for the playground.");
      } else {
        setMgErr(r.reason === "not_configured"
          ? "The playground wallet isn't configured on the backend yet."
          : "MoneyGram's playground didn't respond — try again.");
      }
    } catch {
      setMgErr("Couldn't reach the playground — try again.");
    } finally {
      setBusy(false);
    }
  };

  const watchHeal = async () => {
    const dest = wallet.trim() || "wallet-you-control";
    setWalk("heal");
    setHealLine("Locking a simulated quote…");
    const created = await act({
      action: "create",
      mode: "sim",
      intent: { amountUsd: amount, outcome: { asset, wallet: dest } },
    }, "sim");
    if (!created?.ok || !created.payment) {
      setHealLine("Couldn't start the simulated machine.");
      return;
    }
    const id = created.payment.id;
    setHealLine("Opening intake…");
    await act({ action: "intake", mode: "sim", paymentId: id }, "sim");
    setHealLine("Simulated cash confirmed…");
    await act({ action: "confirm", mode: "sim", paymentId: id }, "sim");
    setHealLine("Killing the payout pipe…");
    await act({ action: "kill_pipe", mode: "sim", paymentId: id, pipe: "payout" }, "sim");
    setHealLine("Settle failed — self-heal, same payment id…");
    await act({ action: "settle", mode: "sim", paymentId: id }, "sim");
    await act({ action: "heal", mode: "sim", paymentId: id }, "sim");
    setHealLine("Healed. Paying out exactly once…");
    await act({ action: "settle", mode: "sim", paymentId: id }, "sim");
    setHealLine("Settled. Same payment id. One payout. Simulated money only.");
  };

  const reset = () => {
    setWalk("story");
    setPayment(null);
    setSim(null);
    setMeta(null);
    setHealLine(null);
    setMgUrl(null);
    setMgId(null);
    setMgErr(null);
    setStatus(null);
    setShowWeb(false);
    setUvceDone(false);
  };

  if (showWeb && mgUrl) {
    return <MgPlaygroundWeb url={mgUrl} onDone={() => { setShowWeb(false); setWalk("progress"); }} />;
  }

  const fee = payment?.quote.loaditFeeUsd ?? loaditFeeUsd(amount);
  const ttlLeft = payment ? Math.max(0, Math.ceil((payment.quote.expiresAt - Date.now()) / 1000)) : 0;
  const machine = walk === "heal" ? sim : payment;

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.head}>
          <Text style={styles.kicker}>UNIFIED FINANCIAL RAIL</Text>
          <Text style={styles.h1}>The machine</Text>
          <HonestyPills owner playground={walk !== "story"} />
          {walk !== "story" && (
            <View style={{ marginTop: 18 }}>
              <RailPath active={pathIndexForWalk(walk)} />
            </View>
          )}
        </View>

        <Animated.View style={{ flex: 1, opacity: fade }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            {walk === "story" && (
              <>
                <Text style={styles.lede}>
                  Intake → UVCE → door → settle. One payment id. Patent pending.
                  {` ${CERT_LINE}.`} Not live cash-in.
                </Text>
                {RAIL_STORY.map((beat) => (
                  <View key={beat.n} style={styles.storyRow}>
                    <View style={styles.storyNum}><Text style={styles.storyNumText}>{beat.n}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.storyTitle}>{beat.title}</Text>
                      <Text style={styles.storyDetail}>{beat.detail}</Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {walk === "intent" && (
              <>
                <Text style={styles.lede}>
                  What should arrive, and where. HQ picks the door. Non-custodial — it lands in a wallet you control.
                </Text>
                <Text style={styles.label}>You want</Text>
                <View style={styles.row}>
                  {ASSETS.map((a) => (
                    <TouchableOpacity key={a} style={[styles.chip, asset === a && styles.chipOn]} onPress={() => setAsset(a)}>
                      <Text style={[styles.chipText, asset === a && styles.chipTextOn]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Cash in (USD)</Text>
                <View style={styles.row}>
                  {AMOUNTS.map((v) => (
                    <TouchableOpacity key={v} style={[styles.chip, amount === v && styles.chipOn]} onPress={() => setAmount(v)}>
                      <Text style={[styles.chipText, amount === v && styles.chipTextOn]}>${v}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.label}>Your wallet</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Paste an address you control"
                  placeholderTextColor={t.faint}
                  value={wallet}
                  onChangeText={setWallet}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.feeRow}>
                  <Text style={styles.dim}>Loadit fee · 0.75%, $1 min</Text>
                  <Text style={styles.feeVal}>{money(loaditFeeUsd(amount))}</Text>
                </View>
              </>
            )}

            {walk === "quote" && (
              <>
                {busy && !payment && (
                  <View style={styles.centerBox}>
                    <ActivityIndicator color={t.accentText} />
                    <Text style={styles.dim}>HQ is scoring doors…</Text>
                  </View>
                )}
                {payment && (
                  <QuotePanel styles={styles} t={t} payment={payment} fee={fee} ttlLeft={ttlLeft} />
                )}
              </>
            )}

            {walk === "uvce" && payment && (
              <>
                <Text style={styles.lede}>
                  HQ hands the locked quote to the UVCE — the Universal Value Conversion Engine.
                  Watch them work: venues sourced, the window forecast, every fee normalized,
                  one settlement-ready object back to HQ. Estimates only; nothing executes yet.
                </Text>
                {payment.quote.route.conversion ? (
                  <UvcePanel plan={payment.quote.route.conversion} onLive={setUvceDone} />
                ) : (
                  <Text style={styles.dim}>This quote predates the UVCE — lock a fresh one to see the plan.</Text>
                )}
              </>
            )}

            {walk === "door" && payment && (
              <>
                <View style={styles.card}>
                  <View style={styles.mgHead}>
                    <Image source={require("../assets/moneygram-logo.jpg")} style={styles.mgLogo} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cardTitle}>MoneyGram door</Text>
                      <Text style={styles.cert}>{CERT_LINE}</Text>
                    </View>
                  </View>
                  <Text style={styles.body}>
                    {payment.intake?.instructions ||
                      "Door one. Final go-live is pending, so the walk continues in MoneyGram's official playground — real SEP-24 rails, test money."}
                  </Text>
                  <Text style={styles.mono}>
                    ref {payment.intake?.internalRef || "—"} · partner tx {payment.intake?.partnerTxId ?? "none (never invented)"}
                  </Text>
                </View>
                {mgUrl && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Playground deposit ready</Text>
                    <Text style={styles.dim}>SEP-24 · {mgId}</Text>
                    <Text style={[styles.body, { marginTop: 8 }]}>
                      {Platform.OS === "android"
                        ? "Complete it in-app. Status updates from their test anchor."
                        : "Their hosted page is most reliable on Chromium. Open it, then come back here."}
                    </Text>
                  </View>
                )}
                {mgErr ? <Text style={styles.err}>{mgErr}</Text> : null}
              </>
            )}

            {walk === "progress" && (
              <>
                {machine && <Timeline styles={styles} t={t} payment={machine} />}
                <LinearGradient
                  colors={[rgba(t.accent, 0.12), "rgba(255,255,255,0.03)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
                  style={styles.hero}
                >
                  <Text style={styles.tag}>PLAYGROUND STATUS</Text>
                  <Text style={styles.heroTitle}>{playgroundStatusLabel(status?.status)}</Text>
                  <Text style={styles.dim}>
                    {status?.status || "…"}
                    {status?.amountIn ? ` · in ${status.amountIn}` : ""}
                    {status?.amountOut ? ` · out ${status.amountOut}` : ""}
                  </Text>
                  {mgId ? <Text style={styles.mono}>SEP-24 {mgId}</Text> : null}
                </LinearGradient>
                <Text style={styles.cert}>{CERT_LINE}. The live door still refuses a real cash confirm.</Text>
              </>
            )}

            {walk === "heal" && (
              <>
                <Text style={styles.lede}>
                  Simulated money only. A pipe dies mid-payout. The machine heals under the same payment id and pays once.
                </Text>
                <Text style={styles.healLine}>{healLine}</Text>
                {sim && <Timeline styles={styles} t={t} payment={sim} />}
                {sim?.receipt && (
                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Delivered · once</Text>
                    <Text style={styles.body}>
                      {money(sim.receipt.amountUsd)} → {sim.receipt.deliveredTo}
                      {sim.receipt.replayed ? " · receipt replayed (idempotent)" : ""}
                    </Text>
                    <Text style={styles.mono}>
                      {sim.id} · {sim.healCount} heal{sim.healCount === 1 ? "" : "s"}
                    </Text>
                  </View>
                )}
              </>
            )}

            {walk === "outcome" && (
              <>
                <LinearGradient
                  colors={[rgba(t.accent, 0.16), "rgba(255,255,255,0.03)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
                  style={styles.hero}
                >
                  <Text style={styles.tag}>
                    {status?.status === "completed" ? "PLAYGROUND COMPLETE" : "POC OUTCOME"}
                  </Text>
                  <Text style={styles.heroTitle}>
                    {status?.status === "completed"
                      ? "Test USDC moved on Stellar testnet"
                      : "You walked the machine"}
                  </Text>
                  <Text style={styles.body}>
                    {CERT_LINE}. Nothing here is customer cash. Crypto, when it moves, lands in a wallet you control.
                  </Text>
                  {payment ? <Text style={styles.mono}>{payment.id} → {payment.intent.outcome.wallet}</Text> : null}
                </LinearGradient>
                <View style={styles.split}>
                  <View style={[styles.splitCard, { borderColor: rgba(t.accent, 0.25) }]}>
                    <Text style={[styles.tag, { color: t.accentText }]}>REAL</Text>
                    <Text style={styles.splitBody}>State machine{"\n"}HQ quote + 0.75% fee{"\n"}Owner Hylaq gate{"\n"}Live-cash confirm refused</Text>
                  </View>
                  <View style={[styles.splitCard, { borderColor: rgba(t.warn, 0.3) }]}>
                    <Text style={[styles.tag, { color: t.warn }]}>PLAYGROUND</Text>
                    <Text style={styles.splitBody}>MoneyGram SEP-24{"\n"}Stellar testnet{"\n"}Test USDC{"\n"}Self-heal (simulated)</Text>
                  </View>
                </View>
                {machine && <Timeline styles={styles} t={t} payment={machine} />}
              </>
            )}

            {err ? <Text style={styles.err}>{err}</Text> : null}
            {meta?.notice ? <Text style={styles.foot}>{meta.notice}</Text> : null}
            <Text style={styles.foot}>
              Owner-only. Patent pending — not patented. {CERT_LINE}. Loadit never holds your keys.
            </Text>
          </ScrollView>
        </Animated.View>

        <View style={styles.footer}>
          {walk === "story" && (
            <Cta styles={styles} label="Begin" onPress={() => setWalk("intent")} />
          )}
          {walk === "intent" && (
            <Cta styles={styles} label="Lock quote" busy={busy} onPress={lockQuote} />
          )}
          {walk === "quote" && payment && (
            <Cta styles={styles} label="Hand to UVCE" onPress={() => { setUvceDone(false); setWalk("uvce"); }} />
          )}
          {walk === "uvce" && payment && (
            <Cta
              styles={styles}
              label={uvceDone ? "HQ approved — open the MoneyGram door" : "HQ ⇄ UVCE working…"}
              busy={busy || !uvceDone}
              onPress={openDoor}
            />
          )}
          {walk === "door" && (
            <>
              {!mgUrl ? (
                <Cta styles={styles} label="Start MoneyGram playground" busy={busy} onPress={openPlayground} />
              ) : Platform.OS === "android" ? (
                <Cta styles={styles} label="Continue in app" onPress={() => setShowWeb(true)} />
              ) : (
                <Cta styles={styles} label="Open playground" onPress={() => mgUrl && Linking.openURL(mgUrl)} />
              )}
              {mgUrl ? (
                <TouchableOpacity style={styles.ghost} onPress={() => setWalk("progress")}>
                  <Text style={styles.ghostText}>I&apos;ve finished — show the machine</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
          {walk === "progress" && (
            <>
              {mgUrl ? (
                <TouchableOpacity onPress={() => Linking.openURL(mgUrl)}>
                  <Text style={styles.link}>Reopen playground</Text>
                </TouchableOpacity>
              ) : null}
              <Cta styles={styles} label="Watch self-heal" busy={busy} onPress={watchHeal} />
              <TouchableOpacity style={styles.ghost} onPress={() => setWalk("outcome")}>
                <Text style={styles.ghostText}>Skip to outcome</Text>
              </TouchableOpacity>
            </>
          )}
          {walk === "heal" && (
            <Cta styles={styles} label="See honest outcome" onPress={() => setWalk("outcome")} />
          )}
          {walk === "outcome" && (
            <Cta styles={styles} label="Run it again" onPress={reset} />
          )}
          {walk !== "story" && walk !== "outcome" && (
            <TouchableOpacity onPress={() => {
              if (walk === "intent") setWalk("story");
              else if (walk === "quote") setWalk("intent");
              else if (walk === "uvce") setWalk("quote");
              else if (walk === "door") setWalk("uvce");
              else if (walk === "progress") setWalk("door");
              else if (walk === "heal") setWalk("progress");
            }}>
              <Text style={styles.back}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Cta({ styles, label, onPress, busy }: {
  styles: ReturnType<typeof makeStyles>; label: string; onPress: () => void; busy?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.cta} onPress={onPress} disabled={busy}>
      {busy ? <ActivityIndicator color={styles.ctaText.color} /> : (
        <>
          <Text style={styles.ctaText}>{label}</Text>
          <Feather name="arrow-right" size={16} color={styles.ctaText.color} />
        </>
      )}
    </TouchableOpacity>
  );
}

function QuotePanel({ styles, t, payment, fee, ttlLeft }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; payment: RailPayment; fee: number; ttlLeft: number;
}) {
  return (
    <LinearGradient
      colors={[rgba(t.accent, 0.16), "rgba(255,255,255,0.03)"]}
      start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.quoteTop}>
        <Text style={styles.tag}>LOCKED QUOTE</Text>
        <Text style={[styles.ttl, ttlLeft <= 15 && { color: t.warn }]}>{ttlLeft}s</Text>
      </View>
      <Text style={styles.heroTitle}>{payment.quote.route.doorLabel}</Text>
      <Text style={styles.bigFee}>{money(fee)}</Text>
      <Text style={styles.dim}>Loadit fee · 0.75% · $1 minimum</Text>
      <Text style={styles.body}>
        {money(payment.intent.amountUsd)} in → {payment.intent.outcome.asset} out
      </Text>
      <Text style={styles.dim}>{payment.quote.route.legs.map((l) => l.detail).join(" → ")}</Text>
      <Text style={styles.cert}>{CERT_LINE}. This door cannot confirm real cash yet.</Text>
      <Text style={styles.mono}>{payment.id} → {payment.intent.outcome.wallet}</Text>
    </LinearGradient>
  );
}

function Timeline({ styles, t, payment }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; payment: RailPayment;
}) {
  const passed = new Set(payment.history.map((h) => h.to));
  const extra = payment.state === "failed" || payment.state === "healing" ? [payment.state] : [];
  return (
    <View style={styles.timeline}>
      {[...STATE_ORDER, ...extra].map((s, i, arr) => {
        const on = passed.has(s) || payment.state === s;
        const here = payment.state === s;
        return (
          <View key={`${s}-${i}`} style={styles.tlRow}>
            <View style={styles.tlRail}>
              <View style={[styles.tlDot, on && { backgroundColor: here ? t.accent : t.dim }]} />
              {i < arr.length - 1 && <View style={[styles.tlLine, on && { backgroundColor: rgba(t.accent, 0.35) }]} />}
            </View>
            <Text style={[styles.tlLabel, here && { color: t.accentText, fontWeight: "800" }]}>
              {STATE_LABEL[s]}{s === "healing" && payment.healCount ? ` · ${payment.healCount}` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    head: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 4 },
    kicker: { color: t.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
    h1: { color: t.text, fontSize: 32, fontWeight: "800", letterSpacing: -1.2, marginTop: 4, marginBottom: 10 },
    scroll: { paddingHorizontal: 22, paddingBottom: 24 },
    lede: { color: t.dim, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 8 },
    storyRow: { flexDirection: "row", gap: 14, marginTop: 18, alignItems: "flex-start" },
    storyNum: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent,
      alignItems: "center", justifyContent: "center",
    },
    storyNumText: { color: t.onAccent, fontWeight: "800", fontSize: 12 },
    storyTitle: { color: t.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
    storyDetail: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 4 },
    label: { color: t.faint, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginTop: 18 },
    row: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
    chip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
    chipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    chipText: { color: t.dim, fontWeight: "600" },
    chipTextOn: { color: t.text },
    input: {
      marginTop: 10, backgroundColor: t.card, borderColor: t.border, borderWidth: 1,
      borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, color: t.text, fontSize: 15,
    },
    feeRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginTop: 14, paddingVertical: 12, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth,
    },
    feeVal: { color: t.text, fontSize: 17, fontWeight: "800" },
    dim: { color: t.dim, fontSize: 13, lineHeight: 18 },
    body: { color: t.text, fontSize: 15, lineHeight: 22, marginTop: 8 },
    cert: { color: "#E8453C", fontSize: 13, fontWeight: "600", marginTop: 10, lineHeight: 18 },
    mono: { color: t.faint, fontSize: 11, fontFamily: "Courier", marginTop: 8 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    card: { marginTop: 14, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 22, padding: 18 },
    cardTitle: { color: t.text, fontSize: 16, fontWeight: "800", letterSpacing: -0.3 },
    mgHead: { flexDirection: "row", alignItems: "center", gap: 12 },
    mgLogo: { width: 40, height: 40, borderRadius: 20 },
    hero: {
      marginTop: 14, borderRadius: 26, padding: 22,
      borderColor: rgba(t.accent, 0.28), borderWidth: 1, overflow: "hidden",
    },
    tag: { color: t.accentText, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
    heroTitle: { color: t.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.6, marginTop: 8 },
    bigFee: { color: t.text, fontSize: 42, fontWeight: "800", letterSpacing: -1.6, marginTop: 10 },
    quoteTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    ttl: { color: t.dim, fontSize: 13, fontWeight: "700" },
    healLine: { color: t.text, fontSize: 18, fontWeight: "700", letterSpacing: -0.3, marginTop: 12, lineHeight: 24 },
    split: { flexDirection: "row", gap: 10, marginTop: 14 },
    splitCard: { flex: 1, backgroundColor: t.card, borderWidth: 1, borderRadius: 20, padding: 14 },
    splitBody: { color: t.dim, fontSize: 12, lineHeight: 19, marginTop: 8 },
    timeline: { marginTop: 18 },
    tlRow: { flexDirection: "row", minHeight: 28 },
    tlRail: { width: 18, alignItems: "center" },
    tlDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.border, marginTop: 5 },
    tlLine: { width: 2, flex: 1, backgroundColor: t.border, marginTop: 3 },
    tlLabel: { color: t.dim, fontSize: 13, fontWeight: "600", paddingLeft: 8 },
    footer: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 10 },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16,
      shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 6,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 16 },
    ghost: { paddingVertical: 12, alignItems: "center" },
    ghostText: { color: t.text, fontWeight: "600", fontSize: 14 },
    link: { color: t.accentText, fontWeight: "700", textAlign: "center", marginBottom: 10 },
    back: { color: t.faint, textAlign: "center", marginTop: 6, fontSize: 14 },
    foot: { color: t.faint, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: "center" },
    centerBox: { alignItems: "center", justifyContent: "center", gap: 12, paddingVertical: 36 },
  });
