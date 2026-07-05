import { View, Text, Image, StyleSheet } from "react-native";

/**
 * Profile picture for a Hylaq @handle. Hylaq handles don't (yet) store an
 * uploaded photo, so we render a deterministic monogram avatar — a stable
 * color + the handle's initial — badged with the Hylaq logo. Same handle
 * always gets the same look. Swap the fill for a real image the day Hylaq
 * exposes uploaded avatars.
 */

const PALETTE = [
  "#22A95C", "#2563EB", "#7C5CFF", "#F97316", "#EC4899",
  "#14B8A6", "#D4A017", "#EF4444", "#0EA5E9", "#64748B",
];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function HandleAvatar({
  handle,
  avatarUrl,
  size = 88,
  showHylaq = true,
}: {
  handle: string;
  avatarUrl?: string | null;
  size?: number;
  showHylaq?: boolean;
}) {
  const bg = colorFor(handle || "?");
  const initial = (handle?.[0] || "?").toUpperCase();
  const badge = Math.round(size * 0.36);
  return (
    <View style={{ width: size, height: size }}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg }} />
      ) : (
        <View
          style={{
            width: size, height: size, borderRadius: size / 2, backgroundColor: bg,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontSize: size * 0.42, fontWeight: "800" }}>{initial}</Text>
        </View>
      )}
      {showHylaq && (
        <Image
          source={require("../assets/hylaq-logo.png")}
          style={[styles.badge, { width: badge, height: badge, borderRadius: badge / 2, right: -badge * 0.1, bottom: -badge * 0.1 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { position: "absolute", borderWidth: 2, borderColor: "#04060B" },
});
