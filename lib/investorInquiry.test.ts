import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInquiry, formatInquiryEmail } from "./investorInquiry";

test("accepts a minimal valid inquiry and normalizes it", () => {
  const r = parseInquiry({ name: "  Ada Lovelace ", email: "ADA@Example.com", firm: "", message: "" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.inquiry.name, "Ada Lovelace");
    assert.equal(r.inquiry.email, "ada@example.com");
    assert.equal(r.inquiry.firm, undefined);
    assert.equal(r.inquiry.message, undefined);
    assert.equal(r.inquiry.investorType, undefined);
  }
});

test("rejects missing name, bad email, unknown investor type", () => {
  const r = parseInquiry({ name: "A", email: "nope", investorType: "whale" });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.ok(r.errors.name);
    assert.ok(r.errors.email);
    assert.ok(r.errors.investorType);
  }
});

test("honeypot field marks the submission as spam", () => {
  const r = parseInquiry({ name: "Bot", email: "bot@example.com", website: "http://spam" });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.errors.website, "spam");
});

test("caps lengths and strips control characters", () => {
  const r = parseInquiry({ name: "x".repeat(500), email: "a@b.co", message: "hi\u0000there\n" + "y".repeat(5000) });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.inquiry.name.length, 80);
    assert.ok(!r.inquiry.message!.includes("\u0000"));
    assert.ok(r.inquiry.message!.length <= 2000);
  }
});

test("non-object bodies fail cleanly", () => {
  assert.equal(parseInquiry(null).ok, false);
  assert.equal(parseInquiry("str").ok, false);
});

test("email body includes the fields and never promises access", () => {
  const txt = formatInquiryEmail({ name: "Ada", email: "ada@example.com", firm: "Analytical", investorType: "vc" }, "2026-10-05T00:00:00Z");
  assert.match(txt, /Ada/);
  assert.match(txt, /Venture fund/);
  assert.match(txt, /granted by you, not by this form/);
});
