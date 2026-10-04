/**
 * FIG. 1, redrawn — the unified rail as a block diagram. The spine is the
 * transaction's path (intake → conversion → routing → quantum → temporal →
 * settlement); the rails beside it are the subsystems that act on every
 * step. Flow lines animate along the spine (off under reduced motion).
 */
const SPINE = [
  { code: "INTAKE", sub: "cash · card · QR · NFC · API" },
  { code: "UVCE", sub: "universal value conversion" },
  { code: "HQ · AORE", sub: "AI-orchestrated routing" },
  { code: "QOL", sub: "quantum optimization · optional" },
  { code: "TSM", sub: "temporal settlement" },
  { code: "SETTLEMENT", sub: "across heterogeneous rails" },
];
const LEFT = [
  { code: "IVOR", sub: "offline · identity-verified" },
  { code: "SHF", sub: "self-healing · re-route" },
];
const RIGHT = [
  { code: "GTCE", sub: "geo-temporal compliance" },
  { code: "SECURITY", sub: "post-quantum · enclaves" },
];

export function PatentFigure() {
  const W = 760, H = 520;
  const colW = 236, rowH = 58, gap = 22;
  const x0 = (W - colW) / 2;
  const y0 = 42;
  const sideW = 176;
  const mono = "ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <figure className="rounded-3xl border border-white/10 bg-[#070A12]/85 p-4 shadow-glass sm:p-6">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Block diagram of the Loadit Unified Financial Rail: intake, universal value conversion, AI-orchestrated routing, quantum optimization, temporal settlement, and settlement along the spine; identity-verified offline rail, self-healing architecture, geo-temporal compliance, and post-quantum security alongside; a multi-reality interface feeding intake.">
        <defs>
          <linearGradient id="pf-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5EEAD4" />
            <stop offset="100%" stopColor="#22A95C" />
          </linearGradient>
        </defs>

        {/* MRTI feeding intake */}
        <g>
          <rect x={x0 - 8} y={2} width={colW + 16} height={26} rx={13} fill="rgba(94,234,212,0.06)" stroke="rgba(94,234,212,0.35)" strokeDasharray="4 4" />
          <text x={W / 2} y={19} textAnchor="middle" fill="rgba(94,234,212,0.9)" fontFamily={mono} fontSize="9.5" letterSpacing="2.5">MRTI · AR / VR / XR / BCI INTENT · VISION</text>
        </g>

        {/* spine */}
        {SPINE.map((b, i) => {
          const y = y0 + i * (rowH + gap);
          const last = i === SPINE.length - 1;
          const core = i >= 1 && i <= 4;
          return (
            <g key={b.code}>
              <rect x={x0} y={y} width={colW} height={rowH} rx={14} fill={last ? "rgba(255,255,255,0.95)" : core ? "rgba(34,169,92,0.08)" : "rgba(255,255,255,0.03)"} stroke={last ? "none" : core ? "rgba(52,209,122,0.55)" : "rgba(255,255,255,0.16)"} strokeWidth="1.2" />
              <text x={W / 2} y={y + 25} textAnchor="middle" fill={last ? "#04060B" : "#fff"} fontFamily={mono} fontSize="12" fontWeight="700" letterSpacing="3">{b.code}</text>
              <text x={W / 2} y={y + 43} textAnchor="middle" fill={last ? "rgba(4,6,11,0.6)" : "rgba(255,255,255,0.5)"} fontFamily={mono} fontSize="9.5">{b.sub}</text>
              {!last && (
                <>
                  <line x1={W / 2} y1={y + rowH} x2={W / 2} y2={y + rowH + gap} stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
                  <line x1={W / 2} y1={y + rowH} x2={W / 2} y2={y + rowH + gap} stroke="url(#pf-grad)" strokeWidth="1.5" className="world-flow" />
                </>
              )}
            </g>
          );
        })}

        {/* side rails */}
        {LEFT.map((b, i) => {
          const y = y0 + (1.5 + i * 1.7) * (rowH + gap);
          return (
            <g key={b.code}>
              <rect x={24} y={y} width={sideW} height={rowH - 8} rx={12} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.14)" />
              <text x={24 + sideW / 2} y={y + 21} textAnchor="middle" fill="#fff" fontFamily={mono} fontSize="11" fontWeight="700" letterSpacing="2.5">{b.code}</text>
              <text x={24 + sideW / 2} y={y + 37} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily={mono} fontSize="9">{b.sub}</text>
              <line x1={24 + sideW} y1={y + (rowH - 8) / 2} x2={x0} y2={y + (rowH - 8) / 2} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 5" />
            </g>
          );
        })}
        {RIGHT.map((b, i) => {
          const y = y0 + (1.5 + i * 1.7) * (rowH + gap);
          const x = W - 24 - sideW;
          return (
            <g key={b.code}>
              <rect x={x} y={y} width={sideW} height={rowH - 8} rx={12} fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.14)" />
              <text x={x + sideW / 2} y={y + 21} textAnchor="middle" fill="#fff" fontFamily={mono} fontSize="11" fontWeight="700" letterSpacing="2.5">{b.code}</text>
              <text x={x + sideW / 2} y={y + 37} textAnchor="middle" fill="rgba(255,255,255,0.45)" fontFamily={mono} fontSize="9">{b.sub}</text>
              <line x1={x0 + colW} y1={y + (rowH - 8) / 2} x2={x} y2={y + (rowH - 8) / 2} stroke="rgba(255,255,255,0.14)" strokeDasharray="3 5" />
            </g>
          );
        })}

        <text x={W / 2} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontFamily={mono} fontSize="9" letterSpacing="2">FIG. 1 · UNIFIED ARCHITECTURE OVERVIEW · REDRAWN AT CONCEPT LEVEL</text>
      </svg>
      <figcaption className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
        Ten subsystems · one transaction object · patent pending
      </figcaption>
    </figure>
  );
}
