import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Energy Marketplace";

export default function Image() {
  return makeOgImage({
    eyebrow: "Energy Marketplace",
    titleTop: "Buy power",
    titleAccent: "as money.",
    subtitle: "Source tokenized energy across grids and settle it into the rail.",
    accent: ["#5EEAD4", "#14B8A6"],
    tags: ["Grid surplus", "Tokenized", "Settle to crypto"],
  });
}
