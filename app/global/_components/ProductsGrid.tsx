import { Reveal } from "@/components/ui/Reveal";
import { PRODUCTS } from "../_lib/site";
import { Section, Kicker, H2, Lede, StatusTag } from "./Bits";

export function ProductsGrid({ full = false }: { full?: boolean }) {
  return (
    <Section id="products">
      <Kicker>Products</Kicker>
      <H2>Every layer of the route, as a product.</H2>
      {full ? (
        <Lede>
          Each capability carries its status. Live means you can call it today with the demo
          key. In build means it exists in the runtime and is being hardened for production.
        </Lede>
      ) : null}
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.id} index={i % 3}>
            <a
              id={full ? p.id : undefined}
              href={full ? undefined : `/products#${p.id}`}
              className="block h-full rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/25"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <StatusTag status={p.status} />
              </div>
              <p className="mt-2 text-sm text-white/70">{p.line}</p>
              {full && <p className="mt-4 text-sm leading-relaxed text-white/55">{p.body}</p>}
            </a>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
