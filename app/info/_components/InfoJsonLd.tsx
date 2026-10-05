import { INFO } from "../_lib/content";

/** Verified facts only: organization, founder, founding date, location, and this site. */
export function InfoJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${INFO.product}/#organization`,
        name: "Loadit",
        legalName: INFO.company,
        url: INFO.product,
        foundingDate: "2025-08",
        founder: { "@type": "Person", name: "Colton Trudell", jobTitle: "Founder, CEO & Chairman" },
        address: { "@type": "PostalAddress", addressLocality: "Mansfield", addressRegion: "TX", addressCountry: "US" },
        sameAs: [INFO.business, INFO.vision, INFO.url],
        contactPoint: { "@type": "ContactPoint", contactType: "investor relations", email: INFO.contact },
      },
      {
        "@type": "WebSite",
        "@id": `${INFO.url}/#website`,
        url: INFO.url,
        name: INFO.name,
        description: INFO.description,
        publisher: { "@id": `${INFO.product}/#organization` },
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }} />;
}
