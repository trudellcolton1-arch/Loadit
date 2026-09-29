import type { Metadata } from "next";
import { PageShell, Prose, H3, P } from "../_components/PageShell";
import { AccessForm } from "../_components/AccessForm";
import { StatusTag } from "../_components/Bits";

export const metadata: Metadata = {
  title: "Join the early-access list",
  description: "Loadit Global is pre-launch. Join the list to be brought in as the platform opens to businesses and developers.",
  alternates: { canonical: "/access" },
};

export default function AccessPage() {
  return (
    <PageShell
      eyebrow="Early access"
      title="Join the list."
      lede="Loadit Global is not available yet. We're opening it to a small set of businesses and developers first. Tell us what value needs to move and we'll bring you in as the platform opens."
      status="EARLY ACCESS"
    >
      <Prose>
        <div className="max-w-xl">
          <AccessForm source="access" cta="Join the early-access list" />
        </div>
        <div>
          <div className="flex items-center gap-2"><StatusTag status="COMING SOON" /></div>
          <H3 id="what">What early access means</H3>
          <P>A person reaches out when your use case fits what&apos;s opening. You get API keys ahead of general availability, a direct line to the engineering team, and diligence materials under NDA.</P>
          <H3 id="who">Who we&apos;re opening to first</H3>
          <ul className="mt-3 space-y-2 text-sm text-white/60">
            <li>— Fintechs and wallets moving value across rails</li>
            <li>— Merchant, marketplace, and remittance platforms</li>
            <li>— Financial institutions connecting existing products</li>
            <li>— Teams building governed payments for AI agents</li>
          </ul>
          <H3 id="honest">No surprises</H3>
          <P>Nothing on this site is available to integrate today. Every capability is labeled by status, and we won&apos;t say something is ready until it is.</P>
        </div>
      </Prose>
    </PageShell>
  );
}
