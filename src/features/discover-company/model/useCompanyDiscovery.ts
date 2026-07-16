"use client";

import { useState, useCallback, useEffect } from "react";
import { searchCompanies } from "../api/searchCompanies";
import { importCompany } from "../api/importCompany";
import { useNotifications } from "@/shared/ui/notifications";
import type { FinnhubSearchResult } from "./types";

interface UseCompanyDiscoveryResult {
  query: string;
  setQuery: (query: string) => void;
  results: FinnhubSearchResult[];
  isSearching: boolean;
  searchError: string | null;
  isImporting: { [ticker: string]: boolean };
  importError: string | null;
  handleSearch: () => Promise<void>;
  handleImport: (ticker: string) => Promise<string>;
}

export function useCompanyDiscovery(): UseCompanyDiscoveryResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FinnhubSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<{ [ticker: string]: boolean }>({});
  const [importError, setImportError] = useState<string | null>(null);
  const { addJob } = useNotifications();

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const response = await searchCompanies(trimmedQuery);
        setResults(response.results);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Search failed";
        setSearchError(message);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSearch = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      setSearchError(null);
      setResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchCompanies(trimmedQuery);
      setResults(response.results);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Search failed";
      setSearchError(message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query]);

  const handleImport = useCallback(async (ticker: string) => {
    setIsImporting((prev) => ({ ...prev, [ticker]: true }));
    setImportError(null);

    try {
      const response = await importCompany(ticker);

      if (response.enrichmentId && !response.alreadyExists) {
        addJob(ticker, response.enrichmentId);
      }
      
      setResults((prev) =>
        prev.map((result) =>
          result.symbol === ticker
            ? { ...result, existsInDatabase: true }
            : result
        )
      );

      return response.ticker;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Import failed";
      setImportError(message);
      throw error;
    } finally {
      setIsImporting((prev) => ({ ...prev, [ticker]: false }));
    }
  }, [addJob]);

  return {
    query,
    setQuery,
    results,
    isSearching,
    searchError,
    isImporting,
    importError,
    handleSearch,
    handleImport,
  };
}
