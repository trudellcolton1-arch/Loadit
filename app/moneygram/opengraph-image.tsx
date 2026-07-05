import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — MoneyGram";

export default function Image() {
  return makeOgImage({
    eyebrow: "MoneyGram",
    titleTop: "Cash into",
    titleAccent: "any crypto.",
    subtitle: "Pay cash at 350,000+ MoneyGram locations. HQ turns it into the asset you want.",
    accent: ["#FBBF24", "#E0553B"],
    tags: ["350k+ locations", "USDC on Stellar", "Non-custodial"],
  });
}
