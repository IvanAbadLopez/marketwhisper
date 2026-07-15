"use client";

import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/widgets/layout";
import { 
  Building2, 
  TrendingUp, 
  Globe, 
  FileText, 
  Calendar,
  ArrowLeft,
  ExternalLink,
  MessageSquare,
  Trash2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { EnrichButton } from "@/features/enrich-company";
import { EnrichmentDisplay } from "@/entities/company/ui/EnrichmentDisplay";
import { AnalysisContent } from "@/shared";

interface Mention {
  id: string;
  timestamp: number | null;
  context: string | null;
  sentiment: string | null;
  content: {
    id: string;
    title: string | null;
    contentType: string;
    date: string;
  };
}

interface Transcript {
  id: string;
  text: string;
  startTime: number | null;
  endTime: number | null;
}

interface ContentDetail {
  id: string;
  title: string | null;
  description: string | null;
  sourceUrl: string;
  sourceName: string;
  contentType: string;
  date: string;
  status: string;
  summary: string | null;
  transcripts: Transcript[];
  mentions: Mention[];
}

interface ContentCompany {
  id: string;
  content: ContentDetail;
}

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
  _count: {
    content: number;
    mentions: number;
    analyses: number;
  };
  content: ContentCompany[];
  mentions: Mention[];
  analyses?: {
    id: string;
    text: string;
    source: string | null;
    ticker: string;
    sentiment: string;
    reliabilityScore: number;
    reasoning: string;
    reasoningEs: string | null;
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
    aiAnalysisEs: string | null;
    ollamaModel: string | null;
    createdAt: Date;
  }[];
}

export default function CompanyDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticker, setTicker] = useState<string>("");
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(p => setTicker(p.ticker));
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

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

  const handleDeleteContent = async (contentId: string, contentTitle: string | null) => {
    if (!confirm(`Are you sure you want to delete "${contentTitle || 'Untitled'}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/content/${contentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh company data after deletion
        await fetchCompany();
      } else {
        const error = await response.json();
        alert(`Failed to delete content: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      alert('Failed to delete content. Please try again.');
    }
  };

  useEffect(() => {
    if (status === "authenticated" && ticker) {
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

  const formatTimestamp = (seconds: number | null): string => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
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
              Back to Companies
            </button>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Company Not Found
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                The company with ticker {ticker.toUpperCase()} could not be found.
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
            onClick={() => router.push('/situations')}
            className="mb-6 flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </button>

          {/* Company Header */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {company.logoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {company.name}
                    </h1>
                    <p className="text-lg font-mono text-blue-600 dark:text-blue-400">
                      {company.ticker}
                    </p>
                  </div>
                </div>
                {company.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 max-w-3xl mt-4">
                    {company.description}
                  </p>
                )}
              </div>
              <Building2 className="w-16 h-16 text-zinc-400 dark:text-zinc-600" />
            </div>

            {/* Company Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {company.sector && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">Sector</span>
                  </div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {company.sector}
                  </p>
                </div>
              )}
              {company.industry && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Industry</span>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {company.industry}
                  </p>
                </div>
              )}
              {company.marketCap && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Market Cap</span>
                  <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {formatMarketCap(company.marketCap)}
                  </p>
                </div>
              )}
              {company.website && (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 block mb-1">Website</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Visit
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-6 flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-500" />
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {company._count.content}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {company._count.content === 1 ? 'article' : 'articles'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-zinc-500" />
                <span className="font-bold text-zinc-900 dark:text-zinc-100">
                  {company._count.mentions}
                </span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {company._count.mentions === 1 ? 'mention' : 'mentions'}
                </span>
              </div>
              {company._count.analyses > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    {company._count.analyses}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    AI {company._count.analyses === 1 ? 'analysis' : 'analyses'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Enrichment Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                Financial Data
              </h3>
              <EnrichButton
                ticker={ticker}
                lastEnrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
                onSuccess={fetchCompany}
                variant="default"
              />
            </div>
            <EnrichmentDisplay
              enrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
            />
          </div>

          {/* AI Analyses Section */}
          {company.analyses && company.analyses.length > 0 && (
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                AI Text Analyses
              </h3>

              {/* Aggregated Scores */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                  Overall Sentiment
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
                      <div className="flex items-center gap-3">
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
                    </div>

                    {/* AI Reasoning */}
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                        AI Reasoning
                      </p>
                      <AnalysisContent text={analysis.reasoning} className="text-sm" />
                    </div>

                    {/* Original Text */}
                    <div>
                      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Original Text
                      </p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3">
                        {analysis.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Section */}
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Related Content
            </h3>
            {company.content.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
                <p className="text-zinc-600 dark:text-zinc-400">No content found for this company.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {company.content.map(({ content }) => (
                  <div
                    key={content.id}
                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex-1">
                        {content.title || 'Untitled'}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(content.contentType)}`}>
                        {content.contentType}
                      </span>
                    </div>

                    {/* Source */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Source:</span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {content.sourceName}
                      </span>
                    </div>

                    {/* Description */}
                    {content.description && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                        {content.description}
                      </p>
                    )}

                    {/* Summary */}
                    {content.summary && (
                      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                        <h5 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-2">AI Summary</h5>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {content.summary}
                        </p>
                      </div>
                    )}

                    {/* Mentions in this content */}
                    {content.mentions && content.mentions.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                          Mentions in this content
                        </h5>
                        <div className="space-y-2">
                          {content.mentions.map((mention) => (
                            <div
                              key={mention.id}
                              className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md"
                            >
                              {mention.timestamp !== null && (
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-3 h-3 text-zinc-500" />
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    Timestamp: {formatTimestamp(mention.timestamp)}
                                  </span>
                                </div>
                              )}
                              {mention.context && (
                                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-1">
                                  &quot;{mention.context}&quot;
                                </p>
                              )}
                              {mention.sentiment && (
                                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getSentimentColor(mention.sentiment)}`}>
                                  {mention.sentiment}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(content.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-medium ${getStatusBadgeColor(content.status)}`}>
                          {content.status}
                        </span>
                        <a
                          href={content.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Source
                        </a>
                        <button
                          onClick={() => handleDeleteContent(content.id, content.title)}
                          className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Delete this content"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function getTypeBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    VIDEO: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    WEB_ARTICLE: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    BLOG_POST: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    SPECIAL_EVENT: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    NEWS: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
  };
  return colors[type] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
}

function getStatusBadgeColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    DOWNLOADING: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    TRANSCRIBING: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    PROCESSING: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    COMPLETED: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    FAILED: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
  };
  return colors[status] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
}

function getSentimentColor(sentiment: string): string {
  const colors: Record<string, string> = {
    POSITIVE: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    NEGATIVE: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    NEUTRAL: "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300",
  };
  return colors[sentiment.toUpperCase()] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
}
