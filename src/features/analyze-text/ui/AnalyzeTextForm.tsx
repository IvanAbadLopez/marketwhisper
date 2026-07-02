"use client";

import { useState } from "react";
import { Brain, Plus, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { analyzeText } from "../api/analyzeText";
import type { AnalysisResponse } from "../model/types";

export function AnalyzeTextForm() {
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError("Please provide text to analyze");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);
    
    try {
      const data = await analyzeText({ text, source: source || undefined });
      setResult(data);
      
      // Reset form after successful analysis
      setTimeout(() => {
        setText("");
        setSource("");
        setShowForm(false);
        setResult(null);
        // Refresh page data
        window.location.reload();
      }, 5000);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "BEARISH": return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH": return "text-green-600 dark:text-green-400";
      case "BEARISH": return "text-red-600 dark:text-red-400";
      default: return "text-zinc-600 dark:text-zinc-400";
    }
  };

  if (!showForm) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Analyze Text
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-3 min-w-[400px]">
      <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI Text Analysis
          </h3>
          <button
            onClick={() => {
              setShowForm(false);
              setText("");
              setSource("");
              setError("");
              setResult(null);
            }}
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            Cancel
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Text to Analyze
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste any text about a company or stock here (e.g., news article, analysis, tweet)..."
              rows={6}
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              disabled={analyzing}
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Source (optional)
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g., Twitter, Bloomberg, Reddit"
              className="w-full px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              disabled={analyzing}
            />
          </div>
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !text.trim()}
            className={`
              w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors text-sm
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
                <Sparkles className="w-4 h-4 animate-pulse" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Success Result */}
          {result && result.success && result.analyses && result.analyses.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded space-y-3">
              <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2">
                ✓ {result.message}
              </div>
              
              {result.analyses.map((analysis, index) => (
                <div key={analysis.id} className={`flex items-start gap-3 ${index > 0 ? 'pt-3 border-t border-green-200 dark:border-green-800' : ''}`}>
                  {getSentimentIcon(analysis.sentiment)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        ${analysis.ticker}
                      </span>
                      <span className="text-sm text-zinc-700 dark:text-zinc-300">
                        {analysis.company.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500">Sentiment: </span>
                        <span className={`font-semibold ${getSentimentColor(analysis.sentiment)}`}>
                          {analysis.sentiment}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">Reliability: </span>
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {analysis.reliabilityScore}/10
                        </span>
                      </div>
                    </div>
                    
                    <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 italic">
                      {analysis.reasoning}
                    </p>
                  </div>
                </div>
              ))}
              
              <div className="pt-2 border-t border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300">
                Refreshing data...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
