import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";

export const metadata: Metadata = {
  title: "System Status",
  description: "Status of Loadit Global components. Updated by hand until automated monitoring is live.",
  alternates: { canonical: "/status" },
  robots: { index: false, follow: true },
};

const COMPONENTS = [
  { name: "Routing endpoint (/api/v1/route)", state: "Operational", tone: "ok" },
  { name: "Live network-fee feeds", state: "Operational — degrades to cached estimates if a feed is down", tone: "ok" },
  { name: "Transactions / settlement", state: "In build — not yet available", tone: "build" },
  { name: "Webhooks", state: "Planned", tone: "build" },
  { name: "Dashboard", state: "Planned", tone: "build" },
];

export default function StatusPage() {
  return (
    <PageShell eyebrow="System status" title="Status." lede="This page is maintained by hand. Automated monitoring, incident history, and uptime reporting arrive with the production build — no uptime figures are published until they are measured.">
      <Prose>
        <div>
          <ul className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10">
            {COMPONENTS.map((c) => (
              <li key={c.name} className="flex items-center justify-between gap-4 bg-white/[0.02] px-5 py-4">
                <span className="text-sm text-white/85">{c.name}</span>
                <span className={`flex items-center gap-2 text-xs ${c.tone === "ok" ? "text-rail-400" : "text-white/50"}`}>
                  <span className={`h-2 w-2 rounded-full ${c.tone === "ok" ? "bg-rail-400" : "bg-white/30"}`} />
                  {c.state}
                </span>
              </li>
            ))}
          </ul>
          <H3 id="incidents">Incidents</H3>
          <P>No incident history is published yet. When automated monitoring is live, incidents and post-mortems will appear here.</P>
          <H3 id="subscribe">Subscribe</H3>
          <P>Status notifications will be available at <span className="font-mono text-white">status.loaditglobal.com</span> when monitoring launches. Until then, email <a href="mailto:colt@loadit.net" className="text-rail-400 underline underline-offset-4">colt@loadit.net</a>.</P>
        </div>
        <Aside title="Trust" items={[{ label: "Security", href: "/security" }, { label: "Compliance", href: "/compliance" }, { label: "Privacy", href: "/privacy" }]} />
      </Prose>
    </PageShell>
  );
}
