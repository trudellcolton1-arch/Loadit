import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

/**
 * Shared Open Graph / share-card renderer. Every non-home page supplies its own
 * copy, accent, and tags via OgConfig; the brand system (void ground, Loadit
 * mark, mono eyebrow, gradient headline, tag pills) stays consistent so the
 * cards read as one family while each is unmistakably its own page.
 */

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

export interface OgConfig {
  /** Mono uppercase label, e.g. "Investor Brief". */
  eyebrow: string;
  /** First headline line (white). */
  titleTop: string;
  /** Second headline line (accent gradient). */
  titleAccent: string;
  /** One-line description. */
  subtitle: string;
  /** Two hex colors for the accent gradient (light → deep). */
  accent: [string, string];
  /** Up to three page-specific tags. */
  tags: string[];
}

export function makeOgImage(cfg: OgConfig): ImageResponse {
  const [a1, a2] = cfg.accent;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#04060B",
          color: "white",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* accent glow */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 200,
            width: 900,
            height: 600,
            background: `radial-gradient(ellipse at center, ${hexA(a1, 0.22)}, transparent 70%)`,
            display: "flex",
          }}
        />
        {/* corner wash */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -160,
            width: 520,
            height: 520,
            background: `radial-gradient(circle, ${hexA(a2, 0.16)}, transparent 68%)`,
            display: "flex",
          }}
        />

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", gap: 18, zIndex: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${SITE.url}/loadit-mark.png`} width={52} height={52} alt="" />
          <div
            style={{
              display: "flex",
              fontSize: 24,
              fontFamily: "monospace",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: a1,
            }}
          >
            Loadit · {cfg.eyebrow}
          </div>
        </div>

        {/* headline + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 82,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.02,
            }}
          >
            <span style={{ display: "flex" }}>{cfg.titleTop}</span>
            <span
              style={{
                display: "flex",
                background: `linear-gradient(90deg, ${a1}, ${a2})`,
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {cfg.titleAccent}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              color: "rgba(255,255,255,0.58)",
              maxWidth: 940,
              lineHeight: 1.35,
            }}
          >
            {cfg.subtitle}
          </div>
        </div>

        {/* footer: tags + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 1 }}>
          <div style={{ display: "flex", gap: 12 }}>
            {cfg.tags.slice(0, 3).map((t) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: 999,
                  border: `1px solid ${hexA(a1, 0.4)}`,
                  background: hexA(a1, 0.08),
                  color: "rgba(255,255,255,0.82)",
                  fontSize: 22,
                }}
              >
                {t}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 22,
              color: "rgba(255,255,255,0.35)",
              letterSpacing: "0.1em",
            }}
          >
            {SITE.domain}
          </div>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}

/** hex (#rrggbb) → rgba() string with the given alpha, for Satori gradients. */
function hexA(hex: string, alpha: number): string {
  const s = hex.replace("#", "");
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
