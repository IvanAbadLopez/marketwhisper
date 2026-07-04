/**
 * Client API for company enrichment
 * @module features/enrich-company/api
 */

import type {
  EnrichmentJobStarted,
  EnrichmentStatusResult,
  EnrichmentError,
} from "../model/types";

/**
 * Start a background enrichment job. Returns immediately with the enrichment id.
 * Use `getEnrichmentStatus` to poll for completion.
 */
export async function enrichCompany(
  ticker: string
): Promise<EnrichmentJobStarted> {
  const response = await fetch(`/api/companies/${ticker}/enrich`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as EnrichmentError).error || "Failed to enrich company");
  }

  return data as EnrichmentJobStarted;
}

/**
 * Poll the status of a background enrichment job.
 */
export async function getEnrichmentStatus(
  ticker: string,
  enrichmentId: string
): Promise<EnrichmentStatusResult> {
  const response = await fetch(
    `/api/companies/${ticker}/enrich/${enrichmentId}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      (data as EnrichmentError).error || "Failed to fetch enrichment status"
    );
  }

  return data as EnrichmentStatusResult;
}
