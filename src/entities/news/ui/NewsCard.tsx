import { ExternalLink, Sparkles } from "lucide-react";
import { NewsItem } from "@/shared";
import { useState } from "react";
import { analyzeText } from "@/features/analyze-text";

interface NewsCardProps {
  news: NewsItem;
  ticker: string;
}

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "Unknown date";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined 
  });
}

export function NewsCard({ news }: NewsCardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAnalyze = async () => {
    // Prepare text: headline + summary
    const textToAnalyze = news.summary 
      ? `${news.title}\n\n${news.summary}`
      : news.title;

    const source = `Finnhub News: ${news.publisher || "Unknown"}`;

    setIsAnalyzing(true);
    setError(null);
    setSuccess(false);

    try {
      await analyzeText({ text: textToAnalyze, source });
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col h-full">
      {/* Header: Publisher and Date */}
      <div className="flex items-center justify-between mb-2 text-xs text-zinc-500 dark:text-zinc-500">
        <span className="font-medium">{news.publisher || "Unknown Source"}</span>
        <span>{formatRelativeDate(news.publishedAt)}</span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 leading-snug line-clamp-2">
        {news.title}
      </h3>

      {/* Summary */}
      {news.summary && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3 line-clamp-2">
          {news.summary}
        </p>
      )}

      {/* Image */}
      {news.image && (
        <div className="mb-3 rounded-md overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={news.image} 
            alt={news.title}
            className="w-full h-32 object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-3">
        {/* Read Full Article */}
        {news.link && (
          <a
            href={news.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Read
          </a>
        )}

        {/* Analyze as Text */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || success}
          className={`
            ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
            transition-colors
            ${
              success
                ? "bg-green-600 text-white cursor-default"
                : isAnalyzing
                ? "bg-purple-600 text-white animate-pulse cursor-wait"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }
            disabled:opacity-50
          `}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
          {success ? "Queued!" : isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mt-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded">
          Analysis queued successfully! Check the company page for results.
        </div>
      )}
    </div>
  );
}
