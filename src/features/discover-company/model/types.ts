export interface FinnhubSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
  existsInDatabase: boolean;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: FinnhubSearchResult[];
  timestamp: string;
}

export interface ImportResponse {
  success: boolean;
  ticker: string;
  companyId: string;
  enrichmentId?: string;
  alreadyExists: boolean;
  message: string;
}

export interface SearchError {
  error: string;
}
