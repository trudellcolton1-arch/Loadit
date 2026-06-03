import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, #0d1b3a, #04060B 70%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            color: "#8fb6ff",
            fontFamily: "monospace",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#5eead4",
            }}
          />
          {SITE.name} · Patent Pending
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 32,
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
          }}
        >
          <span>Move Value.</span>
          <span
            style={{
              background: "linear-gradient(90deg, #5eead4, #5b9bff, #c084fc)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Anywhere.
          </span>
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 30,
            color: "rgba(255,255,255,0.55)",
            maxWidth: 900,
          }}
        >
          The AI-powered financial rail connecting cash, cards, crypto,
          stablecoins, and the future of money.
        </div>
      </div>
    ),
    { ...size }
  );
}
