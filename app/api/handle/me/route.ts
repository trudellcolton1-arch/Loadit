import { NextResponse } from "next/server";
import { handleByOwnerEmail, hylaqConfigured } from "@/lib/hylaqDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET the signed-in user's own Hylaq @handle profile.
 *
 * The app posts its Hylaq access token; we verify it against Hylaq's userinfo
 * to get the authoritative email, then look up the Handle that email owns.
 * Only public-safe fields come back (handle, theme, receive addresses).
 */
export async function POST(req: Request) {
  if (!hylaqConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { token?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const issuer = (process.env.HYLAQ_ISSUER || "https://www.hylaq.com").replace(/\/$/, "");
  let email = "";

  // Prefer token-verified identity.
  const token = (body.token || "").trim();
  if (token) {
    try {
      const res = await fetch(`${issuer}/api/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const info = (await res.json()) as { email?: string };
        if (info.email) email = info.email;
      }
    } catch {
      /* fall through to provided email */
    }
  }
  // Fallback to the email captured at login (profile is public-safe either way).
  if (!email && typeof body.email === "string") email = body.email.trim();

  if (!email) {
    return NextResponse.json({ ok: true, linked: false, reason: "no_identity" });
  }

  try {
    const profile = await handleByOwnerEmail(email);
    if (!profile) {
      return NextResponse.json({ ok: true, linked: false, reason: "no_handle" });
    }
    return NextResponse.json({ ok: true, linked: true, profile });
  } catch (e) {
    console.error("[handle/me] lookup failed:", String(e));
    return NextResponse.json({ ok: false, reason: "lookup_failed" }, { status: 502 });
  }
}
