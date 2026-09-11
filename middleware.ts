import { NextRequest, NextResponse } from "next/server";

/**
 * load.money — the action domain. One brand, two jobs (the cash.app pattern):
 * loadit.net stays canonical for all content; load.money exists only for pay
 * links. `load.money/@handle` serves the pay landing right here (the URL *is*
 * the product), the bare domain goes to install, and every other path bounces
 * permanently to its loadit.net twin so search engines never see two copies.
 */
/** Site paths that must never be mistaken for a bare @handle on load.money. */
const RESERVED = new Set([
  "install", "pay", "app", "learn", "tools", "compare", "platform", "technology",
  "developers", "deck", "privacy", "intent", "exchange", "energy",
  "marketplace", "earn", "admin", "login", "signup", "help", "support", "about",
]);
const HANDLEISH = /^\/([a-z0-9][a-z0-9_.-]{1,30})(?:\/(\$?[0-9.]+))?\/?$/i;

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  if (host !== "load.money" && host !== "www.load.money") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/@")) return NextResponse.next(); // pay links live on this domain

  // People say "load dot money slash colton" — treat a bare handle-looking
  // segment as a pay link too (rewrite, so the typed URL stays in the bar).
  const bare = pathname.match(HANDLEISH);
  if (bare && !RESERVED.has(bare[1].toLowerCase())) {
    const url = req.nextUrl.clone();
    url.pathname = `/@${bare[1]}${bare[2] ? `/${bare[2].replace("$", "")}` : ""}`;
    return NextResponse.rewrite(url);
  }

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
