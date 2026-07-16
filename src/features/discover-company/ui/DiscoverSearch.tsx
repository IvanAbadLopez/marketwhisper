"use client";

import { Search, Building2, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCompanyDiscovery } from "../model/useCompanyDiscovery";

export function DiscoverSearch() {
  const router = useRouter();
  const {
    query,
    setQuery,
    results,
    isSearching,
    searchError,
    isImporting,
    importError,
    handleImport,
  } = useCompanyDiscovery();

  const handleImportClick = async (ticker: string) => {
    try {
      const importedTicker = await handleImport(ticker);
      router.push(`/companies/${importedTicker.toLowerCase()}`);
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by company name or ticker symbol..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {}
        {query.length > 0 && query.length < 2 && (
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Enter at least 2 characters to search
          </p>
        )}

        {}
        {query.length >= 2 && !isSearching && results.length > 0 && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {results.length} {results.length === 1 ? 'company' : 'companies'} found
          </p>
        )}
      </div>

      {}
      {searchError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              Search failed
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {searchError}
            </p>
          </div>
        </div>
      )}

      {}
      {importError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">
              Failed to import company
            </p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">
              {importError}
            </p>
          </div>
        </div>
      )}

      {}
      {query.length >= 2 && !isSearching && results.length === 0 && !searchError && (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            No companies found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            Try searching for a company name or ticker symbol
          </p>
        </div>
      )}

      {}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <div
              key={result.symbol}
              className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">
                    {result.displaySymbol}
                  </span>
                </div>
                {result.existsInDatabase && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                    <CheckCircle className="w-3 h-3" />
                    Already Imported
                  </span>
                )}
              </div>

              <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-2 line-clamp-2">
                {result.description}
              </p>

              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                <TrendingUp className="w-3 h-3" />
                <span>
                  Type: {result.type}
                </span>
              </div>

              <div className="flex gap-2">
                {result.existsInDatabase ? (
                  <button
                    onClick={() => router.push(`/companies/${result.symbol.toLowerCase()}`)}
                    className="flex-1 px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg transition-colors"
                  >
                    View Profile
                  </button>
                ) : (
                  <button
                    onClick={() => handleImportClick(result.symbol)}
                    disabled={isImporting[result.symbol]}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isImporting[result.symbol]
                      ? "Importing..."
                      : "Import & Enrich"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
