import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ASSETS, EVIDENCE_LABEL, formatAmount, type AssetCode, type Evidence, type Parcel } from "@/lib/dollardna";

/** Section shell — consumer-site rhythm (section-py / container-px). */
export function Section({ id, children, className, alt = false }: { id?: string; children: ReactNode; className?: string; alt?: boolean }) {
  return (
    <section id={id} className={cn("relative scroll-mt-20 section-py", alt && "border-y border-white/8 bg-white/[0.015]", className)}>
      <div className="container-px mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

/** Availability / nature labels — words plus a glyph, never color alone. */
export type Tag = "concept" | "illustrative" | "design";
export function StatusTag({ tag, className }: { tag: Tag; className?: string }) {
  const map: Record<Tag, [string, string, string]> = {
    concept: ["○", "Conceptual", "border-white/20 text-white/65 bg-white/[0.04]"],
    illustrative: ["◇", "Illustrative", "border-cyan-glow/40 text-cyan-glow bg-cyan-glow/[0.06]"],
    design: ["◐", "In design", "border-amber/50 text-amber bg-amber/10"],
  };
  const [glyph, label, tone] = map[tag];
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em]", tone, className)}>
      <span aria-hidden>{glyph}</span>
      {label}
    </span>
  );
}

export function EvidenceTag({ evidence, className }: { evidence: Evidence; className?: string }) {
  const tone =
    evidence === "attested" ? "border-rail-400/50 text-rail-400 bg-rail-400/10" :
    evidence === "referenced" ? "border-white/25 text-white/80 bg-white/[0.05]" :
    evidence === "unknown" ? "border-amber/50 text-amber bg-amber/10" :
    "border-dashed border-white/25 text-white/50 bg-transparent";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em]", tone, className)} title={EVIDENCE_LABEL[evidence]}>
      {EVIDENCE_LABEL[evidence]}
    </span>
  );
}

export const ASSET_TONE: Record<AssetCode, string> = {
  BTC: "text-amber border-amber/40",
  USD: "text-white border-white/30",
  USDC: "text-cyan-glow border-cyan-glow/40",
};

/** A parcel card — the unit of the whole page. */
export function ParcelCard({ parcel, selected = false, compact = false }: { parcel: Parcel; selected?: boolean; compact?: boolean }) {
  const consumed = parcel.status === "consumed";
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        consumed ? "border-dashed border-white/15 bg-transparent" : "border-white/12 bg-[#0B0F1A]",
        selected && "ring-1 ring-rail-400/70"
      )}
      aria-label={`${parcel.label}, ${formatAmount(parcel.asset, parcel.amount)} ${parcel.asset}, ${consumed ? "consumed (history)" : "current holding"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{parcel.id} · {consumed ? "history" : "current"}</div>
          <div className={cn("mt-1 font-mono text-[11px] font-bold tracking-[0.18em]", ASSET_TONE[parcel.asset].split(" ")[0])}>{ASSETS[parcel.asset].name.toUpperCase()}</div>
        </div>
        <EvidenceTag evidence={parcel.evidence} />
      </div>
      <div className={cn("mt-2 font-mono text-xl font-semibold tabular-nums", consumed ? "text-white/45 line-through decoration-white/20" : "text-white")}>
        {formatAmount(parcel.asset, parcel.amount)} <span className="text-sm text-white/50">{parcel.asset}</span>
      </div>
      {!compact && (
        <dl className="mt-3 grid gap-1 text-xs text-white/55">
          <div className="flex justify-between gap-3"><dt>Holder</dt><dd className="text-right text-white/75">{parcel.holder}</dd></div>
          <div className="flex justify-between gap-3"><dt>Parents</dt><dd className="font-mono text-white/75">{parcel.parents.length ? parcel.parents.join(", ") : "— (entry)"}</dd></div>
          <div className="flex justify-between gap-3"><dt>Children</dt><dd className="font-mono text-white/75">{parcel.children.length ? parcel.children.join(", ") : "—"}</dd></div>
        </dl>
      )}
    </div>
  );
}

export function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-white/8 rounded-xl border border-white/10">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[150px_1fr]">
          <dt className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 sm:pt-1">{k}</dt>
          <dd className="text-white/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
