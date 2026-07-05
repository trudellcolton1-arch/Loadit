import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Install";

export default function Image() {
  return makeOgImage({
    eyebrow: "Install",
    titleTop: "Loadit on",
    titleAccent: "your phone.",
    subtitle: "Cash and cards to crypto, routed by HQ — straight to your own wallet.",
    accent: ["#34D399", "#22C55E"],
    tags: ["iOS beta", "Android", "Non-custodial"],
  });
}
