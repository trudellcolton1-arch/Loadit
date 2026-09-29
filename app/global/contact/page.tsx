import type { Metadata } from "next";
import { PageShell, Prose } from "../_components/PageShell";
import { AccessForm } from "../_components/AccessForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Loadit about integrating value routing infrastructure.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <PageShell eyebrow="Contact" title="Talk to Loadit." lede="Tell us what value needs to move and where. A person replies — not a sequence.">
      <Prose>
        <div className="max-w-xl">
          <AccessForm source="contact" cta="Send" />
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Direct</p>
          <a href="mailto:colt@loadit.net" className="mt-3 block text-sm text-white hover:text-rail-400">colt@loadit.net</a>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Company</p>
          <p className="mt-3 text-sm text-white/60">Loadit Inc.<br />Mansfield, Texas<br />Delaware corporation</p>
        </div>
      </Prose>
    </PageShell>
  );
}
