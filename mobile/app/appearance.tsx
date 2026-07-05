import { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useTheme, ACCENT_PRESETS, isValidHex, type Theme, type ThemeMode,
} from "@/lib/theme";

/**
 * APPEARANCE — it's the user's app, so it wears their colors.
 * Light/dark toggle + any accent color (presets or a custom hex). Every
 * accent-driven surface in the app updates instantly and the choice persists.
 */
export default function Appearance() {
  const { theme: t, mode, accent, setMode, setAccent } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [hex, setHex] = useState(accent);

  const applyHex = (v: string) => {
    const clean = v.startsWith("#") ? v : `#${v}`;
    setHex(clean);
    if (isValidHex(clean)) setAccent(clean);
  };

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.h1}>Make it yours</Text>
        <Text style={styles.sub}>Your app, your colors. Everything updates instantly.</Text>

        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.segment}>
          {(["light", "dark"] as ThemeMode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.segmentBtn, mode === m && styles.segmentOn]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.segmentText, mode === m && styles.segmentTextOn]}>
                {m === "light" ? "☀️  Light" : "🌙  Dark"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Accent color</Text>
        <View style={styles.swatches}>
          {ACCENT_PRESETS.map((p) => (
            <TouchableOpacity
              key={p.hex}
              style={[styles.swatchWrap, accent.toLowerCase() === p.hex.toLowerCase() && styles.swatchOn]}
              onPress={() => { setAccent(p.hex); setHex(p.hex); }}
            >
              <View style={[styles.swatch, { backgroundColor: p.hex }]} />
              <Text style={styles.swatchName}>{p.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Custom color</Text>
        <View style={styles.hexRow}>
          <View style={[styles.hexPreview, { backgroundColor: isValidHex(hex) ? hex : t.border }]} />
          <TextInput
            style={styles.hexInput}
            value={hex}
            onChangeText={applyHex}
            placeholder="#22A95C"
            placeholderTextColor={t.faint}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={7}
          />
        </View>
        <Text style={styles.hint}>Paste any hex color — the whole app follows it.</Text>

        <Text style={styles.sectionTitle}>Preview</Text>
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>Your route</Text>
          <Text style={styles.previewAccent}>Best price found — {`~2s settlement`}</Text>
          <View style={styles.previewTintCard}>
            <Text style={styles.previewTintText}>Selected · tinted with your color</Text>
          </View>
          <TouchableOpacity style={styles.previewBtn}>
            <Text style={styles.previewBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48 },
    h1: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
    sub: { color: t.dim, fontSize: 14, marginTop: 4 },
    sectionTitle: { color: t.text, fontSize: 16, fontWeight: "700", marginTop: 24, marginBottom: 10 },
    segment: { flexDirection: "row", backgroundColor: t.surface, borderRadius: 14, padding: 4, gap: 4 },
    segmentBtn: { flex: 1, borderRadius: 11, paddingVertical: 12, alignItems: "center" },
    segmentOn: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1 },
    segmentText: { color: t.dim, fontWeight: "600", fontSize: 14 },
    segmentTextOn: { color: t.text },
    swatches: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    swatchWrap: { alignItems: "center", gap: 6, padding: 8, borderRadius: 14, borderWidth: 2, borderColor: "transparent", width: 76 },
    swatchOn: { borderColor: t.accent },
    swatch: { width: 40, height: 40, borderRadius: 20 },
    swatchName: { color: t.dim, fontSize: 10, textAlign: "center" },
    hexRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    hexPreview: { width: 44, height: 44, borderRadius: 12, borderColor: t.border, borderWidth: 1 },
    hexInput: { flex: 1, backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: t.text, fontSize: 16, letterSpacing: 1 },
    hint: { color: t.faint, fontSize: 12, marginTop: 8 },
    previewCard: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 16 },
    previewTitle: { color: t.text, fontSize: 16, fontWeight: "700" },
    previewAccent: { color: t.accentText, fontSize: 13, fontWeight: "600", marginTop: 4 },
    previewTintCard: { backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
    previewTintText: { color: t.text, fontSize: 13 },
    previewBtn: { backgroundColor: t.button, borderRadius: 999, paddingVertical: 13, alignItems: "center", marginTop: 12 },
    previewBtnText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
  });
