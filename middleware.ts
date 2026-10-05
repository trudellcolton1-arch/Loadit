import { NextRequest, NextResponse } from "next/server";

/**
 * One deployment, several front doors. The hostname decides which experience
 * is served; everything shares the same code, tokens, and backends.
 *
 *   loadit.net / www.loadit.net   → the Loadit experience (default, untouched)
 *   loaditglobal.com (+www)       → /global/*   the enterprise / developer site
 *   *.loaditglobal.com            → /global/<section>/*  (developers, status, dashboard)
 *   load.club (+www)              → /club/*     the members program
 *   load.money (+www)             → pay links (the cash.app pattern, below)
 *
 * Rewrites keep the visitor's URL in the bar; www hosts redirect to the apex.
 */

/** loaditglobal.com hosts → internal base path under /global. */
const GLOBAL_HOSTS: Record<string, string> = {
  "loaditglobal.com": "/global",
  "www.loaditglobal.com": "/global",
  "developers.loaditglobal.com": "/global/developers",
  "dashboard.loaditglobal.com": "/global/dashboard",
  "status.loaditglobal.com": "/global/status",
};

/** loadit.world hosts → the vision site under /world. */
const WORLD_HOSTS = new Set(["loadit.world", "www.loadit.world"]);

/** loadit.info hosts → the investor site under /info. */
const INFO_HOSTS = new Set(["loadit.info", "www.loadit.info"]);

/** Site paths that must never be mistaken for a bare @handle on load.money. */
const RESERVED = new Set([
  "install", "pay", "app", "learn", "tools", "compare", "platform", "technology",
  "developers", "deck", "privacy", "intent", "exchange", "energy", "data-room",
  "marketplace", "earn", "admin", "login", "signup", "help", "support", "about",
  "club", "global", "world", "info",
]);
const HANDLEISH = /^\/([a-z0-9][a-z0-9_.-]{1,30})(?:\/(\$?[0-9.]+))?\/?$/i;

function toApex(req: NextRequest, apex: string): NextResponse {
  const url = req.nextUrl.clone();
  url.protocol = "https:";
  url.host = apex;
  url.port = "";
  return NextResponse.redirect(url, 308);
}

export function middleware(req: NextRequest) {
  const host = (req.headers.get("host") || "").toLowerCase();
  const { pathname } = req.nextUrl;

  // ---- loaditglobal.com — the enterprise / developer platform ----
  const globalBase = GLOBAL_HOSTS[host];
  if (globalBase) {
    if (host === "www.loaditglobal.com") return toApex(req, "loaditglobal.com");
    const url = req.nextUrl.clone();
    // robots + sitemap are per-site: serve Global's, never loadit.net's.
    if (pathname === "/robots.txt") { url.pathname = "/global/robots.txt"; return NextResponse.rewrite(url); }
    if (pathname === "/sitemap.xml") { url.pathname = "/global/sitemap.xml"; return NextResponse.rewrite(url); }
    if (pathname.startsWith("/global")) return NextResponse.next(); // already internal
    url.pathname = pathname === "/" ? globalBase : `${globalBase}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ---- loadit.world — the vision site ----
  if (WORLD_HOSTS.has(host)) {
    if (host === "www.loadit.world") return toApex(req, "loadit.world");
    const url = req.nextUrl.clone();
    if (pathname === "/robots.txt") { url.pathname = "/world/robots.txt"; return NextResponse.rewrite(url); }
    if (pathname === "/sitemap.xml") { url.pathname = "/world/sitemap.xml"; return NextResponse.rewrite(url); }
    if (pathname === "/manifest.webmanifest") { url.pathname = "/world/manifest.webmanifest"; return NextResponse.rewrite(url); }
    if (pathname.startsWith("/world")) return NextResponse.next();
    url.pathname = pathname === "/" ? "/world" : `/world${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ---- loadit.info — the investor site ----
  if (INFO_HOSTS.has(host)) {
    if (host === "www.loadit.info") return toApex(req, "loadit.info");
    const url = req.nextUrl.clone();
    if (pathname === "/robots.txt") { url.pathname = "/info/robots.txt"; return NextResponse.rewrite(url); }
    if (pathname === "/sitemap.xml") { url.pathname = "/info/sitemap.xml"; return NextResponse.rewrite(url); }
    if (pathname.startsWith("/info")) return NextResponse.next();
    url.pathname = pathname === "/" ? "/info" : `/info${pathname}`;
    return NextResponse.rewrite(url);
  }
  // The investor site is reachable at /info on other hosts for previews only —
  // keep those copies out of search so loadit.info stays the single canonical.
  if (pathname === "/info" || pathname.startsWith("/info/")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Other hosts: robots/sitemap are only in the matcher for Global's sake.
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return NextResponse.next();

  // ---- load.club — the Loadit members/rewards program ----
  if (host === "load.club" || host === "www.load.club") {
    if (host === "www.load.club") return toApex(req, "load.club");
    if (!pathname.startsWith("/club")) {
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? "/club" : `/club${pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // ---- load.money — pay links only; everything else bounces to loadit.net ----
  if (host !== "load.money" && host !== "www.load.money") return NextResponse.next();

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
  // Skip static assets and API routes; only pages need host logic. robots and
  // sitemap are matched explicitly so loaditglobal.com can serve its own.
  matcher: ["/((?!_next|api|.*\\..*).*)", "/robots.txt", "/sitemap.xml", "/manifest.webmanifest"],
};
