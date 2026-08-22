import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getReceipt } from "@/lib/quantum";

/**
 * /verify/<id> — public verification for quantum receipts. Anyone with a
 * receipt id can check the post-quantum signature, see exactly what was
 * signed, and download the raw material to verify independently.
 */
export const dynamic = "force-dynamic";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Receipt ${params.id} — Quantum verification`,
    description: "Independently verify a Loadit quantum receipt: ML-DSA-65 post-quantum signature over a best-price routing statement.",
  };
}

export default async function VerifyPage({ params }: Props) {
  const r = await getReceipt(params.id);
  if (!r) notFound();

  const p = r.payload;
  const rows: [string, string][] = [
    ["Receipt ID", r.id],
    ["Signed at", p.ts],
    ["Statement", p.statement],
    ["Signature", `${p.signer.alg} (NIST FIPS 204 · post-quantum)`],
    ["Signer key", `sha256:${p.signer.pubkeyFp}`],
    ["Entropy source", p.entropy.source === "hq-qrng" ? "Quantum RNG (HQ harvest)" : "OS CSPRNG (quantum entropy pending)"],
    ["Nonce", p.entropy.nonce],
    ["Calibration", p.calibration],
  ];

  return (
    <>
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <div className="mx-auto max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#9D8CFF]">
            ◈ Quantum receipt verification
          </div>

          <div className={`mt-5 inline-flex items-center gap-3 rounded-2xl border px-5 py-3 ${
            r.valid ? "border-rail/50 bg-rail/10" : "border-red-500/50 bg-red-500/10"
          }`}>
            <span className={`text-2xl ${r.valid ? "text-rail-400" : "text-red-400"}`}>{r.valid ? "✓" : "✗"}</span>
            <div>
              <div className="text-lg font-bold text-white">
                {r.valid ? "Signature valid" : "Signature INVALID"}
              </div>
              <div className="text-xs text-white/50">
                {r.valid
                  ? "This receipt was sealed by Loadit with a post-quantum signature and has not been altered."
                  : "This receipt failed verification. Do not trust its contents."}
              </div>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            {rows.map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 border-b border-white/5 bg-white/[0.02] px-5 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
                <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">{k}</div>
                <div className="break-all text-sm text-white/85 sm:max-w-[65%] sm:text-right">{v}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">Signed statement (quote)</div>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-black/40 p-4 text-xs leading-relaxed text-white/70">
{JSON.stringify(p.quote, null, 2)}
            </pre>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a href={`/api/verify/${r.id}`} className="rounded-full border border-rail/40 bg-rail/10 px-5 py-2.5 text-sm font-semibold text-rail-400 transition-colors hover:bg-rail/20">
              Download raw material (JSON) →
            </a>
          </div>

          <p className="mt-6 text-xs leading-relaxed text-white/40">
            Independent verification: fetch the raw JSON above (payload, ML-DSA-65 signature, and public key,
            base64-encoded), then check{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5">ml_dsa65.verify(sig, utf8(JSON.stringify(payload)), publicKey)</code>{" "}
            with any FIPS 204 implementation (e.g. @noble/post-quantum). No trust in Loadit required — that&apos;s the point.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
