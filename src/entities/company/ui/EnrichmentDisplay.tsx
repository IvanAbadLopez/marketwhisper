"use client";

/**
 * Company Enrichment Display
 * Shows AI analysis and live financial data from Finnhub
 * @module entities/company/ui
 */

import { useState } from "react";
import { useLocale } from "next-intl";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";

interface FinancialMetrics {
  revenue: number | null;
  netIncome: number | null;
  eps: number | null;
  peRatio: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  profitMargins: number | null;
}

interface PriceData {
  currentPrice: number | null;
  previousClose: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  volume: number | null;
  avgVolume: number | null;
}

interface LiveData {
  financials: FinancialMetrics | null;
  price: PriceData | null;
}

interface EnrichmentData {
  id: string;
  ticker: string;
  aiAnalysis: string | null;
  aiAnalysisEs: string | null;
  ollamaModel: string | null;
  createdAt: Date;
}

interface EnrichmentDisplayProps {
  enrichment: EnrichmentData | null;
  liveData?: LiveData | null;
}

export function EnrichmentDisplay({ enrichment, liveData }: EnrichmentDisplayProps) {
  const locale = useLocale();
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);

  if (!enrichment && !liveData) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="text-center text-zinc-400">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No enrichment data available yet.</p>
          <p className="text-xs mt-1">Click &quot;Generate AI Analysis&quot; to create analysis from Finnhub data and user texts.</p>
        </div>
      </div>
    );
  }

  const priceData = liveData?.price;
  const financialData = liveData?.financials;

  const formatCurrency = (value: number | null | undefined, compact = true) => {
    if (value === null || value === undefined) return "N/A";
    if (compact && value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (compact && value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const dayChangeColor = (priceData?.dayChange || 0) >= 0 ? "text-green-400" : "text-red-400";
  const DayChangeIcon = (priceData?.dayChange || 0) >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="space-y-4">
      {/* Price Summary */}
      {priceData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Current Price</h3>
            </div>
            <div className="text-xs text-zinc-500">
              Live data
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-zinc-400">Price</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(priceData.currentPrice, false)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">Day Change</p>
              <p className={`text-lg font-semibold flex items-center gap-1 ${dayChangeColor}`}>
                <DayChangeIcon className="h-4 w-4" />
                {priceData.dayChange?.toFixed(2)} ({priceData.dayChangePercent?.toFixed(2)}%)
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">52W High</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(priceData.fiftyTwoWeekHigh, false)}</p>
            </div>
            <div>
              <p className="text-sm text-zinc-400">52W Low</p>
              <p className="text-lg font-semibold text-white">{formatCurrency(priceData.fiftyTwoWeekLow, false)}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {enrichment?.aiAnalysis && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                {enrichment?.ollamaModel || "llama3.1:8b"}
              </span>
            </div>
            <button
              onClick={() => setShowFullAnalysis(!showFullAnalysis)}
              className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
            >
              {showFullAnalysis ? (
                <>
                  <span>Collapse</span>
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  <span>Expand</span>
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className={`prose prose-invert max-w-none ${showFullAnalysis ? "" : "line-clamp-4"}`}>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {locale === 'es' && enrichment?.aiAnalysisEs ? enrichment.aiAnalysisEs : enrichment?.aiAnalysis}
            </p>
          </div>
        </div>
      )}

      {/* Financials Collapsible */}
      {financialData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowFinancials(!showFinancials)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Financial Metrics</h3>
            </div>
            {showFinancials ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            )}
          </button>

          {showFinancials && (
            <div className="p-4 border-t border-zinc-800 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-zinc-400">Revenue</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(financialData.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Net Income</p>
                <p className="text-lg font-semibold text-white">{formatCurrency(financialData.netIncome)}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">EPS</p>
                <p className="text-lg font-semibold text-white">{financialData.eps?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">P/E Ratio</p>
                <p className="text-lg font-semibold text-white">{financialData.peRatio?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Debt/Equity</p>
                <p className="text-lg font-semibold text-white">{financialData.debtToEquity?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Profit Margin</p>
                <p className="text-lg font-semibold text-white">{formatPercent(financialData.profitMargins)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
