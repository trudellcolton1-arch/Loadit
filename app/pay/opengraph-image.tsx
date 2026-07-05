import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Get Paid";

export default function Image() {
  return makeOgImage({
    eyebrow: "Get Paid",
    titleTop: "Scan, pay,",
    titleAccent: "done.",
    subtitle: "Getting paid in crypto? Scan the Loadit QR and settle it straight to a wallet.",
    accent: ["#34D399", "#22C55E"],
    tags: ["Cash QR", "Any wallet", "Licensed checkout"],
  });
}
