"use client";

import { useState, useEffect } from "react";
import { MainLayout } from "@/components/MainLayout";
import { FileText, Calendar, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

interface Content {
  id: string;
  title: string | null;
  description: string | null;
  sourceUrl: string;
  sourceName: string;
  contentType: string;
  date: string;
  tickers: string[];
  status: string;
}

export default function SituationsPage() {
  const { data: session, status } = useSession();
  const [allContent, setAllContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchContent();
    }
  }, [status]);

  const fetchContent = async () => {
    try {
      const response = await fetch("/api/content");
      if (response.ok) {
        const data = await response.json();
        setAllContent(data);
      }
    } catch (error) {
      console.error("Error fetching content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this content?")) {
      return;
    }

    try {
      const response = await fetch(`/api/content/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchContent();
      } else {
        alert("Error deleting content");
      }
    } catch (error) {
      console.error("Error deleting content:", error);
      alert("Error deleting content");
    }
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
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
              Market Intelligence
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Content from videos, blogs, and scraped web sources
            </p>
          </div>

          {allContent.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🌐</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                No Content Yet
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Add a URL to sync content from any web source
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allContent.map((content) => (
                <div
                  key={content.id}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors relative"
                >
                  {/* Delete Button - Top Right */}
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="absolute top-4 right-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    aria-label="Delete content"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 pr-10">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex-1">
                      {content.title}
                    </h3>
                    <span
                      className={`
                        px-2 py-1 text-xs font-medium rounded
                        ${getTypeBadgeColor(content.contentType)}
                      `}
                    >
                      {content.contentType}
                    </span>
                  </div>

                  {/* Source */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Source:
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {content.sourceName}
                    </span>
                  </div>

                  {/* Description */}
                  {content.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 line-clamp-2">
                      {content.description}
                    </p>
                  )}

                  {/* Tickers */}
                  {content.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {content.tickers.map((ticker) => (
                        <span
                          key={ticker}
                          className="px-2 py-1 text-xs font-mono font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded"
                        >
                          ${ticker}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(content.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className={`
                          px-2 py-0.5 rounded font-medium
                          ${getStatusBadgeColor(content.status)}
                        `}
                      >
                        {content.status}
                      </span>
                    </div>
                  </div>

                  {/* Link to source */}
                  {content.sourceUrl && (
                    <a
                      href={content.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <FileText className="w-3 h-3" />
                      View Source
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {allContent.length > 0 && (
            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Showing {allContent.length} item{allContent.length !== 1 ? "s" : ""}
            </div>
          )}
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

