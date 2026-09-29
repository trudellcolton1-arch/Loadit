import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit Global — GPS for money.";

export default function Image() {
  return makeOgImage({
    brand: "Loadit Global",
    domain: "loaditglobal.com",
    eyebrow: "Value routing infrastructure",
    titleTop: "GPS for money.",
    titleAccent: "You choose the destination.",
    subtitle: "One API. Tell Loadit what value is coming in and where it needs to go — it finds the supported route.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["One API · multiple rails", "Non-custodial", "Live sandbox"],
  });
}
