"use client";


import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getEnrichmentStatus } from "@/features/enrich-company/api/enrichCompany";

export interface EnrichmentJob {
  ticker: string;
  enrichmentId: string;
  startedAt: number;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  ticker: string;
  message: string;
}

interface NotificationContextValue {
  jobs: EnrichmentJob[];
  toasts: Toast[];
  addJob: (ticker: string, enrichmentId: string) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const STORAGE_KEY = "marketwhisper_enrichment_jobs";
const POLL_INTERVAL = 5000;
const MAX_JOB_AGE = 30 * 60 * 1000;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<EnrichmentJob[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: EnrichmentJob[] = JSON.parse(stored);
        const now = Date.now();
        const fresh = parsed.filter(job => now - job.startedAt < MAX_JOB_AGE);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setJobs(fresh);
      }
    } catch (error) {
      console.error("[Notifications] Failed to load jobs from localStorage:", error);
    }
  }, []);

  useEffect(() => {
    try {
      if (jobs.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("[Notifications] Failed to save jobs to localStorage:", error);
    }
  }, [jobs]);

  const pollJobs = useCallback(async () => {
    if (jobs.length === 0) return;

    console.log(`[NotificationProvider] Polling ${jobs.length} jobs...`);

    for (const job of jobs) {
      try {
        const result = await getEnrichmentStatus(job.ticker, job.enrichmentId);
        console.log(`[NotificationProvider] Job ${job.ticker} status: ${result.status}`);

        if (result.status === "COMPLETED") {
          console.log(`[NotificationProvider] Job ${job.ticker} completed! Showing toast.`);
          setJobs(prev => prev.filter(j => j.enrichmentId !== job.enrichmentId));
          setToasts(prev => [
            ...prev,
            {
              id: `${job.enrichmentId}-${Date.now()}`,
              type: "success",
              ticker: job.ticker,
              message: `Analysis for ${job.ticker} completed successfully!`,
            },
          ]);
        } else if (result.status === "FAILED") {
          setJobs(prev => prev.filter(j => j.enrichmentId !== job.enrichmentId));
          setToasts(prev => [
            ...prev,
            {
              id: `${job.enrichmentId}-${Date.now()}`,
              type: "error",
              ticker: job.ticker,
              message: result.errorMessage || `Analysis for ${job.ticker} failed`,
            },
          ]);
        }
      } catch (error) {
        console.error(`[Notifications] Failed to poll job ${job.enrichmentId}:`, error);
      }
    }
  }, [jobs]);

  useEffect(() => {
    if (jobs.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      pollJobs();
      pollTimerRef.current = setInterval(pollJobs, POLL_INTERVAL);
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [jobs, pollJobs]);

  const addJob = useCallback((ticker: string, enrichmentId: string) => {
    console.log(`[NotificationProvider] Adding job: ${ticker} (${enrichmentId})`);
    setJobs(prev => {
      const newJobs = [
        ...prev,
        {
          ticker,
          enrichmentId,
          startedAt: Date.now(),
        },
      ];
      console.log(`[NotificationProvider] Jobs after add:`, newJobs);
      return newJobs;
    });
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: NotificationContextValue = {
    jobs,
    toasts,
    addJob,
    removeToast,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
