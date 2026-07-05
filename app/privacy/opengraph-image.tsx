import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Privacy";

export default function Image() {
  return makeOgImage({
    eyebrow: "Privacy",
    titleTop: "Your money.",
    titleAccent: "Your data.",
    subtitle: "How Loadit handles data — minimal, encrypted, and non-custodial by design.",
    accent: ["#94A3B8", "#64748B"],
    tags: ["Non-custodial", "Encrypted", "Minimal data"],
  });
}
