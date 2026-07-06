"use client";

import { useCallback, useEffect, useState } from "react";
import QR from "qrcode";

/**
 * LOADIT × MONEYGRAM — CLICK-THROUGH DEMO.
 *
 * A partner-facing walkthrough of the exact in-app experience: each step shows
 * the real app screen (mirrored from mobile/app/moneygram.tsx) in a phone frame,
 * with a narration panel explaining what happens behind the scenes — who the
 * licensed party is at each hop, and where Loadit sits (orchestration only,
 * never custody). Steps 4–5 self-animate to feel like the live product.
 */

const WALLET = "bc1qm3…x7v4";
const AMOUNT = 100;
const FEE = 1.0; // 0.75%, $1 minimum — a $100 load hits the floor
const SWAP_FEE = 0.25; // 0.25% on the HQ swap leg
const BTC_OUT = "0.00087 BTC";
const REF_CODE = "MG-4F72-1085";

interface StepInfo {
  label: string;
  title: string;
  narration: string[];
}

const STEPS: StepInfo[] = [
  {
    label: "Open Loadit",
    title: "The user opens Loadit",
    narration: [
      "Loadit is a live iOS + Android app — an AI money app for the cash economy.",
      "It's non-custodial: the balance shown settles in a wallet the user controls. Loadit orchestrates; it never holds funds.",
    ],
  },
  {
    label: "Choose",
    title: "They say what they want",
    narration: [
      "Pick the asset (Bitcoin here), the cash amount, and the wallet it should land in. That's the whole ask.",
      "No chains, bridges, or exchange accounts. The user never needs to know Stellar exists.",
    ],
  },
  {
    label: "The route",
    title: "Loadit shows the exact route",
    narration: [
      "Full transparency before any money moves: MoneyGram is the licensed cash leg and money-transmitter of record; HQ (Loadit's AI) handles the swap after.",
      "Loadit adds 0.75% ($1 minimum) plus 0.25% on the HQ swap — every fee shown up front, still cheaper than cards, banks, and crypto ATMs.",
    ],
  },
  {
    label: "Reference code",
    title: "Loadit issues a MoneyGram code",
    narration: [
      "A SEP-24 interactive deposit against the MoneyGram Ramps anchor produces a reference code.",
      "The user takes this code to any of 350,000+ MoneyGram locations — the counters you already operate.",
    ],
  },
  {
    label: "Pay cash",
    title: "Cash at the counter — your rails",
    narration: [
      "The customer shows the code and hands over cash. MoneyGram verifies identity at the counter — KYC stays on the licensed leg, exactly where it belongs.",
      "MoneyGram Ramps converts the cash to USDC on Stellar. Loadit never touches this hop.",
    ],
  },
  {
    label: "HQ settles",
    title: "HQ swaps and delivers",
    narration: [
      "The moment USDC lands, HQ bridges and swaps it into the asset the user picked, via a licensed liquidity provider.",
      "Delivery goes straight to the user's own wallet. At no point does Loadit custody the funds.",
    ],
  },
  {
    label: "Done",
    title: "Cash in, Bitcoin out",
    narration: [
      "Minutes after handing cash to a teller, the customer holds Bitcoin in a wallet they control — with a receipt for every hop.",
      "Simple, visible pricing that spreads by word of mouth in cash-first communities. This is the front-end that sends MoneyGram volume.",
    ],
  },
];

/** Settlement hops animated on steps 4–6 (index into this list = progress). */
const HOPS = [
  { t: "Cash received at MoneyGram", d: `$${AMOUNT}.00 · identity verified at counter` },
  { t: "USDC minted on Stellar", d: "MoneyGram Ramps — licensed leg" },
  { t: "HQ swaps USDC → BTC", d: "Licensed liquidity provider · best route" },
  { t: "BTC delivered to your wallet", d: WALLET },
];

export function DemoClient() {
  const [step, setStep] = useState(0);
  // How many settlement hops have completed (drives the step 4–6 animations).
  const [hopsDone, setHopsDone] = useState(0);

  const goTo = useCallback((n: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, n)));
  }, []);

  // Animate the settlement hops while on the counter / HQ screens.
  useEffect(() => {
    if (step === 4) {
      setHopsDone(0);
      const t = setTimeout(() => setHopsDone(1), 1600);
      return () => clearTimeout(t);
    }
    if (step === 5) {
      setHopsDone(1);
      const t2 = setTimeout(() => setHopsDone(2), 900);
      const t3 = setTimeout(() => setHopsDone(3), 2100);
      const t4 = setTimeout(() => setHopsDone(4), 3300);
      return () => { clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    }
    if (step === 6) setHopsDone(4);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goTo(step + 1);
      if (e.key === "ArrowLeft") goTo(step - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, goTo]);

  const info = STEPS[step];

  return (
    <main className="dm-root">
      <DemoStyle />

      <div className="dm-bar">
        <a href="/moneygram" className="dm-home">← Partnership brief</a>
        <span className="dm-bar-title font-mono">Loadit × MoneyGram · Demo Flow</span>
        <a href="/install" className="dm-dl">Get the app</a>
      </div>

      <div className="dm-stage">
        {/* ---------------------------------------------------------- phone */}
        <div className="dm-phone-col">
          <div className="dm-phone">
            <div className="dm-notch" aria-hidden />
            <div className="dm-screen">
              {step === 0 && <ScreenHome />}
              {step === 1 && <ScreenChoose />}
              {step === 2 && <ScreenRoute />}
              {step === 3 && <ScreenCode />}
              {(step === 4 || step === 5) && <ScreenSettle hopsDone={hopsDone} waiting={step === 4 && hopsDone === 0} />}
              {step === 6 && <ScreenDone />}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------ narration */}
        <div className="dm-side">
          <div className="dm-kicker font-mono">Step {step + 1} of {STEPS.length}</div>
          <h1 className="dm-h1">{info.title}</h1>
          {info.narration.map((p) => (
            <p key={p} className="dm-p">{p}</p>
          ))}

          <div className="dm-nav">
            <button className="dm-btn dm-btn-ghost" onClick={() => goTo(step - 1)} disabled={step === 0}>← Back</button>
            {step < STEPS.length - 1 ? (
              <button className="dm-btn dm-btn-go" onClick={() => goTo(step + 1)}>Next →</button>
            ) : (
              <button className="dm-btn dm-btn-go" onClick={() => goTo(0)}>Replay ↺</button>
            )}
          </div>

          <div className="dm-dots">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                className={`dm-dot ${i === step ? "dm-dot-on" : ""} ${i < step ? "dm-dot-past" : ""}`}
                onClick={() => goTo(i)}
                title={s.label}
              >
                <span className="dm-dot-label">{s.label}</span>
              </button>
            ))}
          </div>

          <div className="dm-chain font-mono">
            Cash <span className="dm-arrow">→</span> MoneyGram <span className="dm-arrow">→</span> USDC on Stellar
            <span className="dm-arrow">→</span> <span className="dm-grad">HQ swaps</span> <span className="dm-arrow">→</span> BTC
            <span className="dm-arrow">→</span> user&apos;s wallet
          </div>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------- app screens */

function AppHeader({ title }: { title: string }) {
  return (
    <div className="ap-head">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loadit-mark.png" alt="" width={20} height={20} />
      <span className="ap-head-t">{title}</span>
    </div>
  );
}

function ScreenHome() {
  return (
    <div className="ap">
      <AppHeader title="Loadit" />
      <div className="ap-balance-card">
        <div className="ap-bal-label">Your balance</div>
        <div className="ap-bal">$1,284.10</div>
        <div className="ap-bal-sub">@colton · non-custodial · Hylaq wallet</div>
      </div>
      <div className="ap-grid">
        <div className="ap-tile ap-tile-hot">
          <div className="ap-tile-emoji">💵</div>
          <div className="ap-tile-t">Load cash</div>
          <div className="ap-tile-d">At 350,000+ MoneyGram counters</div>
        </div>
        <div className="ap-tile">
          <div className="ap-tile-emoji">✦</div>
          <div className="ap-tile-t">HQ — your AI</div>
          <div className="ap-tile-d">Say it. HQ routes it.</div>
        </div>
        <div className="ap-tile">
          <div className="ap-tile-emoji">↗</div>
          <div className="ap-tile-t">Send</div>
          <div className="ap-tile-d">Any @handle or wallet</div>
        </div>
        <div className="ap-tile">
          <div className="ap-tile-emoji">📡</div>
          <div className="ap-tile-t">Pulse</div>
          <div className="ap-tile-d">Pay nearby — no internet</div>
        </div>
      </div>
      <div className="ap-hint">Tap <b>Load cash</b> to turn paper money into any crypto.</div>
    </div>
  );
}

function ScreenChoose() {
  return (
    <div className="ap">
      <AppHeader title="Cash → crypto" />
      <div className="ap-h1">Cash → crypto at MoneyGram</div>
      <div className="ap-sub">Pay cash at 350,000+ MoneyGram locations. They verify you at the counter; HQ delivers the asset to your own wallet.</div>

      <div className="ap-label">You want</div>
      <div className="ap-row">
        {["BTC", "ETH", "SOL", "USDC"].map((a) => (
          <span key={a} className={`ap-chip ${a === "BTC" ? "ap-chip-on" : ""}`}>{a}</span>
        ))}
      </div>

      <div className="ap-label">Cash amount (USD)</div>
      <div className="ap-row">
        {[40, 100, 250, 500].map((v) => (
          <span key={v} className={`ap-chip ${v === AMOUNT ? "ap-chip-on" : ""}`}>${v}</span>
        ))}
      </div>

      <div className="ap-label">Your wallet address (BTC)</div>
      <div className="ap-input">{WALLET}</div>

      <div className="ap-cta">See my route</div>
    </div>
  );
}

function ScreenRoute() {
  const steps = [
    { t: "Pay cash at MoneyGram", d: "Show your code at any counter — they verify your ID." },
    { t: "Cash becomes USDC on Stellar", d: "MoneyGram Ramps — the licensed leg." },
    { t: "HQ swaps USDC → BTC", d: "Best route via a licensed liquidity provider." },
    { t: "BTC lands in your wallet", d: WALLET },
  ];
  return (
    <div className="ap">
      <AppHeader title="Your route" />
      <div className="ap-h1">Your route</div>
      {steps.map((s, i) => (
        <div key={s.t} className="ap-step">
          <div className="ap-step-rail">
            <div className="ap-step-dot">{i + 1}</div>
            {i < steps.length - 1 && <div className="ap-step-line" />}
          </div>
          <div>
            <div className="ap-step-t">{s.t}</div>
            <div className="ap-step-d">{s.d}</div>
          </div>
        </div>
      ))}
      <div className="ap-fees">
        <div className="ap-fee-row"><span>Cash in</span><b>${AMOUNT.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>Loadit fee (0.75%, $1 min)</span><b>${FEE.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>HQ swap (0.25%)</span><b>${SWAP_FEE.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>Delivered as</span><b>BTC → your wallet</b></div>
      </div>
      <div className="ap-cta">Get my MoneyGram code</div>
    </div>
  );
}

/**
 * A real, scannable QR carrying the MoneyGram reference — with the Loadit mark
 * knocked out of the center. High error correction (H) tolerates the logo
 * cut-out, so it still scans; the reference code stays printed beneath for
 * counters that type it instead.
 */
function LoaditQr({ text }: { text: string }) {
  const qr = QR.create(text, { errorCorrectionLevel: "H" });
  const n = qr.modules.size;
  const hole = Math.ceil(n * 0.3); // center knockout for the logo
  const h0 = Math.floor((n - hole) / 2);
  const cells: JSX.Element[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const inHole = x >= h0 && x < h0 + hole && y >= h0 && y < h0 + hole;
      if (!inHole && qr.modules.get(x, y)) {
        cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.05} height={1.05} rx={0.22} />);
      }
    }
  }
  return (
    <div className="ap-qr">
      <svg viewBox={`0 0 ${n} ${n}`} className="ap-qr-svg" shapeRendering="geometricPrecision">
        <g fill="#0B0D12">{cells}</g>
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loadit-mark.png" alt="" className="ap-qr-mark" />
    </div>
  );
}

function ScreenCode() {
  return (
    <div className="ap ap-center">
      <AppHeader title="Pay at MoneyGram" />
      <div className="ap-code-card">
        <div className="ap-code-label">Show this at the counter</div>
        <LoaditQr text={`LOADIT:${REF_CODE}:${AMOUNT}.00`} />
        <div className="ap-code font-mono">{REF_CODE}</div>
        <div className="ap-code-amt">${AMOUNT}.00 cash</div>
      </div>
      <div className="ap-loc">
        <div className="ap-loc-pin">📍</div>
        <div>
          <div className="ap-loc-t">MoneyGram — Walmart Supercenter</div>
          <div className="ap-loc-d">0.4 mi away · open until 10 pm</div>
        </div>
      </div>
      <div className="ap-hint">Bring your ID — MoneyGram verifies you at the counter.</div>
    </div>
  );
}

function ScreenSettle({ hopsDone, waiting }: { hopsDone: number; waiting: boolean }) {
  return (
    <div className="ap">
      <AppHeader title={waiting ? "Waiting for cash" : "Settling"} />
      <div className="ap-h1">{waiting ? "Hand the cash to the teller" : "Money in motion"}</div>
      {waiting && <div className="ap-sub">Code {REF_CODE} · ${AMOUNT}.00 — this screen updates the moment MoneyGram confirms.</div>}
      <div className="ap-hops">
        {HOPS.map((h, i) => {
          const done = i < hopsDone;
          const active = i === hopsDone;
          return (
            <div key={h.t} className={`ap-hop ${done ? "ap-hop-done" : ""} ${active ? "ap-hop-active" : ""}`}>
              <div className="ap-hop-ic">{done ? "✓" : active ? <span className="ap-spin" /> : i + 1}</div>
              <div>
                <div className="ap-hop-t">{h.t}</div>
                <div className="ap-hop-d">{h.d}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="ap-hint">Non-custodial: Loadit routes this — it never holds your money.</div>
    </div>
  );
}

function ScreenDone() {
  return (
    <div className="ap ap-center">
      <AppHeader title="Done" />
      <div className="ap-success">✓</div>
      <div className="ap-done-amt">+{BTC_OUT}</div>
      <div className="ap-done-sub">landed in your wallet</div>
      <div className="ap-fees" style={{ width: "100%" }}>
        <div className="ap-fee-row"><span>Cash in</span><b>${AMOUNT.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>MoneyGram leg</span><b>USDC on Stellar</b></div>
        <div className="ap-fee-row"><span>Loadit fee (0.75%, $1 min)</span><b>${FEE.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>HQ swap (0.25%)</span><b>${SWAP_FEE.toFixed(2)}</b></div>
        <div className="ap-fee-row"><span>Delivered</span><b>{BTC_OUT}</b></div>
        <div className="ap-fee-row"><span>To</span><b>{WALLET}</b></div>
      </div>
      <div className="ap-hint">Loadit never held your funds. Receipt saved to your history.</div>
    </div>
  );
}

/* ------------------------------------------------------------------ styles */

function DemoStyle() {
  return (
    <style>{`
      .dm-root { background:#04060B; color:#fff; min-height:100vh; }
      body > *:not(.dm-root) { display:none !important; }

      .dm-bar { position:fixed; top:0; left:0; right:0; height:52px; z-index:20; display:flex; align-items:center;
        justify-content:space-between; padding:0 18px; background:rgba(5,7,13,0.85); border-bottom:1px solid rgba(255,255,255,0.08); }
      .dm-home { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; }
      .dm-bar-title { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(94,234,212,0.85); }
      .dm-dl { background:#22A95C; color:#04060B; text-decoration:none; font-weight:700; font-size:13px; padding:8px 14px; border-radius:999px; }

      .dm-stage { display:grid; grid-template-columns:auto 1fr; gap:56px; align-items:center;
        max-width:1040px; margin:0 auto; padding:96px 32px 48px; min-height:100vh; }

      /* phone frame */
      .dm-phone { width:320px; height:660px; border-radius:44px; padding:10px; position:relative;
        background:linear-gradient(160deg,#20242E,#0B0E14); box-shadow:0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.09),
        0 0 120px rgba(34,169,92,0.08); }
      .dm-notch { position:absolute; top:10px; left:50%; transform:translateX(-50%); width:110px; height:26px;
        background:#04060B; border-radius:0 0 16px 16px; z-index:3; }
      .dm-screen { width:100%; height:100%; border-radius:36px; overflow:hidden; background:#0A0E17; position:relative;
        border:1px solid rgba(255,255,255,0.06); }

      /* app chrome */
      .ap { padding:44px 18px 18px; height:100%; display:flex; flex-direction:column; animation:apIn 0.35s ease; }
      @keyframes apIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      .ap-center { align-items:center; text-align:center; }
      .ap-head { display:flex; align-items:center; gap:7px; margin-bottom:14px; }
      .ap-head-t { font-weight:800; font-size:14px; letter-spacing:-0.02em; }
      .ap-h1 { font-size:19px; font-weight:800; letter-spacing:-0.02em; line-height:1.15; }
      .ap-sub { color:rgba(255,255,255,0.55); font-size:11px; line-height:1.5; margin-top:7px; }
      .ap-label { font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.4); margin:14px 0 7px; }
      .ap-row { display:flex; gap:6px; flex-wrap:wrap; }
      .ap-chip { border:1px solid rgba(255,255,255,0.12); border-radius:999px; padding:6px 13px; font-size:11.5px; font-weight:700; color:rgba(255,255,255,0.55); }
      .ap-chip-on { border-color:#22A95C; background:rgba(34,169,92,0.14); color:#fff; }
      .ap-input { border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.03); border-radius:12px;
        padding:11px 13px; font-size:12px; color:rgba(255,255,255,0.85); }
      .ap-cta { margin-top:auto; background:#22A95C; color:#04060B; font-weight:800; font-size:13px; text-align:center;
        border-radius:999px; padding:13px; }
      .ap-hint { color:rgba(255,255,255,0.42); font-size:10px; line-height:1.5; text-align:center; margin-top:12px; }
      .ap-hint b { color:rgba(255,255,255,0.7); }

      /* home */
      .ap-balance-card { background:linear-gradient(150deg,rgba(34,169,92,0.16),rgba(34,211,238,0.05)); border:1px solid rgba(34,169,92,0.25);
        border-radius:18px; padding:16px; }
      .ap-bal-label { font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:rgba(255,255,255,0.5); }
      .ap-bal { font-size:30px; font-weight:800; letter-spacing:-0.03em; margin-top:4px; }
      .ap-bal-sub { font-size:10px; color:rgba(255,255,255,0.5); margin-top:4px; }
      .ap-grid { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:12px; }
      .ap-tile { border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.02); border-radius:15px; padding:12px; }
      .ap-tile-hot { border-color:#22A95C; background:rgba(34,169,92,0.1); box-shadow:0 0 24px rgba(34,169,92,0.15); }
      .ap-tile-emoji { font-size:17px; }
      .ap-tile-t { font-size:12px; font-weight:800; margin-top:7px; }
      .ap-tile-d { font-size:9.5px; color:rgba(255,255,255,0.5); line-height:1.4; margin-top:3px; }

      /* route */
      .ap-step { display:flex; gap:10px; margin-top:11px; }
      .ap-step-rail { display:flex; flex-direction:column; align-items:center; }
      .ap-step-dot { width:20px; height:20px; border-radius:999px; border:1px solid rgba(34,169,92,0.5); color:#34D17A;
        font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; flex:none; }
      .ap-step-line { width:1px; flex:1; background:rgba(34,169,92,0.3); margin-top:3px; }
      .ap-step-t { font-size:12px; font-weight:700; }
      .ap-step-d { font-size:10px; color:rgba(255,255,255,0.5); line-height:1.45; margin-top:2px; padding-bottom:4px; }
      .ap-fees { border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.02); border-radius:13px; padding:11px 13px; margin-top:13px; }
      .ap-fee-row { display:flex; justify-content:space-between; font-size:11px; padding:3.5px 0; color:rgba(255,255,255,0.55); }
      .ap-fee-row b { color:#fff; font-weight:700; }

      /* code */
      .ap-code-card { background:#fff; color:#0B0D12; border-radius:18px; padding:18px 16px; width:100%; text-align:center; margin-top:8px; }
      .ap-code-label { font-size:9px; letter-spacing:0.14em; text-transform:uppercase; color:rgba(11,13,18,0.55); }
      .ap-qr { position:relative; width:148px; height:148px; margin:12px auto 10px; }
      .ap-qr-svg { width:100%; height:100%; display:block; }
      .ap-qr-mark { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:34px; height:34px; border-radius:8px; }
      .ap-code { font-size:17px; font-weight:800; letter-spacing:0.08em; }
      .ap-code-amt { font-size:12px; color:rgba(11,13,18,0.6); margin-top:4px; font-weight:600; }
      .ap-loc { display:flex; gap:9px; align-items:center; border:1px solid rgba(255,255,255,0.09); background:rgba(255,255,255,0.02);
        border-radius:13px; padding:11px; margin-top:12px; width:100%; text-align:left; }
      .ap-loc-pin { font-size:16px; }
      .ap-loc-t { font-size:11.5px; font-weight:700; }
      .ap-loc-d { font-size:10px; color:rgba(255,255,255,0.5); margin-top:2px; }

      /* settlement */
      .ap-hops { display:flex; flex-direction:column; gap:9px; margin-top:16px; }
      .ap-hop { display:flex; gap:10px; align-items:flex-start; border:1px solid rgba(255,255,255,0.07); border-radius:13px;
        padding:10px 12px; opacity:0.45; transition:all 0.4s ease; }
      .ap-hop-active { opacity:1; border-color:rgba(34,211,238,0.35); background:rgba(34,211,238,0.05); }
      .ap-hop-done { opacity:1; border-color:rgba(34,169,92,0.4); background:rgba(34,169,92,0.07); }
      .ap-hop-ic { width:20px; height:20px; border-radius:999px; border:1px solid rgba(255,255,255,0.2); font-size:10px; font-weight:800;
        display:flex; align-items:center; justify-content:center; flex:none; color:rgba(255,255,255,0.6); }
      .ap-hop-done .ap-hop-ic { border-color:#22A95C; background:#22A95C; color:#04060B; }
      .ap-hop-t { font-size:11.5px; font-weight:700; }
      .ap-hop-d { font-size:9.5px; color:rgba(255,255,255,0.5); margin-top:2px; }
      .ap-spin { width:10px; height:10px; border:1.5px solid rgba(34,211,238,0.3); border-top-color:#22D3EE; border-radius:999px;
        display:inline-block; animation:apSpin 0.8s linear infinite; }
      @keyframes apSpin { to { transform:rotate(360deg); } }

      /* done */
      .ap-success { width:64px; height:64px; border-radius:999px; background:#22A95C; color:#04060B; font-size:30px; font-weight:800;
        display:flex; align-items:center; justify-content:center; margin-top:26px; animation:apPop 0.45s cubic-bezier(0.2,1.4,0.4,1); }
      @keyframes apPop { from { transform:scale(0.4); opacity:0; } to { transform:scale(1); opacity:1; } }
      .ap-done-amt { font-size:26px; font-weight:800; letter-spacing:-0.02em; margin-top:14px; }
      .ap-done-sub { font-size:11px; color:rgba(255,255,255,0.55); margin-top:3px; margin-bottom:14px; }

      /* narration side */
      .dm-side { max-width:480px; }
      .dm-kicker { font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:rgba(94,234,212,0.85); }
      .dm-h1 { font-size:clamp(26px,3.4vw,36px); font-weight:800; letter-spacing:-0.03em; line-height:1.08; margin:12px 0 14px; }
      .dm-p { color:rgba(255,255,255,0.66); font-size:14.5px; line-height:1.6; margin-bottom:12px; }
      .dm-grad { background:linear-gradient(90deg,#5EEAD4,#22C55E 50%,#16A34A); -webkit-background-clip:text; background-clip:text; color:transparent; }

      .dm-nav { display:flex; gap:10px; margin-top:20px; }
      .dm-btn { border-radius:999px; padding:12px 22px; font-size:14px; font-weight:700; cursor:pointer; border:1px solid transparent; }
      .dm-btn-ghost { background:transparent; border-color:rgba(255,255,255,0.16); color:rgba(255,255,255,0.75); }
      .dm-btn-ghost:disabled { opacity:0.35; cursor:default; }
      .dm-btn-go { background:#22A95C; color:#04060B; }

      .dm-dots { display:flex; gap:6px; margin-top:22px; flex-wrap:wrap; }
      .dm-dot { position:relative; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); border-radius:999px;
        padding:6px 11px; cursor:pointer; }
      .dm-dot-label { font-size:10.5px; font-weight:700; color:rgba(255,255,255,0.5); }
      .dm-dot-past { border-color:rgba(34,169,92,0.35); }
      .dm-dot-past .dm-dot-label { color:rgba(52,209,122,0.8); }
      .dm-dot-on { border-color:#22A95C; background:rgba(34,169,92,0.14); }
      .dm-dot-on .dm-dot-label { color:#fff; }

      .dm-chain { margin-top:26px; padding:12px 14px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;
        background:rgba(34,169,92,0.05); font-size:11.5px; color:rgba(255,255,255,0.72); letter-spacing:0.02em; }
      .dm-arrow { color:#34D17A; margin:0 3px; }

      @media (max-width:880px) {
        .dm-stage { grid-template-columns:1fr; gap:28px; justify-items:center; padding:82px 16px 40px; }
        .dm-side { text-align:center; }
        .dm-nav, .dm-dots { justify-content:center; }
        .dm-phone { width:290px; height:600px; }
        .dm-bar-title { display:none; }
      }
    `}</style>
  );
}
