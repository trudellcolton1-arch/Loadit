import { Cta } from "./_components/Bits";

export default function GlobalNotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">No route</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tightest text-white sm:text-5xl">That destination doesn&apos;t exist.</h1>
      <p className="mt-4 text-white/55">Recalculating… try one of these.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Cta href="/">Home</Cta>
        <Cta href="/developers" variant="secondary">Developers</Cta>
      </div>
    </main>
  );
}
