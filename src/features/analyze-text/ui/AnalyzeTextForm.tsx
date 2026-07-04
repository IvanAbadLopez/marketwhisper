"use client";

import { useState } from "react";
import { Brain, TrendingUp, TrendingDown, Minus, Sparkles, Building2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { analyzeText } from "../api/analyzeText";
import type { AnalysisResponse } from "../model/types";

export function AnalyzeTextForm() {
  const router = useRouter();
  const t = useTranslations('analyze');
  const [analyzing, setAnalyzing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError(t('errorNoText'));
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);
    
    try {
      const data = await analyzeText({ text, source: source || undefined });
      setResult(data);
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err instanceof Error ? err.message : t('errorGeneric'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClear = () => {
    setText("");
    setSource("");
    setError("");
    setResult(null);
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

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t('textLabel')}
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('textPlaceholder')}
              rows={8}
              className="w-full px-4 py-3 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={analyzing}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              {t('sourceLabel')}
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder={t('sourcePlaceholder')}
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
                  {t('analyzing')}
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  {t('analyzeButton')}
                </>
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={analyzing}
              className="px-4 py-3 rounded-lg font-medium transition-colors bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Success Result */}
          {result && result.success && result.analyses && result.analyses.length > 0 && (
            <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-4">
              <div className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                ✓ {result.message}
              </div>
              
              {result.analyses.map((analysis, index) => (
                <div key={analysis.id} className={`flex items-start gap-3 ${index > 0 ? 'pt-4 border-t border-green-200 dark:border-green-800' : ''}`}>
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
                        <span className="text-zinc-500">{t('sentimentLabel')}: </span>
                        <span className={`font-semibold ${getSentimentColor(analysis.sentiment)}`}>
                          {analysis.sentiment}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500">{t('reliabilityLabel')}: </span>
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
              
              <button
                onClick={() => router.push("/situations")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white mt-4"
              >
                <Building2 className="w-4 h-4" />
                {t('viewCompanyProfile')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
