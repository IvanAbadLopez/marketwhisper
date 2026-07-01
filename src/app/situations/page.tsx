"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { TrendingUp, FileText, Building2, Globe } from "lucide-react";
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
  _count: {
    content: number;
    mentions: number;
  };
  content: ContentCompany[];
}

export default function SituationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCompanies();
    }
  }, [status]);

  const fetchCompanies = async () => {
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
  };

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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company) => (
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

          {companies.length > 0 && (
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


