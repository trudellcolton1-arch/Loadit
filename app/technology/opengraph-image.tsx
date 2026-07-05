import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Technology";

export default function Image() {
  return makeOgImage({
    eyebrow: "Technology",
    titleTop: "The architecture",
    titleAccent: "of value.",
    subtitle: "AI routing, temporal settlement, quantum optimization, and offline mode.",
    accent: ["#5EEAD4", "#10B981"],
    tags: ["Patent pending", "AI routing", "Quantum-ready"],
  });
}
