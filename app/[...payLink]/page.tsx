import type { Metadata } from "next";
import { notFound } from "next/navigation";

/**
 * PAY LINKS — load.money/@handle (and loadit.net/@handle).
 *
 * The URL is the payment address: `load.money/@colton` shows who you're paying
 * (live Hylaq profile) and routes you into the app; `load.money/@colton/20`
 * pre-fills the amount. Catch-all because @handle isn't a valid static
 * segment; anything that doesn't look like a pay link 404s so this never
 * swallows real routes.
 */

const HANDLE_RE = /^@[a-z0-9][a-z0-9_.-]{1,30}$/i;

interface Profile {
  handle: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
}

function parsePayLink(segments: string[]): { handle: string; amount: number | null } | null {
  if (!segments.length || segments.length > 2) return null;
  const first = decodeURIComponent(segments[0]);
  if (!HANDLE_RE.test(first)) return null;
  const handle = first.slice(1).toLowerCase();
  let amount: number | null = null;
  if (segments.length === 2) {
    amount = Number(segments[1]);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000) return null;
    amount = Math.round(amount * 100) / 100;
  }
  return { handle, amount };
}

async function fetchProfile(handle: string): Promise<Profile | null> {
  try {
    const res = await fetch(`https://loadit.net/api/handle/${encodeURIComponent(handle)}`, {
      next: { revalidate: 300 },
    });
    const data = await res.json();
    return data?.ok && data.profile ? (data.profile as Profile) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { payLink: string[] } }): Promise<Metadata> {
  const link = parsePayLink(params.payLink);
  if (!link) return {};
  const amt = link.amount ? ` $${link.amount}` : "";
  return {
    title: `Pay${amt} @${link.handle} · Loadit`,
    description: `Send${amt ? ` $${link.amount}` : " money"} to @${link.handle} on Loadit — non-custodial, straight to their own wallet.`,
    robots: { index: false, follow: false },
  };
}

export default async function PayLink({ params }: { params: { payLink: string[] } }) {
  const link = parsePayLink(params.payLink);
  if (!link) notFound();
  const profile = await fetchProfile(link.handle);
  const display = profile?.displayName && profile.displayName !== link.handle ? profile.displayName : null;
  const money = link.amount
    ? `$${link.amount.toLocaleString(undefined, { minimumFractionDigits: link.amount % 1 ? 2 : 0 })}`
    : null;

  return (
    <main className="pl-root">
      <style>{`
        .pl-root { min-height:100vh; background:#04060B; color:#fff; display:flex; flex-direction:column;
          align-items:center; justify-content:center; padding:32px 20px; text-align:center; }
        .pl-card { display:flex; flex-direction:column; align-items:center; max-width:420px; width:100%; }
        .pl-avatar { width:96px; height:96px; border-radius:999px; object-fit:cover; border:2px solid rgba(34,169,92,0.5);
          box-shadow:0 0 40px rgba(34,169,92,0.25); }
        .pl-avatar-fallback { width:96px; height:96px; border-radius:999px; display:flex; align-items:center; justify-content:center;
          font-size:38px; font-weight:800; color:#04060B; background:linear-gradient(140deg,#5EEAD4,#22A95C);
          box-shadow:0 0 40px rgba(34,169,92,0.25); }
        .pl-handle { font-size:26px; font-weight:800; letter-spacing:-0.02em; margin-top:18px; }
        .pl-name { color:rgba(255,255,255,0.6); font-size:14px; margin-top:4px; }
        .pl-ask { font-size:17px; color:rgba(255,255,255,0.8); margin-top:18px; line-height:1.5; }
        .pl-amount { font-size:44px; font-weight:800; letter-spacing:-0.03em; margin-top:10px;
          background:linear-gradient(90deg,#5EEAD4,#22C55E); -webkit-background-clip:text; background-clip:text; color:transparent; }
        .pl-cta { display:inline-block; background:#22A95C; color:#04060B; font-weight:800; font-size:16px;
          border-radius:999px; padding:16px 36px; text-decoration:none; margin-top:26px; }
        .pl-alt { color:rgba(255,255,255,0.55); font-size:13px; line-height:1.6; margin-top:18px; }
        .pl-alt b { color:rgba(255,255,255,0.85); }
        .pl-foot { color:rgba(255,255,255,0.35); font-size:11px; margin-top:40px; letter-spacing:0.14em; text-transform:uppercase; }
        .pl-foot a { color:rgba(94,234,212,0.7); text-decoration:none; }
      `}</style>
      <div className="pl-card">
        {profile?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="" className="pl-avatar" />
        ) : (
          <div className="pl-avatar-fallback">{link.handle[0].toUpperCase()}</div>
        )}
        <div className="pl-handle">@{link.handle}</div>
        {display && <div className="pl-name">{display}</div>}
        <div className="pl-ask">{money ? "is requesting" : "accepts money on Loadit"}</div>
        {money && <div className="pl-amount">{money}</div>}
        <a className="pl-cta" href="https://loadit.net/install">
          {money ? `Pay ${money} with Loadit` : "Send with Loadit"}
        </a>
        <p className="pl-alt">
          Already have Loadit? Open <b>Send</b> and type <b>@{link.handle}</b>
          {money ? ` — ${money}` : ""}. It lands in their own wallet — Loadit never holds it.
        </p>
        <div className="pl-foot">
          <a href="https://loadit.net">loadit.net</a> · non-custodial · 0.75% flat
        </div>
      </div>
    </main>
  );
}
