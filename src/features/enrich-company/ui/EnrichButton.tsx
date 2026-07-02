"use client";

/**
 * Enrich Company Button
 * Triggers public financial data fetch and AI analysis
 * @module features/enrich-company/ui
 */

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { enrichCompany } from "../api/enrichCompany";

interface EnrichButtonProps {
  ticker: string;
  onSuccess?: () => void;
  variant?: "default" | "compact";
  className?: string;
}

export function EnrichButton({
  ticker,
  onSuccess,
  variant = "default",
  className = "",
}: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await enrichCompany(ticker);
      setSuccess(true);
      
      // Call success callback after short delay
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to enrich company");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleEnrich}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
          success
            ? "bg-green-500/20 text-green-400 cursor-default"
            : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        } ${className}`}
        title={error || (success ? "Enriched successfully!" : "Fetch public financial data and AI analysis")}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : success ? (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Enriched</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Enrich</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleEnrich}
        disabled={loading}
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          success
            ? "bg-green-500/20 text-green-400 cursor-default"
            : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Enriching...</span>
          </>
        ) : success ? (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Enriched Successfully!</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Enrich with Public Data</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-400 flex items-start gap-1.5">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {loading && (
        <p className="text-sm text-zinc-400">
          Fetching financial data and generating AI analysis... This may take 20-30 seconds.
        </p>
      )}
    </div>
  );
}
