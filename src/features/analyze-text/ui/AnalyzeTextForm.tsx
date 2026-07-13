"use client";

import { useState } from "react";
import { Brain, Sparkles, RotateCcw, ArrowRight, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { analyzeText } from "../api/analyzeText";

export function AnalyzeTextForm() {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please provide text to analyze");
      return;
    }

    setAnalyzing(true);
    setError("");
    setJobId(null);
    
    try {
      const data = await analyzeText({ text, source: source || undefined });
      setJobId(data.jobId);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setText("");
    setSource("");
    setError("");
    setJobId(null);
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Text to Analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste any text about a company or stock here (e.g., news article, analysis, tweet)..."
              rows={8}
              className="w-full px-4 py-3 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={analyzing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Source (optional)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Twitter, Bloomberg, Reddit"
              className="w-full px-4 py-3 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={analyzing}
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className={`
                flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors
                ${
                  analyzing || !text.trim()
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }
                text-white
              `}
            >
              {analyzing ? (
                <>
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Analyze with AI
                </>
              )}
            </button>
            
            {(text || source || jobId) && !analyzing && (
              <button
                onClick={handleClear}
                className="px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Clear"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Success message with job ID */}
          {jobId && !error && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                    Analysis Started!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                    Your text is being analyzed by AI. You can track the progress in the process queue.
                  </p>
                  <button
                    onClick={() => router.push("/jobs")}
                    className="flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  >
                    <span>View in queue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
