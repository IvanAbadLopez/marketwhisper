import type { SearchResponse, SearchError } from "../model/types";

export async function searchCompanies(query: string): Promise<SearchResponse> {
  const endpoint = `/api/companies/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(endpoint);

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as SearchError).error || "Failed to search companies");
  }

  return data as SearchResponse;
}
