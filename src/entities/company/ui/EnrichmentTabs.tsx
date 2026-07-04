"use client";

/**
 * Enrichment Tabs Component
 * Displays Yahoo Finance and Finnhub data in separate tabs
 * @module entities/company/ui
 */

import { useState } from "react";
import { EnrichmentDisplay } from "./EnrichmentDisplay";
import { EnrichButton } from "@/features/enrich-company";

interface EnrichmentData {
  id: string;
  ticker: string;
  source: "YAHOO" | "FINNHUB";
  financialData?: any;
  priceData?: any;
  newsHeadlines?: any[];
  recommendations?: any[];
  aiAnalysis: string | null;
  aiAnalysisEs: string | null;
  ollamaModel: string | null;
  createdAt: Date;
}

interface EnrichmentTabsProps {
  ticker: string;
  yahooEnrichment: EnrichmentData | null;
  finnhubEnrichment: EnrichmentData | null;
  onRefresh: () => void;
}

export function EnrichmentTabs({
  ticker,
  yahooEnrichment,
  finnhubEnrichment,
  onRefresh,
}: EnrichmentTabsProps) {
  const [activeTab, setActiveTab] = useState<"YAHOO" | "FINNHUB">("YAHOO");

  return (
    <div>
      {/* Tab Headers + Enrich Buttons */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex border-b border-zinc-300 dark:border-zinc-700">
          <button
            onClick={() => setActiveTab("YAHOO")}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === "YAHOO"
                ? "text-purple-600 dark:text-purple-400"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Yahoo Finance
            {activeTab === "YAHOO" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("FINNHUB")}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === "FINNHUB"
                ? "text-purple-600 dark:text-purple-400"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            Finnhub
            {activeTab === "FINNHUB" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600 dark:bg-purple-400" />
            )}
          </button>
        </div>
        
        {/* Enrich Button for Active Tab */}
        <EnrichButton
          ticker={ticker}
          source={activeTab}
          onSuccess={onRefresh}
          variant="default"
        />
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "YAHOO" && (
          <EnrichmentDisplay enrichment={yahooEnrichment} />
        )}
        {activeTab === "FINNHUB" && (
          <EnrichmentDisplay enrichment={finnhubEnrichment} />
        )}
      </div>
    </div>
  );
}
