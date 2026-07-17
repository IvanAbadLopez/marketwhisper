"use client";


import { useState } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Newspaper,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity
} from "lucide-react";
import { AnalystSentimentChart } from "./AnalystSentimentChart";
import { calcAnalystScore, analystScoreLabel } from "@/features/enrich-company/lib/analystScore";
import { AnalysisContent } from "@/shared/ui/AnalysisContent";

interface EnrichmentData {
  id: string;
  ticker: string;
  financialData?: {
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    peRatio: number | null;
    debtToEquity: number | null;
    dividendYield: number | null;
    profitMargins: number | null;
  };
  priceData?: {
    currentPrice: number | null;
    previousClose: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    volume: number | null;
    avgVolume: number | null;
  };
  newsHeadlines?: Array<{
    title: string;
    publisher: string | null;
    link: string | null;
    publishedAt: string | null;
  }>;
  recommendations?: Array<{
    period: string;
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  }>;
  aiAnalysis: string | null;
  aiModel: string | null;
  createdAt: Date | string;
}

interface EnrichmentDisplayProps {
  enrichment: EnrichmentData | null;
  mode?: 'full' | 'ai' | 'financial';
}

export function EnrichmentDisplay({ enrichment, mode = 'full' }: EnrichmentDisplayProps) {
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [showNews, setShowNews] = useState(false);

  if (!enrichment) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <div className="text-center text-zinc-400">
          <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No enrichment data available yet.</p>
          <p className="text-xs mt-1">Click &quot;Enrich&quot; to fetch public financial data and AI analysis.</p>
        </div>
      </div>
    );
  }

  const { priceData, financialData, newsHeadlines, recommendations, aiAnalysis, createdAt } = enrichment;

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

  const latestRec = recommendations && recommendations.length > 0 ? recommendations[recommendations.length - 1] : null;
  const totalRecs = latestRec ? latestRec.strongBuy + latestRec.buy + latestRec.hold + latestRec.sell + latestRec.strongSell : 0;

  if (mode === 'ai') {
    return (
      <div>
        {aiAnalysis && (
          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
                <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                  {enrichment.aiModel || "llama-3.1-8b-instant"}
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

            <div>
              <AnalysisContent text={aiAnalysis} className="text-sm" collapsed={!showFullAnalysis} />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {}
      {priceData && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Current Price</h3>
            </div>
            <div className="text-xs text-zinc-500">
              Updated: {new Date(createdAt).toLocaleDateString()}
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

      {}
      {aiAnalysis && mode !== 'financial' && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">AI Analysis</h3>
              <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-1 rounded">
                {enrichment.aiModel || "llama-3.1-8b-instant"}
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

          <div>
            <AnalysisContent text={aiAnalysis} className="text-sm" collapsed={!showFullAnalysis} />
          </div>
        </div>
      )}

      {}
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

      {}
      {newsHeadlines && newsHeadlines.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowNews(!showNews)}
            className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Recent News</h3>
              <span className="text-sm text-zinc-400">({newsHeadlines.length})</span>
            </div>
            {showNews ? (
              <ChevronUp className="h-5 w-5 text-zinc-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-zinc-400" />
            )}
          </button>

          {showNews && (
            <div className="p-4 border-t border-zinc-800 space-y-3">
              {newsHeadlines.slice(0, 5).map((news, idx) => (
                <div key={idx} className="border-l-2 border-orange-500/30 pl-3">
                  <a
                    href={news.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-white hover:text-orange-400 transition-colors"
                  >
                    {news.title}
                  </a>
                  <p className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                    <span>{news.publisher || "Unknown"}</span>
                    {news.publishedAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(news.publishedAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {}
      {recommendations && recommendations.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Analyst Sentiment</h3>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            {}
            {recommendations.length >= 2 && (
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                  Consensus Trend
                </p>
                <AnalystSentimentChart recommendations={recommendations} height={160} />
              </div>
            )}

            {}
            {latestRec && totalRecs > 0 && (
              <div>
                <p className="text-sm text-zinc-400 mb-3">
                  Latest Period: <span className="text-white font-medium">{latestRec.period}</span>
                </p>

                <div className="grid grid-cols-5 gap-2 text-center mb-4">
                  <div>
                    <p className="text-xs text-zinc-400">Strong Buy</p>
                    <p className="text-lg font-bold text-green-400">{latestRec.strongBuy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Buy</p>
                    <p className="text-lg font-bold text-green-500">{latestRec.buy}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Hold</p>
                    <p className="text-lg font-bold text-zinc-400">{latestRec.hold}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Sell</p>
                    <p className="text-lg font-bold text-red-500">{latestRec.sell}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Strong Sell</p>
                    <p className="text-lg font-bold text-red-400">{latestRec.strongSell}</p>
                  </div>
                </div>

                <div className="text-center p-3 bg-zinc-800/50 rounded-lg">
                  <p className="text-sm text-zinc-400">
                    Consensus Score:
                    <span className={`ml-2 font-bold ${
                      calcAnalystScore(latestRec) !== null && calcAnalystScore(latestRec)! >= 0
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}>
                      {calcAnalystScore(latestRec)?.toFixed(2) ?? 'N/A'}
                    </span>
                    <span className="ml-2 text-zinc-300">
                      ({analystScoreLabel(calcAnalystScore(latestRec))})
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        recommendations !== undefined && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <h3 className="text-lg font-semibold text-white">Analyst Sentiment</h3>
            </div>
            <p className="text-sm text-zinc-500 text-center">
              Analyst recommendations not available for this ticker
            </p>
          </div>
        )
      )}
    </div>
  );
}
