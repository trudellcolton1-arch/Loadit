import assert from "node:assert/strict";
import { test } from "node:test";
import { POST } from "../../app/api/practice/moneygram/route";

test("POST /api/practice/moneygram refuses callers without a rail-owner token", async () => {
  const res = await POST(
    new Request("https://loadit.net/api/practice/moneygram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUsd: 50 }),
    })
  );
  assert.equal(res.status, 401);
  const body = (await res.json()) as { ok?: boolean; reason?: string };
  assert.equal(body.ok, false);
  assert.equal(body.reason, "missing_token");
});

test("POST /api/practice/moneygram refuses a verified non-owner", async () => {
  const prev = process.env.RAIL_DEV_TOKEN_EMAILS;
  process.env.RAIL_DEV_TOKEN_EMAILS = JSON.stringify({ "intruder-token": "intruder@example.com" });
  try {
    const res = await POST(
      new Request("https://loadit.net/api/practice/moneygram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer intruder-token",
        },
        body: JSON.stringify({ amountUsd: 50 }),
      })
    );
    assert.equal(res.status, 403);
    const body = (await res.json()) as { ok?: boolean; reason?: string };
    assert.equal(body.reason, "not_rail_owner");
  } finally {
    if (prev === undefined) delete process.env.RAIL_DEV_TOKEN_EMAILS;
    else process.env.RAIL_DEV_TOKEN_EMAILS = prev;
  }
});
