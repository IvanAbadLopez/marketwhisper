/**
 * Company entity public API
 * @module entities/company
 */

// ===== TYPES =====
export type {
  Company,
  CompanyWithDetails,
  ContentCompany,
  ContentSummary,
  AnalysisSummary,
} from "./model/types";

// ===== UTILS =====
export {
  formatMarketCap,
  getSentimentColor,
  getReliabilityColor,
  getSentimentLabel,
} from "./model/utils";

// ===== HOOKS =====
export { useCompanies, useCompany } from "./model/hooks";

// ===== UI =====
export { CompanyCard } from "./ui/CompanyCard";
export { EnrichmentDisplay } from "./ui/EnrichmentDisplay";
