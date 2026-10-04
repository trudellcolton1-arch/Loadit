import { Cta } from "./_components/Bits";
import { DocumentTitle } from "./_components/DocumentTitle";

export default function WorldNotFound() {
  return (
    <main className="mx-auto flex min-h-[70svh] max-w-3xl flex-col items-center justify-center px-6 pt-24 text-center">
      <DocumentTitle title="Not found | Loadit.world" />
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-rail-400">No route</p>
      <h1 className="mt-4 text-4xl font-semibold uppercase tracking-tightest text-white sm:text-6xl">That destination isn&apos;t on the map.</h1>
      <p className="mt-4 text-white/55">Loadit.world is one continuous story. Start at the top.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Cta href="/">Enter the world</Cta>
        <Cta href="https://loadit.net" variant="secondary">Loadit.net ↗</Cta>
      </div>
    </main>
  );
}
