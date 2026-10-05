"use client";

import { useId, useState } from "react";
import { track } from "@/lib/track";
import { INVESTOR_TYPES, INVESTOR_TYPE_LABEL, type FieldErrors } from "@/lib/investorInquiry";

const CONTACT = "colt@loadit.net";

/**
 * Investor inquiry form. Success is shown only after the backend confirms
 * delivery; validation errors are announced per field; delivery failures
 * are honest and offer a direct email instead.
 */
export function InquiryForm() {
  const uid = useId();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState("sending");
    setErrors({});
    setErrorMsg("");
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    try {
      const res = await fetch("/api/investor-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; reason?: string; errors?: FieldErrors };
      if (res.ok && data.ok) {
        setState("done");
        track("investor_inquiry_submitted", { investorType: String(payload.investorType || "") || null });
        return;
      }
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        setState("idle");
        return;
      }
      setErrorMsg(
        res.status === 429
          ? "Too many attempts from this connection. Please wait a minute, or email us directly."
          : data.reason === "not_configured"
            ? "Form delivery isn't configured on this deployment. Please email us directly."
            : "We couldn't deliver your message just now. Please email us directly."
      );
      setState("error");
    } catch {
      setErrorMsg("We couldn't reach the server. Please email us directly.");
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-rail-400/40 bg-rail-400/[0.07] p-6" role="status">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-rail-400">Received</p>
        <p className="mt-2 text-white">Thank you. Your message reached the Loadit inbox. A person will reply from a Loadit address, usually within a few business days.</p>
        <p className="mt-2 text-sm text-white/55">Investor materials and data-room access are provided after that conversation, not automatically.</p>
      </div>
    );
  }

  const field = "w-full rounded-xl border bg-[#0B0F1A] px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-rail-400/60";
  const err = (k: keyof FieldErrors) => (errors[k] ? "border-rose-400/70" : "border-white/12");

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-2xl border border-white/10 bg-[#070A12] p-6" aria-describedby={`${uid}-note`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-name`} className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Name</label>
          <input id={`${uid}-name`} name="name" required autoComplete="name" maxLength={80} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? `${uid}-name-err` : undefined} className={`${field} ${err("name")}`} />
          {errors.name && <p id={`${uid}-name-err`} className="text-xs text-rose-300">{errors.name}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-email`} className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Email</label>
          <input id={`${uid}-email`} name="email" type="email" required autoComplete="email" maxLength={254} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? `${uid}-email-err` : undefined} className={`${field} ${err("email")}`} />
          {errors.email && <p id={`${uid}-email-err`} className="text-xs text-rose-300">{errors.email}</p>}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-firm`} className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Firm <span className="normal-case tracking-normal text-white/30">(optional)</span></label>
          <input id={`${uid}-firm`} name="firm" autoComplete="organization" maxLength={120} className={`${field} border-white/12`} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor={`${uid}-type`} className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Investor type <span className="normal-case tracking-normal text-white/30">(optional)</span></label>
          <select id={`${uid}-type`} name="investorType" defaultValue="" aria-invalid={Boolean(errors.investorType)} className={`${field} ${err("investorType")}`}>
            <option value="">Prefer not to say</option>
            {INVESTOR_TYPES.map((t) => (
              <option key={t} value={t}>{INVESTOR_TYPE_LABEL[t]}</option>
            ))}
          </select>
          {errors.investorType && <p className="text-xs text-rose-300">{errors.investorType}</p>}
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${uid}-msg`} className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Message <span className="normal-case tracking-normal text-white/30">(optional)</span></label>
        <textarea id={`${uid}-msg`} name="message" rows={4} maxLength={2000} placeholder="What you'd like to understand, or when you'd like to talk." className={`${field} border-white/12`} />
      </div>
      {/* honeypot — hidden from people, filled by bots */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`${uid}-web`}>Website</label>
        <input id={`${uid}-web`} name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state === "sending"} className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-void transition-colors hover:bg-white/90 disabled:opacity-60">
          {state === "sending" ? "Sending…" : "Request investor materials"}
        </button>
        <a href={`mailto:${CONTACT}?subject=Investor%20inquiry`} className="text-sm text-white/60 hover:text-white">or email {CONTACT}</a>
      </div>
      {state === "error" && (
        <p role="alert" className="rounded-xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
          {errorMsg} <a href={`mailto:${CONTACT}?subject=Investor%20inquiry`} className="underline underline-offset-4">{CONTACT}</a>
        </p>
      )}
      <p id={`${uid}-note`} className="text-[11px] leading-relaxed text-white/40">
        We collect only what a reply needs and use it only to respond. Submitting this form does not grant access to the data room or send any documents automatically.
      </p>
    </form>
  );
}
