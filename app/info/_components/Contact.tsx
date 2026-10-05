import { Section, Eyebrow, H2, Lede } from "./Bits";
import { INFO } from "../_lib/content";
import { claim } from "../_lib/claims";
import { InquiryForm } from "./InquiryForm";

export function Contact() {
  return (
    <Section id="contact">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow>Start a conversation</Eyebrow>
          <H2>Request investor materials.</H2>
          <Lede>
            Tell us who you are and what you want to understand. A person replies. Materials and data-room access follow the conversation — they are granted individually, never automatically.
          </Lede>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Already have access?</p>
            <p className="mt-1.5 text-sm text-white/70">{claim("data-room")}</p>
            <a href={INFO.dataRoom} className="mt-3 inline-block text-sm font-semibold text-rail-400 hover:text-rail-100">Enter the data room →</a>
          </div>
        </div>
        <div className="relative">
          <InquiryForm />
        </div>
      </div>
    </Section>
  );
}
