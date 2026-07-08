"use client";

/**
 * Job Queue Component
 * Displays all AI processing jobs (analysis + enrichment) with real-time updates
 * @module widgets/job-queue
 */

import { useState, useEffect } from "react";
import { Loader2, Filter } from "lucide-react";
import { JobCard } from "./JobCard";

interface Job {
  id: string;
  type: "ANALYSIS" | "ENRICHMENT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  ticker: string;
  result: any;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export function JobQueue() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "ANALYSIS" | "ENRICHMENT">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "FAILED">("ALL");

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams();
      
      if (typeFilter !== "ALL") {
        params.append("type", typeFilter);
      }
      
      if (statusFilter === "ACTIVE") {
        params.append("status", "PENDING,PROCESSING");
      } else if (statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/jobs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [typeFilter, statusFilter]);

  // Auto-refresh for active jobs (every 3 seconds)
  useEffect(() => {
    const hasActiveJobs = jobs.some(
      (job) => job.status === "PENDING" || job.status === "PROCESSING"
    );

    if (!hasActiveJobs) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs]);

  // Count active jobs
  const activeCount = jobs.filter(
    (job) => job.status === "PENDING" || job.status === "PROCESSING"
  ).length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-500" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Filters:</span>
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">All Types</option>
            <option value="ANALYSIS">Analysis</option>
            <option value="ENRICHMENT">Enrichment</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active (Pending + Processing)</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Active jobs indicator */}
          {activeCount > 0 && (
            <div className="ml-auto flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{activeCount} active job{activeCount !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-zinc-400" />
          <p className="text-zinc-500 dark:text-zinc-400">Loading jobs...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
          <p className="text-zinc-500 dark:text-zinc-400">
            No jobs found. Start analyzing text or enriching companies to see them here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Results summary */}
      {!loading && jobs.length > 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
          Showing {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
