import { ImageResponse } from "next/og";
import { ogSize, ogContentType } from "@/lib/og";
import { OG_MARK } from "@/lib/ogMark";

export const runtime = "edge";
export const size = ogSize;
export const contentType = ogContentType;
export const alt = "DollarDNA — Different assets. Connected history. Bitcoin → USD → USDC, every link kept.";

/**
 * DollarDNA share card. Left: the brand line and headline. Right: the
 * connected-history graph from the hero (BTC entry → USD conversion → USDC
 * paid / kept, with a split and an attested context note) drawn with Satori
 * friendly primitives: absolutely positioned nodes over an SVG of links.
 * Example amounts only; the card says so.
 */

const AMBER = "#FBBF24";
const CYAN = "#5EEAD4";
const GREEN = "#34D17A";

type Node = { x: number; y: number; w?: number; tag: string; value: string; unit: string; tone: string; dim?: boolean; dashed?: boolean };

const NODES: Node[] = [
  { x: 24, y: 44, tag: "P1 · ENTRY", value: "0.002", unit: "BTC", tone: AMBER, dashed: true },
  { x: 178, y: 150, tag: "P2 · CONVERT", value: "119.10", unit: "USD", tone: "#FFFFFF", dashed: true },
  { x: 24, y: 256, tag: "P4 · KEPT", value: "39.10", unit: "USD", tone: "#FFFFFF", dim: true },
  { x: 336, y: 44, tag: "P6 · PAID", value: "50.00", unit: "USDC", tone: CYAN },
  { x: 336, y: 256, tag: "P7 · KEPT", value: "29.80", unit: "USDC", tone: CYAN, dim: true },
];
const NW = 132, NH = 60;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#04060B",
          color: "white",
          fontFamily: "sans-serif",
          overflow: "hidden",
        }}
      >
        {/* glows */}
        <div style={{ position: "absolute", top: -260, left: -120, width: 820, height: 640, background: "radial-gradient(ellipse at center, rgba(251,191,36,0.20), transparent 68%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -300, right: -140, width: 900, height: 700, background: "radial-gradient(ellipse at center, rgba(94,234,212,0.18), transparent 66%)", display: "flex" }} />
        <div style={{ position: "absolute", top: 180, left: 560, width: 520, height: 420, background: "radial-gradient(circle, rgba(52,209,122,0.10), transparent 70%)", display: "flex" }} />
        {/* hairline frame */}
        <div style={{ position: "absolute", top: 28, left: 28, right: 28, bottom: 28, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 28, display: "flex" }} />

        {/* LEFT — copy */}
        <div style={{ position: "absolute", top: 72, left: 80, bottom: 72, width: 560, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={OG_MARK} width={48} height={48} alt="" />
            <div style={{ display: "flex", fontSize: 22, letterSpacing: "0.24em", textTransform: "uppercase", color: AMBER }}>Loadit · DollarDNA</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", fontSize: 64, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.0 }}>
              <span style={{ display: "flex" }}>Different assets.</span>
              <span style={{ display: "flex", background: `linear-gradient(90deg, ${AMBER} 0%, ${GREEN} 55%, ${CYAN} 100%)`, backgroundClip: "text", color: "transparent" }}>Connected history.</span>
            </div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.60)", maxWidth: 520 }}>
              Value&apos;s history from Bitcoin to dollars to stablecoins — with the evidence behind every link.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { t: "BTC → USD → USDC", c: "rgba(251,191,36,0.45)" },
                { t: "Evidence, not assumptions", c: "rgba(94,234,212,0.45)" },
                { t: "In design", c: "rgba(255,255,255,0.28)" },
              ].map((p) => (
                <div key={p.t} style={{ display: "flex", padding: "7px 14px", borderRadius: 999, border: `1px solid ${p.c}`, background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.85)", fontSize: 16, whiteSpace: "nowrap" }}>
                  {p.t}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", fontSize: 18, letterSpacing: "0.12em", color: "rgba(255,255,255,0.38)" }}>loadit.net/dollardna</div>
          </div>
        </div>

        {/* RIGHT — connected-history graph */}
        <div style={{ position: "absolute", top: 96, left: 672, width: 488, height: 438, display: "flex", borderRadius: 26, border: "1px solid rgba(255,255,255,0.10)", background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))" }}>
          {/* links */}
          <svg width="488" height="438" viewBox="0 0 488 438" style={{ position: "absolute", top: 0, left: 0 }}>
            {/* P1 → P2 (conversion) */}
            <path d="M156 74 C 167 74, 167 180, 178 180" stroke={AMBER} strokeOpacity="0.85" strokeWidth="2.5" fill="none" strokeDasharray="6 7" />
            {/* P2 → P4 (split, kept) */}
            <path d="M178 180 C 167 180, 167 286, 156 286" stroke="white" strokeOpacity="0.28" strokeWidth="2" fill="none" />
            {/* P2 → P6 (conversion then paid) */}
            <path d="M310 180 C 323 180, 323 74, 336 74" stroke={CYAN} strokeOpacity="0.9" strokeWidth="2.5" fill="none" strokeDasharray="6 7" />
            {/* P2 → P7 (kept) */}
            <path d="M310 180 C 323 180, 323 286, 336 286" stroke={CYAN} strokeOpacity="0.45" strokeWidth="2" fill="none" strokeDasharray="6 7" />
            {/* P6 → context */}
            <path d="M402 104 L 402 338" stroke={GREEN} strokeOpacity="0.5" strokeWidth="1.5" fill="none" />
            {/* join dots */}
            <circle cx="178" cy="180" r="4" fill={AMBER} />
            <circle cx="310" cy="180" r="4" fill={CYAN} />
          </svg>

          {NODES.map((n) => (
            <div
              key={n.tag}
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: NW,
                height: NH,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "0 14px",
                borderRadius: 14,
                border: `${n.dashed ? "1.5px dashed" : "1.5px solid"} ${n.tone}${n.dim ? "66" : "CC"}`,
                background: n.dashed ? "rgba(4,6,11,0.6)" : "rgba(255,255,255,0.04)",
              }}
            >
              <div style={{ display: "flex", fontSize: 10, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{n.tag}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 3 }}>
                <span style={{ display: "flex", fontSize: 22, fontWeight: 700, color: n.dim ? "rgba(255,255,255,0.6)" : n.tone }}>{n.value}</span>
                <span style={{ display: "flex", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{n.unit}</span>
              </div>
            </div>
          ))}

          {/* context chip */}
          <div style={{ position: "absolute", left: 182, top: 338, width: 282, height: 50, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 14px", borderRadius: 14, border: `1px solid ${GREEN}66`, background: "rgba(34,169,92,0.10)" }}>
            <div style={{ display: "flex", fontSize: 11, letterSpacing: "0.18em", color: `${GREEN}` }}>CONTEXT · ATTESTED</div>
            <div style={{ display: "flex", fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>Invoice #1042 · signed by sender</div>
          </div>

          {/* legend */}
          <div style={{ position: "absolute", left: 24, top: 352, display: "flex", flexDirection: "column", gap: 6, fontSize: 11, letterSpacing: "0.14em", color: "rgba(255,255,255,0.38)" }}>
            <div style={{ display: "flex" }}>DASHED = CONSUMED</div>
            <div style={{ display: "flex" }}>EXAMPLE AMOUNTS</div>
            <div style={{ display: "flex" }}>NO FUNDS MOVE</div>
          </div>
        </div>
      </div>
    ),
    { ...ogSize }
  );
}
