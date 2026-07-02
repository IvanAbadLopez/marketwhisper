/**
 * CompanyCard component
 * Displays company information in a card format
 * @module entities/company
 */

"use client";

import { Building2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Company } from "../model/types";
import { formatMarketCap, getSentimentColor, getReliabilityColor, getSentimentLabel } from "../model/utils";

interface CompanyCardProps {
  company: Company;
  onClick?: (ticker: string) => void;
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  const sentimentLabel = getSentimentLabel(company.avgSentimentScore);
  
  const SentimentIcon = sentimentLabel === "BULLISH" 
    ? TrendingUp 
    : sentimentLabel === "BEARISH" 
      ? TrendingDown 
      : Minus;

  return (
    <div
      onClick={() => onClick?.(company.ticker)}
      className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-zinc-200 dark:border-zinc-800"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
              {company.ticker}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {company.name}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">Sector</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {company.sector || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">Market Cap</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {formatMarketCap(company.marketCap)}
          </p>
        </div>
      </div>

      {/* Sentiment & Reliability Indicators */}
      <div className="space-y-3 mb-4">
        {/* Sentiment */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <SentimentIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Sentiment: {sentimentLabel}
              </span>
            </div>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {company.avgSentimentScore !== null 
                ? company.avgSentimentScore.toFixed(2) 
                : "N/A"}
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getSentimentColor(company.avgSentimentScore)}`}
              style={{
                width: company.avgSentimentScore !== null
                  ? `${((company.avgSentimentScore + 1) / 2) * 100}%`
                  : "50%",
              }}
            />
          </div>
        </div>

        {/* Reliability */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Reliability
            </span>
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {company.avgReliabilityScore !== null
                ? `${company.avgReliabilityScore.toFixed(1)}/10`
                : "N/A"}
            </span>
          </div>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${getReliabilityColor(company.avgReliabilityScore)}`}
              style={{
                width: company.avgReliabilityScore !== null
                  ? `${(company.avgReliabilityScore / 10) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <span>{company._count?.analyses || company.analysisCount || 0} analyses</span>
        <span>{company._count?.content || 0} articles</span>
      </div>
    </div>
  );
}
