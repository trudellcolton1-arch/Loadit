import assert from "node:assert/strict";
import { test } from "node:test";
import {
  authorizeStatusRead,
  extractProvidedSecret,
  isQueryFlagEnabled,
  secretsMatch,
} from "./practiceStatusAuth";

test("query flags default false and only accept explicit truthy values", () => {
  assert.equal(isQueryFlagEnabled(new URLSearchParams(""), "latest"), false);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("id=abc"), "latest"), false);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("start=0"), "start"), false);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("start=false"), "start"), false);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("latest=1"), "latest"), true);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("latest=true"), "latest"), true);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("latest=yes"), "latest"), true);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("latest="), "latest"), true);
  assert.equal(isQueryFlagEnabled(new URLSearchParams("start=1"), "start"), true);
});

test("secretsMatch is true only for exact values", () => {
  assert.equal(secretsMatch("alpha", "alpha"), true);
  assert.equal(secretsMatch("alpha", "beta"), false);
  assert.equal(secretsMatch("", "alpha"), false);
});

test("extracts bearer / header / query secrets without preferring empty values", () => {
  const url = "https://loadit.net/api/practice/moneygram?latest=1&key=from-query";
  const bearer = extractProvidedSecret(
    new Request(url, { headers: { authorization: "Bearer from-header" } })
  );
  assert.equal(bearer, "from-header");
  const gunna = extractProvidedSecret(
    new Request("https://loadit.net/api/practice/moneygram?latest=1", {
      headers: { "x-gunna-secret": "gunna-secret" },
    })
  );
  assert.equal(gunna, "gunna-secret");
  const query = extractProvidedSecret(new Request(url));
  assert.equal(query, "from-query");
});

test("authorizeStatusRead: missing env is 503, wrong secret is 401, match is ok", () => {
  const prevG = process.env.GUNNA_LOADIT_STATUS_SECRET;
  const prevP = process.env.PRACTICE_KEY;
  delete process.env.GUNNA_LOADIT_STATUS_SECRET;
  delete process.env.PRACTICE_KEY;
  try {
    const unconfigured = authorizeStatusRead(
      new Request("https://loadit.net/api/practice/moneygram?latest=1&key=x")
    );
    assert.equal(unconfigured.ok, false);
    if (!unconfigured.ok) {
      assert.equal(unconfigured.status, 503);
      assert.equal(unconfigured.reason, "gate_unconfigured");
    }

    process.env.PRACTICE_KEY = "practice-secret";
    const denied = authorizeStatusRead(
      new Request("https://loadit.net/api/practice/moneygram?latest=1&key=wrong")
    );
    assert.equal(denied.ok, false);
    if (!denied.ok) {
      assert.equal(denied.status, 401);
      assert.equal(denied.reason, "unauthorized");
    }

    const allowed = authorizeStatusRead(
      new Request("https://loadit.net/api/practice/moneygram?latest=1&key=practice-secret")
    );
    assert.equal(allowed.ok, true);

    process.env.GUNNA_LOADIT_STATUS_SECRET = "gunna-only";
    const gunnaDenied = authorizeStatusRead(
      new Request("https://loadit.net/api/practice/moneygram?latest=1&key=practice-secret")
    );
    assert.equal(gunnaDenied.ok, false);
    const gunnaOk = authorizeStatusRead(
      new Request("https://loadit.net/api/practice/moneygram?latest=1", {
        headers: { authorization: "Bearer gunna-only" },
      })
    );
    assert.equal(gunnaOk.ok, true);
  } finally {
    if (prevG === undefined) delete process.env.GUNNA_LOADIT_STATUS_SECRET;
    else process.env.GUNNA_LOADIT_STATUS_SECRET = prevG;
    if (prevP === undefined) delete process.env.PRACTICE_KEY;
    else process.env.PRACTICE_KEY = prevP;
  }
});
