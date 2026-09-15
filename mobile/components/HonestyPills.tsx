import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, rgba, type Theme } from "@/lib/theme";
import { CERT_PILL, PATENT_PILL, PLAYGROUND_PILL, OWNER_PILL } from "@/lib/railPoc";

/** Compact honesty row — never screams "developer console". */
export function HonestyPills({
  owner,
  playground = true,
}: {
  owner?: boolean;
  playground?: boolean;
}) {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.row}>
      <View style={styles.pill}><Text style={styles.muted}>{PATENT_PILL}</Text></View>
      <View style={[styles.pill, styles.cert]}><Text style={styles.certText}>{CERT_PILL}</Text></View>
      {playground && <View style={[styles.pill, styles.play]}><Text style={styles.playText}>{PLAYGROUND_PILL}</Text></View>}
      {owner && <View style={[styles.pill, styles.owner]}><Text style={styles.ownerText}>{OWNER_PILL}</Text></View>}
    </View>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    pill: {
      borderColor: t.border, borderWidth: 1, borderRadius: 999,
      paddingHorizontal: 9, paddingVertical: 4, backgroundColor: t.card,
    },
    muted: { color: t.faint, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
    cert: { borderColor: rgba("#E8453C", 0.35), backgroundColor: rgba("#E8453C", 0.08) },
    certText: { color: "#E8453C", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
    play: { borderColor: rgba(t.warn, 0.35), backgroundColor: rgba(t.warn, 0.08) },
    playText: { color: t.warn, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
    owner: { borderColor: rgba(t.accent, 0.4), backgroundColor: t.accentSoft },
    ownerText: { color: t.accentText, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  });
