import assert from "node:assert/strict";
import { test } from "node:test";
import {
  RAIL_OWNER_EMAILS,
  isRailOwnerEmail,
  extractBearerToken,
  authorizeRailOwner,
} from "./ownerGate";

const URL = "https://loadit.net/api/rail";
const OWNER = "trudellcolton@gmail.com";

function reqWithBearer(token?: string, body?: unknown): Request {
  return new Request(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body ?? {}),
  });
}

test("the rail allowlist is exactly the owner's Hylaq account", () => {
  assert.deepEqual([...RAIL_OWNER_EMAILS], ["trudellcolton@gmail.com"]);
  assert.equal(isRailOwnerEmail("trudellcolton@gmail.com"), true);
  assert.equal(isRailOwnerEmail("TrudellColton@Gmail.com"), true); // case-insensitive
  assert.equal(isRailOwnerEmail(" trudellcolton@gmail.com "), true);
  // The OTHER founder email is deliberately NOT on the rail allowlist.
  assert.equal(isRailOwnerEmail("colt@loadit.net"), false);
  assert.equal(isRailOwnerEmail("someoneelse@gmail.com"), false);
  assert.equal(isRailOwnerEmail(""), false);
  assert.equal(isRailOwnerEmail(null), false);
});

test("bearer extraction reads only the Authorization header", () => {
  assert.equal(extractBearerToken(reqWithBearer("tok-123")), "tok-123");
  assert.equal(extractBearerToken(reqWithBearer(undefined)), "");
  const weird = new Request(URL, { headers: { authorization: "Basic abc" } });
  assert.equal(extractBearerToken(weird), "");
});

test("no token → 401, no machine access", async () => {
  const res = await authorizeRailOwner(reqWithBearer(undefined), async () => OWNER);
  assert.deepEqual(res, { ok: false, status: 401, reason: "missing_token" });
});

test("unverifiable token → 401 (fail closed, including resolver crashes)", async () => {
  const nullRes = await authorizeRailOwner(reqWithBearer("garbage"), async () => null);
  assert.deepEqual(nullRes, { ok: false, status: 401, reason: "unverified_token" });

  const throwRes = await authorizeRailOwner(reqWithBearer("garbage"), async () => {
    throw new Error("hylaq down");
  });
  assert.deepEqual(throwRes, { ok: false, status: 401, reason: "unverified_token" });
});

test("a verified NON-owner is refused — including the other founder email", async () => {
  const other = await authorizeRailOwner(reqWithBearer("valid-token"), async () => "colt@loadit.net");
  assert.deepEqual(other, { ok: false, status: 403, reason: "not_rail_owner" });

  const stranger = await authorizeRailOwner(reqWithBearer("valid-token"), async () => "intruder@example.com");
  assert.deepEqual(stranger, { ok: false, status: 403, reason: "not_rail_owner" });
});

test("the owner's verified token passes", async () => {
  const res = await authorizeRailOwner(reqWithBearer("colton-token"), async () => OWNER);
  assert.deepEqual(res, { ok: true, email: OWNER });

  // Email casing from the resolver is normalized, not rejected.
  const cased = await authorizeRailOwner(reqWithBearer("colton-token"), async () => "TrudellColton@GMAIL.com");
  assert.deepEqual(cased, { ok: true, email: OWNER });
});

test("a client-supplied email is never trusted — only the token resolves identity", async () => {
  // Body claims to be the owner; the token resolves to someone else. Refused.
  const req = reqWithBearer("intruder-token", { email: OWNER, action: "create" });
  const res = await authorizeRailOwner(req, async (token) =>
    token === "intruder-token" ? "intruder@example.com" : null
  );
  assert.deepEqual(res, { ok: false, status: 403, reason: "not_rail_owner" });
});
