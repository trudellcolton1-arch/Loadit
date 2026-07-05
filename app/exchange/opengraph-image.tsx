import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Temporal Exchange";

export default function Image() {
  return makeOgImage({
    eyebrow: "Temporal Exchange",
    titleTop: "Trade on time,",
    titleAccent: "not just price.",
    subtitle: "Lock yesterday's rate. Settle on tomorrow's conditions. All auditable.",
    accent: ["#5EEAD4", "#22D3EE"],
    tags: ["Temporal settlement", "FX lock", "Conditional"],
  });
}
