import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { RailConversionPlan } from "@/lib/api";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * UVCE PANEL — the Universal Value Conversion Engine working WITH HQ,
 * live on screen. Renders the HQ↔UVCE directive exchange as a typing feed,
 * then the normalized uvce.v1 object, the sourced liquidity venues with the
 * winner HQ approved, the forecast window, and the normalized fee stack.
 *
 * Honesty: the plan is stamped `estimates: true` — every number here is a
 * deterministic planning estimate, labeled as such. Simulated venues.
 */

const UVCE_VIOLET = "#9D8CFF";
const money = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function UvcePanel({ plan, onLive }: { plan: RailConversionPlan; onLive?: (done: boolean) => void }) {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [shown, setShown] = useState(0);
  const done = shown >= plan.directives.length;

  // Reveal the HQ↔UVCE exchange one directive at a time.
  useEffect(() => {
    setShown(0);
    const id = setInterval(() => {
      setShown((n) => {
        if (n >= plan.directives.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, 650);
    return () => clearInterval(id);
  }, [plan]);

  useEffect(() => {
    onLive?.(done);
  }, [done, onLive]);

  const winner = plan.venues.find((v) => v.selected);

  return (
    <View>
      {/* ——— HQ ↔ UVCE governance feed ——— */}
      <View style={styles.feed}>
        <View style={styles.feedHead}>
          <Text style={styles.feedTitle}>HQ ⇄ UVCE</Text>
          <Text style={styles.feedTag}>GOVERNED CONVERSION · ESTIMATES</Text>
        </View>
        {plan.directives.slice(0, Math.max(shown, 1)).map((d) => (
          <DirectiveRow key={d.seq} styles={styles} t={t} from={d.from} note={d.note} />
        ))}
        {!done && <Cursor color={UVCE_VIOLET} />}
      </View>

      {done && (
        <>
          {/* ——— Normalized settlement object ——— */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>Settlement-ready object</Text>
              <Text style={[styles.pill, { color: UVCE_VIOLET, borderColor: rgba(UVCE_VIOLET, 0.4) }]}>
                {plan.normalized.schema}
              </Text>
            </View>
            <Text style={styles.mono}>
              in&nbsp;&nbsp; {plan.normalized.valueIn.form.replace("_", " ")} · {money(plan.normalized.valueIn.amountUsd)} · {plan.normalized.valueIn.via}
            </Text>
            <Text style={styles.mono}>
              out&nbsp; {plan.normalized.valueOut.asset} on {plan.normalized.valueOut.chain}
            </Text>
            <Text style={styles.mono}>hold {"—"} non-custodial · UVCE keeps nothing</Text>
          </View>

          {/* ——— Sourced liquidity venues ——— */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Liquidity venues UVCE sourced</Text>
            <Text style={styles.dimSmall}>Simulated venues · scored under HQ&apos;s weights</Text>
            {plan.venues.map((v) => (
              <View key={v.venueId} style={styles.venueRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowStart}>
                    {v.selected && <Feather name="check-circle" size={13} color={t.accentText} style={{ marginRight: 5 }} />}
                    <Text style={[styles.venueLabel, v.selected && { color: t.text, fontWeight: "800" }]}>
                      {v.label}
                    </Text>
                  </View>
                  <Text style={styles.dimSmall}>
                    {v.slippageBps} bps slip · depth {v.depth.toFixed(2)} · vol {v.volatilityBps} bps
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, v.score)}%` as `${number}%`,
                          backgroundColor: v.selected ? t.accent : rgba(UVCE_VIOLET, 0.55),
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.venueScore, v.selected && { color: t.accentText }]}>{v.score.toFixed(1)}</Text>
              </View>
            ))}
            {winner && (
              <Text style={styles.approved}>
                HQ approved {winner.label}
                {plan.program.deferral === "brief" ? ` · swap leg deferred ${plan.forecast.deferMs} ms` : " · execute now"}
              </Text>
            )}
          </View>

          {/* ——— Forecast window ——— */}
          <LinearGradient
            colors={[rgba(UVCE_VIOLET, 0.14), "rgba(255,255,255,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.forecast}
          >
            <Text style={[styles.feedTag, { color: UVCE_VIOLET }]}>FORECASTING LAYER · ESTIMATE</Text>
            <Text style={styles.forecastLine}>{plan.forecast.summary}</Text>
            <Text style={styles.dimSmall}>
              drift {plan.forecast.driftBps >= 0 ? "+" : ""}{plan.forecast.driftBps} bps · liquidity {plan.forecast.liquidityOutlook} · confidence {Math.round(plan.forecast.confidence * 100)}%
            </Text>
          </LinearGradient>

          {/* ——— Normalized fee stack ——— */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Every fee, normalized</Text>
            <FeeRow styles={styles} label="Loadit · 0.75% ($1 min)" value={money(plan.fees.loaditFeeUsd)} />
            <FeeRow
              styles={styles}
              label={plan.fees.swapFeeUsd > 0 ? "HQ swap · 0.25%" : "HQ swap · none (stable target)"}
              value={money(plan.fees.swapFeeUsd)}
            />
            <FeeRow styles={styles} label="Venue cost (est.)" value={money(plan.fees.venueCostUsd)} />
            <FeeRow styles={styles} label="Network (est.)" value={money(plan.fees.networkFeeUsd)} />
            <View style={styles.feeTotal}>
              <Text style={styles.feeTotalLabel}>All-in estimate</Text>
              <Text style={styles.feeTotalValue}>
                {money(plan.fees.totalUsd)} · {plan.fees.totalPct.toFixed(2)}%
              </Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function DirectiveRow({ styles, t, from, note }: {
  styles: ReturnType<typeof makeStyles>; t: Theme; from: "HQ" | "UVCE"; note: string;
}) {
  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [slide]);
  const hq = from === "HQ";
  return (
    <Animated.View
      style={[
        styles.dirRow,
        { opacity: slide, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] },
      ]}
    >
      <Text style={[styles.dirFrom, { color: hq ? t.accentText : UVCE_VIOLET }]}>{from}</Text>
      <Text style={styles.dirNote}>{note}</Text>
    </Animated.View>
  );
}

function Cursor({ color }: { color: string }) {
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.15, duration: 420, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 420, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink]);
  return <Animated.View style={{ width: 8, height: 14, marginLeft: 44, marginTop: 4, backgroundColor: color, opacity: blink }} />;
}

function FeeRow({ styles, label, value }: {
  styles: ReturnType<typeof makeStyles>; label: string; value: string;
}) {
  return (
    <View style={styles.feeRow}>
      <Text style={styles.feeLabel}>{label}</Text>
      <Text style={styles.feeValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    feed: {
      marginTop: 14, backgroundColor: t.mode === "dark" ? "rgba(0,0,0,0.35)" : "#0B0D12",
      borderColor: rgba(UVCE_VIOLET, 0.25), borderWidth: 1, borderRadius: 22, padding: 16,
    },
    feedHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    feedTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800", letterSpacing: 0.4 },
    feedTag: { color: rgba("#FFFFFF", 0.45), fontSize: 9, fontWeight: "800", letterSpacing: 1.4 },
    dirRow: { flexDirection: "row", gap: 8, marginTop: 8, alignItems: "flex-start" },
    dirFrom: { width: 36, fontSize: 11, fontWeight: "800", fontFamily: "Courier", marginTop: 1 },
    dirNote: { flex: 1, color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 17, fontFamily: "Courier" },
    card: { marginTop: 12, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 22, padding: 16 },
    cardTitle: { color: t.text, fontSize: 15, fontWeight: "800", letterSpacing: -0.3 },
    pill: { fontSize: 10, fontWeight: "800", letterSpacing: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden" },
    rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    rowStart: { flexDirection: "row", alignItems: "center" },
    mono: { color: t.dim, fontSize: 12, fontFamily: "Courier", marginTop: 7, lineHeight: 17 },
    dimSmall: { color: t.faint, fontSize: 11, marginTop: 3 },
    venueRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
    venueLabel: { color: t.dim, fontSize: 13, fontWeight: "600" },
    venueScore: { color: t.faint, fontSize: 15, fontWeight: "800", width: 42, textAlign: "right" },
    barTrack: { height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 6, overflow: "hidden" },
    barFill: { height: 4, borderRadius: 2 },
    approved: { color: t.accentText, fontSize: 12, fontWeight: "700", marginTop: 14 },
    forecast: { marginTop: 12, borderRadius: 22, padding: 16, borderColor: rgba(UVCE_VIOLET, 0.3), borderWidth: 1 },
    forecastLine: { color: t.text, fontSize: 14, fontWeight: "700", lineHeight: 20, marginTop: 8 },
    feeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    feeLabel: { color: t.dim, fontSize: 13 },
    feeValue: { color: t.text, fontSize: 13, fontWeight: "700" },
    feeTotal: {
      flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12,
      borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth,
    },
    feeTotalLabel: { color: t.text, fontSize: 13, fontWeight: "800" },
    feeTotalValue: { color: t.text, fontSize: 15, fontWeight: "800" },
  });
