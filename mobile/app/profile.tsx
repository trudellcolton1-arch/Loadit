import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image, Share,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { getMyHandle, type HandleProfile } from "@/lib/api";
import { useTheme, type Theme } from "@/lib/theme";

/**
 * PROFILE — the user's Hylaq identity inside Loadit.
 *
 * Shows the Hylaq logo + their @handle (resolved from Hylaq's directory via the
 * Loadit backend, keyed off their Hylaq login), account type, preferred receive
 * asset, and the addresses value can land at. The @handle is shareable so
 * anyone can pay them by name.
 */

const short = (a?: string | null) => (a && a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a || "");

export default function Profile() {
  const { session, ready } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const [state, setState] = useState<"loading" | "linked" | "unlinked" | "error">("loading");
  const [profile, setProfile] = useState<HandleProfile | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!session) return;
    (async () => {
      try {
        const r = await getMyHandle(session.accessToken, session.email);
        if (r.ok && r.linked && r.profile) {
          setProfile(r.profile);
          setState("linked");
        } else {
          setState("unlinked");
        }
      } catch {
        setState("error");
      }
    })();
  }, [ready, session]);

  if (ready && !session) return <Redirect href="/login" />;

  const addresses = profile
    ? ([
        ["Solana", profile.addresses.solana],
        ["EVM", profile.addresses.evm],
        ["Bitcoin", profile.addresses.bitcoin],
        ["USDC", profile.addresses.usdc],
      ].filter(([, v]) => v) as [string, string][])
    : [];

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Image source={require("../assets/hylaq-logo.png")} style={styles.logo} />
          {state === "loading" && <ActivityIndicator color={t.accentText} style={{ marginTop: 18 }} />}

          {state === "linked" && profile && (
            <>
              <Text style={styles.handle}>@{profile.handle}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.hylaqBadge}>
                  <Image source={require("../assets/hylaq-logo.png")} style={styles.badgeIcon} />
                  <Text style={styles.hylaqBadgeText}>Hylaq handle</Text>
                </View>
                {profile.accountType && (
                  <View style={styles.typeBadge}><Text style={styles.typeBadgeText}>{profile.accountType}</Text></View>
                )}
              </View>
              <TouchableOpacity
                style={styles.share}
                onPress={() => Share.share({ message: `Pay me at @${profile.handle} on Loadit.` })}
              >
                <Text style={styles.shareText}>Share @{profile.handle}</Text>
              </TouchableOpacity>
            </>
          )}

          {state === "unlinked" && (
            <>
              <Text style={styles.handle}>No handle yet</Text>
              <Text style={styles.sub}>
                Claim your @handle on Hylaq and it appears here automatically — then anyone can pay
                you by name.
              </Text>
            </>
          )}

          {state === "error" && (
            <Text style={styles.sub}>Couldn&apos;t reach Hylaq right now. Pull back and try again.</Text>
          )}
        </View>

        {state === "linked" && profile && (
          <>
            {profile.preferredReceiveAsset && (
              <View style={styles.card}>
                <Text style={styles.label}>Preferred receive asset</Text>
                <Text style={styles.value}>{profile.preferredReceiveAsset}</Text>
              </View>
            )}

            {addresses.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.label}>Value lands at</Text>
                {addresses.map(([net, addr]) => (
                  <View key={net} style={styles.addrRow}>
                    <Text style={styles.addrNet}>{net}</Text>
                    <Text style={styles.addrVal}>{short(addr)}</Text>
                  </View>
                ))}
              </View>
            )}

            {profile.profileTheme && (
              <Text style={styles.themeNote}>Hylaq theme · {profile.profileTheme}</Text>
            )}
          </>
        )}

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (t: Theme) =>
  StyleSheet.create({
    wrap: { flex: 1, backgroundColor: t.bg },
    scroll: { padding: 20, paddingBottom: 48, alignItems: "stretch" },
    hero: { alignItems: "center", marginTop: 12, marginBottom: 8 },
    logo: { width: 88, height: 88, borderRadius: 24 },
    handle: { color: t.text, fontSize: 30, fontWeight: "800", letterSpacing: -0.5, marginTop: 16 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: "center", paddingHorizontal: 20 },
    badgeRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
    hylaqBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    badgeIcon: { width: 14, height: 14, borderRadius: 4 },
    hylaqBadgeText: { color: t.accentText, fontSize: 11, fontWeight: "700" },
    typeBadge: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    typeBadgeText: { color: t.dim, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    share: { marginTop: 16, backgroundColor: t.button, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
    shareText: { color: t.buttonText, fontWeight: "700", fontSize: 14 },
    card: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
    label: { color: t.faint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
    value: { color: t.text, fontSize: 18, fontWeight: "700", marginTop: 6 },
    addrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
    addrNet: { color: t.dim, fontSize: 13, fontWeight: "600" },
    addrVal: { color: t.text, fontSize: 13, fontFamily: "Courier" },
    themeNote: { color: t.faint, fontSize: 12, textAlign: "center", marginTop: 16 },
    back: { color: t.faint, textAlign: "center", marginTop: 22, fontSize: 14 },
  });
