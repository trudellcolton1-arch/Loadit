"use client";

import { useId, useState } from "react";
import { DESTINATIONS, SOURCES, describeRoute } from "../_lib/content";
import { StatusTag } from "./Bits";

/**
 * ROUTE EXPLORER — pick a source and a destination; see the three steps and
 * the honest status. Buttons (keyboard-native, aria-pressed), no animation
 * beyond a fade the browser can skip, no fees or timings. The static version
 * of every route is rendered by the server next to this component.
 */
function Group({ label, options, value, onChange }: { label: string; options: typeof SOURCES; value: string; onChange: (id: string) => void }) {
  const id = useId();
  return (
    <fieldset aria-labelledby={id}>
      <legend id={id} className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-white">{label}</legend>
      <div className="mt-3 grid gap-2">
        {options.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(o.id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${on ? "border-white bg-white text-void" : "border-white/12 text-white hover:border-white/35"}`}
            >
              <span className="block text-sm font-semibold">{o.label}</span>
              <span className={`block text-xs ${on ? "text-void/65" : "text-white/50"}`}>{o.detail}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function RouteExplorer() {
  const [source, setSource] = useState("cash");
  const [dest, setDest] = useState("asset");
  const route = describeRoute(source, dest);
  const srcLabel = SOURCES.find((s) => s.id === source)?.label ?? source;
  const dstLabel = DESTINATIONS.find((d) => d.id === dest)?.label ?? dest;

  return (
    <div className="grid gap-6 rounded-2xl border border-white/10 bg-[#070A12] p-5 sm:p-6 lg:grid-cols-[1fr_1fr_1.3fr]">
      <Group label="Source" options={SOURCES} value={source} onChange={setSource} />
      <Group label="Destination" options={DESTINATIONS} value={dest} onChange={setDest} />
      <div className="rounded-2xl border border-white/10 bg-[#04060B] p-5" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Illustrative flow</span>
          <StatusTag status={route.status} />
        </div>
        <p className="mt-3 text-sm font-semibold text-white">{srcLabel} → {dstLabel}</p>
        <ol className="mt-4 grid gap-0">
          {route.steps.map((s, i) => (
            <li key={s} className="grid grid-cols-[22px_1fr] gap-x-3">
              <div className="flex flex-col items-center">
                <span className={`mt-1 h-3 w-3 rounded-full border ${i === 1 ? "border-rail-400 bg-rail-400/30" : "border-white/40"}`} />
                {i < route.steps.length - 1 && <span className="my-1 h-7 w-px bg-white/12" />}
              </div>
              <p className="pb-2 text-sm leading-relaxed text-white/75">{s}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-relaxed text-white/50">{route.note}</p>
        <p className="mt-2 text-[11px] text-white/35">No fee, speed, or availability is quoted here. Routes are shown to explain the model, not as an offer.</p>
      </div>
    </div>
  );
}
