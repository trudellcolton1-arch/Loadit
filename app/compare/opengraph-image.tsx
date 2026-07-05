import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Compare";

export default function Image() {
  return makeOgImage({
    eyebrow: "Compare",
    titleTop: "The old way vs",
    titleAccent: "the Loadit way.",
    subtitle: "Cash, cards, and crypto — routed cheaper than banks, ATMs, and card on-ramps.",
    accent: ["#34D399", "#22C55E"],
    tags: ["0.75% flat fee", "No bank needed", "Any asset"],
  });
}
