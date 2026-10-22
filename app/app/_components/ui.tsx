"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Small, app-flavoured primitives. Same tokens as the marketing site, denser layout. */

export function Btn({ tone = "primary", className = "", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" | "ghost" | "danger" }) {
  const tones: Record<string, string> = {
    primary: "bg-white text-void hover:bg-white/90 disabled:bg-white/30",
    secondary: "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08] disabled:opacity-40",
    ghost: "text-white/70 hover:text-white disabled:opacity-40",
    danger: "border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-40",
  };
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed ${tones[tone]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "accent" | "warn" }) {
  const t = tone === "accent" ? "border-rail-400/30 bg-rail-400/[0.05]" : tone === "warn" ? "border-amber-400/30 bg-amber-400/[0.05]" : "border-white/10 bg-white/[0.03]";
  return <div className={`rounded-3xl border p-5 ${t} ${className}`}>{children}</div>;
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-xs text-white/40">{hint}</p>}
    </label>
  );
}

export const inputCls = "w-full rounded-2xl border border-white/15 bg-[#070A12] px-4 py-3.5 text-[15px] text-white placeholder:text-white/30 outline-none focus:border-rail-400/60";

export function Pill({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "bad" | "test" }) {
  const t: Record<string, string> = {
    neutral: "border-white/15 text-white/60",
    good: "border-rail-400/40 text-rail-400",
    warn: "border-amber-400/40 text-amber-300",
    bad: "border-red-400/40 text-red-300",
    test: "border-amber-400/60 bg-amber-400/10 text-amber-300",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] ${t[tone]}`}>{children}</span>;
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "warn" | "error" | "good" }) {
  const t: Record<string, string> = {
    info: "border-white/10 bg-white/[0.03] text-white/70",
    warn: "border-amber-400/30 bg-amber-400/[0.06] text-amber-100",
    error: "border-red-400/30 bg-red-400/[0.06] text-red-100",
    good: "border-rail-400/30 bg-rail-400/[0.06] text-rail-100",
  };
  return <div role={tone === "error" ? "alert" : undefined} className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed ${t[tone]}`}>{children}</div>;
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white ${className}`} />;
}

export function Row({ k, v, mono = false }: { k: string; v: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-white/50">{k}</span>
      <span className={`text-right text-white ${mono ? "font-mono text-[13px]" : ""}`}>{v}</span>
    </div>
  );
}

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="flex h-14 items-center justify-between">
      <div className="flex items-center gap-2">
        {onBack && (
          <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        <h1 className="text-lg font-semibold text-white">{title}</h1>
      </div>
      <div>{right}</div>
    </div>
  );
}
