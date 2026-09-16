import { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme, type Theme } from "@/lib/theme";

const NODES = [
  { id: "intake", label: "Intake" },
  { id: "uvce", label: "UVCE" },
  { id: "door", label: "Door" },
  { id: "settle", label: "Settle" },
] as const;

/** Living four-beat rail — pulse travels toward the active node. */
export function RailPath({ active }: { active: number }) {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.row}>
      {NODES.map((n, i) => {
        const on = i <= active;
        const here = i === active;
        return (
          <View key={n.id} style={styles.col}>
            <View style={styles.nodeRow}>
              {i > 0 && <View style={[styles.line, on && { backgroundColor: t.accent }]} />}
              <Animated.View
                style={[
                  styles.dot,
                  on && { backgroundColor: t.accent, borderColor: t.accent },
                  here && { transform: [{ scale: pulse.interpolate({ inputRange: [0.35, 1], outputRange: [1, 1.18] }) }] },
                ]}
              />
              {i < NODES.length - 1 && <View style={[styles.line, i < active && { backgroundColor: t.accent }]} />}
            </View>
            <Text style={[styles.label, on && { color: t.text }]}>{n.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "flex-start" },
    col: { flex: 1, alignItems: "center" },
    nodeRow: { flexDirection: "row", alignItems: "center", alignSelf: "stretch", height: 22 },
    line: { flex: 1, height: 2, backgroundColor: t.border },
    dot: {
      width: 14, height: 14, borderRadius: 7, borderWidth: 2,
      borderColor: t.border, backgroundColor: t.bg,
    },
    label: { color: t.faint, fontSize: 11, fontWeight: "700", marginTop: 8, letterSpacing: -0.2 },
  });

export function pathIndexForWalk(walk: string): number {
  switch (walk) {
    case "story":
    case "intent":
    case "quote":
      return 0;
    case "uvce":
      return 1;
    case "door":
      return 2;
    case "progress":
    case "outcome":
    case "heal":
      return 3;
    default:
      return 0;
  }
}