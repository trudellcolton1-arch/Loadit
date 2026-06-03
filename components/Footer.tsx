import { Logo } from "@/components/ui/Logo";
import { SITE, NAV_LINKS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-black">
      {/* Hero statement */}
      <div className="container-px mx-auto max-w-7xl py-24 text-center sm:py-32">
        <p className="text-balance text-3xl font-semibold tracking-tightest text-rail-gradient sm:text-5xl lg:text-6xl">
          The future runs on better rails.
        </p>
      </div>

      <div className="hairline" />

      <div className="container-px mx-auto max-w-7xl py-12">
        <div className="flex flex-col items-center justify-between gap-8 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <a href="#top" className="flex items-center gap-2.5">
              <Logo className="h-7 w-7" />
              <span className="text-base font-semibold tracking-tight">
                {SITE.name}
              </span>
            </a>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/35">
              Patent Pending
            </p>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-white/50 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <a
              href="mailto:hello@loadit.net"
              className="text-sm text-white/50 transition-colors hover:text-white"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-white/30 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </span>
          <span>Move value. Anywhere.</span>
        </div>
      </div>
    </footer>
  );
}
