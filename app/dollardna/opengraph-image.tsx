import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "DollarDNA — Different assets. Connected history.";

export default function Image() {
  return makeOgImage({
    eyebrow: "DollarDNA · in design",
    titleTop: "Different assets.",
    titleAccent: "Connected history.",
    subtitle: "Loadit's framework for giving value a traceable history — from Bitcoin to USD and beyond. Illustrative simulation.",
    accent: ["#FBBF24", "#5EEAD4"],
    tags: ["BTC → USD → USDC", "Linked records", "Evidence, not assumptions"],
  });
}
