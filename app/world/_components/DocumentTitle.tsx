"use client";

import { useEffect } from "react";

/**
 * Sets document.title after hydration. Used by the World not-found page: Next 14
 * resolves not-found metadata from the root layout, which would otherwise show
 * loadit.net's title suffix in the tab.
 */
export function DocumentTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = title;
  }, [title]);
  return null;
}
