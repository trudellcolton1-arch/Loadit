import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  // Explicitly welcome the major AI/LLM crawlers so Loadit can be cited in
  // ChatGPT, Claude, Perplexity, Gemini, and AI search answers.
  const aiCrawlers = [
    "GPTBot", // OpenAI / ChatGPT
    "OAI-SearchBot", // OpenAI search
    "ChatGPT-User",
    "ClaudeBot", // Anthropic / Claude
    "Claude-Web",
    "anthropic-ai",
    "PerplexityBot", // Perplexity
    "Perplexity-User",
    "Google-Extended", // Gemini / Vertex AI training
    "Applebot-Extended", // Apple Intelligence
    "Amazonbot",
    "Bytespider", // TikTok / Doubao
    "CCBot", // Common Crawl (feeds many models)
    "Meta-ExternalAgent", // Meta AI
    "cohere-ai",
    "DuckAssistBot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...aiCrawlers.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
