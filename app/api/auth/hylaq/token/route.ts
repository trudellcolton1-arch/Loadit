import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HYLAQ TOKEN EXCHANGE — server-side leg of "Login with Hylaq".
 *
 * Hylaq's token endpoint requires the client secret, which must never ship
 * in the mobile app. The app completes the authorize step (with PKCE) and
 * posts the code here; this endpoint attaches HYLAQ_CLIENT_ID +
 * HYLAQ_CLIENT_SECRET and forwards the exchange. Hylaq's token JSON is
 * returned verbatim — the secret never leaves this process.
 */
export async function POST(req: Request) {
  let body: { code?: string; redirect_uri?: string; code_verifier?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code.slice(0, 512) : "";
  const redirectUri = typeof body.redirect_uri === "string" ? body.redirect_uri.slice(0, 256) : "";
  if (!code || !redirectUri) {
    return NextResponse.json({ error: "invalid_request", detail: "code and redirect_uri required" }, { status: 422 });
  }

  const clientId = process.env.HYLAQ_CLIENT_ID;
  const secret = process.env.HYLAQ_CLIENT_SECRET;
  if (!clientId || !secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const issuer = (process.env.HYLAQ_ISSUER || "https://www.hylaq.com").replace(/\/$/, "");

  const form = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: secret,
  });
  if (typeof body.code_verifier === "string" && body.code_verifier) {
    form.set("code_verifier", body.code_verifier.slice(0, 256));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${issuer}/api/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({ error: "bad_upstream" }));
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    console.error("[hylaq-token] exchange failed:", String(e));
    return NextResponse.json({ error: "network_error" }, { status: 502 });
  }
}
