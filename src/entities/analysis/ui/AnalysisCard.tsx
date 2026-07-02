/**
 * AnalysisCard component
 * Displays a single analysis with sentiment and reliability
 * @module entities/analysis
 */

"use client";

import { TrendingUp, TrendingDown, Minus, Calendar, FileText } from "lucide-react";
import { Analysis } from "../model/types";

interface AnalysisCardProps {
  analysis: Analysis;
  showCompany?: boolean;
}

export function AnalysisCard({ analysis, showCompany = false }: AnalysisCardProps) {
  const getSentimentIcon = () => {
    if (analysis.sentiment === "BULLISH") return TrendingUp;
    if (analysis.sentiment === "BEARISH") return TrendingDown;
    return Minus;
  };

  const getSentimentColor = () => {
    if (analysis.sentiment === "BULLISH") return "text-green-600 dark:text-green-400";
    if (analysis.sentiment === "BEARISH") return "text-red-600 dark:text-red-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  const getReliabilityColor = () => {
    if (analysis.reliabilityScore >= 8) return "text-green-600 dark:text-green-400";
    if (analysis.reliabilityScore >= 5) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const SentimentIcon = getSentimentIcon();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-md p-4 border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <SentimentIcon className={`w-5 h-5 ${getSentimentColor()}`} />
          <span className={`font-semibold ${getSentimentColor()}`}>
            {analysis.sentiment}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-500">Reliability:</span>
          <span className={`font-semibold ${getReliabilityColor()}`}>
            {analysis.reliabilityScore}/10
          </span>
        </div>
      </div>

      {/* Company (optional) */}
      {showCompany && (
        <div className="mb-2">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {analysis.company.ticker} - {analysis.company.name}
          </span>
        </div>
      )}

      {/* Reasoning */}
      <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
        {analysis.reasoning}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500 border-t border-zinc-200 dark:border-zinc-800 pt-2">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(analysis.createdAt).toLocaleDateString()}</span>
        </div>
        {analysis.source && (
          <div className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            <span>{analysis.source}</span>
          </div>
        )}
      </div>
    </div>
  );
}
