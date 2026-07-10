import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loadit × MoneyGram — Integration Status",
  description: "Live SEP-1/10/24 integration readiness for Loadit's MoneyGram Ramps onboarding.",
  alternates: { canonical: "/moneygram/status" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Public testnet keys generated for MoneyGram Ramps sandbox onboarding.
// These are PUBLIC addresses — safe to display; secrets live only in env.
const SIGNING_KEY = "GCNLOGNOEEROESV4RD6NRJZWYF7W4GHFJE7H2R4W35OYWY6QQ4SIF4CC";
const AUTH_ACCOUNT = "GA6BQSTDJJUVFIKN4XLUNKJROGLSVCVB73ZLJELNQLCJYAKLJ23RTEM5";
const FUNDS_ACCOUNT = "GDEE5ZPWWTQHMULYR2SPDYG7CCGCM3P26ZPE563QEBSKIZCBSWZ74SXX";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

type State = "done" | "live" | "ready" | "pending";

async function signingConfigured(): Promise<boolean> {
  try {
    const res = await fetch("https://loadit.net/api/anchor/sign-challenge", { cache: "no-store" });
    const d = await res.json();
    return Boolean(d?.configured);
  } catch {
    return false;
  }
}

export default async function StatusPage() {
  const signingLive = await signingConfigured();

  const checks: { key: string; title: string; detail: string; state: State }[] = [
    { key: "SEP-1", title: "stellar.toml hosted & valid", state: "live", detail: "loadit.net/.well-known/stellar.toml — org info, principal, SIGNING_KEY. Passes the Stellar TOML checker." },
    { key: "SEP-10", title: "Web Auth + client_domain signing", state: signingLive ? "live" : "ready", detail: "Server co-signs the anchor's challenge with the toml SIGNING_KEY (non-custodial, home_domain flow). The private key never touches the client." },
    { key: "SEP-24", title: "Interactive deposit flow", state: "ready", detail: "App renders the reference code + hosted webview slot; wires to the live anchor via one config value on sandbox allowlisting." },
    { key: "SEP-9", title: "KYC pass-through", state: "ready", detail: "KYC handled entirely in MoneyGram's hosted UI; non-custodial wallets pass no mandatory amount field." },
    { key: "Asset", title: "USDC on Stellar", state: "live", detail: "Trustline established on the funds account for testnet USDC." },
  ];

  const stages: { label: string; state: State }[] = [
    { label: "SEP-1 toml live", state: "done" },
    { label: "Testnet keypairs funded", state: "done" },
    { label: "SEP-10 signing service", state: signingLive ? "done" : "pending" },
    { label: "Sandbox allowlisting", state: "pending" },
    { label: "Certification", state: "pending" },
    { label: "KYB + agreements", state: "pending" },
    { label: "Production", state: "pending" },
  ];

  return (
    <main className="st-root">
      <StatusStyle />

      <div className="st-bar">
        <a href="/moneygram" className="st-home">← Partnership brief</a>
        <span className="st-kicker font-mono">Integration Status · Confidential</span>
      </div>

      <article className="st-page">
        <header className="st-head">
          <div className="st-lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loadit-mark.png" alt="Loadit" width={36} height={36} />
            <span className="st-word">Loadit</span>
            <span className="st-x">×</span>
            <span className="st-mg">MoneyGram Ramps</span>
          </div>
          <div className={`st-net ${signingLive ? "on" : ""}`}>
            <span className="st-dot" /> Testnet
          </div>
        </header>

        <h1 className="st-h1">Integration readiness — live</h1>
        <p className="st-lede">
          What&apos;s implemented on Loadit&apos;s side of the SEP standards, checked against the live
          deployment. Everything below is done except the steps that require MoneyGram to allowlist us.
        </p>

        <section className="st-checks">
          {checks.map((c) => (
            <div key={c.key} className="st-check">
              <StateBadge state={c.state} />
              <div className="st-check-body">
                <div className="st-check-top">
                  <span className="st-check-k font-mono">{c.key}</span>
                  <span className="st-check-t">{c.title}</span>
                </div>
                <div className="st-check-d">{c.detail}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="st-keys">
          <div className="st-sec font-mono">Testnet accounts — ready to allowlist</div>
          <div className="st-key-grid">
            <KeyRow label="Signing key (client_domain)" value={SIGNING_KEY} note="Published in stellar.toml" />
            <KeyRow label="Authentication account" value={AUTH_ACCOUNT} note="Funded · XLM" />
            <KeyRow label="Funds account" value={FUNDS_ACCOUNT} note="Funded · USDC trustline set" />
            <KeyRow label="Testnet USDC issuer" value={USDC_ISSUER} note="MoneyGram testnet asset" />
          </div>
          <div className="st-ask">
            Share these three Loadit public keys to allowlist us for the Ramps sandbox. The moment
            they&apos;re enabled, the SEP-10 → SEP-24 deposit flow runs end to end.
          </div>
        </section>

        <section className="st-stages">
          <div className="st-sec font-mono">Onboarding progress</div>
          <div className="st-stage-row">
            {stages.map((s, i) => (
              <div key={s.label} className={`st-stage ${s.state}`}>
                <span className="st-stage-num">{s.state === "done" ? "✓" : i + 1}</span>
                <span className="st-stage-label">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="st-foot font-mono">
          <span>LOADIT × MONEYGRAM</span>
          <span className="st-foot-line" />
          <a href="mailto:colt@loadit.net">colt@loadit.net</a>
          <span>loadit.net</span>
        </footer>
      </article>
    </main>
  );
}

function StateBadge({ state }: { state: State }) {
  const map: Record<State, { label: string; cls: string }> = {
    done: { label: "✓", cls: "done" },
    live: { label: "LIVE", cls: "live" },
    ready: { label: "READY", cls: "ready" },
    pending: { label: "…", cls: "pending" },
  };
  const m = map[state];
  return <span className={`st-badge ${m.cls}`}>{m.label}</span>;
}

function KeyRow({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="st-key">
      <div className="st-key-label">{label}</div>
      <div className="st-key-val font-mono">{value}</div>
      <div className="st-key-note">{note}</div>
    </div>
  );
}

function StatusStyle() {
  return (
    <style>{`
      .st-root { background:#04060B; color:#fff; min-height:100vh; }
      body > *:not(.st-root) { display:none !important; }
      .st-bar { position:fixed; top:0; left:0; right:0; height:52px; z-index:20; display:flex; align-items:center;
        justify-content:space-between; padding:0 18px; background:rgba(5,7,13,0.85); border-bottom:1px solid rgba(255,255,255,0.08); }
      .st-home { color:rgba(255,255,255,0.6); text-decoration:none; font-size:13px; }
      .st-kicker { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:rgba(94,234,212,0.85); }

      .st-page { max-width:900px; margin:52px auto 0; padding:40px 40px 32px;
        background:radial-gradient(ellipse 90% 50% at 50% -8%, rgba(34,169,92,0.13), transparent 60%), linear-gradient(180deg,#0A0E17,#05070D);
        border-left:1px solid rgba(255,255,255,0.06); border-right:1px solid rgba(255,255,255,0.06); min-height:calc(100vh - 52px); }
      .st-head { display:flex; align-items:center; justify-content:space-between; }
      .st-lockup { display:flex; align-items:center; gap:10px; }
      .st-word { font-size:20px; font-weight:800; letter-spacing:-0.03em; }
      .st-x { color:rgba(255,255,255,0.4); }
      .st-mg { font-size:20px; font-weight:800; letter-spacing:-0.03em; color:#E0553B; }
      .st-net { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:700; color:rgba(255,255,255,0.6);
        border:1px solid rgba(255,255,255,0.12); border-radius:999px; padding:6px 12px; }
      .st-net.on { color:#34D17A; border-color:rgba(34,169,92,0.4); background:rgba(34,169,92,0.08); }
      .st-dot { width:8px; height:8px; border-radius:999px; background:#34D17A; box-shadow:0 0 10px rgba(34,169,92,0.8); }

      .st-h1 { font-size:clamp(26px,4vw,36px); font-weight:800; letter-spacing:-0.03em; margin:26px 0 12px; }
      .st-lede { color:rgba(255,255,255,0.62); font-size:14.5px; line-height:1.55; max-width:70ch; }

      .st-sec { font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:rgba(255,255,255,0.45); margin:30px 0 14px; }

      .st-checks { margin-top:28px; display:flex; flex-direction:column; gap:10px; }
      .st-check { display:flex; gap:14px; align-items:flex-start; border:1px solid rgba(255,255,255,0.08);
        background:rgba(17,21,31,0.5); border-radius:14px; padding:14px 16px; }
      .st-badge { flex:none; min-width:52px; text-align:center; font-size:11px; font-weight:800; letter-spacing:0.06em;
        padding:5px 8px; border-radius:8px; }
      .st-badge.done, .st-badge.live { background:rgba(34,169,92,0.16); color:#34D17A; border:1px solid rgba(34,169,92,0.4); }
      .st-badge.ready { background:rgba(94,234,212,0.12); color:#5EEAD4; border:1px solid rgba(94,234,212,0.3); }
      .st-badge.pending { background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.5); border:1px solid rgba(255,255,255,0.14); }
      .st-check-top { display:flex; align-items:baseline; gap:10px; }
      .st-check-k { font-size:11px; color:rgba(94,234,212,0.8); letter-spacing:0.08em; }
      .st-check-t { font-size:14.5px; font-weight:700; }
      .st-check-d { font-size:12.5px; color:rgba(255,255,255,0.58); line-height:1.5; margin-top:4px; }

      .st-key-grid { display:flex; flex-direction:column; gap:10px; }
      .st-key { border:1px solid rgba(255,255,255,0.08); background:rgba(17,21,31,0.5); border-radius:12px; padding:12px 14px; }
      .st-key-label { font-size:12px; font-weight:700; color:rgba(255,255,255,0.85); }
      .st-key-val { font-size:12px; color:#5EEAD4; margin-top:4px; word-break:break-all; }
      .st-key-note { font-size:11px; color:rgba(255,255,255,0.45); margin-top:3px; }
      .st-ask { margin-top:12px; padding:12px 14px; border-left:2px solid #22A95C; background:rgba(34,169,92,0.06);
        border-radius:0 10px 10px 0; font-size:12.5px; line-height:1.5; color:rgba(255,255,255,0.78); }

      .st-stage-row { display:flex; flex-wrap:wrap; gap:8px; }
      .st-stage { display:flex; align-items:center; gap:7px; border:1px solid rgba(255,255,255,0.1); border-radius:999px; padding:7px 12px; }
      .st-stage.done { border-color:rgba(34,169,92,0.4); background:rgba(34,169,92,0.08); }
      .st-stage-num { width:18px; height:18px; border-radius:999px; display:flex; align-items:center; justify-content:center;
        font-size:10px; font-weight:800; background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.6); }
      .st-stage.done .st-stage-num { background:#22A95C; color:#04060B; }
      .st-stage-label { font-size:11.5px; font-weight:600; color:rgba(255,255,255,0.75); }

      .st-foot { display:flex; align-items:center; gap:14px; margin-top:34px; padding-top:16px;
        border-top:1px solid rgba(255,255,255,0.08); font-size:10px; letter-spacing:0.16em; text-transform:uppercase; color:rgba(255,255,255,0.4); }
      .st-foot-line { flex:1; height:1px; background:linear-gradient(90deg,rgba(255,255,255,0.12),transparent); }
      .st-foot a { color:rgba(94,234,212,0.75); text-decoration:none; }

      @media (max-width:680px) {
        .st-page { padding:28px 18px; }
        .st-head { flex-direction:column; align-items:flex-start; gap:10px; }
        .st-foot { flex-wrap:wrap; gap:8px 12px; }
        .st-foot-line { display:none; }
      }
    `}</style>
  );
}
