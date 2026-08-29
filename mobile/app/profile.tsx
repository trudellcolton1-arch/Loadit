import { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image, Share, Linking,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/lib/authContext";
import { getMyHandle, type HandleProfile } from "@/lib/api";
import { getWalletBalance, type WalletBalance } from "@/lib/hylaqWallet";
import { API_BASE, HYLAQ } from "@/lib/config";
import { useTheme, type Theme } from "@/lib/theme";
import { HandleAvatar } from "@/components/HandleAvatar";

/**
 * PROFILE — the user's Hylaq identity inside Loadit.
 *
 * Shows the Hylaq logo + their @handle (resolved from Hylaq's directory via the
 * Loadit backend, keyed off their Hylaq login), account type, preferred receive
 * asset, and the addresses value can land at. The @handle is shareable so
 * anyone can pay them by name.
 */

const short = (a?: string | null) => (a && a.length > 16 ? `${a.slice(0, 8)}…${a.slice(-6)}` : a || "");

/** Where handles are claimed — Hylaq's own site. */
const HYLAQ_WEB = (HYLAQ.issuer || "https://www.hylaq.com").replace(/\/$/, "");

export default function Profile() {
  const { session, ready, signOut } = useAuth();
  const { theme: t } = useTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const router = useRouter();
  const [state, setState] = useState<"loading" | "linked" | "unlinked" | "error">("loading");
  const [profile, setProfile] = useState<HandleProfile | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [receiveNet, setReceiveNet] = useState("");

  const signedIn = session?.kind === "hylaq";

  useEffect(() => {
    if (!ready) return;
    if (!session || session.kind !== "hylaq") return;
    (async () => {
      try {
        const r = await getMyHandle(session.accessToken);
        if (r.ok && r.linked && r.profile) {
          setProfile(r.profile);
          setState("linked");
          getWalletBalance(r.profile.handle).then(setBalance).catch(() => {});
        } else {
          setState("unlinked");
        }
      } catch {
        setState("error");
      }
    })();
  }, [ready, session]);

  const addresses = profile
    ? ([
        ["Solana", profile.addresses.solana],
        ["EVM", profile.addresses.evm],
        ["Bitcoin", profile.addresses.bitcoin],
        ["USDC", profile.addresses.usdc],
      ].filter(([, v]) => v) as [string, string][])
    : [];

  useEffect(() => {
    if (addresses.length && !receiveNet) setReceiveNet(addresses[0][0]);
  }, [addresses, receiveNet]);

  if (ready && !session) return <Redirect href="/login" />;

  const activeAddr = (addresses.find(([n]) => n === receiveNet) || addresses[0])?.[1] || null;

  return (
    <SafeAreaView style={styles.wrap} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          {signedIn && state === "linked" && profile ? (
            <HandleAvatar handle={profile.handle} avatarUrl={profile.avatarUrl} size={96} />
          ) : (
            <Image source={require("../assets/hylaq-logo.png")} style={styles.logo} />
          )}

          {/* signed out (guest) — a real way in, never a dead end */}
          {!signedIn && (
            <>
              <Text style={styles.handle}>You&apos;re signed out</Text>
              <Text style={styles.sub}>
                Your Hylaq account is your Loadit identity. Sign in to see your @handle,
                balance and wallet addresses — or claim a new @handle first.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
                <Text style={styles.primaryBtnText}>Sign in with Hylaq</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => Linking.openURL(HYLAQ_WEB)}>
                <Text style={styles.secondaryBtnText}>New here? Claim your @handle on Hylaq →</Text>
              </TouchableOpacity>
            </>
          )}

          {signedIn && state === "loading" && <ActivityIndicator color={t.accentText} style={{ marginTop: 18 }} />}

          {signedIn && state === "linked" && profile && (
            <>
              {profile.displayName && <Text style={styles.displayName}>{profile.displayName}</Text>}
              <Text style={profile.displayName ? styles.handleSmall : styles.handle}>@{profile.handle}</Text>
              {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
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

          {/* signed in but no linked @handle (or a stale token the backend
              couldn't match to a handle) — never a dead end: a real Sign in
              plus a Create account path, and Sign out below to clear it. */}
          {signedIn && state === "unlinked" && (
            <>
              <Text style={styles.handle}>No handle yet</Text>
              <Text style={styles.sub}>
                This session isn&apos;t linked to a Hylaq @handle. Sign in again with the account
                that holds your @handle — or create one and it appears here automatically.
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
                <Text style={styles.primaryBtnText}>Sign in with Hylaq</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => Linking.openURL(HYLAQ_WEB)}>
                <Text style={styles.secondaryBtnText}>Create account — claim your @handle on Hylaq →</Text>
              </TouchableOpacity>
            </>
          )}

          {signedIn && state === "error" && (
            <>
              <Text style={styles.sub}>Couldn&apos;t reach Hylaq right now. Pull back and try again.</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/login")}>
                <Text style={styles.primaryBtnText}>Sign in with Hylaq</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {signedIn && state === "linked" && profile && (
          <>
            {balance && balance.hasWallet && (
              <View style={styles.balanceCard}>
                <Text style={styles.label}>Balance</Text>
                <Text style={styles.balanceBig}>{balance.displayBalance || balance.balanceFormatted || `$${balance.balance.toFixed(2)}`}</Text>
                <Text style={styles.balanceSub}>USDC</Text>
                <View style={styles.nativeRow}>
                  {([
                    ["SOL", balance.solBalance],
                    ["ETH", balance.ethBalance],
                    ["BNB", balance.bnbBalance],
                    ["BTC", balance.btcOnchainBalance],
                  ] as [string, number | undefined][])
                    .filter(([sym, v]) => sym === "SOL" || (v && v > 0))
                    .map(([sym, v]) => (
                      <View key={sym} style={styles.native}>
                        <Text style={styles.nativeSym}>{sym}</Text>
                        <Text style={styles.nativeVal}>{(v ?? 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}</Text>
                      </View>
                    ))}
                </View>
                {balance.hasGas === false && (
                  <Text style={styles.gasWarn}>⚠ Low SOL for network fees — top up SOL to send.</Text>
                )}
                {balance.hasStuckWsol && balance.wsolRecoveryMessage ? (
                  <Text style={styles.gasWarn}>{balance.wsolRecoveryMessage}</Text>
                ) : null}
              </View>
            )}

            {profile.preferredReceiveAsset && (
              <View style={styles.card}>
                <Text style={styles.label}>Preferred receive asset</Text>
                <Text style={styles.value}>{profile.preferredReceiveAsset}</Text>
              </View>
            )}

            {addresses.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.label}>Top up your wallet</Text>
                <Text style={styles.receiveHint}>Show this QR or share an address to receive crypto into your wallet.</Text>
                <View style={styles.netRow}>
                  {addresses.map(([net]) => (
                    <TouchableOpacity key={net} style={[styles.netChip, receiveNet === net && styles.netChipOn]} onPress={() => setReceiveNet(net)}>
                      <Text style={[styles.netChipText, receiveNet === net && styles.netChipTextOn]}>{net}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {activeAddr && (
                  <View style={styles.receiveBox}>
                    <View style={styles.qrBox}>
                      <Image source={{ uri: `${API_BASE}/api/qr?size=512&data=${encodeURIComponent(activeAddr)}` }} style={styles.qr} />
                    </View>
                    <Text style={styles.fullAddr}>{activeAddr}</Text>
                    <TouchableOpacity
                      style={styles.receiveShare}
                      onPress={() => Share.share({ message: `My ${receiveNet} address (@${profile.handle} on Loadit):\n${activeAddr}` })}
                    >
                      <Text style={styles.receiveShareText}>Share {receiveNet} address</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {profile.profileTheme && (
              <Text style={styles.themeNote}>Hylaq theme · {profile.profileTheme}</Text>
            )}
          </>
        )}

        {/* any session (linked, unlinked, or guest) can be cleared here — the
            escape hatch for a stale token that won't verify */}
        {session && (
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={async () => {
              await signOut();
              router.replace("/login");
            }}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
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
    displayName: { color: t.text, fontSize: 26, fontWeight: "800", letterSpacing: -0.5, marginTop: 14 },
    handleSmall: { color: t.accentText, fontSize: 16, fontWeight: "700", marginTop: 2 },
    bio: { color: t.dim, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8, paddingHorizontal: 24 },
    sub: { color: t.dim, fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: "center", paddingHorizontal: 20 },
    badgeRow: { flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" },
    hylaqBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: t.accentSoft, borderColor: t.accentTint, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    badgeIcon: { width: 14, height: 14, borderRadius: 4 },
    hylaqBadgeText: { color: t.accentText, fontSize: 11, fontWeight: "700" },
    typeBadge: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
    typeBadgeText: { color: t.dim, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    share: { marginTop: 16, backgroundColor: t.button, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 24 },
    shareText: { color: t.buttonText, fontWeight: "700", fontSize: 14 },
    primaryBtn: {
      marginTop: 20, alignSelf: "stretch", backgroundColor: t.button, borderRadius: 18,
      paddingVertical: 15, alignItems: "center", marginHorizontal: 8,
      shadowColor: t.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 5,
    },
    primaryBtnText: { color: t.buttonText, fontWeight: "700", fontSize: 15 },
    secondaryBtn: {
      marginTop: 10, alignSelf: "stretch", borderColor: t.border, borderWidth: 1, borderRadius: 18,
      paddingVertical: 14, alignItems: "center", marginHorizontal: 8,
    },
    secondaryBtnText: { color: t.text, fontWeight: "600", fontSize: 14 },
    card: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 16, marginTop: 14 },
    label: { color: t.faint, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
    value: { color: t.text, fontSize: 18, fontWeight: "700", marginTop: 6 },
    addrRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, borderTopColor: t.border, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
    addrNet: { color: t.dim, fontSize: 13, fontWeight: "600" },
    addrVal: { color: t.text, fontSize: 13, fontFamily: "Courier" },
    balanceCard: { backgroundColor: t.card, borderColor: t.border, borderWidth: 1, borderRadius: 18, padding: 18, marginTop: 14 },
    balanceBig: { color: t.text, fontSize: 40, fontWeight: "800", letterSpacing: -1, marginTop: 6 },
    balanceSub: { color: t.dim, fontSize: 13, fontWeight: "600", marginTop: 2 },
    nativeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14 },
    native: { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, minWidth: 78 },
    nativeSym: { color: t.faint, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
    nativeVal: { color: t.text, fontSize: 14, fontWeight: "700", marginTop: 2 },
    gasWarn: { color: t.warn, fontSize: 12, marginTop: 12, lineHeight: 17 },
    receiveHint: { color: t.dim, fontSize: 12, lineHeight: 17, marginTop: 6 },
    netRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 12 },
    netChip: { borderColor: t.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
    netChipOn: { borderColor: t.accent, backgroundColor: t.accentSoft },
    netChipText: { color: t.dim, fontWeight: "600", fontSize: 12 },
    netChipTextOn: { color: t.text },
    receiveBox: { alignItems: "center", marginTop: 16 },
    qrBox: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 12 },
    qr: { width: 200, height: 200, borderRadius: 6 },
    fullAddr: { color: t.text, fontSize: 12, fontFamily: "Courier", textAlign: "center", marginTop: 12, paddingHorizontal: 8, lineHeight: 18 },
    receiveShare: { marginTop: 12, backgroundColor: t.button, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22 },
    receiveShareText: { color: t.buttonText, fontWeight: "700", fontSize: 13 },
    themeNote: { color: t.faint, fontSize: 12, textAlign: "center", marginTop: 16 },
    signOutBtn: {
      marginTop: 24, alignSelf: "center", borderColor: t.border, borderWidth: 1,
      borderRadius: 999, paddingVertical: 11, paddingHorizontal: 28,
    },
    signOutText: { color: t.warn, fontWeight: "700", fontSize: 13 },
    back: { color: t.faint, textAlign: "center", marginTop: 22, fontSize: 14 },
  });
