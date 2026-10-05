import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_GLYPH, STATUS_LABEL, type Status } from "../_lib/content";

/** Section shell — calm rhythm, readable measure, no decoration. */
export function Section({ id, children, className, alt = false }: { id?: string; children: ReactNode; className?: string; alt?: boolean }) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 sm:py-28", alt && "border-y border-white/8 bg-[#070A12]/70", className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-rail-400">{children}</p>;
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.08] tracking-tightest text-white sm:text-5xl", className)}>{children}</h2>;
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-white/60", className)}>{children}</p>;
}

/** Status label — glyph + words, never color alone. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  const tone =
    status === "today"
      ? "border-rail-400/50 bg-rail-400/10 text-rail-400"
      : status === "testing"
        ? "border-amber/50 bg-amber/10 text-amber"
        : "border-white/20 bg-white/[0.04] text-white/65";
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em]", tone, className)}>
      <span aria-hidden>{STATUS_GLYPH[status]}</span>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusKey({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50", className)} aria-label="Status key">
      {(["today", "testing", "planned"] as Status[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-2">
          <StatusTag status={s} />
          {s === "today" ? "exists and can be shown" : s === "testing" ? "prototype or pre-launch" : "intended, not built"}
        </span>
      ))}
    </div>
  );
}

export function Cta({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "ghost"; className?: string }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-colors";
  const styles =
    variant === "primary"
      ? "bg-white text-void hover:bg-white/90"
      : variant === "secondary"
        ? "border border-white/15 text-white hover:border-white/40"
        : "text-white/70 hover:text-white";
  return (
    <a href={href} className={cn(base, styles, className)}>
      {children}
    </a>
  );
}

/** Definition rows used by several sections — one visual language. */
export function Rows({ items }: { items: { k: string; v: string; status?: Status }[] }) {
  return (
    <dl className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      {items.map((it) => (
        <div key={it.k} className="grid gap-2 px-5 py-4 sm:grid-cols-[220px_1fr_auto] sm:items-start sm:gap-6">
          <dt className="text-sm font-semibold text-white">{it.k}</dt>
          <dd className="text-sm leading-relaxed text-white/65">{it.v}</dd>
          {it.status ? <dd className="sm:justify-self-end"><StatusTag status={it.status} /></dd> : null}
        </div>
      ))}
    </dl>
  );
}
