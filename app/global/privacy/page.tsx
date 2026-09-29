import type { Metadata } from "next";
import { PageShell, Prose, Aside, H3, P } from "../_components/PageShell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Loadit Global collects on this site and through the API, and how it is used.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PageShell eyebrow="Privacy" title="What we collect, and why." lede="Short, because there isn't much. This covers loaditglobal.com and the sandbox API.">
      <Prose>
        <div>
          <H3 id="site">This website</H3>
          <P>No advertising trackers. If you submit an access or contact form we receive the email, company, and message you typed, delivered to a Loadit inbox and used only to reply to you.</P>
          <H3 id="api">The sandbox API</H3>
          <P>Requests to the routing endpoint are rate-limited per key. Request parameters (amount, method, asset, and an optional destination address) are processed to compute a route and are not sold or shared. Server logs are retained for operations and abuse prevention.</P>
          <H3 id="product">The Loadit product</H3>
          <P>The consumer application and any production integration are governed by the Loadit privacy policy at <a href="https://loadit.net/privacy" className="text-rail-400 underline underline-offset-4">loadit.net/privacy</a>, which controls where the two differ.</P>
          <H3 id="contact">Questions</H3>
          <P>Email <a href="mailto:colt@loadit.net" className="text-rail-400 underline underline-offset-4">colt@loadit.net</a>. Loadit Inc., Delaware.</P>
        </div>
        <Aside title="Trust" items={[{ label: "Security", href: "/security" }, { label: "Compliance", href: "/compliance" }]} />
      </Prose>
    </PageShell>
  );
}
