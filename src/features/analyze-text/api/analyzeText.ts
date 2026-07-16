import type { AnalysisFormData, AnalysisResponse } from "../model/types";

export async function analyzeText(data: AnalysisFormData): Promise<AnalysisResponse> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ 
      text: data.text, 
      source: data.source || null 
    }),
  });

  const result: AnalysisResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Analysis failed");
  }

  return result;
}
