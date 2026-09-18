import { makeOgImage, ogSize, ogContentType } from "@/lib/og";

/**
 * Share card for /data-room. Shown when the investor diligence link is
 * pasted into email or chat. Reveals nothing confidential — only that this
 * is Loadit's authorized diligence library — while staying in the brand
 * family (void ground, mark, mono eyebrow, gradient headline, tag pills).
 */
export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "Loadit — Diligence Library";

export default function Image() {
  return makeOgImage({
    eyebrow: "Diligence Library",
    titleTop: "The Loadit record,",
    titleAccent: "in one place.",
    subtitle:
      "Corporate, IP, technology, commercial, regulatory, financial, and security materials — for authorized diligence.",
    accent: ["#6EE7B7", "#0E9F6E"],
    tags: ["Corporate · IP · Financials", "Authorized access", "Patent pending"],
  });
}
