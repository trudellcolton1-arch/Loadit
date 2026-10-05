import { INFO } from "../_lib/content";
import { LEGAL_NOTE } from "../_lib/claims";

export function InfoFooter() {
  const links = [
    { label: "Loadit.net — the product", href: INFO.product },
    { label: "Loadit Global — for businesses", href: INFO.business },
    { label: "Loadit.world — the vision", href: INFO.vision },
    { label: "Investor data room (access required)", href: INFO.dataRoom },
    { label: "Privacy", href: `${INFO.product}/privacy` },
  ];
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="font-mono text-[13px] font-bold tracking-[0.22em] text-white">
              LOADIT<span className="text-white/45"> · INVESTORS</span>
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55">
              Connecting how people pay with how value is received. Investor inquiries: <a href={`mailto:${INFO.contact}`} className="text-white underline decoration-white/30 underline-offset-4">{INFO.contact}</a>
            </p>
          </div>
          <ul className="space-y-2.5">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-white/65 transition-colors hover:text-white">{l.label}</a>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 border-t border-white/8 pt-6 text-xs leading-relaxed text-white/40">{LEGAL_NOTE}</p>
        <p className="mt-3 text-xs text-white/35">© {new Date().getFullYear()} {INFO.company}</p>
      </div>
    </footer>
  );
}
