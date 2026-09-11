import assert from "node:assert/strict";
import { test } from "node:test";
import { HQ_ALLOWED_SLUGS, filterAllowedHqPages, isAllowedHqSlug } from "./hqContent";

const CURATED = [
  "non-custodial-app-to-convert-cash-to-bitcoin-without-kyc-delays",
  "send-crypto-to-family-overseas-without-custodial-risk",
];

test("allowlist is exactly the curated slugs", () => {
  assert.deepEqual([...HQ_ALLOWED_SLUGS].sort(), [...CURATED].sort());
  assert.equal(new Set(HQ_ALLOWED_SLUGS).size, 2);
});

test("every curated slug passes; generic HQ slugs never do", () => {
  for (const slug of CURATED) {
    assert.equal(isAllowedHqSlug(slug), true, slug);
  }
  // Generic republished junk must 404 even if its DB row is published.
  assert.equal(isAllowedHqSlug("best-crypto-app-2026"), false);
  assert.equal(isAllowedHqSlug("moneygram-near-me"), false);
  assert.equal(isAllowedHqSlug("how-to-buy-crypto-with-cash-at-a-moneygram-near-me"), false);
  assert.equal(isAllowedHqSlug("how-to-buy-crypto"), false);
  assert.equal(isAllowedHqSlug(""), false);
  assert.equal(isAllowedHqSlug("   "), false);
});

test("matching is exact after trim + lowercase, no prefix/suffix tricks", () => {
  assert.equal(isAllowedHqSlug("  Send-Crypto-To-Family-Overseas-Without-Custodial-Risk  "), true);
  assert.equal(isAllowedHqSlug("send-crypto-to-family-overseas-without-custodial-risk-2"), false);
  assert.equal(isAllowedHqSlug("x-send-crypto-to-family-overseas-without-custodial-risk"), false);
});

test("filterAllowedHqPages drops non-curated rows even when 'published'", () => {
  const rows = [
    { slug: CURATED[0], title: "keep", publishedAt: "2026-01-01" },
    { slug: "generic-seo-junk", title: "drop", publishedAt: "2026-08-01" },
    { slug: CURATED[1], title: "keep", publishedAt: null },
    { slug: "another-republish", title: "drop", publishedAt: "2026-08-29" },
  ];
  const kept = filterAllowedHqPages(rows);
  assert.deepEqual(
    kept.map((r) => r.slug),
    [CURATED[0], CURATED[1]]
  );
});
