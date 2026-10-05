import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit for Investors — Connecting how people pay with how value is received.";

export default function Image() {
  return makeOgImage({
    brand: "Loadit · Investors",
    domain: "loadit.info",
    eyebrow: "Investor overview · pre-launch",
    titleTop: "Connecting how people pay",
    titleAccent: "with how value is received.",
    subtitle: "Infrastructure coordinating movement between cash, payment systems, and digital assets. Non-custodial. Patent pending.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["Prototype built", "Cash network certified", "Production app next"],
  });
}
