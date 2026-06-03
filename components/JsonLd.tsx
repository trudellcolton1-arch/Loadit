import { buildJsonLd } from "@/lib/seo";

/** Injects structured data for rich results. Server component. */
export function JsonLd() {
  return (
    <script
      type="application/ld+json"
      // Structured data is trusted, build-time content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
    />
  );
}
