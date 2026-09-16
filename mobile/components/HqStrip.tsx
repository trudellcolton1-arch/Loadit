import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTheme, rgba, type Theme } from "@/lib/theme";

/**
 * HQ STRIP — HQ's live presence on the machine.
 *
 * HQ is the one intelligence running the rail; this strip is him narrating
 * what he is doing RIGHT NOW on every beat of the walk — scoring doors,
 * handing to the UVCE, watching the door, executing UVCE's plan, healing.
 * The line is driven by real machine state passed in from the walk, never
 * by a timer pretending to be progress.
 */

export function HqStrip({ line, working }: { line: string; working?: boolean }) {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const pulse = useRef(new Animated.Value(1)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [shown, setShown] = useState(line);

  // Breathing dot — faster while HQ is actively working.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: working ? 380 : 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: working ? 380 : 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, working]);

  // Cross-fade when HQ's line changes.
  useEffect(() => {
    if (line === shown) return;
    Animated.timing(fade, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setShown(line);
      Animated.timing(fade, { toValue: 1, duration: 190, useNativeDriver: true }).start();
    });
  }, [line, shown, fade]);

  return (
    <View style={styles.strip}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={styles.who}>HQ</Text>
      <Animated.Text style={[styles.line, { opacity: fade }]} numberOfLines={2}>
        {shown}
      </Animated.Text>
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    strip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: rgba(t.accent, 0.25),
      backgroundColor: t.accentSoft,
      paddingHorizontal: 12,
      paddingVertical: 9,
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent },
    who: { color: t.accentText, fontSize: 11, fontWeight: "800", letterSpacing: 1, fontFamily: "Courier" },
    line: { flex: 1, color: t.text, fontSize: 12.5, lineHeight: 17, fontWeight: "600" },
  });
