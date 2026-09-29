import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { StatusTag, type Status } from "./Bits";

/** Header for every secondary page — same rhythm, same restraint. */
export function PageShell({
  eyebrow,
  title,
  lede,
  status,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  status?: Status;
  children: ReactNode;
}) {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 70% 80% at 30% 50%, black 20%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 70% 80% at 30% 50%, black 20%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 pb-14 pt-16 sm:pb-20 sm:pt-24">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">{eyebrow}</p>
              {status && <StatusTag status={status} />}
            </div>
          </Reveal>
          <Reveal index={1}>
            <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.02] tracking-tightest text-white sm:text-6xl">
              {title}
            </h1>
          </Reveal>
          {lede && (
            <Reveal index={2}>
              <p className="mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-white/55">{lede}</p>
            </Reveal>
          )}
        </div>
      </section>
      {children}
    </main>
  );
}

/** Prose container for documentation-style pages. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-14 sm:py-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">{children}</div>
    </div>
  );
}

export function Code({ children, title }: { children: string; title?: string }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-white/10 bg-[#070A12]">
      {title && (
        <div className="border-b border-white/8 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
          {title}
        </div>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-relaxed text-white/85">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function H3({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-12 scroll-mt-24 text-xl font-semibold tracking-tight text-white first:mt-0">
      {children}
    </h2>
  );
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-white/62">{children}</p>;
}

export function Aside({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <aside className="lg:sticky lg:top-24 lg:self-start">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{title}</p>
      <ul className="mt-3 space-y-2 border-l border-white/10 pl-4">
        {items.map((i) => (
          <li key={i.href}>
            <a href={i.href} className="text-sm text-white/60 hover:text-white">{i.label}</a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/** Small key/value table for reference docs. */
export function Table({ rows, head }: { head: string[]; rows: (string | ReactNode)[][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/[0.03] font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
          <tr>{head.map((h) => <th key={h} className="px-4 py-2.5 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/8 align-top">
              {r.map((c, j) => (
                <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-mono text-[12.5px] text-white" : "text-white/62"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
