import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loadit × MoneyGram — Partnership Brief",
  description:
    "Loadit is the AI money app that turns cash into any crypto. MoneyGram Ramps is the licensed cash rail. Together: the simplest cash-to-crypto experience in the world.",
  alternates: { canonical: "/moneygram" },
  robots: { index: false, follow: false },
};

const FLOW = [
  { n: "1", t: "Pay cash at MoneyGram", d: "The user shows a Loadit code at any of 350,000+ MoneyGram locations and hands over cash. MoneyGram verifies identity at the counter." },
  { n: "2", t: "Cash → USDC on Stellar", d: "MoneyGram Ramps converts the cash to USDC on Stellar — the licensed, regulated leg. Loadit never touches it." },
  { n: "3", t: "HQ swaps to the chosen asset", d: "Loadit's AI, HQ, bridges and swaps the USDC into whatever the user picked — Bitcoin, Solana, Ethereum — via a licensed liquidity provider." },
  { n: "4", t: "Lands in the user's wallet", d: "The asset is delivered to a wallet the user controls. They never hold Stellar USDC or need a Stellar wallet." },
];

const WHY = [
  { t: "Non-custodial by construction", d: "Loadit orchestrates; it never holds funds. That's structurally aligned with how Ramps works — MoneyGram stays the money-transmitter of record." },
  { t: "HQ removes the crypto learning curve", d: "Users don't pick chains, bridges, or wallets to fund. They say what they want; HQ routes cash → USDC → asset in one flow." },
  { t: "Live product, real users", d: "The iOS app is shipping with HQ, the Load flow, and live provider quotes. This is a front-end ready to send you volume, not a concept." },
  { t: "Transparent 0.75% fee", d: "One flat, visible fee — cheaper than banks, cards, and crypto ATMs. Simple pricing that spreads by word of mouth in cash-first communities." },
];

const READY = [
  { k: "SEP-1", v: "stellar.toml live", d: "Hosted at loadit.net/.well-known/stellar.toml." },
  { k: "SEP-10 / 24", v: "Ready to wire", d: "Interactive deposit against your anchor." },
  { k: "Swap layer", v: "Provider-agnostic", d: "USDC→asset executor plugs in on your signal." },
];

// MoneyGram Ramps USDC pricing tiers + Loadit's flat 0.75%, worked through at
// typical load sizes so the all-in cost is visible at a glance.
const PRICING_TIERS = [
  { range: "$15 – $99", fee: "$2" },
  { range: "$100 – $999", fee: "$2 + 1%" },
  { range: "$1,000 – $2,500", fee: "$10 + 0.5%" },
];
const PRICING_EXAMPLES = [
  { cash: "$100", mg: "$3.00", loadit: "$1.25", allIn: "4.3%" },
  { cash: "$250", mg: "$4.50", loadit: "$2.51", allIn: "2.8%" },
  { cash: "$500", mg: "$7.00", loadit: "$5.00", allIn: "2.4%" },
];

// Volume scenarios: users × 2 loads/mo × avg load, priced with MoneyGram's
// tiers and Loadit's flat 0.75% — so the brief shows what the partnership is
// worth to BOTH sides at each stage.
const PROJECTIONS = [
  { stage: "Pilot", users: "1,000", volume: "$300K / mo", mg: "$7K / mo", loadit: "$3K / mo" },
  { stage: "Growth", users: "10,000", volume: "$3M / mo", mg: "$70K / mo", loadit: "$30K / mo" },
  { stage: "Scale", users: "100,000", volume: "$40M / mo", mg: "$800K / mo", loadit: "$400K / mo" },
  { stage: "Year at scale", users: "—", volume: "$480M / yr", mg: "$9.6M / yr", loadit: "$4.8M / yr" },
];

export default function MoneyGramBrief() {
  return (
    <main className="mg-root">
      <MgStyle />

      <div className="mg-bar">
        <a href="/" className="mg-home">← loadit.net</a>
        <div className="mg-bar-actions">
          <a href="/moneygram/demo" className="mg-demo">▶ See the demo flow</a>
          <a href="/moneygram.pdf" download className="mg-dl">↓ Download PDF</a>
        </div>
      </div>

      <article className="mg-page grain">
        <div className="mg-glow" aria-hidden />

        <header className="mg-head">
          <div className="mg-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loadit-mark.png" alt="Loadit" width={40} height={40} />
            <span className="mg-word">Loadit</span>
            <span className="mg-x">×</span>
            <span className="mg-mg">MoneyGram</span>
          </div>
          <div className="mg-kicker font-mono">Partnership Brief · Confidential</div>
        </header>

        <h1 className="mg-h1">
          The simplest way to turn <span className="mg-grad">cash into any crypto</span> — on your rails.
        </h1>
        <p className="mg-lede">
          Loadit is the AI money app for the cash economy. MoneyGram Ramps is the licensed cash-in
          rail. Together we give 350,000+ counters a modern, non-custodial front-end: cash in,
          any crypto out, in one tap — with MoneyGram as the regulated money-transmitter and Loadit
          as the intelligence that routes the rest.
        </p>

        <section className="mg-flow">
          <div className="mg-sec font-mono">How it works</div>
          <div className="mg-flow-grid">
            {FLOW.map((s) => (
              <div key={s.n} className="mg-step">
                <div className="mg-step-n font-mono">{s.n}</div>
                <div className="mg-step-t">{s.t}</div>
                <div className="mg-step-d">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mg-chain font-mono">
            Cash <span className="mg-arrow">→</span> MoneyGram <span className="mg-arrow">→</span> USDC on Stellar
            <span className="mg-arrow">→</span> <span className="mg-grad">HQ swaps</span> <span className="mg-arrow">→</span> BTC / SOL / ETH
            <span className="mg-arrow">→</span> user&apos;s wallet
          </div>
        </section>

        <div className="mg-cols">
          <section className="mg-why">
            <div className="mg-sec font-mono">Why Loadit is the right wallet partner</div>
            <div className="mg-why-list">
              {WHY.map((w) => (
                <div key={w.t} className="mg-why-item">
                  <div className="mg-why-dot" aria-hidden />
                  <div>
                    <div className="mg-why-t">{w.t}</div>
                    <div className="mg-why-d">{w.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="mg-ready">
            <div className="mg-sec font-mono">Integration readiness</div>
            {READY.map((r) => (
              <div key={r.k} className="mg-ready-row">
                <span className="mg-ready-k font-mono">{r.k}</span>
                <div>
                  <div className="mg-ready-v">{r.v}</div>
                  <div className="mg-ready-d">{r.d}</div>
                </div>
              </div>
            ))}
            <div className="mg-oneliner">
              “We connect over the standards you already run — SEP-10 for auth, SEP-24 interactive
              deposit so your webview owns KYC and compliance end to end. Our stellar.toml is live;
              we need wallet-partner onboarding and sandbox access, and we can demo the flow today.”
            </div>
            <div className="mg-ask">
              <div className="mg-ask-t">The ask</div>
              <div className="mg-ask-d">Production anchor access + wallet-partner onboarding, and a pilot cash corridor to prove the flow end to end.</div>
            </div>
          </aside>
        </div>

        <section className="mg-pricing">
          <div className="mg-sec font-mono">Pricing — transparent, end to end</div>
          <div className="mg-price-grid">
            <div className="mg-price-card">
              <div className="mg-price-t">MoneyGram Ramps fee (USDC)</div>
              {PRICING_TIERS.map((t) => (
                <div key={t.range} className="mg-price-row">
                  <span>{t.range}</span><b>{t.fee}</b>
                </div>
              ))}
              <div className="mg-price-note">Plus Loadit&apos;s 0.75% ($1 minimum) and a visible 0.25% on the HQ swap leg — the only fees we add. No spread, no markup on the asset.</div>
            </div>
            <div className="mg-price-card">
              <div className="mg-price-t">What the user pays, all-in</div>
              <div className="mg-price-row mg-price-head">
                <span>Cash in</span><span>MoneyGram</span><span>Loadit</span><b>All-in</b>
              </div>
              {PRICING_EXAMPLES.map((e) => (
                <div key={e.cash} className="mg-price-row">
                  <span>{e.cash}</span><span>{e.mg}</span><span>{e.loadit}</span><b>{e.allIn}</b>
                </div>
              ))}
              <div className="mg-price-note">2–4% all-in vs 10–20% at crypto ATMs and ~4.5%+ on card on-ramps — the cheapest way to turn cash into crypto.</div>
            </div>
          </div>
        </section>

        <section className="mg-proj">
          <div className="mg-sec font-mono">Projected volume — what it&apos;s worth to both of us</div>
          <div className="mg-proj-table">
            <div className="mg-proj-row mg-proj-head">
              <span>Stage</span><span>Active users</span><span>Cash volume</span><span className="mg-mg-col">MoneyGram earns</span><b>Loadit earns (~1%)</b>
            </div>
            {PROJECTIONS.map((p) => (
              <div key={p.stage} className="mg-proj-row">
                <span>{p.stage}</span><span>{p.users}</span><span>{p.volume}</span><span className="mg-mg-col">{p.mg}</span><b>{p.loadit}</b>
              </div>
            ))}
          </div>
          <div className="mg-proj-note">
            Assumes 2 loads per active user per month at a $150–200 average, priced on the Ramps tiers above; Loadit&apos;s
            take is 0.75% ($1 min) plus 0.25% on the HQ swap leg (~1% blended). Every dollar of Loadit volume pays
            MoneyGram about 2× what it pays Loadit — our growth is your revenue.
            Cash-out (off-ramp, 174 countries) and larger corridors are upside on top.
          </div>
        </section>

        <footer className="mg-foot font-mono">
          <span>LOADIT × MONEYGRAM</span>
          <span className="mg-foot-line" aria-hidden />
          <a href="mailto:colt@loadit.net">colt@loadit.net</a>
          <span>loadit.net</span>
        </footer>
      </article>
    </main>
  );
}

function MgStyle() {
  return (
    <style>{`
      .mg-root { background:#04060B; color:#fff; min-height:100vh; }
      body > *:not(.mg-root) { display:none !important; }
      .mg-bar { position:fixed; top:0; left:0; right:0; height:52px; z-index:20; display:flex; align-items:center;
        justify-content:space-between; padding:0 18px; background:rgba(5,7,13,0.8); border-bottom:1px solid rgba(255,255,255,0.08); }
      .mg-home { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; }
      .mg-dl { background:#22A95C; color:#04060B; text-decoration:none; font-weight:700; font-size:13px; padding:8px 14px; border-radius:999px; }
      .mg-bar-actions { display:flex; align-items:center; gap:10px; }
      .mg-demo { color:#5EEAD4; text-decoration:none; font-weight:700; font-size:13px; padding:8px 14px; border-radius:999px; border:1px solid rgba(94,234,212,0.35); }

      .mg-page { position:relative; max-width:1040px; margin:52px auto 0; padding:44px 52px 34px; overflow:hidden;
        background:
          radial-gradient(ellipse 90% 55% at 50% -8%, rgba(34,169,92,0.14), transparent 62%),
          linear-gradient(180deg,#0A0E17,#05070D);
        border-left:1px solid rgba(255,255,255,0.06); border-right:1px solid rgba(255,255,255,0.06); }
      .mg-glow { position:absolute; top:-25%; right:-8%; width:52%; height:60%;
        background:radial-gradient(circle, rgba(34,211,238,0.09), transparent 60%); pointer-events:none; }

      .mg-head { display:flex; align-items:center; justify-content:space-between; }
      .mg-lockup { display:flex; align-items:center; gap:11px; }
      .mg-word { font-size:22px; font-weight:800; letter-spacing:-0.03em; }
      .mg-x { color:rgba(255,255,255,0.4); font-size:18px; }
      .mg-mg { font-size:22px; font-weight:800; letter-spacing:-0.03em; color:#E0553B; }
      .mg-kicker { font-size:11px; letter-spacing:0.24em; text-transform:uppercase; color:rgba(94,234,212,0.85); }

      .mg-h1 { font-size:clamp(28px,4vw,42px); font-weight:800; letter-spacing:-0.03em; line-height:1.05; margin:26px 0 14px; max-width:20ch; }
      .mg-grad { background:linear-gradient(90deg,#5EEAD4,#22C55E 50%,#16A34A); -webkit-background-clip:text; background-clip:text; color:transparent; }
      .mg-lede { color:rgba(255,255,255,0.66); font-size:15px; line-height:1.55; max-width:74ch; }

      .mg-sec { font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin-bottom:14px; }
      .mg-flow { margin-top:30px; }
      .mg-flow-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
      .mg-step { border:1px solid rgba(255,255,255,0.08); background:rgba(17,21,31,0.5); border-radius:14px; padding:15px; }
      .mg-step-n { width:26px; height:26px; border-radius:999px; border:1px solid rgba(34,169,92,0.45); color:#34D17A;
        display:flex; align-items:center; justify-content:center; font-size:12px; margin-bottom:11px; }
      .mg-step-t { font-weight:700; font-size:14px; letter-spacing:-0.01em; }
      .mg-step-d { color:rgba(255,255,255,0.58); font-size:11.5px; line-height:1.5; margin-top:6px; }
      .mg-chain { margin-top:16px; padding:12px 14px; border:1px solid rgba(255,255,255,0.08); border-radius:12px;
        background:rgba(34,169,92,0.05); font-size:12px; color:rgba(255,255,255,0.75); text-align:center; letter-spacing:0.02em; }
      .mg-arrow { color:#34D17A; margin:0 3px; }

      .mg-cols { display:grid; grid-template-columns:1.35fr 1fr; gap:28px; margin-top:30px; }
      .mg-why-list { display:flex; flex-direction:column; gap:14px; }
      .mg-why-item { display:flex; gap:11px; }
      .mg-why-dot { width:7px; height:7px; border-radius:2px; background:#22A95C; box-shadow:0 0 10px rgba(34,169,92,0.7); margin-top:6px; flex:none; }
      .mg-why-t { font-weight:700; font-size:14px; }
      .mg-why-d { color:rgba(255,255,255,0.6); font-size:12.5px; line-height:1.5; margin-top:3px; }

      .mg-ready { border:1px solid rgba(255,255,255,0.08); background:rgba(17,21,31,0.5); border-radius:16px; padding:18px; height:fit-content; }
      .mg-ready-row { display:flex; gap:11px; padding:9px 0; border-bottom:1px solid rgba(255,255,255,0.06); }
      .mg-ready-k { font-size:10px; letter-spacing:0.1em; color:rgba(94,234,212,0.8); width:58px; flex:none; padding-top:2px; text-transform:uppercase; }
      .mg-ready-v { font-size:13px; font-weight:700; }
      .mg-ready-d { font-size:11px; color:rgba(255,255,255,0.5); margin-top:2px; }
      .mg-oneliner { margin-top:14px; padding:12px 14px; border-left:2px solid #22A95C; background:rgba(34,169,92,0.06);
        border-radius:0 10px 10px 0; font-size:12.5px; line-height:1.55; color:rgba(255,255,255,0.8); font-style:italic; }
      .mg-ask { margin-top:14px; padding-top:12px; }
      .mg-ask-t { font-size:11px; letter-spacing:0.14em; text-transform:uppercase; color:#34D17A; }
      .mg-ask-d { font-size:12.5px; color:rgba(255,255,255,0.72); line-height:1.5; margin-top:6px; }

      .mg-pricing { margin-top:30px; }
      .mg-price-grid { display:grid; grid-template-columns:1fr 1.2fr; gap:14px; }
      .mg-price-card { border:1px solid rgba(255,255,255,0.08); background:rgba(17,21,31,0.5); border-radius:16px; padding:16px 18px; }
      .mg-price-t { font-weight:700; font-size:13px; margin-bottom:10px; }
      .mg-price-row { display:flex; justify-content:space-between; gap:8px; padding:6px 0; font-size:12.5px;
        color:rgba(255,255,255,0.7); border-bottom:1px solid rgba(255,255,255,0.05); }
      .mg-price-row span { flex:1; }
      .mg-price-row b { flex:1; text-align:right; color:#34D17A; font-weight:700; }
      .mg-price-head { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.4); }
      .mg-price-head b { color:rgba(255,255,255,0.4); }
      .mg-price-note { font-size:11px; color:rgba(255,255,255,0.5); line-height:1.5; margin-top:10px; }
      .mg-proj { margin-top:30px; }
      .mg-proj-table { border:1px solid rgba(255,255,255,0.08); background:rgba(17,21,31,0.5); border-radius:16px; padding:8px 18px; }
      .mg-proj-row { display:flex; gap:10px; padding:9px 0; font-size:12.5px; color:rgba(255,255,255,0.75);
        border-bottom:1px solid rgba(255,255,255,0.05); align-items:baseline; }
      .mg-proj-row:last-child { border-bottom:none; }
      .mg-proj-row span { flex:1; }
      .mg-proj-row b { flex:1.1; text-align:right; color:#34D17A; font-weight:700; }
      .mg-proj-row .mg-mg-col { color:#E0553B; font-weight:600; text-align:right; }
      .mg-proj-head { font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.4) !important; }
      .mg-proj-head span, .mg-proj-head b, .mg-proj-head .mg-mg-col { color:rgba(255,255,255,0.4); }
      .mg-proj-note { font-size:11px; color:rgba(255,255,255,0.5); line-height:1.55; margin-top:10px; max-width:88ch; }
      .mg-foot { display:flex; align-items:center; gap:14px; margin-top:32px; padding-top:16px;
        border-top:1px solid rgba(255,255,255,0.08); font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.4); }
      .mg-foot-line { flex:1; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.12),transparent); }
      .mg-foot a { color:rgba(94,234,212,0.75); text-decoration:none; }

      @media (max-width:720px) {
        .mg-page { padding:32px 22px; }
        .mg-flow-grid, .mg-cols, .mg-price-grid { grid-template-columns:1fr; }
        .mg-head { flex-direction:column; align-items:flex-start; gap:10px; }
        .mg-kicker { font-size:10px; }
        .mg-word, .mg-mg { font-size:19px; }
        .mg-h1 { font-size:30px; }
        .mg-foot { flex-wrap:wrap; gap:8px 12px; }
        .mg-foot-line { display:none; }
      }
      @media print {
        @page { size:1040px 1140px; margin:0; }
        .mg-bar { display:none !important; }
        .mg-page { margin:0; max-width:none; width:1040px; border:none; }
        .mg-root { background:#04060B !important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      }
    `}</style>
  );
}
