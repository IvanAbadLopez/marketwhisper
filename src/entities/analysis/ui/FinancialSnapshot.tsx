"use client";

/**
 * Financial Snapshot Display
 * Compact view of financial metrics from Finnhub (price, P/E, EPS, 52w range, analyst consensus)
 * @module entities/analysis/ui
 */

import { useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, ChevronDown, ChevronUp, BarChart3 } from "lucide-react";
import type { FinancialSnapshot as FinancialSnapshotType } from "../model/types";

interface FinancialSnapshotProps {
  snapshot: FinancialSnapshotType;
  companyName?: string;
}

export function FinancialSnapshot({ snapshot, companyName }: FinancialSnapshotProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (price: number | null) => {
    if (price === null) return "N/A";
    return `$${price.toFixed(2)}`;
  };

  const formatRatio = (ratio: number | null) => {
    if (ratio === null) return "N/A";
    return ratio.toFixed(2);
  };

  const getConsensusColor = (consensus: string | null) => {
    if (!consensus) return "text-zinc-500";
    const lower = consensus.toLowerCase();
    if (lower.includes("strong buy") || lower.includes("buy")) {
      return "text-green-600 dark:text-green-400";
    }
    if (lower.includes("sell")) {
      return "text-red-600 dark:text-red-400";
    }
    return "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <div className="mt-3 border-t border-zinc-200 dark:border-zinc-800 pt-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" />
          <span className="font-medium">Financial Data & AI Analysis</span>
          <span className="text-zinc-400 dark:text-zinc-500">
            ({new Date(snapshot.fetchedAt).toLocaleDateString()})
          </span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {/* Current Price */}
          {snapshot.currentPrice !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <DollarSign className="w-3 h-3" />
                <span>Price</span>
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(snapshot.currentPrice)}
              </div>
            </div>
          )}

          {/* P/E Ratio */}
          {snapshot.peRatio !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <BarChart3 className="w-3 h-3" />
                <span>P/E</span>
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatRatio(snapshot.peRatio)}
              </div>
            </div>
          )}

          {/* EPS */}
          {snapshot.eps !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <DollarSign className="w-3 h-3" />
                <span>EPS</span>
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatRatio(snapshot.eps)}
              </div>
            </div>
          )}

          {/* 52w High */}
          {snapshot.fiftyTwoWeekHigh !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <TrendingUp className="w-3 h-3" />
                <span>52w High</span>
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(snapshot.fiftyTwoWeekHigh)}
              </div>
            </div>
          )}

          {/* 52w Low */}
          {snapshot.fiftyTwoWeekLow !== null && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <TrendingDown className="w-3 h-3" />
                <span>52w Low</span>
              </div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                {formatPrice(snapshot.fiftyTwoWeekLow)}
              </div>
            </div>
          )}

          {/* Analyst Consensus */}
          {snapshot.analystConsensus && (
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded p-2 sm:col-span-1">
              <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 mb-1">
                <BarChart3 className="w-3 h-3" />
                <span>Consensus</span>
              </div>
              <div className={`font-semibold ${getConsensusColor(snapshot.analystConsensus)}`}>
                {snapshot.analystConsensus}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
