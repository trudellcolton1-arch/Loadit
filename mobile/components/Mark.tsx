import { Image, type ImageStyle, type StyleProp } from "react-native";

/**
 * Loadit brand mark — the green "L→" logo. Rendered in its true brand color
 * (not tinted to the theme) so the logo stays consistent everywhere. The
 * `color` prop is kept for call-site compatibility but no longer recolors the
 * mark; the transparent PNG reads on both light and dark surfaces.
 */
export function Mark({
  size = 40,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  color,
  style,
}: {
  size?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={require("../assets/mark.png")}
      style={[{ width: size, height: size, resizeMode: "contain" }, style]}
    />
  );
}
