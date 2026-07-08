"use client";

/**
 * Enrich Company Button
 * Triggers a background public financial data fetch + AI analysis job,
 * then registers it with the notification system for global polling.
 * @module features/enrich-company/ui
 */

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { enrichCompany } from "../api/enrichCompany";
import { useNotifications } from "@/shared/ui/notifications";

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
  const { addJob } = useNotifications();

  const handleEnrich = async () => {
    setLoading(true);
    setError(null);

    try {
      const job = await enrichCompany(ticker);
      
      // Register job with notification system (background polling + toast on completion)
      addJob(job.ticker, job.enrichmentId);
      
      // Reset button state immediately (job runs in background)
      setLoading(false);
      
      // Optionally trigger refresh (e.g., to show the PENDING enrichment)
      onSuccess?.();
    } catch (err: unknown) {
      setLoading(false);
      const message = err instanceof Error ? err.message : "Failed to enrich company";
      setError(message);
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleEnrich}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title={error || "Generate AI analysis from Finnhub data + user texts"}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Starting...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            <span>Analyze</span>
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
        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Starting Analysis...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Generate AI Analysis</span>
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
          Running in the background — you can keep browsing. Fetching financial
          data from Finnhub and generating AI analysis...
        </p>
      )}
    </div>
  );
}
