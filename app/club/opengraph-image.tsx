import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

/**
 * Share card for load.club. Same brand family as the other cards, but its
 * own badge-like identity for the members program.
 */
export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Load.club — You earn your way in.";

export default function Image() {
  return makeOgImage({
    eyebrow: "Load.club",
    titleTop: "You don't join.",
    titleAccent: "You earn your way in.",
    subtitle:
      "The Loadit members program. Earn your place through real activity, then unlock unlimited loads with no per-load fee.",
    accent: ["#5EEAD4", "#22C55E"],
    tags: ["Earned, not bought", "Members free", "Unlimited $35/mo"],
  });
}
