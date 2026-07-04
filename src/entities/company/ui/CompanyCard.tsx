/**
 * CompanyCard component
 * Displays company information in a card format (simplified)
 * @module entities/company
 */

"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Company } from "../model/types";
import { getSentimentColor, getReliabilityColor, getSentimentLabel } from "../model/utils";

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
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Header: Name (primary) + Ticker badge */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {company.name}
          </h3>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
            ${company.ticker}
          </span>
        </div>
        {/* Sector */}
        {company.sector && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {company.sector}
          </p>
        )}
      </div>

      {/* AI Analysis Scores */}
      {company.analysisCount > 0 && (
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
      )}

      {/* Footer: Analyses count */}
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <span>
          {company._count?.analyses || company.analysisCount || 0}{" "}
          {(company._count?.analyses || company.analysisCount || 0) === 1 ? "analysis" : "analyses"}
        </span>
      </div>
    </div>
  );
}
