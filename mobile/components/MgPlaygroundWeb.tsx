import { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Linking, Image, Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * MoneyGram hosted PLAYGROUND (SEP-24 testnet). Not live cash-in.
 * Extracted so the Rail POC can open the door without a second product screen.
 */

const DIAG_JS = `
    window.RAMPS_CONFIG = window.RAMPS_CONFIG || {};
    (function () {
      var addRibbon = function () {
        if (document.getElementById("loadit-ribbon") || !document.body) return;
        var r = document.createElement("div");
        r.id = "loadit-ribbon";
        r.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;background:#05070C;border-bottom:1px solid rgba(61,227,131,.35);font-family:-apple-system,Roboto,sans-serif;";
        r.innerHTML = '<img src="https://loadit.net/icon-512.png" style="width:20px;height:20px;border-radius:6px;"/>' +
          '<span style="color:#fff;font-weight:700;font-size:13px;letter-spacing:-0.2px;">Loadit</span>' +
          '<span style="color:rgba(255,255,255,.45);font-size:12px;">playground — not live cash</span>' +
          '<span style="margin-left:auto;color:#F5B84B;border:1px solid rgba(245,184,75,.5);border-radius:6px;padding:2px 7px;font-size:9px;font-weight:800;letter-spacing:1px;">PLAYGROUND</span>';
        document.body.appendChild(r);
        document.body.style.paddingTop = (parseFloat(getComputedStyle(document.body).paddingTop) || 0) + 40 + "px";
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addRibbon);
      else addRibbon();
      setTimeout(addRibbon, 1500);

      var active = 0, barTimer = null;
      var setBusy = function (busy) {
        var r = document.getElementById("loadit-ribbon");
        if (!r) return;
        var bar = document.getElementById("loadit-progress");
        if (busy && !bar) {
          bar = document.createElement("div");
          bar.id = "loadit-progress";
          bar.style.cssText = "position:fixed;top:40px;left:0;right:0;height:2px;z-index:2147483647;overflow:hidden;background:rgba(61,227,131,.15);";
          bar.innerHTML = '<div style="width:35%;height:100%;background:#3DE383;border-radius:2px;animation:loaditSlide 1.1s ease-in-out infinite;"></div>';
          if (!document.getElementById("loadit-progress-style")) {
            var st = document.createElement("style");
            st.id = "loadit-progress-style";
            st.textContent = "@keyframes loaditSlide{0%{transform:translateX(-110%)}100%{transform:translateX(390px)}}";
            document.head.appendChild(st);
          }
          document.body.appendChild(bar);
        } else if (!busy && bar) {
          bar.remove();
        }
      };
      var bump = function (d) {
        active += d;
        clearTimeout(barTimer);
        if (active > 0) barTimer = setTimeout(function () { setBusy(true); }, 500);
        else setBusy(false);
      };
      var of = window.fetch;
      window.fetch = function () {
        bump(1);
        return of.apply(this, arguments).finally(function () { bump(-1); });
      };
      var oo = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function () {
        this.addEventListener("loadstart", function () { bump(1); });
        this.addEventListener("loadend", function () { bump(-1); });
        return oo.apply(this, arguments);
      };
    })();
    true;`;

export function MgPlaygroundWeb({ url, onDone }: { url: string; onDone: () => void }) {
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const [webErr, setWebErr] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.wrap} edges={["top", "bottom"]}>
      <View style={styles.webHead}>
        <View style={styles.webBrandRow}>
          <Image source={require("../assets/mark.png")} style={styles.webBrandLogo} />
          <Text style={styles.webBrandX}>×</Text>
          <Image source={require("../assets/moneygram-logo.jpg")} style={[styles.webBrandLogo, { borderRadius: 13 }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.webTitle}>MoneyGram playground</Text>
          <Text style={styles.webSub}>Playground — cert approved 4/5 — cash-in not live yet</Text>
        </View>
        <TouchableOpacity onPress={onDone}>
          <Text style={styles.close}>Done →</Text>
        </TouchableOpacity>
      </View>
      {webErr ? (
        <View style={styles.webErrWrap}>
          <Text style={styles.err}>MoneyGram&apos;s playground couldn&apos;t load in-app: {webErr}</Text>
          <TouchableOpacity style={styles.cta} onPress={() => Linking.openURL(url)}>
            <Text style={styles.ctaText}>Open in {Platform.OS === "ios" ? "Safari" : "Chrome"} instead</Text>
            <Feather name="external-link" size={16} color={t.onAccent} />
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          source={{ uri: url }}
          style={{ flex: 1, backgroundColor: "#FFFFFF", opacity: 0.99 }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          geolocationEnabled
          setSupportMultipleWindows={false}
          injectedJavaScriptBeforeContentLoaded={DIAG_JS}
          onRenderProcessGone={() => setWebErr("Android WebView renderer crashed — update 'Android System WebView' in the Play Store and retry")}
          onContentProcessDidTerminate={() => setWebErr("iOS web content process terminated — retry")}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.webLoading, { backgroundColor: "#FFFFFF" }]}>
              <ActivityIndicator color={t.accentText} />
              <Text style={styles.loadingText}>Loading MoneyGram playground…</Text>
            </View>
          )}
          onError={(e) => setWebErr(e.nativeEvent.description || "load error")}
          onHttpError={(e) => setWebErr(`HTTP ${e.nativeEvent.statusCode}`)}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    webHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomColor: t.border, borderBottomWidth: 1 },
    webBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    webBrandLogo: { width: 26, height: 26, borderRadius: 8 },
    webBrandX: { color: t.faint, fontSize: 13, fontWeight: "700" },
    webTitle: { color: t.text, fontWeight: "600" },
    webSub: { color: t.warn, fontSize: 11, marginTop: 2 },
    close: { color: t.accentText, fontWeight: "600" },
    webErrWrap: { padding: 20 },
    err: { color: t.warn, fontSize: 13, marginTop: 12 },
    cta: {
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: t.accent, borderRadius: 18, paddingVertical: 16, marginTop: 18,
    },
    ctaText: { color: t.onAccent, fontWeight: "700", fontSize: 15 },
    webLoading: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", gap: 10 },
    loadingText: { color: t.dim, fontSize: 14 },
  });
