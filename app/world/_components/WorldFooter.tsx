import { FOOTER_LINKS, WORLD } from "../_lib/world";

export function WorldFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-mono text-[12px] font-bold tracking-[0.22em] text-white">
              LOADIT<span className="text-white/45">.WORLD</span>
            </p>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/55">{WORLD.tagline}</p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40">
              System status: <span className="text-amber">Building</span>
            </p>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.slice(0, 4).map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Legal</p>
            <ul className="mt-4 space-y-2.5">
              {FOOTER_LINKS.slice(4).map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>Built by {WORLD.parent.name} · Delaware. © {new Date().getFullYear()}</p>
          <p>Non-custodial infrastructure. Patent pending. Everything here is labeled live, building, or vision — nothing is a promise of availability.</p>
        </div>
      </div>
    </footer>
  );
}
