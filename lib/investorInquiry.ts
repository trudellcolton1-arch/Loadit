/**
 * Investor inquiry — validation shared by the API route and its tests.
 * Pure functions, no I/O. Collects only what a reply needs.
 */

export const INVESTOR_TYPES = ["angel", "vc", "family_office", "strategic", "other"] as const;
export type InvestorType = (typeof INVESTOR_TYPES)[number];

export interface InvestorInquiry {
  name: string;
  email: string;
  firm?: string;
  investorType?: InvestorType;
  message?: string;
}

export type FieldErrors = Partial<Record<keyof InvestorInquiry | "website", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "";

/**
 * Validate a raw JSON body. `website` is a honeypot: humans never see it, so
 * any value means a bot. Returns either the clean inquiry or field errors.
 */
export function parseInquiry(body: unknown): { ok: true; inquiry: InvestorInquiry } | { ok: false; errors: FieldErrors } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const errors: FieldErrors = {};

  if (clean(b.website, 200)) errors.website = "spam";

  const name = clean(b.name, 80);
  if (name.length < 2) errors.name = "Please enter your name.";

  const email = clean(b.email, 254).toLowerCase();
  if (!EMAIL.test(email)) errors.email = "Please enter a valid email address.";

  const firm = clean(b.firm, 120);
  const message = clean(b.message, 2000);

  let investorType: InvestorType | undefined;
  const t = clean(b.investorType, 32);
  if (t) {
    if ((INVESTOR_TYPES as readonly string[]).includes(t)) investorType = t as InvestorType;
    else errors.investorType = "Please choose an investor type from the list.";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, inquiry: { name, email, firm: firm || undefined, investorType, message: message || undefined } };
}

export const INVESTOR_TYPE_LABEL: Record<InvestorType, string> = {
  angel: "Angel",
  vc: "Venture fund",
  family_office: "Family office",
  strategic: "Strategic / corporate",
  other: "Other",
};

/** Plain-text email body for the inbox. */
export function formatInquiryEmail(i: InvestorInquiry, ts: string): string {
  return [
    "New investor inquiry on loadit.info",
    "",
    `Name: ${i.name}`,
    `Email: ${i.email}`,
    `Firm: ${i.firm ?? "—"}`,
    `Investor type: ${i.investorType ? INVESTOR_TYPE_LABEL[i.investorType] : "—"}`,
    `Time: ${ts}`,
    "",
    "Message:",
    i.message ?? "—",
    "",
    "Reply to this email to reach them directly. Data-room access is granted by you, not by this form.",
  ].join("\n");
}
