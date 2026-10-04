import { Reveal } from "@/components/ui/Reveal";
import { BANK_EXAMPLES, MERCHANT_EXAMPLES, PEOPLE_QUESTIONS } from "../_lib/world";
import { Section, Kicker, Display, Lede, StatusBadge } from "./Bits";

/**
 * Four audiences, four different compositions — no repeating card grid.
 * People: the questions that disappear. Unbanked: two vertical flows.
 * Merchants: pay / receive pairs. Banks: a two-line conversation.
 */

export function ForPeople() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Kicker>For people</Kicker>
          <Display>Money without the rail complexity.</Display>
          <Lede>Nobody picks a protocol before they send an email. Eventually nobody should pick a rail before they send value.</Lede>
        </div>
        <Reveal>
          <div className="rounded-3xl border border-white/10 bg-[#070A12]/85 p-7 shadow-glass sm:p-9">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">You shouldn&apos;t have to ask</p>
            <ul className="mt-5 space-y-2">
              {PEOPLE_QUESTIONS.map((q) => (
                <li key={q} className="text-2xl font-semibold tracking-tight text-white/30 line-through decoration-white/20 decoration-2 sm:text-3xl">{q}</li>
              ))}
            </ul>
            <div className="mt-8 border-t border-white/10 pt-7">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">Instead</p>
              <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight text-white sm:text-3xl">
                Send value.
                <br />
                Choose the destination.
                <br />
                <span className="text-rail-400">Let infrastructure handle the route.</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

function Flow({ steps, status, caption }: { steps: string[]; status: "live" | "building" | "vision"; caption: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#070A12]/85 p-6 shadow-glass sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Flow</span>
        <StatusBadge status={status} />
      </div>
      <ol className="mt-6 space-y-1">
        {steps.map((s, i) => (
          <li key={s} className="flex flex-col items-start">
            <span className={`rounded-xl px-4 py-3 font-mono text-[12px] font-bold tracking-[0.2em] ${i === 1 ? "border border-rail-400/50 bg-rail-400/10 text-rail-400" : "border border-white/12 text-white"}`}>{s.toUpperCase()}</span>
            {i < steps.length - 1 && <span aria-hidden className="ml-6 my-1 h-6 w-px bg-gradient-to-b from-white/30 to-rail-400/60" />}
          </li>
        ))}
      </ol>
      <p className="mt-5 text-sm leading-relaxed text-white/55">{caption}</p>
    </div>
  );
}

export function ForUnbanked() {
  return (
    <Section tight className="border-y border-white/8 bg-[#070A12]/60">
      <Kicker>Access</Kicker>
      <Display>Cash is a network too.</Display>
      <Lede>
        Over a billion people operate partly or entirely outside traditional banking. They are not outside the economy. Interoperable cash and digital infrastructure gives their value an entry point — and an exit — without requiring a bank account first.
      </Lede>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <Reveal>
          <Flow
            steps={["Cash", "Loadit", "Digital economy"]}
            status="building"
            caption="A supported cash counter becomes a door into digital value held in a wallet the person controls. Certification with a licensed national cash network is complete; consumer cash-in launches with the production build. Identity verification is performed by the licensed partner at the counter."
          />
        </Reveal>
        <Reveal index={1}>
          <Flow
            steps={["Digital value", "Loadit", "Local cash access"]}
            status="vision"
            caption="The same door, the other way: digital value to cash or local payout through a licensed partner. Depends on exit partners corridor by corridor. Vision."
          />
        </Reveal>
      </div>
    </Section>
  );
}

export function ForMerchants() {
  return (
    <Section>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Kicker>For merchants</Kicker>
          <Display>
            Accept value.
            <br />
            Receive what you want.
          </Display>
          <Lede>
            How a customer pays and how a business is paid are two different decisions. Today they are forced to match. The merchant shouldn&apos;t need to care which network the value travelled on.
          </Lede>
        </div>
        <Reveal>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#070A12]/85 shadow-glass">
            <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-white/8 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
              <span>Customer pays</span><span /><span>Merchant receives</span><span>Status</span>
            </div>
            {MERCHANT_EXAMPLES.map((e) => (
              <div key={e.pays + e.receives} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border-b border-white/8 px-6 py-5 last:border-b-0">
                <span className="text-xl font-semibold text-white sm:text-2xl">{e.pays}</span>
                <span aria-hidden className="font-mono text-rail-400">→</span>
                <span className="text-xl font-semibold text-white sm:text-2xl">{e.receives}</span>
                <StatusBadge status={e.status} />
              </div>
            ))}
            <p className="px-6 py-4 text-xs leading-relaxed text-white/45">
              Future-state examples. Merchant settlement requires issuing and settlement partners and is on the roadmap, not in the product.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

export function ForBanks() {
  return (
    <Section tight className="border-y border-white/8 bg-[#070A12]/60">
      <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Kicker>For banks</Kicker>
          <Display>Banks already know how to move dollars.</Display>
          <Lede>
            The opportunity appears when customers want value to move into or across other financial networks. Instead of every institution maintaining integrations and routing intelligence for every network, one abstraction layer could do it for all of them. Loadit is not built to compete with banks. It is built to be infrastructure they can use.
          </Lede>
          <Reveal>
            <div className="mt-10 max-w-xl space-y-3">
              <div className="rounded-2xl rounded-bl-md border border-white/12 bg-white/[0.03] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Bank</p>
                <p className="mt-1.5 text-lg text-white">&ldquo;Here is the transaction. Get it to the destination under these requirements.&rdquo;</p>
              </div>
              <div className="ml-10 rounded-2xl rounded-br-md border border-rail-400/40 bg-rail-400/[0.07] px-5 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-rail-400">Loadit</p>
                <p className="mt-1.5 text-lg text-white">&ldquo;Route determined.&rdquo;</p>
              </div>
            </div>
          </Reveal>
        </div>
        <Reveal index={1}>
          <div className="rounded-3xl border border-white/10 bg-[#04060B] p-6 sm:p-8">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Where a bank would use it</p>
            <ul className="mt-5 divide-y divide-white/8">
              {BANK_EXAMPLES.map((e) => (
                <li key={e.pays + e.receives} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="font-mono text-[12px] tracking-[0.1em] text-white">
                    {e.pays.toUpperCase()} <span className="text-rail-400">→</span> {e.receives.toUpperCase()}
                  </span>
                  <StatusBadge status={e.status} />
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-white/45">
              Keep ACH and wires exactly where they are. Checking to another U.S. bank account should never touch Loadit.
            </p>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
