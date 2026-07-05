import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Earn";

export default function Image() {
  return makeOgImage({
    eyebrow: "Earn",
    titleTop: "Get paid to",
    titleAccent: "move money.",
    subtitle: "Refer the rail, plug in the API, and earn on every transfer you send.",
    accent: ["#A3E635", "#34D399"],
    tags: ["Revenue share", "Affiliate", "API payouts"],
  });
}
