"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
    >
      <div className="container-px mx-auto max-w-7xl pt-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-full px-4 py-2.5 transition-all duration-500",
            scrolled
              ? "glass glass-blur shadow-glass"
              : "border border-transparent bg-transparent"
          )}
        >
          <a
            href="#top"
            className="flex items-center gap-2.5 pl-2"
            aria-label={`${SITE.name} home`}
          >
            <Logo className="h-7 w-7" priority />
            <span className="text-base font-semibold tracking-tight">
              {SITE.name}
            </span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="rounded-full px-3.5 py-2 text-sm text-white/60 transition-colors hover:bg-white/[0.05] hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <a
              href="#demo"
              className="hidden rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:text-white sm:block"
            >
              Try the demo
            </a>
            <a
              href="#access"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-void transition-all hover:shadow-glow"
            >
              Request Access
            </a>
            <button
              onClick={() => setOpen((o) => !o)}
              className="ml-1 grid h-9 w-9 place-items-center rounded-full text-white/70 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <div className="space-y-1.5">
                <span
                  className={cn(
                    "block h-px w-5 bg-current transition-transform",
                    open && "translate-y-[3.5px] rotate-45"
                  )}
                />
                <span
                  className={cn(
                    "block h-px w-5 bg-current transition-transform",
                    open && "-translate-y-[3.5px] -rotate-45"
                  )}
                />
              </div>
            </button>
          </div>
        </nav>

        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass glass-blur mt-2 space-y-1 rounded-3xl p-3 lg:hidden"
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-sm text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </motion.ul>
        )}
      </div>
    </motion.header>
  );
}
