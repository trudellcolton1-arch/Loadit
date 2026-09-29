import type { Metadata } from "next";
import { PageShell, Prose, P } from "../_components/PageShell";
import { StatusTag, Cta } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "The Loadit Global dashboard ships with production keys.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: true },
};

export default function DashboardPage() {
  return (
    <PageShell eyebrow="Dashboard" title="Sign in arrives with production keys." lede="Key management, usage, transactions, and webhook logs live here once the production build ships. Until then, access is provisioned by hand." status="PLANNED">
      <Prose>
        <div>
          <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
            <StatusTag status="PLANNED" />
            <p className="mt-4 text-white/70">No self-serve sign-in yet — deliberately. We would rather provision your first key by hand than ship a half-finished console.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Cta href="/access">Request access</Cta>
              <Cta href="/developers/sandbox" variant="secondary">Use the sandbox</Cta>
            </div>
          </div>
          <P>This address will become <span className="font-mono text-white">dashboard.loaditglobal.com</span>.</P>
        </div>
        <div />
      </Prose>
    </PageShell>
  );
}
