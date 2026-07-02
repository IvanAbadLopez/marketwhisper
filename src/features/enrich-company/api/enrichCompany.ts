/**
 * Client API for company enrichment
 * @module features/enrich-company/api
 */

import type { EnrichmentResult, EnrichmentError } from "../model/types";

export async function enrichCompany(
  ticker: string
): Promise<EnrichmentResult> {
  const response = await fetch(`/api/companies/${ticker}/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as EnrichmentError).error || "Failed to enrich company");
  }

  return data as EnrichmentResult;
}
