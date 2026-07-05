import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Investor Brief";

export default function Image() {
  return makeOgImage({
    eyebrow: "Investor Brief",
    titleTop: "Move value.",
    titleAccent: "Anywhere.",
    subtitle: "The AI money rail — cash in, any crypto out. The full investor deck.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["$5M pre-seed", "Live on iOS", "Patent pending"],
  });
}
