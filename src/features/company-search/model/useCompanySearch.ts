"use client";

import { useMemo } from "react";
import type { SearchableItem } from "./types";

export function useCompanySearch<T extends SearchableItem>(
  items: T[],
  query: string
): T[] {
  return useMemo(() => {
    if (!query.trim()) return items;

    const searchQuery = query.toLowerCase();
    return items.filter((item) => {
      return (
        item.ticker.toLowerCase().includes(searchQuery) ||
        item.name.toLowerCase().includes(searchQuery) ||
        item.sector?.toLowerCase().includes(searchQuery) ||
        item.industry?.toLowerCase().includes(searchQuery) ||
        item.description?.toLowerCase().includes(searchQuery)
      );
    });
  }, [items, query]);
}
