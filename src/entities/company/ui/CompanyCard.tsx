/**
 * CompanyCard component
 * Displays company information in a card format (simplified)
 * @module entities/company
 */

"use client";

import { Target, Trash2 } from "lucide-react";
import { Company } from "../model/types";
import { getGlobalScoreColor, getGlobalScoreLabelColor } from "../model/utils";

interface CompanyCardProps {
  company: Company;
  onClick?: (ticker: string) => void;
  onDelete?: (ticker: string) => void;
}

export function CompanyCard({ company, onClick, onDelete }: CompanyCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(company.ticker);
  };

  return (
    <div
      onClick={() => onClick?.(company.ticker)}
      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer relative"
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
          title="Delete company"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      {/* Header: Name (primary) + Ticker badge */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
            {company.name}
          </h3>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded">
            ${company.ticker}
          </span>
        </div>
        {/* Sector */}
        {company.sector && (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            {company.sector}
          </p>
        )}
      </div>

      {/* Global Score */}
      {company.globalScore !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs text-zinc-600 dark:text-zinc-400">
                Global Score
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold ${getGlobalScoreLabelColor(company.globalScoreLabel)}`}>
                {company.globalScoreLabel || 'N/A'}
              </span>
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {company.globalScore.toFixed(0)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">/100</span>
            </div>
          </div>
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${getGlobalScoreColor(company.globalScore)}`}
              style={{
                width: `${company.globalScore}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Footer: Analyses count */}
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <span>
          {company._count?.analyses || company.analysisCount || 0}{" "}
          {(company._count?.analyses || company.analysisCount || 0) === 1 
            ? 'analysis' 
            : 'analyses'}
        </span>
      </div>
    </div>
  );
}
