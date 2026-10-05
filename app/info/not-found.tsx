import { Cta } from "./_components/Bits";

export default function InfoNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.28em] text-rail-400">Not found</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-white">That page isn&apos;t here.</h1>
      <p className="mt-4 text-white/55">The investor overview is a single page.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Cta href="/">Investor overview</Cta>
        <Cta href="/#contact" variant="secondary">Contact</Cta>
      </div>
    </main>
  );
}
