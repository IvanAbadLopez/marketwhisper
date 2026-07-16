"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/widgets/layout";
import { 
  TrendingUp,
  TrendingDown, 
  Globe, 
  Calendar,
  ArrowLeft,
  ExternalLink,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EnrichButton } from "@/features/enrich-company";
import { EnrichmentDisplay } from "@/entities/company/ui/EnrichmentDisplay";
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import { AnalysisContent } from "@/shared/ui/AnalysisContent";

interface Company {
  id: string;
  ticker: string;
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  logoUrl: string | null;
  website: string | null;
  avgSentimentScore: number | null;
  avgReliabilityScore: number | null;
  analysisCount: number;
  globalScore: number | null;
  globalScoreLabel: string | null;
  targetPrice: number | null;
  valuationBreakdown: {
    financialHealthScore: number | null;
    analystScore: number | null;
    textSentimentScore: number | null;
    weights: { financial: number; analyst: number; text: number };
    targetPriceMethods: {
      grahamNumber: number | null;
      fairPE: number | null;
      fiftyTwoWeekMid: number | null;
    };
    baseTarget: number | null;
    sentimentAdjustment: number | null;
  } | null;
  valuationUpdatedAt: string | null;
  _count: {
    analyses: number;
  };
  analyses?: {
    id: string;
    text: string;
    source: string | null;
    ticker: string;
    sentiment: string;
    reliabilityScore: number;
    reasoning: string;
    financialSnapshot?: Record<string, unknown> | null;
    createdAt: string;
  }[];
  enrichments?: {
    id: string;
    ticker: string;
    source: "FINNHUB";
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
    createdAt: string; // Comes as string from JSON
  }[];
}

// UpsideIndicator Component
function UpsideIndicator({ ticker, targetPrice }: { ticker: string; targetPrice: number }) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  
  useEffect(() => {
    fetch(`/api/companies/${ticker}/finnhub-live`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.price?.currentPrice) {
          setLivePrice(data.price.currentPrice);
        }
      })
      .catch(() => setLivePrice(null));
  }, [ticker]);
  
  if (!livePrice) return null;
  
  const upside = ((targetPrice - livePrice) / livePrice) * 100;
  const isPositive = upside > 0;
  
  return (
    <div className={`flex items-center gap-1 text-sm font-semibold ${
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }`}>
      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {upside > 0 ? '+' : ''}{upside.toFixed(1)}% Upside
    </div>
  );
}

export default function CompanyDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticker, setTicker] = useState<string>("");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'financial' | 'text-analyses'>('financial');
  const [isValuationExpanded, setIsValuationExpanded] = useState(false);
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);
  const [expandedAnalyses, setExpandedAnalyses] = useState<Set<string>>(new Set());

  const toggleAnalysisExpanded = (analysisId: string) => {
    setExpandedAnalyses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    params.then(p => setTicker(p.ticker));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchCompany = useCallback(async () => {
    if (!ticker) return; // Don't fetch if ticker is empty
    
    try {
      const response = await fetch(`/api/companies/${ticker}`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
      } else if (response.status === 404) {
        // Company not found
        setCompany(null);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  const handleDeleteAnalysis = async (analysisId: string, analysisText: string) => {
    const truncatedText = analysisText.length > 60 ? analysisText.substring(0, 60) + '...' : analysisText;
    if (!confirm(`Are you sure you want to delete this analysis?\n\n"${truncatedText}"\n\nThis will recalculate company metrics.`)) {
      return;
    }

    setDeletingAnalysisId(analysisId);
    try {
      const response = await fetch(`/api/analysis/${analysisId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh company data after deletion
        await fetchCompany();
      } else {
        const error = await response.json();
        alert(`Failed to delete analysis: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      alert('Failed to delete analysis. Please try again.');
    } finally {
      setDeletingAnalysisId(null);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && ticker) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompany();
    }
  }, [status, ticker, fetchCompany]);

  const formatMarketCap = (marketCap: number | null): string => {
    if (!marketCap) return "N/A";
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  if (status === "loading" || loading) {
    return (
      <MainLayout user={session?.user}>
        <div className="p-8">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout user={session?.user}>
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={() => router.back()}
              className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Company Not Found
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                The company {ticker.toUpperCase()} does not exist in our database.
              </p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout user={session?.user}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </button>

          {/* Company Header */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
              {/* Left: Company Info */}
              <div className="flex gap-4">
                {company.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-16 h-16 rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {company.name}
                    </h1>
                    <span className="text-sm font-mono text-blue-600 dark:text-blue-400 flex-shrink-0">
                      {company.ticker}
                    </span>
                    {company._count.analyses > 0 && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                        • {company._count.analyses} {company._count.analyses === 1 ? 'analysis' : 'analyses'}
                      </span>
                    )}
                  </div>
                  
                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                    {company.sector && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {company.sector}
                      </span>
                    )}
                    {company.industry && (
                      <>
                        <span className="text-zinc-400">•</span>
                        <span>{company.industry}</span>
                      </>
                    )}
                    {company.marketCap && (
                      <>
                        <span className="text-zinc-400">•</span>
                        <span className="font-semibold">{formatMarketCap(company.marketCap)}</span>
                      </>
                    )}
                    {company.website && (
                      <>
                        <span className="text-zinc-400">•</span>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          Website
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </>
                    )}
                  </div>
                  
                  {company.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-3">
                      {company.description}
                    </p>
                  )}
                  
                  {/* Valuation Breakdown (Detail Section) - Compact */}
                  {company.valuationBreakdown && (
                    <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <button
                        onClick={() => setIsValuationExpanded(!isValuationExpanded)}
                        className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors mb-2"
                      >
                        {isValuationExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                        <span className="font-medium">Valuation Breakdown</span>
                      </button>
                      
                      {isValuationExpanded && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          {/* Scores Row */}
                          {company.valuationBreakdown.financialHealthScore !== null && (
                            <div className="flex items-center gap-1">
                              <span className="text-zinc-600 dark:text-zinc-400">Financial:</span>
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {company.valuationBreakdown.financialHealthScore.toFixed(0)}/100
                              </span>
                              <InfoTooltip content="Based on P/E ratio, profit margin, ROE, debt/equity, and dividend yield." />
                            </div>
                          )}
                          
                          {company.valuationBreakdown.analystScore !== null && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-600">•</span>
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-600 dark:text-zinc-400">Analyst:</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {company.valuationBreakdown.analystScore.toFixed(0)}/100
                                </span>
                                <InfoTooltip content="Consensus from analyst recommendations (strong buy, buy, hold, sell, strong sell)." />
                              </div>
                            </>
                          )}
                          
                          {company.valuationBreakdown.textSentimentScore !== null && (
                            <>
                              <span className="text-zinc-300 dark:text-zinc-600">•</span>
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-600 dark:text-zinc-400">Text:</span>
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                  {company.valuationBreakdown.textSentimentScore.toFixed(0)}/100
                                </span>
                                <InfoTooltip content="Aggregate sentiment from your text analyses, weighted by reliability and volume." />
                              </div>
                            </>
                          )}
                          
                          {/* Target Price Methods */}
                          {company.targetPrice && (
                            <>
                              {company.valuationBreakdown.targetPriceMethods.grahamNumber && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-600">|</span>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Graham: </span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      ${company.valuationBreakdown.targetPriceMethods.grahamNumber.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              )}
                              
                              {company.valuationBreakdown.targetPriceMethods.fairPE && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Fair P/E: </span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      ${company.valuationBreakdown.targetPriceMethods.fairPE.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              )}
                              
                              {company.valuationBreakdown.targetPriceMethods.fiftyTwoWeekMid && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">52W Mid: </span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      ${company.valuationBreakdown.targetPriceMethods.fiftyTwoWeekMid.toFixed(2)}
                                    </span>
                                  </div>
                                </>
                              )}
                              
                              {company.valuationBreakdown.sentimentAdjustment !== null && (
                                <>
                                  <span className="text-zinc-300 dark:text-zinc-600">•</span>
                                  <div>
                                    <span className="text-zinc-600 dark:text-zinc-400">Sentiment Adj: </span>
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                      {company.valuationBreakdown.sentimentAdjustment > 0 ? '+' : ''}
                                      {company.valuationBreakdown.sentimentAdjustment.toFixed(1)}%
                                    </span>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right: Valuation Metrics */}
              {(company.globalScore !== null || company.targetPrice !== null) && (
                <div className="flex gap-3">
                  {/* Global Score */}
                  {company.globalScore !== null && (
                    <div className="flex flex-col items-center justify-center min-w-[110px] px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Global Score
                        </span>
                        <InfoTooltip content="Combines financial health (40%), analyst consensus (35%), and your text analyses (25%). Scale 0-100." />
                      </div>
                      <div className={`px-3 py-1 rounded-lg font-bold text-lg ${
                        company.globalScore >= 75 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                        : company.globalScore >= 60 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                        : company.globalScore >= 40 ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                      }`}>
                        {company.globalScore}/100
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                        {company.globalScoreLabel}
                      </span>
                    </div>
                  )}
                  
                  {/* Target Price */}
                  {company.targetPrice !== null && (
                    <div className="flex flex-col items-center justify-center min-w-[110px] px-4 py-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <div className="flex items-center gap-1 mb-1.5">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">
                          Target Price
                        </span>
                        <InfoTooltip content="Fair value estimate using Graham Number, fair P/E, and 52-week midpoint, adjusted by global sentiment." />
                      </div>
                      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        ${company.targetPrice.toFixed(2)}
                      </div>
                      <div className="mt-1 h-4">
                        <UpsideIndicator ticker={company.ticker} targetPrice={company.targetPrice} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Enrichment Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Financial Data & AI Analysis
              </h3>
              <EnrichButton
                ticker={ticker}
                lastEnrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
                onSuccess={fetchCompany}
                variant="default"
              />
            </div>

            {/* AI Analysis (synthesized verdict) - always visible above tabs */}
            <div className="mb-6">
              <EnrichmentDisplay
                enrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
                mode="ai"
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeTab === 'financial'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                Financial Data
                {activeTab === 'financial' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('text-analyses')}
                className={`px-4 py-2 font-medium transition-colors relative ${
                  activeTab === 'text-analyses'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                AI Text Analyses
                {activeTab === 'text-analyses' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
                )}
              </button>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'financial' ? (
              <EnrichmentDisplay
                enrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
                mode="financial"
              />
            ) : (
              /* AI Text Analyses Content */
              company.analyses && company.analyses.length > 0 ? (
            <div>

              {/* Aggregated Scores */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                  Overall Sentiment & Reliability
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sentiment Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Average Sentiment
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {company.avgSentimentScore !== null
                          ? company.avgSentimentScore > 0
                            ? `+${company.avgSentimentScore.toFixed(2)}`
                            : company.avgSentimentScore.toFixed(2)
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          company.avgSentimentScore === null
                            ? 'bg-zinc-300'
                            : company.avgSentimentScore > 0.3
                            ? 'bg-green-500'
                            : company.avgSentimentScore < -0.3
                            ? 'bg-red-500'
                            : 'bg-zinc-400'
                        }`}
                        style={{
                          width:
                            company.avgSentimentScore !== null
                              ? `${50 + company.avgSentimentScore * 50}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>

                  {/* Reliability Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Average Reliability
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {company.avgReliabilityScore?.toFixed(1) || '0'} / 10
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          company.avgReliabilityScore === null || company.avgReliabilityScore < 4
                            ? 'bg-red-400'
                            : company.avgReliabilityScore < 7
                            ? 'bg-yellow-400'
                            : 'bg-green-500'
                        }`}
                        style={{
                          width:
                            company.avgReliabilityScore !== null
                              ? `${(company.avgReliabilityScore / 10) * 100}%`
                              : '0%',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Analyses */}
              <div className="space-y-4">
                {company.analyses.map((analysis) => (
                  <div
                    key={analysis.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        {/* Sentiment Badge */}
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            analysis.sentiment === 'BULLISH'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : analysis.sentiment === 'BEARISH'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400'
                          }`}
                        >
                          {analysis.sentiment}
                        </div>

                        {/* Reliability Score */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            Reliability:
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              analysis.reliabilityScore < 4
                                ? 'text-red-600 dark:text-red-400'
                                : analysis.reliabilityScore < 7
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}
                          >
                            {analysis.reliabilityScore}/10
                          </span>
                        </div>
                      </div>

                      {/* Date & Source */}
                      <div className="flex items-start gap-3">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(analysis.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                          {analysis.source && (
                            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                              Source: {analysis.source}
                            </div>
                          )}
                        </div>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteAnalysis(analysis.id, analysis.text)}
                          disabled={deletingAnalysisId === analysis.id}
                          className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title="Delete analysis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
                      <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">
                        AI Reasoning:
                      </p>
                      <AnalysisContent text={analysis.reasoning} className="text-sm" />
                    </div>

                    {/* Original Text */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Original Text:
                        </p>
                        {analysis.text.length > 250 && (
                          <button
                            onClick={() => toggleAnalysisExpanded(analysis.id)}
                            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center gap-1"
                          >
                            {expandedAnalyses.has(analysis.id) ? (
                              <>
                                <span>Collapse</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>Expand</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <p className={`text-sm text-zinc-600 dark:text-zinc-400 ${
                        analysis.text.length > 250 && !expandedAnalyses.has(analysis.id) ? 'line-clamp-3' : ''
                      }`}>
                        {analysis.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
              ) : (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
                  <p className="text-zinc-600 dark:text-zinc-400">No text analyses found for this company.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
