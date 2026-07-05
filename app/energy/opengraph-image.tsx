import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Energy Native Rail";

export default function Image() {
  return makeOgImage({
    eyebrow: "Energy Native Rail",
    titleTop: "Settle value",
    titleAccent: "in energy.",
    subtitle: "Tokenized kWh, backed by real production data. Money denominated in power.",
    accent: ["#FBBF24", "#F59E0B"],
    tags: ["Tokenized kWh", "IoT-verified", "Energy-backed"],
  });
}
