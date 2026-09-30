import assert from "node:assert/strict";
import { test } from "node:test";
import { filterPublishableHqPages, isBlockedHqPage, sanitizeHqText } from "./hqContent";

test("published HQ pages render by default — no hand allowlist", () => {
  for (const slug of [
    "send-money-to-kenya-without-bank-transfer-fees-using-crypto",
    "how-to-buy-bitcoin-with-cash-at-rite-aid-near-me",
    "best-way-to-buy-crypto-without-an-exchange-holding-it",
    "send-crypto-to-family-overseas-without-custodial-risk",
  ]) {
    assert.equal(isBlockedHqPage({ slug }), false, slug);
  }
});

test("comprehensively sanctioned jurisdictions are blocked by slug or title", () => {
  assert.equal(isBlockedHqPage({ slug: "send-money-to-cuba-without-western-union-fees-using-crypto" }), true);
  assert.equal(isBlockedHqPage({ slug: "send-usdc-abroad", title: "How to Send Money to Iran Using USDC" }), true);
  assert.equal(isBlockedHqPage({ slug: "north-korea-crypto-remittance" }), true);
  assert.equal(isBlockedHqPage({ slug: "remit-to-syria-fast" }), true);
  assert.equal(isBlockedHqPage({ slug: "send-money-to-russia-with-crypto" }), true);
  // Not false positives on ordinary words / other places.
  assert.equal(isBlockedHqPage({ slug: "send-money-to-ecuador-without-bank-fees-using-crypto" }), false);
  assert.equal(isBlockedHqPage({ slug: "cheapest-way-to-send-usdc-internationally-in-2024" }), false);
});

test("URLs that name the cash partner stay out; empty slugs are blocked", () => {
  assert.equal(isBlockedHqPage({ slug: "how-to-buy-crypto-with-cash-at-a-moneygram-near-me" }), true);
  assert.equal(isBlockedHqPage({ slug: "moneygram-to-crypto-wallet-without-an-exchange-account" }), true);
  assert.equal(isBlockedHqPage({ slug: "" }), true);
  assert.equal(isBlockedHqPage({ slug: "   " }), true);
});

test("filterPublishableHqPages drops blocked rows even when 'published'", () => {
  const rows = [
    { slug: "send-money-to-kenya-without-bank-transfer-fees-using-crypto", title: "keep" },
    { slug: "send-money-to-cuba-without-western-union-fees-using-crypto", title: "drop" },
    { slug: "buy-usdc-with-cash-at-moneygram-near-me-no-bank-needed", title: "drop" },
    { slug: "how-to-buy-bitcoin-with-cash-at-cvs-near-me", title: "keep" },
  ];
  assert.deepEqual(
    filterPublishableHqPages(rows).map((r) => r.slug),
    ["send-money-to-kenya-without-bank-transfer-fees-using-crypto", "how-to-buy-bitcoin-with-cash-at-cvs-near-me"]
  );
});

test("sanitizer de-brands the cash partner and frames cash-in as launching", () => {
  const out = sanitizeHqText(
    "You can fund a purchase with cash through a MoneyGram location, or with a card through Stripe or Coinbase."
  );
  assert.doesNotMatch(out, /moneygram/i);
  assert.match(out, /participating cash location \(retail cash-in launching soon\)/);

  const list = sanitizeHqText("Using an on-ramp connected to Stripe, Coinbase, or MoneyGram, you can convert cash.");
  assert.doesNotMatch(list, /moneygram/i);
  assert.match(list, /a licensed cash network/);

  const plural = sanitizeHqText("Convert cash to USDC at MoneyGram locations nationwide.");
  assert.doesNotMatch(plural, /moneygram/i);
  assert.match(plural, /launching soon/);

  // HTML is untouched apart from the text.
  const html = sanitizeHqText('<p>Walk into <strong>any MoneyGram kiosk</strong>.</p>');
  assert.equal(html, '<p>Walk into <strong>any participating cash location (retail cash-in launching soon)</strong>.</p>');
});

test("sanitizer repairs HQ's CTA glitch and leaves clean text alone", () => {
  assert.equal(sanitizeHqText("This is where a tool like try Loadit fits in."), "This is where a tool like Loadit fits in.");
  assert.equal(sanitizeHqText("This is where try Loadit comes in — it's built for that."), "This is where Loadit comes in — it's built for that.");
  const clean = "Loadit lets you turn cash or a card into USDC while you keep custody.";
  assert.equal(sanitizeHqText(clean), clean);
  assert.equal(sanitizeHqText(""), "");
});
