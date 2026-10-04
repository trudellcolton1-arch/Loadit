import { WORLD } from "../_lib/world";

export function WorldJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${WORLD.parent.url}/#organization`,
        name: "Loadit",
        legalName: WORLD.parent.name,
        url: WORLD.parent.url,
        sameAs: [WORLD.url, WORLD.global.url],
      },
      {
        "@type": "WebSite",
        "@id": `${WORLD.url}/#website`,
        url: WORLD.url,
        name: WORLD.name,
        description: WORLD.description,
        publisher: { "@id": `${WORLD.parent.url}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${WORLD.url}/#page`,
        url: WORLD.url,
        name: WORLD.title,
        isPartOf: { "@id": `${WORLD.url}/#website` },
        about: { "@id": `${WORLD.parent.url}/#organization` },
        description: WORLD.description,
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
