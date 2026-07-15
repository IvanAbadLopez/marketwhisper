"use client";

import { useSession } from "next-auth/react";
import { MainLayout } from "@/widgets/layout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { NewsCard } from "@/entities/news";
import { NewsItem } from "@/shared";
import { Newspaper, Loader2, AlertCircle } from "lucide-react";

interface Company {
  ticker: string;
  name: string;
}

interface NewsResponse {
  success: boolean;
  ticker: string;
  companyName: string;
  news: NewsItem[];
  count: number;
  days: number;
}

export default function NewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch companies list on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchCompanies();
    }
  }, [status]);

  // Fetch news when a company is selected
  useEffect(() => {
    if (selectedTicker) {
      fetchNews(selectedTicker);
    }
  }, [selectedTicker]);

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    setError(null);

    try {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();
      setCompanies(data);

      // Auto-select first company
      if (data.length > 0) {
        setSelectedTicker(data[0].ticker);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load companies";
      setError(message);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const fetchNews = async (ticker: string) => {
    setIsLoadingNews(true);
    setError(null);

    try {
      const response = await fetch(`/api/news?ticker=${ticker}&days=7`);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a few moments.");
        }
        throw new Error("Failed to fetch news");
      }

      const data = await response.json();
      setNewsData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load news";
      setError(message);
      setNewsData(null);
    } finally {
      setIsLoadingNews(false);
    }
  };

  if (status === "loading" || !session?.user) {
    return null;
  }

  return (
    <MainLayout user={session.user}>
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Newspaper className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                Market News
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Latest news for your tracked companies from Finnhub
            </p>
          </div>

          {/* Company Selector */}
          {isLoadingCompanies ? (
            <div className="flex items-center gap-2 text-zinc-500 mb-6">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading companies...
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                    No Companies Tracked
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Add companies to your watchlist to see their latest news.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Select Company
              </label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                className="w-full max-w-md px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {companies.map((company) => (
                  <option key={company.ticker} value={company.ticker}>
                    {company.ticker} - {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    Error
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoadingNews && (
            <div className="flex items-center gap-2 text-zinc-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading news...
            </div>
          )}

          {/* News Grid */}
          {!isLoadingNews && newsData && (
            <>
              {newsData.count === 0 ? (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
                  <Newspaper className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    No Recent News
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    No news articles found for {newsData.ticker} in the last {newsData.days} days.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {newsData.companyName} ({newsData.ticker})
                    </h2>
                    <span className="text-sm text-zinc-500">
                      {newsData.count} article{newsData.count === 1 ? "" : "s"} · Last {newsData.days} days
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {newsData.news.map((article, index) => (
                      <NewsCard 
                        key={`${article.link}-${index}`} 
                        news={article} 
                        ticker={newsData.ticker}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
