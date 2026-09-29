import { Reveal } from "@/components/ui/Reveal";
import { ROLES, MONEY_MAP } from "../_lib/site";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

/**
 * THE WHOLE PRODUCT ON A WHITEBOARD.
 * CUSTOMER → LOADIT → PARTNERS / RAILS → RECIPIENT, and the four jobs inside
 * the Loadit box: capture intent, HQ plans, UVCE converts, ledger reconciles.
 */
const BOXES = [
  { name: "Customer / partner app", does: "States the outcome", sub: "\"I have X. Make it Y, there.\"" },
  { name: "Loadit", does: "HQ decides · UVCE converts · ledger tracks", sub: "capture intent → plan → convert → reconcile", core: true },
  { name: "Partners / rails", does: "Accept · fund · convert · transfer · settle", sub: "under their role and license" },
  { name: "Recipient", does: "Gets the requested output", sub: "a destination they control" },
];

const JOBS = [
  { n: "01", title: "Capture intent", body: "Source value, amount, desired output or outputs, destination or destinations, constraints. Quoted before anything is funded." },
  { n: "02", title: "HQ chooses the eligible plan", body: "Only supported paths, scored on cost, speed, liquidity, availability, risk, and compliance. Re-planned if a leg fails." },
  { n: "03", title: "UVCE converts when needed", body: "Wherever input and output differ, the conversion engine performs or coordinates it across supported liquidity." },
  { n: "04", title: "Ledger tracks and reconciles", body: "Every leg's state, every fee, every partner's role, one receipt. Verified against what the partners report." },
];

export function Whiteboard({ withMoneyMap = true }: { withMoneyMap?: boolean }) {
  return (
    <Section id="whiteboard">
      <Kicker>The whole product on a whiteboard</Kicker>
      <H2>Customer → Loadit → partners → recipient.</H2>
      <Lede>
        Four boxes, and four jobs inside the Loadit box. At every step we can say who has the
        money, what Loadit is doing, who charges a fee, and why the customer was better off.
      </Lede>

      {/* the four boxes */}
      <Reveal>
        <ol className="mt-14 grid gap-3 md:grid-cols-[1fr_auto_1.3fr_auto_1fr_auto_1fr] md:items-stretch">
          {BOXES.map((b, i) => (
            <li key={b.name} className="contents">
              <div className={`rounded-2xl border p-5 ${b.core ? "border-rail-400/40 bg-rail-400/[0.06] shadow-glow" : "border-white/10 bg-[#070A12]/85"}`}>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">{String(i + 1).padStart(2, "0")}</div>
                <div className={`mt-2 text-base font-semibold ${b.core ? "text-white" : "text-white/90"}`}>{b.name}</div>
                <div className="mt-2 text-sm text-white/70">{b.does}</div>
                <div className="mt-1 font-mono text-[11px] text-white/40">{b.sub}</div>
              </div>
              {i < BOXES.length - 1 && (
                <div aria-hidden className="flex items-center justify-center py-1 font-mono text-xl text-rail-400 md:py-0">
                  <span className="md:hidden">↓</span>
                  <span className="hidden md:inline">→</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Reveal>

      {/* inside the Loadit box */}
      <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
        {JOBS.map((j, i) => (
          <Reveal key={j.n} index={i} className="bg-[#070A12] p-7">
            <div className="font-mono text-xs font-bold tracking-[0.25em] text-rail-400">{j.n}</div>
            <h3 className="mt-4 text-lg font-semibold text-white">{j.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{j.body}</p>
          </Reveal>
        ))}
      </div>

      {/* who does what */}
      <div className="mt-12 grid gap-4 lg:grid-cols-2">
        {ROLES.map((r, i) => (
          <Reveal key={r.name} index={i % 2}>
            <div className="h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-white">{r.name}</h3>
                <StatusTag status={r.status} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{r.role}</p>
            </div>
          </Reveal>
        ))}
      </div>

      {withMoneyMap && (
        <Reveal>
          <div className="mt-12 rounded-2xl border border-white/10 bg-[#070A12]/85 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-rail-400">The money map</div>
                <h3 className="mt-2 text-xl font-semibold text-white">Ten questions every live route must answer.</h3>
              </div>
              <p className="max-w-sm text-sm text-white/50">
                The product changes — Load, Send, Connect, Convert, Cash Out, Loadit One — but the
                questions never do. Partners get the answers for their corridor in writing.
              </p>
            </div>
            <ol className="mt-6 grid gap-2 sm:grid-cols-2">
              {MONEY_MAP.map((q, i) => (
                <li key={q} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-white/75">
                  <span className="font-mono text-[11px] text-rail-400">{String(i + 1).padStart(2, "0")}</span>
                  {q}
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      )}
    </Section>
  );
}
