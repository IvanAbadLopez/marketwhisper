"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { MainLayout } from "@/components/MainLayout";
import { TrendingUp, FileText, Building2, Globe, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";

interface ContentSummary {
  id: string;
  title: string | null;
  contentType: string;
  date: string;
  status: string;
}

interface ContentCompany {
  id: string;
  content: ContentSummary;
}

interface Company {
  id: string;
  ticker: string;
  name: string;
  description: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
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
  analyses?: {
    id: string;
    sentiment: string;
    reliabilityScore: number;
    createdAt: string;
  }[];
}

export default function SituationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  const fetchCompanies = useCallback(async () => {
    try {
      const response = await fetch("/api/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCompanies();
    }
  }, [status, fetchCompanies]);

  const handleCompanyClick = (ticker: string) => {
    router.push(`/companies/${ticker.toLowerCase()}`);
  };

  const formatMarketCap = (marketCap: number | null): string => {
    if (!marketCap) return "N/A";
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
    return `$${marketCap.toLocaleString()}`;
  };

  const getSentimentColor = (score: number | null): string => {
    if (score === null) return "bg-zinc-300 dark:bg-zinc-700";
    if (score > 0.3) return "bg-green-500 dark:bg-green-600";
    if (score < -0.3) return "bg-red-500 dark:bg-red-600";
    return "bg-zinc-400 dark:bg-zinc-600";
  };

  const getSentimentLabel = (score: number | null): string => {
    if (score === null) return "No data";
    if (score > 0.5) return "Bullish";
    if (score > 0.2) return "Slightly Bullish";
    if (score < -0.5) return "Bearish";
    if (score < -0.2) return "Slightly Bearish";
    return "Neutral";
  };

  const getReliabilityWidth = (score: number | null): string => {
    if (score === null) return "0%";
    return `${(score / 10) * 100}%`;
  };

  const getReliabilityColor = (score: number | null): string => {
    if (score === null || score < 4) return "bg-red-400 dark:bg-red-500";
    if (score < 7) return "bg-yellow-400 dark:bg-yellow-500";
    return "bg-green-500 dark:bg-green-600";
  };

  // Filter companies based on search query
  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companies;

    const query = searchQuery.toLowerCase();
    return companies.filter((company) => {
      return (
        company.ticker.toLowerCase().includes(query) ||
        company.name.toLowerCase().includes(query) ||
        company.sector?.toLowerCase().includes(query) ||
        company.industry?.toLowerCase().includes(query) ||
        company.description?.toLowerCase().includes(query)
      );
    });
  }, [companies, searchQuery]);

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

  return (
    <MainLayout user={session?.user}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Companies Tracked
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Intelligence gathered across all your content sources
            </p>
          </div>

          {/* Search Bar */}
          {companies.length > 0 && (
            <div className="mb-6">
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by ticker, company name, sector, industry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                  >
                    ✕
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Found {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'}
                </p>
              )}
            </div>
          )}

          {companies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No Companies Yet
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Add content to start tracking companies
              </p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No Companies Found
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                No companies match your search &quot;{searchQuery}&quot;
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map((company) => (
                <div
                  key={company.id}
                  onClick={() => handleCompanyClick(company.ticker)}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                          ${company.ticker}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                        {company.name}
                      </h3>
                    </div>
                    <Building2 className="w-8 h-8 text-zinc-400 dark:text-zinc-600 flex-shrink-0" />
                  </div>

                  {/* Sector & Industry */}
                  {(company.sector || company.industry) && (
                    <div className="mb-4 space-y-1">
                      {company.sector && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3 h-3 text-zinc-500" />
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">
                            {company.sector}
                          </span>
                        </div>
                      )}
                      {company.industry && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 ml-5">
                          {company.industry}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Market Cap */}
                  {company.marketCap && (
                    <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Market Cap</span>
                      <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                        {formatMarketCap(company.marketCap)}
                      </p>
                    </div>
                  )}

                  {/* AI Analysis Scores */}
                  {company.analysisCount > 0 && (
                    <div className="mb-4 space-y-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800">
                      {/* Sentiment */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Sentiment
                          </span>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {getSentimentLabel(company.avgSentimentScore)}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getSentimentColor(company.avgSentimentScore)}`}
                            style={{ 
                              width: company.avgSentimentScore !== null 
                                ? `${50 + (company.avgSentimentScore * 50)}%`
                                : '0%'
                            }}
                          />
                        </div>
                      </div>

                      {/* Reliability */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            Reliability
                          </span>
                          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {company.avgReliabilityScore?.toFixed(1) || '0'}/10
                          </span>
                        </div>
                        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${getReliabilityColor(company.avgReliabilityScore)}`}
                            style={{ width: getReliabilityWidth(company.avgReliabilityScore) }}
                          />
                        </div>
                      </div>

                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 text-center pt-1">
                        Based on {company.analysisCount} {company.analysisCount === 1 ? 'analysis' : 'analyses'}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {company.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  {/* Recent Content Summary */}
                  {company.content.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase mb-2">
                        Recent Mentions
                      </h4>
                      <div className="space-y-1.5">
                        {company.content.map(({ content }) => (
                          <div
                            key={content.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(content.status)}`} />
                            <span className="text-zinc-700 dark:text-zinc-300 truncate flex-1">
                              {content.title || "Untitled"}
                            </span>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-600">
                              {new Date(content.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3 text-zinc-500" />
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {company._count.content}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {company._count.content === 1 ? 'article' : 'articles'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {company._count.mentions}
                        </span>
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {company._count.mentions === 1 ? 'mention' : 'mentions'}
                        </span>
                      </div>
                    </div>
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {companies.length > 0 && filteredCompanies.length > 0 && !searchQuery && (
            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Tracking {companies.length} {companies.length === 1 ? 'company' : 'companies'}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function getStatusDotColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500",
    DOWNLOADING: "bg-blue-500",
    TRANSCRIBING: "bg-purple-500",
    PROCESSING: "bg-orange-500",
    COMPLETED: "bg-green-500",
    FAILED: "bg-red-500",
  };
  return colors[status] || "bg-zinc-400";
}


