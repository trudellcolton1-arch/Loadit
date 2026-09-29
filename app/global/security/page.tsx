import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";
import { StatusTag } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Security",
  description: "How Loadit Global is secured today — implemented controls, and what is planned. No certifications are claimed that have not been earned.",
  alternates: { canonical: "/security" },
};

const CONTROLS = [
  ["Non-custodial by construction", "The runtime holds no keys and no balances; there is deliberately no field in the data model for a private key or a custodial balance. Delivery is only to destinations the customer controls."],
  ["Server-side authorization", "Every request to a gated surface is authorized on the server against a verified identity or key; the client is never the source of truth for who may move what."],
  ["Idempotent side effects", "Every money-moving step carries a deterministic idempotency key. Retries, reroutes, and self-heal can never double-execute."],
  ["Partner authentication", "Rail authentication uses challenge signing with dual signatures — the customer key plus the loadit.net domain key — verified against partner requirements."],
  ["Secrets", "Signing keys and access secrets are server-only environment variables; none ship to clients or live in the repository. Access codes are compared timing-safe."],
  ["Transport", "HTTPS everywhere, HSTS preloaded, nosniff and frame protections on every response."],
  ["Verifiable routing receipts", "Routing receipts are published with signatures third parties can verify; tampered receipts fail verification."],
];

export default function SecurityPage() {
  return (
    <PageShell eyebrow="Security" title="Treat it as financial software. We do." lede="What is implemented is listed as implemented. What is planned is listed as planned. Nothing here is a certification we have not earned.">
      <Prose>
        <div>
          <H3 id="controls">Implemented controls</H3>
          <ul className="mt-4 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10">
            {CONTROLS.map(([k, v]) => (
              <li key={k} className="bg-white/[0.02] px-5 py-4">
                <div className="text-sm font-semibold text-white">{k}</div>
                <div className="mt-1 text-sm text-white/58">{v}</div>
              </li>
            ))}
          </ul>

          <H3 id="planned">Planned</H3>
          <div className="mt-4 grid gap-3">
            {[
              ["Independent penetration test", "Scheduled as part of the production build."],
              ["Third-party security audit", "Scheduled as part of the production build."],
              ["SOC 2", "Not yet started. Will be pursued after the production launch."],
              ["Bug bounty", "Not yet open."],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5">
                <div><div className="text-sm text-white/85">{k}</div><div className="text-xs text-white/45">{v}</div></div>
                <StatusTag status="PLANNED" />
              </div>
            ))}
          </div>

          <H3 id="report">Report a vulnerability</H3>
          <P>Email <a href="mailto:colt@loadit.net" className="text-rail-400 underline underline-offset-4">colt@loadit.net</a> with details and steps to reproduce. We acknowledge reports and do not pursue good-faith researchers.</P>
        </div>
        <Aside title="Trust" items={[{ label: "Compliance", href: "/compliance" }, { label: "Privacy", href: "/privacy" }, { label: "System status", href: "/status" }]} />
      </Prose>
    </PageShell>
  );
}
