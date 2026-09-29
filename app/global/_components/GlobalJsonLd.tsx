import { GLOBAL } from "../_lib/site";

/** Structured data for loaditglobal.com — Organization + developer platform. */
export function GlobalJsonLd() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${GLOBAL.url}/#organization`,
        name: GLOBAL.name,
        legalName: GLOBAL.parent.name,
        url: GLOBAL.url,
        description: GLOBAL.description,
        slogan: GLOBAL.tagline,
        parentOrganization: { "@type": "Organization", name: GLOBAL.parent.name, url: GLOBAL.parent.url },
        contactPoint: { "@type": "ContactPoint", contactType: "sales", email: GLOBAL.contact },
      },
      {
        "@type": "WebSite",
        "@id": `${GLOBAL.url}/#website`,
        url: GLOBAL.url,
        name: GLOBAL.name,
        publisher: { "@id": `${GLOBAL.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        name: "Loadit Global API",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        url: `${GLOBAL.url}/developers`,
        description:
          "HTTP API that returns a selected, supported settlement route — cost, expected time, network, and a normalized settlement object — for a stated origin and destination of value.",
        publisher: { "@id": `${GLOBAL.url}/#organization` },
        releaseNotes: "Pre-launch. Opening to early-access partners first.",
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What does Loadit Global do?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Loadit is a routing and orchestration layer for value movement. Your application states what value is coming in and what needs to come out; Loadit evaluates supported routes on cost, speed, liquidity, availability, risk, and compliance, and returns the selected route and a normalized settlement object.",
            },
          },
          {
            "@type": "Question",
            name: "Is Loadit an exchange, a wallet, or a token?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "No. Loadit is infrastructure — an integration layer between your application and supported traditional and digital financial rails. It is non-custodial and never holds customer funds.",
            },
          },
          {
            "@type": "Question",
            name: "Can I integrate Loadit Global today?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Not yet. Loadit Global is pre-launch. Businesses and developers can join the early-access list at loaditglobal.com/access and will be brought in as the platform opens.",
            },
          },
        ],
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
