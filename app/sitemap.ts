import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { ARTICLES, TOOLS } from "@/lib/learn";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/intent", priority: 0.9 },
    { path: "/compare", priority: 0.9 },
    { path: "/platform", priority: 0.8 },
    { path: "/technology", priority: 0.7 },
    { path: "/developers", priority: 0.8 },
    { path: "/exchange", priority: 0.7 },
    { path: "/energy", priority: 0.7 },
    { path: "/marketplace", priority: 0.7 },
    { path: "/earn", priority: 0.7 },
    { path: "/moneygram", priority: 0.7 },
    { path: "/install", priority: 0.8 },
    { path: "/deck", priority: 0.6 },
    { path: "/learn", priority: 0.8 },
    ...ARTICLES.map((a) => ({ path: a.href, priority: 0.7 })),
    ...TOOLS.map((t) => ({ path: t.href, priority: 0.7 })),
  ];
  return routes.map((r) => ({
    url: `${SITE.url}${r.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}
