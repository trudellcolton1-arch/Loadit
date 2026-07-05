import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Platform";

export default function Image() {
  return makeOgImage({
    eyebrow: "Platform",
    titleTop: "The universal",
    titleAccent: "value rail.",
    subtitle: "Cash, cards, crypto, stablecoins, and energy — one intelligent rail.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["8+ networks", "Non-custodial", "AI-routed"],
  });
}
