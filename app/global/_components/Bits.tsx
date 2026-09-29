import type { ReactNode } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Section shell — consistent rhythm and the subtle infrastructure grid. */
export function Section({
  id,
  children,
  className,
  grid = false,
  tight = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  grid?: boolean;
  tight?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("relative", tight ? "py-16 sm:py-20" : "py-20 sm:py-28 lg:py-32", className)}
      style={
        grid
          ? {
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.055) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {grid && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, #04060B 100%)",
          }}
        />
      )}
      <div className="relative mx-auto max-w-7xl px-6">{children}</div>
    </section>
  );
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal>
      <p className={cn("font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400", className)}>
        {children}
      </p>
    </Reveal>
  );
}

export function H2({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal index={1}>
      <h2
        className={cn(
          "mt-4 max-w-3xl text-balance text-3xl font-semibold leading-[1.05] tracking-tightest text-white sm:text-5xl",
          className
        )}
      >
        {children}
      </h2>
    </Reveal>
  );
}

export function Lede({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Reveal index={2}>
      <p className={cn("mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/55 sm:text-lg", className)}>
        {children}
      </p>
    </Reveal>
  );
}

export type Status = "LIVE · SANDBOX" | "PATENT PENDING" | "IN BUILD" | "CONCEPTUAL" | "ILLUSTRATIVE" | "PLANNED" | "LABS";

/** Honest capability tag — every product/example carries one. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  const tone =
    status === "LIVE · SANDBOX"
      ? "border-rail-400/50 text-rail-400 bg-rail-400/10"
      : status === "PATENT PENDING"
        ? "border-cyan-glow/40 text-cyan-glow bg-cyan-glow/10"
        : status === "IN BUILD"
          ? "border-amber/40 text-amber bg-amber/10"
          : "border-white/20 text-white/60 bg-white/[0.04]";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.15em]", tone, className)}>
      {status}
    </span>
  );
}

/** Solid primary + quiet secondary CTAs used site-wide. */
export function Cta({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all";
  const styles =
    variant === "primary"
      ? "bg-white text-void hover:bg-white/90 shadow-[0_0_40px_-12px_rgba(255,255,255,0.5)]"
      : variant === "secondary"
        ? "border border-white/15 text-white hover:border-white/40"
        : "text-white/70 hover:text-white";
  return (
    <a href={href} className={cn(base, styles, className)}>
      {children}
    </a>
  );
}
