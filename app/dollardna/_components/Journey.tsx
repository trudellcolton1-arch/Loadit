"use client";

import { useEffect, useMemo, useState } from "react";
import { ASSETS, buildScenario, depths, exampleValuationCents, formatAmount, holdings, stateAt, type AssetCode, type Parcel } from "@/lib/dollardna";
import { ParcelCard, EvidenceTag, StatusTag, Rows, ASSET_TONE } from "./Bits";

/**
 * INTERACTIVE CROSS-ASSET JOURNEY — Bitcoin → USD → USDC → recipient payment.
 * Deterministic scenario from lib/dollardna. Step through six recorded
 * events; inspect inputs, outputs, rate, fee, rounding, reference, evidence;
 * see the lineage as a graph (desktop) or stacked stages (phones); reset.
 * Listens for a page-level "dollardna:replay" event from the final CTA.
 */
const scenario = buildScenario();
const TOTAL = scenario.events.length;

export function Journey() {
  const [step, setStep] = useState(1); // 1..TOTAL; 0 = nothing recorded yet
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    const onReplay = () => { setStep(1); setFocus(null); document.getElementById("journey")?.scrollIntoView({ block: "start" }); };
    window.addEventListener("dollardna:replay", onReplay);
    return () => window.removeEventListener("dollardna:replay", onReplay);
  }, []);

  const event = scenario.events[step - 1];
  const parcels = useMemo(() => stateAt(scenario, step), [step]);
  const byId = useMemo(() => new Map(parcels.map((p) => [p.id, p])), [parcels]);
  const hold = useMemo(() => holdings(parcels), [parcels]);
  const valuation = useMemo(() => exampleValuationCents(hold, scenario.exampleRates), [hold]);
  const feesSoFar = scenario.events.slice(0, step).reduce((a, e) => a + (e.conversion?.feeMinor ?? 0n), 0n);

  const go = (n: number) => { setStep(Math.min(TOTAL, Math.max(1, n))); setFocus(null); };

  return (
    <div className="grid gap-6">
      {/* stepper */}
      <div className="glass rounded-3xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusTag tag="illustrative" />
            <span className="text-xs text-white/55">Illustrative simulation. Example rates. No real funds move.</span>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => go(step - 1)} disabled={step <= 1} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white disabled:opacity-40">← Back</button>
            <button type="button" onClick={() => go(step + 1)} disabled={step >= TOTAL} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-void disabled:opacity-40">Next →</button>
            <button type="button" onClick={() => go(1)} className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:text-white">Reset</button>
          </div>
        </div>
        <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Recorded events">
          {scenario.events.map((e) => {
            const on = e.n === step;
            const done = e.n < step;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => go(e.n)}
                  aria-current={on ? "step" : undefined}
                  className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${on ? "border-rail-400/60 bg-rail-400/10" : done ? "border-white/15 bg-white/[0.03]" : "border-white/10 bg-transparent hover:border-white/25"}`}
                >
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{String(e.n).padStart(2, "0")} · {e.kind}</div>
                  <div className={`mt-0.5 text-sm font-semibold ${on ? "text-white" : done ? "text-white/80" : "text-white/55"}`}>{e.title}</div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* event inspector */}
        <article className="rounded-3xl border border-white/10 bg-[#070A12] p-5 sm:p-6" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-white">
              <span className="font-mono text-sm text-rail-400">{String(event.n).padStart(2, "0")}</span> {event.title}
            </h3>
            <div className="flex items-center gap-2"><EvidenceTag evidence={event.evidence} /><StatusTag tag="concept" /></div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/65">{event.summary}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Input{event.inputs.length === 1 ? "" : "s"}</div>
              <div className="mt-2 grid gap-2">
                {event.inputs.length ? event.inputs.map((id) => <button key={id} type="button" onClick={() => setFocus(id)} className="text-left"><ParcelCard parcel={scenario.parcels.find((p) => p.id === id)!} selected={focus === id} compact /></button>) : <p className="text-sm text-white/45">None — this is where the record begins.</p>}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Output{event.outputs.length === 1 ? "" : "s"}</div>
              <div className="mt-2 grid gap-2">
                {event.outputs.map((id) => <button key={id} type="button" onClick={() => setFocus(id)} className="text-left"><ParcelCard parcel={byId.get(id) ?? scenario.parcels.find((p) => p.id === id)!} selected={focus === id} compact /></button>)}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Recorded details</div>
            <div className="mt-2"><Rows rows={event.details} /></div>
          </div>

          {focus && (
            <div className="mt-5 rounded-2xl border border-rail-400/30 bg-rail-400/[0.05] p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-rail-400">Parcel {focus} · full record</div>
                <button type="button" onClick={() => setFocus(null)} className="text-xs text-white/60 hover:text-white">Close</button>
              </div>
              <div className="mt-3"><ParcelCard parcel={byId.get(focus) ?? scenario.parcels.find((p) => p.id === focus)!} /></div>
            </div>
          )}
        </article>

        {/* holdings + lineage */}
        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-[#070A12] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Current holdings</h3>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">after event {step}</span>
            </div>
            <ul className="mt-4 divide-y divide-white/8">
              {(Object.keys(hold) as AssetCode[]).map((a) => (
                <li key={a} className="flex items-center justify-between py-2.5 text-sm">
                  <span className={`font-mono text-[11px] font-bold tracking-[0.18em] ${ASSET_TONE[a].split(" ")[0]}`}>{a}</span>
                  <span className="font-mono tabular-nums text-white">{formatAmount(a, hold[a])}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-xs text-white/55">
              <div className="flex justify-between"><span>Example valuation (USD, example rates)</span><span className="font-mono text-white">${formatAmount("USD", valuation)}</span></div>
              <div className="mt-1 flex justify-between"><span>Example fees paid so far</span><span className="font-mono text-white">${formatAmount("USD", feesSoFar)}</span></div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/40">Valuation adds unlike assets only after converting each at the labeled example rate. Consumed parcels are history and are never counted.</p>
            </div>
          </div>

          <Lineage parcels={parcels} focus={focus} onFocus={setFocus} />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ lineage */

function Lineage({ parcels, focus, onFocus }: { parcels: Parcel[]; focus: string | null; onFocus: (id: string) => void }) {
  const d = depths(parcels);
  const cols = Math.max(0, ...Object.values(d)) + 1;
  // group by depth, keep stable order by id
  const layers: Parcel[][] = Array.from({ length: cols }, () => []);
  parcels.forEach((p) => layers[d[p.id]].push(p));
  const W = 520, H = 230, nodeW = 92, nodeH = 44;
  const pos = new Map<string, { x: number; y: number }>();
  layers.forEach((layer, ci) => {
    const x = cols === 1 ? W / 2 - nodeW / 2 : 16 + (ci * (W - nodeW - 32)) / (cols - 1);
    layer.forEach((p, ri) => {
      const gap = H / (layer.length + 1);
      pos.set(p.id, { x, y: gap * (ri + 1) - nodeH / 2 });
    });
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-[#070A12] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">Lineage</h3>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">dashed = consumed (history)</span>
      </div>

      {/* desktop graph */}
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 hidden h-auto w-full sm:block" role="img" aria-label={`Lineage graph with ${parcels.length} parcels. ${parcels.map((p) => `${p.id} ${p.asset} ${p.status}${p.parents.length ? ` from ${p.parents.join(" and ")}` : ""}`).join("; ")}.`}>
        {parcels.flatMap((p) =>
          p.parents.map((pid) => {
            const a = pos.get(pid), b = pos.get(p.id);
            if (!a || !b) return null;
            const x1 = a.x + nodeW, y1 = a.y + nodeH / 2, x2 = b.x, y2 = b.y + nodeH / 2;
            const mx = (x1 + x2) / 2;
            return <path key={`${pid}-${p.id}`} d={`M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.3" />;
          })
        )}
        {parcels.map((p) => {
          const q = pos.get(p.id)!;
          const consumed = p.status === "consumed";
          const color = p.asset === "BTC" ? "#FBBF24" : p.asset === "USDC" ? "#5EEAD4" : "#FFFFFF";
          return (
            <g key={p.id} tabIndex={0} role="button" aria-label={`Inspect parcel ${p.id}`} onClick={() => onFocus(p.id)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onFocus(p.id); } }} style={{ cursor: "pointer" }}>
              <rect x={q.x} y={q.y} width={nodeW} height={nodeH} rx="10" fill={consumed ? "transparent" : "rgba(255,255,255,0.03)"} stroke={focus === p.id ? "#34D17A" : color} strokeOpacity={consumed ? 0.5 : 0.8} strokeWidth={focus === p.id ? 1.8 : 1.2} strokeDasharray={consumed ? "4 4" : undefined} />
              <text x={q.x + 8} y={q.y + 16} fill="rgba(255,255,255,0.45)" fontFamily="ui-monospace, monospace" fontSize="8" letterSpacing="1.5">{p.id} · {p.asset}</text>
              <text x={q.x + 8} y={q.y + 33} fill={consumed ? "rgba(255,255,255,0.5)" : color} fontFamily="ui-monospace, monospace" fontSize="11" fontWeight="700">{formatAmount(p.asset, p.amount, { trim: p.asset !== "USD" })}</text>
            </g>
          );
        })}
      </svg>

      {/* phone: stacked stages, readable top to bottom */}
      <ol className="mt-4 grid gap-2 sm:hidden" aria-label="Lineage, stacked">
        {parcels.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onFocus(p.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left ${p.status === "consumed" ? "border-dashed border-white/15" : "border-white/15 bg-white/[0.03]"} ${focus === p.id ? "ring-1 ring-rail-400/70" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{p.id} · {ASSETS[p.asset].code}{p.parents.length ? ` ← ${p.parents.join(", ")}` : " · entry"}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{p.status}</span>
              </div>
              <div className={`mt-1 font-mono text-base font-semibold ${p.status === "consumed" ? "text-white/45 line-through" : "text-white"}`}>{formatAmount(p.asset, p.amount)} {p.asset}</div>
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-white/40">Tap a parcel to inspect its full record. Arrows run parent → child; a parcel can have several parents (merge) or several children (split).</p>
    </div>
  );
}
