export interface SearchFilters {
  query: string;
}

export interface SearchableItem {
  ticker: string;
  name: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
}
