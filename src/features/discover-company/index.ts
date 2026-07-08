/**
 * Feature: Discover Company - Public API
 * @module features/discover-company
 */

export { DiscoverSearch } from "./ui/DiscoverSearch";
export { useCompanyDiscovery } from "./model/useCompanyDiscovery";
export { searchCompanies } from "./api/searchCompanies";
export { importCompany } from "./api/importCompany";
export type {
  FinnhubSearchResult,
  SearchResponse,
  ImportResponse,
  SearchError,
} from "./model/types";
