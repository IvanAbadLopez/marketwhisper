"use client";

import { useState, useEffect, useCallback } from "react";
import { Company } from "./types";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/companies");
      
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }
      
      const data = await response.json();
      setCompanies(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, error, refetch: fetchCompanies };
}

export function useCompany(ticker: string) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/companies/${ticker}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch company");
      }
      
      const data = await response.json();
      setCompany(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching company:", err);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompany();
  }, [fetchCompany]);

  return { company, loading, error, refetch: fetchCompany };
}
