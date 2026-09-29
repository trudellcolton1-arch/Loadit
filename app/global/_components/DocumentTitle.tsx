"use client";

import { useEffect } from "react";

/**
 * Sets document.title after hydration. Used by the Global not-found page,
 * where Next 14 resolves metadata from the root layout (not-found.tsx cannot
 * export metadata), so the tab would otherwise show loadit.net's title.
 */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}
