"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { NAV } from "../_lib/site";
import { Wordmark } from "./Wordmark";

type Menu = "products" | "developers" | null;

/**
 * Loadit Global navigation — its own, separate from loadit.net's Navbar.
 * Desktop: two dropdowns + three links + Sign In + primary CTA.
 * Mobile: full-screen sheet with grouped links.
 */
export function GlobalNav() {
  const [open, setOpen] = useState<Menu>(null);
  const [mobile, setMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobile ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile]);

  const Dropdown = ({ id, label, items }: { id: Menu; label: string; items: readonly { label: string; href: string; desc: string }[] }) => (
    <div
      className="relative"
      onMouseEnter={() => setOpen(id)}
      onMouseLeave={() => setOpen(null)}
    >
      <button
        className={`flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${open === id ? "text-white" : "text-white/65 hover:text-white"}`}
        aria-expanded={open === id}
        onClick={() => setOpen(open === id ? null : id)}
      >
        {label}
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className={`transition-transform ${open === id ? "rotate-180" : ""}`}>
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <AnimatePresence>
        {open === id && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full pt-2"
          >
            <div className="w-[300px] rounded-xl border border-white/10 bg-[#0B0F1A] p-2 shadow-glass">
              {items.map((it) => (
                <a key={it.href} href={it.href} className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.05]">
                  <div className="text-sm font-medium text-white">{it.label}</div>
                  <div className="text-xs text-white/45">{it.desc}</div>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-colors ${
        scrolled ? "border-white/8 bg-[#04060B]/90 backdrop-blur-sm" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="/" className="flex items-center gap-2" aria-label="Loadit Global home">
          <Wordmark />
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          <Dropdown id="products" label="Products" items={NAV.products} />
          {NAV.top.slice(0, 1).map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-white/65 hover:text-white">{l.label}</a>
          ))}
          <Dropdown id="developers" label="Developers" items={NAV.developers} />
          {NAV.top.slice(1).map((l) => (
            <a key={l.href} href={l.href} className="rounded-md px-3 py-2 text-sm text-white/65 hover:text-white">{l.label}</a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400 xl:inline">Pre-launch</span>
          <a
            href="/access"
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-white/90"
          >
            Join the list
          </a>
        </div>

        <button
          className="rounded-md p-2 text-white/80 lg:hidden"
          aria-label={mobile ? "Close menu" : "Open menu"}
          onClick={() => setMobile((m) => !m)}
        >
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
            {mobile ? (
              <path d="M5 5l12 12M17 5 5 17" stroke="currentColor" strokeWidth="1.6" />
            ) : (
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" />
            )}
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {mobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-white/8 bg-[#04060B] px-6 py-6 lg:hidden"
          >
            <div className="grid gap-8">
              <div>
                <p className="eyebrow mb-3">Products</p>
                <div className="grid gap-1">
                  {NAV.products.map((it) => (
                    <a key={it.href} href={it.href} className="rounded-lg py-2 text-base text-white/85">{it.label}</a>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow mb-3">Developers</p>
                <div className="grid gap-1">
                  {NAV.developers.map((it) => (
                    <a key={it.href} href={it.href} className="rounded-lg py-2 text-base text-white/85">{it.label}</a>
                  ))}
                </div>
              </div>
              <div className="grid gap-1">
                {NAV.top.map((l) => (
                  <a key={l.href} href={l.href} className="rounded-lg py-2 text-base text-white/85">{l.label}</a>
                ))}
              </div>
              <a href="/access" className="rounded-lg bg-white px-4 py-3 text-center text-sm font-semibold text-void">
                Join the early-access list
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
