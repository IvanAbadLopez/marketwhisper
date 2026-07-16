import type { ImportResponse, SearchError } from "../model/types";

export async function importCompany(ticker: string): Promise<ImportResponse> {
  const endpoint = `/api/companies/import`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as SearchError).error || "Failed to import company");
  }

  return data as ImportResponse;
}
