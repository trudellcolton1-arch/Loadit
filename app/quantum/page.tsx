import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { QuantumCollapse } from "@/components/QuantumCollapse";
import { getLatestBatch, getLatestReceiptId, publicKeyFingerprint } from "@/lib/quantum";

/**
 * /quantum — the pioneer page. Live calibration status straight from the
 * batch table (every row = a completed IBM job), a live receipt to check,
 * and the honest version of every claim.
 */
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Quantum Routing — Loadit",
  description:
    "The first consumer money app with quantum-calibrated routing and quantum-proof receipts. ML-DSA-65 signatures, IBM hardware calibration batches, publicly verifiable.",
};

export default async function QuantumPage() {
  const [batch, receiptId, fp] = await Promise.all([
    getLatestBatch(),
    getLatestReceiptId(),
    Promise.resolve(publicKeyFingerprint()),
  ]);

  return (
    <>
      <Navbar />
      <main className="px-5 pb-24 pt-24">
        <div className="mx-auto max-w-4xl">
          {/* hero */}
          <div className="text-center">
            <div className="font-mono text-xs uppercase tracking-[0.4em] text-[#9D8CFF]">
              World first · Loadit × Hylaq Quantum
            </div>
            <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-white sm:text-6xl">
              Quantum{" "}
              <span className="bg-gradient-to-r from-rail-400 to-[#9D8CFF] bg-clip-text text-transparent">
                Routing
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
              Every Loadit quote is sealed with <b className="text-white">post-quantum cryptography</b> and stamped
              with routing calibration measured on <b className="text-white">real IBM quantum hardware</b>. Not a
              metaphor — batch-numbered, job-ID&apos;d, and publicly verifiable.
            </p>
          </div>

          {/* live status */}
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/10">
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] uppercase tracking-[0.25em] text-rail-400">
              ● Live calibration status
            </div>
            <div className="grid gap-px bg-white/5 sm:grid-cols-2">
              {(batch
                ? ([
                    ["Current batch", `QAOA batch #${batch.batchNo}`],
                    ["Quantum backend", batch.backend],
                    ["IBM job id", batch.jobId],
                    ["Shots", String(batch.shots)],
                    ["Ran at", batch.ranAt],
                    ["Signature scheme", "ML-DSA-65 · NIST FIPS 204"],
                  ] as [string, string][])
                : ([
                    ["Current batch", "classical-v1 — first QAOA batch pending"],
                    ["Signature scheme", "ML-DSA-65 · NIST FIPS 204"],
                  ] as [string, string][])
              ).map(([k, v]) => (
                <div key={k} className="bg-[#0B0F0D] px-5 py-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">{k}</div>
                  <div className="mt-1 break-all text-sm font-semibold text-white/90">{v}</div>
                </div>
              ))}
            </div>
            {fp && (
              <div className="border-t border-white/10 bg-white/[0.02] px-5 py-3 font-mono text-[11px] text-white/40">
                Loadit signing key: sha256:{fp}
              </div>
            )}
          </div>

          {/* collapse animation */}
          <div className="mt-14">
            <h2 className="text-2xl font-bold text-white">Six possible routes enter. One survives.</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Watch HQ collapse the route space — partners × chains — into the single cheapest real path.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#080D0A]">
              <QuantumCollapse />
            </div>
          </div>

          {/* what's real */}
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {[
              ["Quantum-proof receipts", "Every quote's best-price receipt is sealed with ML-DSA-65 — signatures built to survive the quantum computers that will break RSA and ECDSA. Live on every quote today."],
              ["Hardware calibration", "A scheduled job runs route calibration on IBM quantum processors. Every batch stores its real IBM job id — nothing is written when a run fails. Auditable, not aspirational."],
              ["Zero-trust verification", "Every receipt links to a public verify page with the raw payload, signature, and public key. Check it with any FIPS 204 library. No trust in Loadit required."],
            ].map(([t, b]) => (
              <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="font-semibold text-rail-400">{t}</div>
                <p className="mt-2 text-[13px] leading-relaxed text-white/60">{b}</p>
              </div>
            ))}
          </div>

          {/* live receipt CTA */}
          {receiptId && (
            <div className="mt-12 rounded-2xl border border-[#4A3F8F] bg-gradient-to-br from-[#151030] to-[#0B0F0D] p-6 text-center">
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#9D8CFF]">
                Don&apos;t take our word for it
              </div>
              <p className="mx-auto mt-3 max-w-xl text-sm text-white/60">
                Here is the most recent quantum receipt sealed on this rail. Open it, download the raw material,
                and verify the signature yourself.
              </p>
              <a
                href={`/verify/${receiptId}`}
                className="mt-5 inline-block rounded-full bg-rail px-7 py-3 text-sm font-bold text-black transition-transform hover:scale-105"
              >
                Verify a live receipt →
              </a>
            </div>
          )}

          {/* honesty */}
          <div className="mt-14 rounded-2xl border border-white/10 p-6">
            <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-white/50">What we never claim</h3>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-white/55">
              <li>— A quantum computer does not route your payment live: quantum queues take minutes, quotes take milliseconds. The hot path is classical and instant; the quantum layer calibrates it on a schedule.</li>
              <li>— Quantum does not make your payment faster or cheaper today. The post-quantum receipt security is the hard value; the calibration pipeline is infrastructure for the scale where it will matter.</li>
              <li>— If the quantum layer is stale or down, receipts say so honestly — entropy and calibration fields report exactly what ran.</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
