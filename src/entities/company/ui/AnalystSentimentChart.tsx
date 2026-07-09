"use client";

/**
 * Analyst Sentiment Chart
 * Displays analyst recommendation trends as a time-series line chart
 * @module entities/company/ui
 */

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";
import { calcAnalystScore, type AnalystRecommendation } from "@/features/enrich-company/lib/analystScore";

interface AnalystSentimentChartProps {
  recommendations: AnalystRecommendation[];
}

export function AnalystSentimentChart({ recommendations }: AnalystSentimentChartProps) {
  const chartData = useMemo(() => {
    return recommendations
      .map(r => ({
        period: r.period,
        score: calcAnalystScore(r),
      }))
      .filter(d => d.score !== null)
      .reverse(); // Chronological order (oldest first)
  }, [recommendations]);

  if (chartData.length < 2) {
    return (
      <div className="h-[200px] flex items-center justify-center text-zinc-500 text-sm">
        Insufficient data for trend chart (need at least 2 periods)
      </div>
    );
  }

  // Determine line color based on latest score
  const latestScore = chartData[chartData.length - 1]?.score ?? 0;
  const lineColor = latestScore >= 0 ? "#22c55e" : "#ef4444";

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
        <XAxis 
          dataKey="period" 
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis 
          domain={[-1, 1]}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          ticks={[-1, -0.5, 0, 0.5, 1]}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1f2937', 
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#f3f4f6'
          }}
          formatter={(value) => {
            if (typeof value === 'number') {
              return [value.toFixed(3), 'Score'];
            }
            return ['N/A', 'Score'];
          }}
          labelFormatter={(label) => `Period: ${label}`}
        />
        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke={lineColor}
          strokeWidth={2}
          dot={{ fill: lineColor, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
