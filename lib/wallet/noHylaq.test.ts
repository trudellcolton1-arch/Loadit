import assert from "node:assert/strict";
import { test } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/**
 * GUARD: the wallet (/app) must never involve Hylaq — not its OAuth, not its
 * database, not the HQ routing service, not its copy. This test walks the
 * wallet's transitive first-party import graph and fails if any file in it
 * references Hylaq, or if a known Hylaq module is ever pulled in.
 */

const ROOT = resolve(__dirname, "../..");
const ROOTS = [
  "app/app/page.tsx",
  "app/app/layout.tsx",
  "app/app/manifest.webmanifest/route.ts",
  "app/api/anchor/auth/route.ts",
  "app/api/anchor/sep24/route.ts",
  "app/api/wallet/activate/route.ts",
  "app/api/anchor/sign-challenge/route.ts",
  "public/app-sw.js",
];
const FORBIDDEN_MODULES = ["lib/hylaqDb.ts", "lib/hq.ts", "lib/rail/ownerGate.ts", "lib/dataroom.ts", "app/api/auth/hylaq/token/route.ts"];
const FORBIDDEN_TEXT = /hylaq|hylaqo|HQ_LOADIT_KEY|HYLAQ_|HYLAQ_DATABASE_URL/i;

function resolveImport(from: string, spec: string): string | null {
  if (!spec.startsWith(".") && !spec.startsWith("@/")) return null; // third-party
  const base = spec.startsWith("@/") ? join(ROOT, spec.slice(2)) : resolve(dirname(from), spec);
  for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, join(base, "index.ts"), join(base, "index.tsx")]) {
    if (existsSync(c) && !c.endsWith("/")) {
      try {
        if (readFileSync(c, "utf8") !== undefined && !/\/$/.test(c)) return c;
      } catch {
        /* directory */
      }
    }
  }
  return null;
}

function closure(): string[] {
  const seen = new Set<string>();
  const stack = ROOTS.map((r) => join(ROOT, r));
  while (stack.length) {
    const f = stack.pop()!;
    if (seen.has(f)) continue;
    seen.add(f);
    const src = readFileSync(f, "utf8");
    const specs = [...src.matchAll(/from\s+["']([^"']+)["']/g), ...src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g), ...src.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    for (const s of specs) {
      const r = resolveImport(f, s);
      if (r && !r.includes("node_modules")) stack.push(r);
    }
  }
  return [...seen].map((f) => f.slice(ROOT.length + 1)).sort();
}

test("wallet import graph contains no Hylaq module", () => {
  const files = closure();
  assert.ok(files.length >= 15, `closure unexpectedly small: ${files.length}`);
  for (const bad of FORBIDDEN_MODULES) assert.ok(!files.includes(bad), `${bad} is reachable from the wallet`);
});

test("no file on the wallet path mentions Hylaq, hylaqo, or HQ keys", () => {
  const offenders: string[] = [];
  for (const rel of closure()) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    const m = src.match(FORBIDDEN_TEXT);
    if (m) offenders.push(`${rel}: "${m[0]}"`);
  }
  assert.deepEqual(offenders, []);
});

test("wallet copy never mentions Hylaq or HQ as a product", () => {
  // User-facing wallet files only; docs/LOADIT_APP.md states the rule and so names it.
  const files = ["app/app/_components/screens.tsx", "app/app/_components/TxStatus.tsx", "app/app/_components/AppShell.tsx", "app/app/_components/ui.tsx", "app/app/layout.tsx", "app/app/page.tsx", "app/app/manifest.webmanifest/route.ts", "public/app-sw.js"];
  for (const rel of files) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    assert.ok(!/hylaq/i.test(src), `${rel} mentions Hylaq`);
    assert.ok(!/\bAsk HQ\b|Loadit HQ|HQ ·/.test(src), `${rel} mentions HQ as a product`);
  }
});
