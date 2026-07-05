import { NextResponse } from "next/server";
import { handleByOwnerEmail, hylaqConfigured, ownerEmailFromAccessToken } from "@/lib/hylaqDb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET the signed-in user's own Hylaq @handle profile.
 *
 * Token-verified only: the caller must present a valid Hylaq access token. We
 * establish their email authoritatively — first from Hylaq's OAuthAccessToken
 * table (sha256 of the token), then falling back to Hylaq's userinfo endpoint.
 * A client-supplied email is never trusted (that would allow email→handle
 * enumeration). Only public-safe handle fields are returned.
 */
export async function POST(req: Request) {
  if (!hylaqConfigured()) {
    return NextResponse.json({ ok: false, reason: "not_configured" }, { status: 503 });
  }

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const token = (body.token || "").trim();
  if (!token) {
    return NextResponse.json({ ok: true, linked: false, reason: "no_token" });
  }

  // 1) Authoritative: match the token hash in Hylaq's token store.
  let email = "";
  try {
    email = (await ownerEmailFromAccessToken(token)) || "";
  } catch (e) {
    console.error("[handle/me] token lookup failed:", String(e));
  }

  // 2) Fallback: verify the token against Hylaq's userinfo endpoint.
  if (!email) {
    const issuer = (process.env.HYLAQ_ISSUER || "https://www.hylaq.com").replace(/\/$/, "");
    try {
      const res = await fetch(`${issuer}/api/oauth/userinfo`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const info = (await res.json()) as { email?: string };
        if (info.email) email = info.email;
      }
    } catch (e) {
      console.error("[handle/me] userinfo failed:", String(e));
    }
  }

  if (!email) {
    return NextResponse.json({ ok: true, linked: false, reason: "unverified" });
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
