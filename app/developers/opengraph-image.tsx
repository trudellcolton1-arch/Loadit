import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Developers";

export default function Image() {
  return makeOgImage({
    eyebrow: "Developers",
    titleTop: "One API for",
    titleAccent: "every rail.",
    subtitle: "Route value across 8+ networks with a single call. Grounded quotes, live fees.",
    accent: ["#38BDF8", "#2563EB"],
    tags: ["REST API", "Smart routing", "Live fees"],
  });
}
