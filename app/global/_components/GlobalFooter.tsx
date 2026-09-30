import { FOOTER, GLOBAL } from "../_lib/site";
import { Wordmark } from "./Wordmark";

export function GlobalFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.3fr_repeat(4,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/50">
              The intelligent layer between where value is and where it needs to go.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.25em] text-rail-400">
              {GLOBAL.tagline}
            </p>
          </div>
          {FOOTER.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">{col.title}</p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-3 border-t border-white/8 pt-6 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {GLOBAL.parent.name} Loadit Global is the business and developer platform of Loadit.</p>
          <p>Non-custodial infrastructure. Patent pending. Capabilities labeled by status; nothing here is a guarantee of availability.</p>
        </div>
      </div>
    </footer>
  );
}
