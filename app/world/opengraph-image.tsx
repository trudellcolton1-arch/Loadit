import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit.world — The world where money works like the internet.";

export default function Image() {
  return makeOgImage({
    brand: "Loadit.world",
    domain: "loadit.world",
    eyebrow: "The vision",
    titleTop: "The world where money",
    titleAccent: "works like the internet.",
    subtitle: "Any value. Any network. Any destination. The user chooses the outcome — Loadit chooses the route.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["Cash · banks · digital assets", "Intelligent routing", "Live · Building · Vision"],
  });
}
