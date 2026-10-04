import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";
import { STATUS_HELP, STATUS_LABEL, type Status } from "../_lib/world";

/** Section shell — generous vertical rhythm, cinematic by default. */
export function Section({
  id,
  children,
  className,
  tight = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  tight?: boolean;
}) {
  return (
    <section id={id} className={cn("relative scroll-mt-24", tight ? "py-20 sm:py-28" : "py-28 sm:py-40", className)}>
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">{children}</div>
    </section>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal>
      <p className={cn("font-mono text-[11px] font-bold uppercase tracking-[0.32em] text-rail-400", className)}>{children}</p>
    </Reveal>
  );
}

/** Display headline — the big uppercase statements that carry the story. */
export function Display({ children, className, as: Tag = "h2" }: { children: ReactNode; className?: string; as?: "h1" | "h2" }) {
  return (
    <Reveal index={1}>
      <Tag
        className={cn(
          "mt-5 max-w-5xl text-balance font-semibold uppercase leading-[0.95] tracking-tightest text-white",
          "text-[2.6rem] sm:text-6xl lg:text-7xl",
          className
        )}
      >
        {children}
      </Tag>
    </Reveal>
  );
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal index={2}>
      <p className={cn("mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-white/60 sm:text-xl", className)}>{children}</p>
    </Reveal>
  );
}

/** Truthfulness system — LIVE / BUILDING / VISION. */
export function StatusBadge({ status, className, verbose = false }: { status: Status; className?: string; verbose?: boolean }) {
  const tone =
    status === "live"
      ? "border-rail-400/70 bg-rail-400/15 text-rail-400 shadow-glow"
      : status === "building"
        ? "border-amber/50 bg-amber/10 text-amber"
        : "border-cyan-glow/40 bg-cyan-glow/[0.06] text-cyan-glow";
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]", tone, className)}
      title={STATUS_HELP[status]}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", status === "live" ? "bg-rail-400" : status === "building" ? "bg-amber" : "bg-cyan-glow")} />
      {STATUS_LABEL[status]}
      {verbose && <span className="font-normal normal-case tracking-normal text-white/50"> · {STATUS_HELP[status]}</span>}
    </span>
  );
}

export function StatusLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-5 gap-y-2", className)}>
      {(["live", "building", "vision"] as Status[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-2 text-xs text-white/50">
          <StatusBadge status={s} />
          {STATUS_HELP[s]}
        </span>
      ))}
    </div>
  );
}

export function Cta({
  href,
  children,
  variant = "primary",
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all";
  const styles =
    variant === "primary"
      ? "bg-white text-void hover:bg-white/90 shadow-[0_0_50px_-12px_rgba(255,255,255,0.55)]"
      : variant === "secondary"
        ? "border border-white/15 text-white hover:border-white/45 hover:bg-white/[0.03]"
        : "text-white/70 hover:text-white";
  return (
    <a href={href} className={cn(base, styles, className)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}
