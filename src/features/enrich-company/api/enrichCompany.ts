import type {
  EnrichmentJobStarted,
  EnrichmentStatusResult,
  EnrichmentError,
} from "../model/types";

export async function enrichCompany(
  ticker: string
): Promise<EnrichmentJobStarted> {
  const endpoint = `/api/companies/${ticker}/enrich-finnhub`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as EnrichmentError).error || "Failed to enrich company");
  }

  return data as EnrichmentJobStarted;
}

export async function getEnrichmentStatus(
  ticker: string,
  enrichmentId: string
): Promise<EnrichmentStatusResult> {
  const endpoint = `/api/companies/${ticker}/enrich-finnhub/${enrichmentId}`;

  const response = await fetch(endpoint);

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      (data as EnrichmentError).error || "Failed to fetch enrichment status"
    );
  }

  return data as EnrichmentStatusResult;
}
