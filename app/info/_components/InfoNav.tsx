"use client";

import { useEffect, useState } from "react";
import { INFO, NAV } from "../_lib/content";

/** Header — Loadit wordmark with a restrained Investors identifier. */
export function InfoNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={`sticky top-0 z-50 border-b transition-colors ${scrolled || open ? "border-white/8 bg-[#04060B]/92 backdrop-blur-sm" : "border-transparent"}`}>
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5" aria-label="Loadit Investors — top" onClick={() => setOpen(false)}>
            <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden>
              <span className="absolute inset-0 rounded-[5px] border border-rail-400/70" />
              <span className="h-1.5 w-1.5 rounded-full bg-rail-400" />
            </span>
            <span className="font-mono text-[13px] font-bold tracking-[0.22em] text-white">
              LOADIT<span className="text-white/45"> · INVESTORS</span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-2 text-sm text-white/65 transition-colors hover:text-white">{n.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a href="#contact" className="hidden whitespace-nowrap rounded-lg bg-white px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-white/90 sm:inline-flex">
              Request investor materials
            </a>
            <button
              className="rounded-md p-2 text-white/80 lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="info-mobile-menu"
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                {open ? <path d="M5 5l12 12M17 5 5 17" stroke="currentColor" strokeWidth="1.6" /> : <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* The sheet lives OUTSIDE the header: a backdrop-filter on the header
          would otherwise become the containing block for this fixed panel and
          clip it to the 64px bar. */}
      {open && (
        <div id="info-mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-white/8 bg-[#04060B] px-5 py-6 lg:hidden">
          <nav aria-label="Mobile" className="grid gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg py-3 text-lg text-white/85">{n.label}</a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)} className="mt-4 rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-void">Request investor materials</a>
            <a href={INFO.product} className="mt-2 rounded-lg py-3 text-center text-sm text-white/60">Loadit.net ↗</a>
          </nav>
        </div>
      )}
    </>
  );
}
