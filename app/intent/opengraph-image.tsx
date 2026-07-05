import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — AI Intent Router";

export default function Image() {
  return makeOgImage({
    eyebrow: "AI Intent Router",
    titleTop: "Just",
    titleAccent: "say it.",
    subtitle: "Tell HQ what you want with your money. It finds the cheapest real route.",
    accent: ["#A78BFF", "#7C5CFF"],
    tags: ["Natural language", "Grounded quotes", "HQ"],
  });
}
