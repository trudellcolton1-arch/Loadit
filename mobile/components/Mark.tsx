import { Image, type ImageStyle, type StyleProp } from "react-native";

/**
 * Loadit brand mark, tinted to the current theme accent so it recolors with
 * the app (and stays visible on any background — the QR ink is no longer a
 * fixed dark that vanishes in dark mode). One flat accent silhouette of the
 * QR + rising arrow.
 */
export function Mark({
  size = 40,
  color,
  style,
}: {
  size?: number;
  color: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require("../assets/mark.png")}
      style={[{ width: size, height: size, resizeMode: "contain", tintColor: color }, style]}
    />
  );
}
