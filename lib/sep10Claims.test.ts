import assert from "node:assert/strict";
import { test } from "node:test";
import { decodeSep10JwtClaims } from "./sep10Claims";

function jwt(payload: Record<string, unknown>): string {
  const h = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const p = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${h}.${p}.sig`;
}

test("reports client_domain and client_name when present", () => {
  const claims = decodeSep10JwtClaims(
    jwt({
      iss: "https://extstellar.moneygram.com",
      sub: "GABC",
      iat: 1,
      exp: 2,
      client_domain: "loadit.net",
      client_name: "Loadit",
    })
  );
  assert.equal(claims.client_domain, "loadit.net");
  assert.equal(claims.client_name, "Loadit");
  assert.equal(claims.iss, "https://extstellar.moneygram.com");
  assert.equal(claims.sub, "GABC");
  assert.deepEqual(claims.claim_keys, ["client_domain", "client_name", "exp", "iat", "iss", "sub"]);
});

test("nulls missing client_domain / client_name instead of inventing them", () => {
  const claims = decodeSep10JwtClaims(jwt({ iss: "https://anchor.example", sub: "GABC", iat: 1, exp: 2 }));
  assert.equal(claims.client_domain, null);
  assert.equal(claims.client_name, null);
  assert.ok(!claims.claim_keys.includes("client_domain"));
  assert.ok(!claims.claim_keys.includes("client_name"));
});

test("empty claims on garbage input — never throws", () => {
  for (const token of ["", "not-a-jwt", "a.b", "a.!!!.c"]) {
    const claims = decodeSep10JwtClaims(token);
    assert.equal(claims.client_domain, null);
    assert.equal(claims.client_name, null);
    assert.deepEqual(claims.claim_keys, []);
  }
});
