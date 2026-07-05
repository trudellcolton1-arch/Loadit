"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * LOADIT — Investor Deck. Lives at /deck, on-brand with the site (void/rail
 * palette, Inter + JetBrains Mono). Each slide is a 16:9 surface on screen and
 * a single landscape page in print, so "Download PDF" (which links to the
 * pre-rendered /deck.pdf) and the browser's print-to-PDF both produce a clean,
 * emailable deck. Revenue figures are labelled targets/estimates, not promises.
 */

const RAISE = {
  amount: "$5M",
  stage: "Pre-Seed (SAFE)",
  contact: "trudellcolton@gmail.com",
};

export function DeckClient() {
  const [active, setActive] = useState(1);

  useEffect(() => {
    const slides = Array.from(document.querySelectorAll<HTMLElement>("[data-slide]"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-slide")));
        });
      },
      { threshold: 0.55 }
    );
    slides.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowRight" && e.key !== "ArrowUp" && e.key !== "ArrowLeft") return;
      const dir = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
      const next = Math.min(TOTAL, Math.max(1, active + dir));
      document.getElementById(`slide-${next}`)?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  return (
    <main className="deck-root bg-void text-white">
      <StyleBlock />

      {/* Toolbar — hidden in print */}
      <div className="deck-toolbar">
        <a href="/" className="deck-brand" aria-label="Loadit home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loadit-mark.png" alt="" width={22} height={22} />
          <span>Loadit</span>
        </a>
        <div className="deck-toolbar-actions">
          <span className="deck-progress font-mono">
            {String(active).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
          </span>
          <a href="/deck.pdf" download className="deck-btn deck-btn-primary">
            ↓ Download PDF
          </a>
          <button type="button" className="deck-btn" onClick={() => window.print()}>
            Print
          </button>
        </div>
      </div>

      <div className="deck-scroll">
        {SLIDES.map((S, i) => (
          <section
            key={i}
            id={`slide-${i + 1}`}
            data-slide={i + 1}
            className="deck-slide"
          >
            <div className="deck-slide-inner grain">
              <div className="deck-glow" aria-hidden />
              {S}
              <SlideFooter n={i + 1} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ chrome */

function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="deck-eyebrow font-mono">{children}</div>;
}

function SlideFooter({ n }: { n: number }) {
  return (
    <div className="deck-footer font-mono">
      <span>LOADIT</span>
      <span className="deck-footer-line" aria-hidden />
      <span>loadit.net</span>
      <span className="deck-footer-num">{String(n).padStart(2, "0")}</span>
    </div>
  );
}

function Stat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="deck-stat glass">
      <div className="deck-stat-value">{value}</div>
      <div className="deck-stat-label">{label}</div>
      {sub ? <div className="deck-stat-sub">{sub}</div> : null}
    </div>
  );
}

function Pillar({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div className="deck-pillar glass">
      <div className="deck-pillar-tag font-mono">{tag}</div>
      <div className="deck-pillar-title">{title}</div>
      <div className="deck-pillar-body">{body}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ slides */

const TOTAL = 14;

const SLIDES: ReactNode[] = [
  /* 01 — COVER */
  <div key="cover" className="deck-cover">
    <div className="deck-cover-mark">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loadit-mark.png" alt="Loadit" width={64} height={64} />
      <span className="deck-cover-word">Loadit</span>
    </div>
    <Eyebrow>Investor Brief · Confidential</Eyebrow>
    <h1 className="deck-h1 deck-title-xl">
      Move Value.
      <br />
      <span className="text-rail-gradient">Anywhere.</span>
    </h1>
    <p className="deck-lede">
      The AI-powered financial rail. Cash and cards in — Bitcoin, stablecoins, and the
      future of money out, routed the cheapest real way by <b>HQ</b>, your money&apos;s AI.
    </p>
    <div className="deck-cover-meta font-mono">
      <span>{RAISE.stage}</span>
      <span>·</span>
      <span>{RAISE.contact}</span>
    </div>
  </div>,

  /* 02 — PROBLEM */
  <div key="problem" className="deck-body">
    <Eyebrow>01 · The Problem</Eyebrow>
    <h2 className="deck-h2">Moving money still breaks at the edges.</h2>
    <div className="deck-two">
      <ul className="deck-list">
        <li>
          <b>Cash → crypto is a rip-off.</b> Bitcoin ATMs skim 7–15%. Card on-ramps
          bury 4–5% spreads users never see.
        </li>
        <li>
          <b>The people who need it most pay the most.</b> ~60M underbanked US adults
          run on cash — the single most expensive way onto digital rails.
        </li>
        <li>
          <b>Liquidity is fragmented.</b> Value is scattered across dozens of chains;
          users guess the network and overpay on every transfer.
        </li>
      </ul>
      <div className="deck-quote glass">
        <div className="deck-quote-mark font-mono">“</div>
        <p>
          The internet moved <span className="text-rail-gradient">information</span> for
          free. Value still moves like it&apos;s 1971.
        </p>
      </div>
    </div>
  </div>,

  /* 03 — SOLUTION */
  <div key="solution" className="deck-body">
    <Eyebrow>02 · The Solution</Eyebrow>
    <h2 className="deck-h2">
      One AI rail that routes any value the <span className="text-rail-gradient">cheapest real way</span>.
    </h2>
    <p className="deck-lede deck-lede-tight">
      Tell HQ what you want. It parses the intent, scores every network and licensed
      partner in real time, delivers straight to your own wallet — and proves it got you
      the best price.
    </p>
    <div className="deck-pillars">
      <Pillar tag="HQ" title="Your AI does everything" body="One intelligence that routes, quotes, executes, and explains — in plain language, on your phone." />
      <Pillar tag="Non-custodial" title="Loadit never holds funds" body="Licensed partners settle straight to a wallet you control. No float, no money-transmitter burden." />
      <Pillar tag="Proof" title="Best price, receipted" body="Every route ships with a signed receipt showing it beat the alternatives. The money app that proves it." />
    </div>
  </div>,

  /* 04 — PRODUCT */
  <div key="product" className="deck-body">
    <Eyebrow>03 · The Product · Live on iOS</Eyebrow>
    <h2 className="deck-h2">HQ — your money&apos;s AI, in your pocket.</h2>
    <div className="deck-grid-2x2">
      <Pillar tag="Say it" title="HQ routes everything" body="“Turn $200 cash into Bitcoin.” HQ returns a grounded route with live fees and one-tap buy." />
      <Pillar tag="Load" title="Cash or card → crypto in 4 taps" body="Method → amount → coin → wallet. Licensed checkout, delivered to you." />
      <Pillar tag="Quote" title="Live provider comparison" body="Zero Hash, Transak, MoonPay and more — compared live, best deal first, signed receipt attached." />
      <Pillar tag="Cash" title="Cash at any register" body="Deposit paper cash at 90,000+ stores, then buy crypto through a licensed on-ramp." />
    </div>
  </div>,

  /* 05 — HOW IT WORKS */
  <div key="how" className="deck-body">
    <Eyebrow>04 · How It Works</Eyebrow>
    <h2 className="deck-h2">Four steps. Non-custodial end to end.</h2>
    <div className="deck-steps">
      {[
        { n: "1", t: "Say it", d: "Tell HQ the move in plain language, or run the Load flow." },
        { n: "2", t: "HQ routes", d: "Scores 8+ networks and every licensed partner for the cheapest real path." },
        { n: "3", t: "Partner executes", d: "A licensed provider does KYC + settlement. Loadit never touches funds." },
        { n: "4", t: "It lands", d: "Crypto arrives in your own wallet — with a receipt proving the price." },
      ].map((s) => (
        <div key={s.n} className="deck-step glass">
          <div className="deck-step-n font-mono">{s.n}</div>
          <div className="deck-step-t">{s.t}</div>
          <div className="deck-step-d">{s.d}</div>
        </div>
      ))}
    </div>
  </div>,

  /* 06 — WHY NOW */
  <div key="whynow" className="deck-body">
    <Eyebrow>05 · Why Now</Eyebrow>
    <h2 className="deck-h2">Three curves just crossed.</h2>
    <div className="deck-pillars">
      <Pillar tag="Stablecoins" title="Trillions now settle on-chain" body="Digital dollars went mainstream. The demand to move between cash and chains is here and growing." />
      <Pillar tag="Infrastructure" title="On-ramps became APIs" body="Coinbase, Stripe, Zero Hash and others turned licensed KYC + settlement into callable endpoints. We orchestrate them." />
      <Pillar tag="AI" title="Intent is now parseable" body="LLMs can turn “send my mom $200 the cheapest way” into a structured, grounded route in real time." />
    </div>
  </div>,

  /* 07 — MARKET */
  <div key="market" className="deck-body">
    <Eyebrow>06 · Market</Eyebrow>
    <h2 className="deck-h2">A wedge into a multi-hundred-billion-dollar flow.</h2>
    <div className="deck-tam">
      {[
        { k: "TAM", v: "$400B+", l: "Global on-ramp + remittance + cash-to-digital volume, annually.", w: 100 },
        { k: "SAM", v: "$60B", l: "US cash-to-crypto & underbanked digital payments.", w: 55 },
        { k: "SOM", v: "$4B", l: "Reachable GMV at Loadit's 3-year adoption target.", w: 22 },
      ].map((r) => (
        <div key={r.k} className="deck-tam-row">
          <div className="deck-tam-head">
            <span className="font-mono deck-tam-k">{r.k}</span>
            <span className="deck-tam-v">{r.v}</span>
          </div>
          <div className="deck-tam-bar">
            <div className="deck-tam-fill" style={{ width: `${r.w}%` }} />
          </div>
          <div className="deck-tam-l">{r.l}</div>
        </div>
      ))}
    </div>
    <p className="deck-note font-mono">Figures are directional estimates from public market sizing.</p>
  </div>,

  /* 08 — BUSINESS MODEL */
  <div key="model" className="deck-body">
    <Eyebrow>07 · Business Model</Eyebrow>
    <h2 className="deck-h2">A flat 3% convenience fee on every conversion.</h2>
    <div className="deck-two">
      <ul className="deck-list">
        <li>
          <b>3% flat, shown before you confirm.</b> One transparent fee on the amount
          converted — no hidden spread, no surprise math.
        </li>
        <li>
          <b>Still the cheapest way in.</b> 3% all-in beats Bitcoin ATMs (7–15%) and card
          on-ramps (4–5%). Transparency is the wedge.
        </li>
        <li>
          <b>Non-custodial by design</b> — licensed partners settle the money, so Loadit
          avoids money-transmitter licensing: high margin, fast to scale.
        </li>
      </ul>
      <div className="deck-econ glass">
        <div className="deck-econ-title font-mono">Unit economics · $150 order</div>
        <div className="deck-econ-row"><span>Order value</span><b>$150.00</b></div>
        <div className="deck-econ-row"><span>Convenience fee (3%)</span><b className="text-rail-gradient">$4.50</b></div>
        <div className="deck-econ-row"><span>Marginal cost</span><b>~$0.05</b></div>
        <div className="deck-econ-row deck-econ-total"><span>Contribution</span><b>~$4.45</b></div>
      </div>
    </div>
  </div>,

  /* 09 — REVENUE MATH */
  <div key="revenue" className="deck-body">
    <Eyebrow>08 · The Math</Eyebrow>
    <h2 className="deck-h2">Revenue scales with usage, not store count.</h2>
    <div className="deck-scenarios">
      {[
        { k: "Wedge", u: "10K", tx: "1×", gmv: "$1.5M/mo", rev: "$540K", w: 8, hot: false },
        { k: "Traction", u: "100K", tx: "2×", gmv: "$30M/mo", rev: "$10.8M", w: 34, hot: true },
        { k: "Scale", u: "1M", tx: "2×", gmv: "$400M/mo", rev: "$144M", w: 72, hot: false },
        { k: "Cash App scale", u: "57M", tx: "2×", gmv: "$20B/mo", rev: "$7.2B", w: 100, hot: false },
      ].map((s) => (
        <div key={s.k} className={`deck-scn ${s.hot ? "deck-scn-hot" : ""}`}>
          <div className="deck-scn-top">
            <span className="deck-scn-k">{s.k}</span>
            <span className="deck-scn-rev text-rail-gradient">{s.rev}<span className="deck-scn-yr">/yr</span></span>
          </div>
          <div className="deck-scn-bar"><div className="deck-scn-fill" style={{ width: `${s.w}%` }} /></div>
          <div className="deck-scn-meta font-mono">
            {s.u} users · {s.tx} tx/mo · {s.gmv} GMV
          </div>
        </div>
      ))}
    </div>
    <p className="deck-note font-mono">3% convenience fee, ~$150–200 avg order. Illustrative, not a forecast.</p>
  </div>,

  /* 10 — TRACTION */
  <div key="traction" className="deck-body">
    <Eyebrow>09 · Where We Are</Eyebrow>
    <h2 className="deck-h2">Built, live, and routing real quotes.</h2>
    <div className="deck-stats-row">
      <Stat value="Live" label="iOS app shipping" sub="HQ, Load flow, live quotes" />
      <Stat value="5" label="Licensed partners wired" sub="Coinbase · Stripe · Zero Hash · Transak · MoonPay" />
      <Stat value="90K+" label="Cash-access stores" sub="Deposit-to-crypto reach today" />
      <Stat value="8+" label="Networks routed" sub="L1s, L2s, Lightning & banks" />
    </div>
    <ul className="deck-list deck-list-compact">
      <li><b>Product is real.</b> HQ chat, the Load flow, and signed live-quote receipts are running against production infrastructure.</li>
      <li><b>Rails are connected.</b> Routing hits real provider APIs and returns grounded prices — no vaporware demo.</li>
    </ul>
  </div>,

  /* 11 — MOAT */
  <div key="moat" className="deck-body">
    <Eyebrow>10 · Defensibility</Eyebrow>
    <h2 className="deck-h2">The moat is the rail, the AI, and the proof.</h2>
    <div className="deck-grid-2x2">
      <Pillar tag="IP" title="Patent-pending Unified Rail" body="One invention, 25 claims across routing, temporal settlement, quantum optimization, offline mode, and compliance." />
      <Pillar tag="HQ" title="The intelligence layer" body="A money-native AI that parses intent and routes — the interface users trust and return to." />
      <Pillar tag="Architecture" title="Non-custodial by construction" body="No float, no licensing drag — a structurally leaner operator than custodial competitors." />
      <Pillar tag="Network" title="Partner + cash reach" body="Licensed on-ramps plus a 90k-store cash footprint that new entrants can't switch on overnight." />
    </div>
  </div>,

  /* 12 — COMPETITION */
  <div key="competition" className="deck-body">
    <Eyebrow>11 · Landscape</Eyebrow>
    <h2 className="deck-h2">Everyone does one piece. HQ does the whole path.</h2>
    <div className="deck-table-wrap">
      <table className="deck-table">
        <thead>
          <tr>
            <th></th>
            <th className="deck-table-us">Loadit</th>
            <th>BTC ATMs</th>
            <th>Direct on-ramps</th>
            <th>Cash App</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Cheapest-route AI", true, false, false, false],
            ["Best-price receipt", true, false, false, false],
            ["Non-custodial", true, false, "some", false],
            ["Cash access", true, true, false, true],
            ["Any chain / any asset", true, false, "some", false],
            ["Low fees", true, false, "mid", "mid"],
          ].map((row) => (
            <tr key={row[0] as string}>
              <td className="deck-table-row">{row[0]}</td>
              {row.slice(1).map((c, i) => (
                <td key={i} className={i === 0 ? "deck-table-us" : ""}>
                  {c === true ? <span className="deck-yes">●</span> : c === false ? <span className="deck-no">—</span> : <span className="deck-mid">{c}</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>,

  /* 13 — ROADMAP */
  <div key="roadmap" className="deck-body">
    <Eyebrow>12 · Roadmap</Eyebrow>
    <h2 className="deck-h2">From wedge to universal value layer.</h2>
    <div className="deck-road">
      {[
        { y: "2025", t: "Launch", d: "Unified rail MVP live; iOS app + pilot users." },
        { y: "2026", t: "Regional scale", d: "Growth engine, register network, first 100K users." },
        { y: "2027", t: "National", d: "Coast-to-coast coverage and partner distribution." },
        { y: "2028", t: "Global stablecoin rails", d: "Cross-border settlement across dollar networks." },
        { y: "2030+", t: "Universal value layer", d: "Cash, crypto, and energy on one protocol." },
      ].map((r) => (
        <div key={r.y} className="deck-road-item">
          <div className="deck-road-y font-mono text-rail-gradient">{r.y}</div>
          <div className="deck-road-dot" aria-hidden />
          <div className="deck-road-t">{r.t}</div>
          <div className="deck-road-d">{r.d}</div>
        </div>
      ))}
    </div>
  </div>,

  /* 14 — THE ASK */
  <div key="ask" className="deck-body deck-ask">
    <Eyebrow>13 · The Ask</Eyebrow>
    <h2 className="deck-h2">
      Raising <span className="text-rail-gradient">{RAISE.amount}</span> to turn a live product into a movement.
    </h2>
    <div className="deck-ask-grid">
      <div className="deck-ask-use">
        <div className="deck-ask-sub font-mono">Use of funds</div>
        {[
          { l: "Product & engineering", w: 40 },
          { l: "Growth & user acquisition", w: 25 },
          { l: "Partnerships & compliance", w: 20 },
          { l: "Team & operations", w: 15 },
        ].map((u) => (
          <div key={u.l} className="deck-ask-row">
            <div className="deck-ask-bar"><div className="deck-ask-fill" style={{ width: `${u.w}%` }} /></div>
            <div className="deck-ask-l"><span>{u.l}</span><b>{u.w}%</b></div>
          </div>
        ))}
      </div>
      <div className="deck-ask-milestones glass">
        <div className="deck-ask-sub font-mono">What it funds</div>
        <ul className="deck-list deck-list-compact">
          <li>Public App Store + Play launch and first 250K active users.</li>
          <li>Direct partner rebate &amp; licensing deals that lift the take rate.</li>
          <li>Native register cash-network integration (QR at the point of sale).</li>
          <li>Core hires across engineering, growth, and compliance.</li>
        </ul>
      </div>
    </div>
    <div className="deck-ask-contact">
      <span className="font-mono">{RAISE.stage}</span>
      <a href={`mailto:${RAISE.contact}`}>{RAISE.contact}</a>
      <a href="https://loadit.net">loadit.net</a>
    </div>
  </div>,
];

/* ------------------------------------------------------------------ styles */

function StyleBlock() {
  return (
    <style>{`
      .deck-root { --ink:#04060B; --line:rgba(255,255,255,0.10); position:relative; }
      /* This deck stands alone — hide the site's global chat widget (and any
         other body-level sibling) on /deck, on screen and in print. */
      body > *:not(.deck-root) { display: none !important; }
      .deck-scroll { scroll-snap-type: y mandatory; }
      .deck-slide {
        min-height: 100vh; display:flex; align-items:center; justify-content:center;
        padding: 84px 24px 40px; scroll-snap-align: start;
      }
      .deck-slide-inner {
        position: relative; width: 100%; max-width: 1120px; aspect-ratio: 16 / 9;
        border: 1px solid var(--line); border-radius: 24px; overflow: hidden;
        background:
          radial-gradient(ellipse 90% 60% at 50% -10%, rgba(34,169,92,0.14), transparent 65%),
          linear-gradient(180deg, #0A0E17 0%, #05070D 100%);
        padding: 54px 60px 46px; display:flex; flex-direction:column;
        box-shadow: 0 40px 120px -40px rgba(0,0,0,0.9);
      }
      .deck-glow { position:absolute; top:-30%; right:-10%; width:60%; height:70%;
        background: radial-gradient(circle, rgba(34,211,238,0.10), transparent 60%); pointer-events:none; }

      .deck-eyebrow { font-size: 12px; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(94,234,212,0.85); margin-bottom: 20px; }
      .deck-h1 { font-weight: 800; letter-spacing: -0.04em; line-height: 0.98; }
      .deck-title-xl { font-size: clamp(40px, 6.4vw, 78px); margin: 10px 0 22px; }
      .deck-h2 { font-size: clamp(26px, 3.6vw, 44px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.04; max-width: 20ch; }
      .deck-lede { color: rgba(255,255,255,0.66); font-size: clamp(15px, 1.7vw, 20px); line-height: 1.5; max-width: 60ch; margin-top: 18px; }
      .deck-lede-tight { margin-top: 14px; max-width: 68ch; }
      .deck-body { display:flex; flex-direction:column; height:100%; }
      .deck-note { margin-top: auto; padding-top: 16px; font-size: 10.5px; letter-spacing: 0.06em; color: rgba(255,255,255,0.34); text-transform: uppercase; }

      /* cover */
      .deck-cover { display:flex; flex-direction:column; height:100%; }
      .deck-cover-mark { display:flex; align-items:center; gap:14px; margin-bottom: auto; }
      .deck-cover-word { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
      .deck-cover-meta { display:flex; gap:12px; align-items:center; color: rgba(255,255,255,0.5); font-size: 13px; margin-top: 22px; }

      /* footer */
      .deck-footer { position:absolute; left:60px; right:60px; bottom:22px; display:flex; align-items:center; gap:14px;
        font-size: 10px; letter-spacing: 0.22em; color: rgba(255,255,255,0.32); text-transform: uppercase; }
      .deck-footer-line { flex:1; height:1px; background: linear-gradient(90deg, rgba(255,255,255,0.14), transparent); }
      .deck-footer-num { color: rgba(94,234,212,0.7); }

      /* toolbar */
      .deck-toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 40; height: 60px;
        display:flex; align-items:center; justify-content:space-between; padding: 0 20px;
        background: rgba(5,7,13,0.72); backdrop-filter: blur(12px); border-bottom: 1px solid var(--line); }
      .deck-brand { display:flex; align-items:center; gap:9px; font-weight:700; color:#fff; text-decoration:none; font-size:15px; }
      .deck-toolbar-actions { display:flex; align-items:center; gap:12px; }
      .deck-progress { font-size: 12px; color: rgba(255,255,255,0.45); letter-spacing: 0.1em; }
      .deck-btn { font-size: 13px; font-weight: 600; padding: 9px 14px; border-radius: 999px; border: 1px solid var(--line);
        background: transparent; color: #fff; cursor: pointer; text-decoration:none; transition: all .2s; }
      .deck-btn:hover { background: rgba(255,255,255,0.06); }
      .deck-btn-primary { background: #22A95C; border-color: #22A95C; color: #04060B; }
      .deck-btn-primary:hover { background: #34D17A; }

      /* pillars */
      .deck-pillars { display:grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-top: 30px; }
      .deck-grid-2x2 { display:grid; grid-template-columns: repeat(2,1fr); gap: 14px; margin-top: 26px; }
      .glass { border: 1px solid rgba(255,255,255,0.08); background: rgba(17,21,31,0.55);
        box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05); }
      .deck-pillar { border-radius: 16px; padding: 20px; }
      .deck-pillar-tag { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(94,234,212,0.8); }
      .deck-pillar-title { font-size: clamp(15px, 1.6vw, 19px); font-weight: 700; margin-top: 10px; letter-spacing: -0.01em; }
      .deck-pillar-body { font-size: clamp(12px, 1.25vw, 14px); color: rgba(255,255,255,0.6); margin-top: 8px; line-height: 1.5; }

      /* lists / two-col */
      .deck-two { display:grid; grid-template-columns: 1.25fr 1fr; gap: 28px; margin-top: 26px; align-items:start; }
      .deck-list { display:flex; flex-direction:column; gap: 16px; }
      .deck-list-compact { gap: 10px; margin-top: 18px; }
      .deck-list li { position: relative; padding-left: 20px; color: rgba(255,255,255,0.66); font-size: clamp(13px,1.4vw,16px); line-height: 1.5; list-style: none; }
      .deck-list li::before { content: ""; position:absolute; left: 0; top: 9px; width: 7px; height: 7px; border-radius: 2px;
        background: #22A95C; box-shadow: 0 0 12px rgba(34,169,92,0.7); }
      .deck-list b { color: #fff; font-weight: 700; }

      .deck-quote { border-radius: 18px; padding: 26px; display:flex; flex-direction:column; justify-content:center; }
      .deck-quote-mark { font-size: 40px; color: rgba(94,234,212,0.6); line-height: 0.5; }
      .deck-quote p { font-size: clamp(17px, 2vw, 24px); font-weight: 700; letter-spacing: -0.02em; line-height: 1.25; margin-top: 10px; }

      /* steps */
      .deck-steps { display:grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 34px; }
      .deck-step { border-radius: 16px; padding: 20px 18px; }
      .deck-step-n { font-size: 13px; width: 30px; height: 30px; border-radius: 999px; display:flex; align-items:center; justify-content:center;
        border: 1px solid rgba(34,169,92,0.4); color: #34D17A; margin-bottom: 14px; }
      .deck-step-t { font-weight: 700; font-size: 16px; }
      .deck-step-d { color: rgba(255,255,255,0.58); font-size: 13px; margin-top: 6px; line-height: 1.45; }

      /* stats */
      .deck-stats-row { display:grid; grid-template-columns: repeat(4,1fr); gap: 14px; margin-top: 26px; }
      .deck-stat { border-radius: 16px; padding: 18px; }
      .deck-stat-value { font-size: clamp(24px, 3vw, 36px); font-weight: 800; letter-spacing: -0.03em; color: #fff; }
      .deck-stat-label { font-size: 13px; font-weight: 600; margin-top: 6px; }
      .deck-stat-sub { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 4px; line-height: 1.4; }

      /* TAM */
      .deck-tam { display:flex; flex-direction:column; gap: 22px; margin-top: 32px; }
      .deck-tam-head { display:flex; align-items:baseline; gap: 14px; }
      .deck-tam-k { font-size: 12px; letter-spacing: 0.2em; color: rgba(255,255,255,0.5); width: 44px; }
      .deck-tam-v { font-size: clamp(22px, 2.6vw, 32px); font-weight: 800; letter-spacing: -0.02em; }
      .deck-tam-bar { height: 12px; border-radius: 999px; background: rgba(255,255,255,0.05); margin-top: 8px; overflow: hidden; }
      .deck-tam-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5EEAD4, #22C55E 55%, #15803D); }
      .deck-tam-l { font-size: 12.5px; color: rgba(255,255,255,0.55); margin-top: 7px; }

      /* econ */
      .deck-econ { border-radius: 18px; padding: 22px; }
      .deck-econ-title { font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 14px; }
      .deck-econ-row { display:flex; justify-content:space-between; padding: 9px 0; font-size: 14px; color: rgba(255,255,255,0.7); border-bottom: 1px solid rgba(255,255,255,0.06); }
      .deck-econ-row b { color: #fff; }
      .deck-econ-total { border-bottom: none; font-weight: 700; color: #fff; padding-top: 12px; }

      /* scenarios */
      .deck-scenarios { display:flex; flex-direction:column; gap: 16px; margin-top: 28px; }
      .deck-scn { padding: 4px 0; }
      .deck-scn-hot .deck-scn-fill { box-shadow: 0 0 20px rgba(34,169,92,0.6); }
      .deck-scn-top { display:flex; justify-content:space-between; align-items:baseline; }
      .deck-scn-k { font-weight: 700; font-size: 15px; }
      .deck-scn-hot .deck-scn-k::after { content: " · base case"; color: rgba(94,234,212,0.7); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; }
      .deck-scn-rev { font-size: clamp(18px, 2.2vw, 26px); font-weight: 800; letter-spacing: -0.02em; }
      .deck-scn-yr { font-size: 12px; color: rgba(255,255,255,0.4); font-weight: 500; }
      .deck-scn-bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.05); margin-top: 8px; overflow: hidden; }
      .deck-scn-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5EEAD4, #22C55E 55%, #15803D); }
      .deck-scn-meta { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 7px; letter-spacing: 0.04em; }

      /* table */
      .deck-table-wrap { margin-top: 26px; overflow-x: auto; }
      .deck-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
      .deck-table th, .deck-table td { padding: 12px 10px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.07); }
      .deck-table th { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(255,255,255,0.5); font-weight: 600; }
      .deck-table-row { text-align: left !important; color: rgba(255,255,255,0.75); font-weight: 600; }
      .deck-table-us { background: rgba(34,169,92,0.08); color: #fff; font-weight: 700; }
      thead .deck-table-us { border-radius: 8px 8px 0 0; }
      .deck-yes { color: #34D17A; font-size: 15px; }
      .deck-no { color: rgba(255,255,255,0.25); }
      .deck-mid { color: rgba(251,191,36,0.85); font-size: 11px; }

      /* roadmap */
      .deck-road { display:flex; flex-direction:column; margin-top: 26px; }
      .deck-road-item { display:grid; grid-template-columns: 72px 24px 190px 1fr; align-items:center; gap: 10px; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
      .deck-road-y { font-size: 15px; font-weight: 700; }
      .deck-road-dot { width: 9px; height: 9px; border-radius: 999px; background: #22A95C; box-shadow: 0 0 12px rgba(34,169,92,0.8); justify-self:center; }
      .deck-road-t { font-weight: 700; font-size: 15px; }
      .deck-road-d { color: rgba(255,255,255,0.55); font-size: 13px; }

      /* ask */
      .deck-ask-grid { display:grid; grid-template-columns: 1.1fr 1fr; gap: 26px; margin-top: 30px; }
      .deck-ask-sub { font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-bottom: 16px; }
      .deck-ask-row { margin-bottom: 16px; }
      .deck-ask-bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,0.05); overflow: hidden; }
      .deck-ask-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #5EEAD4, #22C55E 55%, #15803D); }
      .deck-ask-l { display:flex; justify-content:space-between; margin-top: 7px; font-size: 13px; color: rgba(255,255,255,0.7); }
      .deck-ask-l b { color: #fff; }
      .deck-ask-milestones { border-radius: 18px; padding: 22px; }
      .deck-ask-contact { display:flex; gap: 20px; align-items:center; margin-top: auto; padding-top: 20px; font-size: 14px; }
      .deck-ask-contact span { color: rgba(255,255,255,0.5); }
      .deck-ask-contact a { color: #34D17A; text-decoration: none; font-weight: 600; }

      @media (max-width: 720px) {
        .deck-slide-inner { aspect-ratio: auto; min-height: 78vh; padding: 40px 26px 40px; }
        .deck-two, .deck-pillars, .deck-grid-2x2, .deck-steps, .deck-stats-row, .deck-scenarios, .deck-ask-grid { grid-template-columns: 1fr; }
        .deck-footer { left: 26px; right: 26px; }
        .deck-road-item { grid-template-columns: 56px 16px 1fr; }
        .deck-road-d { display:none; }
      }

      /* ---------------- print → clean 16:9 PDF pages ---------------- */
      @media print {
        @page { size: 1280px 720px; margin: 0; }
        .deck-toolbar { display: none !important; }
        .deck-scroll { scroll-snap-type: none; }
        .deck-slide { min-height: 0; padding: 0; display: block; break-inside: avoid; }
        .deck-slide:not(:last-child) { page-break-after: always; }
        .deck-slide-inner { width: 1280px; height: 720px; aspect-ratio: auto; max-width: none;
          border: none; border-radius: 0; box-shadow: none; page-break-inside: avoid; }
        html, body, .deck-root { background: #04060B !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `}</style>
  );
}
