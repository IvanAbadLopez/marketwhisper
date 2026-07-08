"use client";

/**
 * Recent Jobs List - Compact version for Dashboard
 * Shows last 10 jobs with basic info
 * @module widgets/job-queue
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, CheckCircle2, XCircle, Brain, Sparkles, ArrowRight } from "lucide-react";

interface Job {
  id: string;
  type: "ANALYSIS" | "ENRICHMENT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  ticker: string;
  createdAt: string;
}

export function RecentJobsList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/jobs");
      if (!response.ok) throw new Error("Failed to fetch jobs");
      
      const data = await response.json();
      setJobs((data.jobs || []).slice(0, 10)); // Only show last 10
    } catch (error) {
      console.error("Error fetching recent jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();

    // Auto-refresh every 5 seconds if there are active jobs
    const interval = setInterval(() => {
      fetchJobs();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Job["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">
          No jobs yet. Start analyzing text or enriching companies to see activity here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <div
          key={job.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          {/* Status icon */}
          <div>{getStatusIcon(job.status)}</div>

          {/* Type icon */}
          <div className="text-zinc-600 dark:text-zinc-400">
            {job.type === "ANALYSIS" ? (
              <Brain className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 font-mono">
                {job.ticker}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {job.type === "ANALYSIS" ? "Analysis" : "Enrichment"}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {getRelativeTime(job.createdAt)}
            </p>
          </div>

          {/* Status badge */}
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              job.status === "COMPLETED"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : job.status === "FAILED"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                : job.status === "PROCESSING"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
            }`}
          >
            {job.status.toLowerCase()}
          </span>
        </div>
      ))}

      {/* Link to full queue */}
      <button
        onClick={() => router.push("/jobs")}
        className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
      >
        <span>View all processes</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
