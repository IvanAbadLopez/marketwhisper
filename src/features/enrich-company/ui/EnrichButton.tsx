"use client";

/**
 * Enrich Company Button
 * Triggers a background public financial data fetch + AI analysis job,
 * then polls for completion.
 * @module features/enrich-company/ui
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Loader2, Clock } from "lucide-react";
import { enrichCompany, getEnrichmentStatus } from "../api/enrichCompany";
import { formatRelativeTime } from "@/shared/lib/date";

interface EnrichButtonProps {
  ticker: string;
  onSuccess?: () => void;
  variant?: "default" | "compact";
  className?: string;
  lastEnrichment?: { createdAt: Date | string } | null;
}

/** Poll interval for checking background job status (ms) */
const POLL_INTERVAL = 3000;
/** Safety cap on polling attempts (~5 min at 3s each) */
const MAX_POLLS = 100;

type JobState = "idle" | "pending" | "processing" | "success" | "error";

export function EnrichButton({
  ticker,
  onSuccess,
  variant = "default",
  className = "",
  lastEnrichment,
}: EnrichButtonProps) {
  const [state, setState] = useState<JobState>("idle");
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const loading = state === "pending" || state === "processing";
  const success = state === "success";

  // Calculate age color for timestamp (gray <7 days, yellow >7 days)
  const ageColor = useMemo(() => {
    if (!lastEnrichment) return "text-zinc-500 dark:text-zinc-400";
    
    // eslint-disable-next-line react-hooks/purity
    const ageInDays = (Date.now() - new Date(lastEnrichment.createdAt).getTime()) / 86400000;
    return ageInDays > 7
      ? "text-yellow-600 dark:text-yellow-400"
      : "text-zinc-500 dark:text-zinc-400";
  }, [lastEnrichment]);

  const pollStatus = (enrichmentId: string, attempt = 0) => {
    timerRef.current = setTimeout(async () => {
      try {
        const result = await getEnrichmentStatus(ticker, enrichmentId);

        if (result.status === "COMPLETED") {
          setState("success");
          setTimeout(() => onSuccess?.(), 1000);
          return;
        }

        if (result.status === "FAILED") {
          setState("error");
          setError(result.errorMessage || "Enrichment failed");
          return;
        }

        // Still PENDING or PROCESSING
        setState(result.status === "PROCESSING" ? "processing" : "pending");

        if (attempt + 1 >= MAX_POLLS) {
          setState("error");
          setError("Enrichment timed out. Please try again later.");
          return;
        }

        pollStatus(enrichmentId, attempt + 1);
      } catch (err: unknown) {
        setState("error");
        const message = err instanceof Error ? err.message : "Failed to check enrichment status";
        setError(message);
      }
    }, POLL_INTERVAL);
  };

  const handleEnrich = async () => {
    setState("pending");
    setError(null);

    try {
      const job = await enrichCompany(ticker);
      pollStatus(job.enrichmentId);
    } catch (err: unknown) {
      setState("error");
      const message = err instanceof Error ? err.message : "Failed to enrich company";
      setError(message);
    }
  };

  const statusLabel =
    state === "pending"
      ? "Queued..."
      : state === "processing"
      ? "Analyzing..."
      : "Enriching...";

  if (variant === "compact") {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleEnrich}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            success
              ? "bg-green-500/20 text-green-400 cursor-default"
              : "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          } ${className}`}
          title={error || (success ? "Enriched successfully!" : "Fetch data from Finnhub")}
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{state === "processing" ? "Analyzing" : "Queued"}</span>
            </>
          ) : success ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enriched</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Finnhub</span>
            </>
          )}
        </button>

        {lastEnrichment && !loading && (
          <div className={`flex items-center gap-1 text-xs ${ageColor}`}>
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(lastEnrichment.createdAt)}</span>
          </div>
        )}
      </div>
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
            : loading
            ? "bg-purple-600 text-white animate-pulse cursor-wait"
            : "bg-purple-600 text-white hover:bg-purple-700"
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{statusLabel}</span>
          </>
        ) : success ? (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Enriched Successfully!</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Enrich with Finnhub</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-sm text-red-400 flex items-start gap-1.5">
          <span className="mt-0.5">⚠️</span>
          <span>{error}</span>
        </p>
      )}

      {lastEnrichment && !loading && (
        <div className={`flex items-center gap-1.5 text-sm ${ageColor}`}>
          <Clock className="w-4 h-4" />
          <span>{formatRelativeTime(lastEnrichment.createdAt)}</span>
        </div>
      )}
    </div>
  );
}
