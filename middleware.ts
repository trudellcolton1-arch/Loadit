import { NextRequest, NextResponse } from "next/server";

/**
 * load.money — the action domain. One brand, two jobs (the cash.app pattern):
 * loadit.net stays canonical for all content; load.money exists only for pay
 * links. `load.money/@handle` serves the pay landing right here (the URL *is*
 * the product), the bare domain goes to install, and every other path bounces
 * permanently to its loadit.net twin so search engines never see two copies.
 */
export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (host !== "load.money" && host !== "www.load.money") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/@")) return NextResponse.next(); // pay links live on this domain

  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.host = "loadit.net";
  url.port = "";
  if (pathname === "/") {
    url.pathname = "/install";
    return NextResponse.redirect(url, 302); // may become its own landing later
  }
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Skip static assets and API routes; only pages need host logic.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
