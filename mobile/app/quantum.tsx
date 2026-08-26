import { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Linking } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * QUANTUM — the pioneer page (loadit.net/quantum) inside the app: live QAOA
 * batch status, the collapse animation, and a live verifiable receipt. It's
 * our own site, so the in-app view IS the experience — no Safari bounce.
 */

const VIOLET = "#9D8CFF";
const URL = "https://loadit.net/quantum";

export default function Quantum() {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [failed, setFailed] = useState(false);

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      {failed ? (
        <View style={styles.errWrap}>
          <Text style={styles.errText}>Couldn&apos;t load the quantum page — check your connection.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => Linking.openURL(URL)}>
            <Text style={styles.ctaText}>Open in browser</Text>
            <Feather name="external-link" size={16} color={t.onAccent} />
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: URL }}
          style={{ flex: 1, backgroundColor: "#05070C" }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator color={VIOLET} />
              <Text style={styles.loadingText}>◈ Entering the quantum layer…</Text>
            </View>
          )}
          onError={() => setFailed(true)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: "#05070C" },
    loading: {
      position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
      alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "#05070C",
    },
    loadingText: { color: VIOLET, fontSize: 13, fontWeight: "600" },
    errWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, gap: 8 },
    errText: { color: t.dim, fontSize: 14, textAlign: "center", lineHeight: 20 },
    cta: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingHorizontal: 22, paddingVertical: 14, marginTop: 12,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
  });
