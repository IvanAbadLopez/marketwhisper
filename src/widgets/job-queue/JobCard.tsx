"use client";


import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  ChevronDown, 
  ChevronUp,
  Brain,
  Sparkles,
  ExternalLink,
  Ban,
} from "lucide-react";

interface Job {
  id: string;
  type: "ANALYSIS" | "ENRICHMENT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  ticker: string;
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface JobCardProps {
  job: Job;
  onCancelled?: () => void;
}

export function JobCard({ job, onCancelled }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const router = useRouter();

  const getStatusDisplay = () => {
    switch (job.status) {
      case "PENDING":
        return {
          icon: <Clock className="w-5 h-5" />,
          color: "text-yellow-600 dark:text-yellow-400",
          bg: "bg-yellow-100 dark:bg-yellow-900/30",
          label: "Queued",
        };
      case "PROCESSING":
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          label: "Processing",
        };
      case "COMPLETED":
        return {
          icon: <CheckCircle2 className="w-5 h-5" />,
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-100 dark:bg-green-900/30",
          label: "Completed",
        };
      case "FAILED":
        return {
          icon: <XCircle className="w-5 h-5" />,
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-100 dark:bg-red-900/30",
          label: "Failed",
        };
      case "CANCELLED":
        return {
          icon: <Ban className="w-5 h-5" />,
          color: "text-orange-600 dark:text-orange-400",
          bg: "bg-orange-100 dark:bg-orange-900/30",
          label: "Cancelled",
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  const typeIcon = job.type === "ANALYSIS" ? (
    <Brain className="w-4 h-4" />
  ) : (
    <Sparkles className="w-4 h-4" />
  );

  const elapsedTime = useMemo(() => {
    const start = new Date(job.createdAt).getTime();
    const end = job.status === "COMPLETED" || job.status === "FAILED" || job.status === "CANCELLED"
      ? new Date(job.updatedAt).getTime()
      // eslint-disable-next-line react-hooks/purity
      : Date.now();
    const elapsed = Math.floor((end - start) / 1000);

    if (elapsed < 60) return `${elapsed}s`;
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    return `${Math.floor(elapsed / 3600)}h ${Math.floor((elapsed % 3600) / 60)}m`;
  }, [job.createdAt, job.updatedAt, job.status]);

  const viewResult = () => {
    if (job.status === "COMPLETED" && job.ticker && job.ticker !== "PENDING") {
      const ticker = job.ticker.split(" ")[0];
      router.push(`/companies/${ticker.toLowerCase()}`);
    }
  };

  const handleCancel = async () => {
    if (!confirm(`Cancel this ${job.type.toLowerCase()} job for ${job.ticker}?`)) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to cancel job");
      }

      onCancelled?.();
    } catch (error) {
      console.error("Error cancelling job:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel job");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {}
      <div className="p-4 flex items-center gap-4">
        {}
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${statusDisplay.bg}`}>
          <div className={statusDisplay.color}>
            {statusDisplay.icon}
          </div>
        </div>

        {}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {typeIcon}
              <span>{job.type === "ANALYSIS" ? "Text Analysis" : "Finnhub Enrichment"}</span>
            </div>
            <span className="text-sm text-zinc-400">•</span>
            <span className="text-sm font-mono text-zinc-900 dark:text-zinc-100">
              {job.ticker}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className={`${statusDisplay.color} font-medium`}>
              {statusDisplay.label}
            </span>
            <span>•</span>
            <span>{elapsedTime}</span>
            <span>•</span>
            <span>{new Date(job.createdAt).toLocaleString()}</span>
          </div>
        </div>

        {}
        <div className="flex items-center gap-2">
          {}
          {(job.status === "PENDING" || job.status === "PROCESSING") && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cancel job"
            >
              {cancelling ? (
                <Loader2 className="w-4 h-4 text-red-600 dark:text-red-400 animate-spin" />
              ) : (
                <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
              )}
            </button>
          )}

          {job.status === "COMPLETED" && job.ticker !== "PENDING" && (
            <button
              onClick={viewResult}
              className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-1.5"
            >
              <span>View Result</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          
          {(job.result || job.errorMessage) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {}
      {expanded && (job.result || job.errorMessage) && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
          {job.errorMessage ? (
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                Error Details
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 font-mono bg-red-50 dark:bg-red-900/20 p-3 rounded">
                {job.errorMessage}
              </p>
            </div>
          ) : job.result ? (
            <div>
              <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                Result Details
              </h4>
              <pre className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto">
                {JSON.stringify(job.result, null, 2)}
              </pre>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
