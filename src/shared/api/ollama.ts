/**
 * Ollama AI Client (Local LLM)
 * Handles text analysis for company detection, sentiment, and reliability scoring
 * Supports multiple company detection in a single text
 */

import { env } from '@/shared/config/env';

export interface AnalysisResult {
  ticker: string;
  companyName: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliabilityScore: number; // 1-10
  reasoning: string;
}

interface RawCompanyAnalysis {
  ticker?: string;
  companyName?: string;
  sentiment?: string;
  reliabilityScore?: number | string;
  reasoning?: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

const OLLAMA_URL = env.OLLAMA_URL;
const OLLAMA_MODEL = 'llama3.1:8b'; // Default model, can be configured

/**
 * Analyze text to extract ALL companies mentioned, with individual sentiment and reliability
 * Returns an array of analysis results (one per company detected)
 */
export async function analyzeText(text: string): Promise<AnalysisResult[]> {
  const prompt = buildAnalysisPrompt(text);

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    const responseText = data.response;
    
    // Parse the JSON response from the model
    const parsed = JSON.parse(responseText);
    
    // Handle both single object and array responses
    const companies: RawCompanyAnalysis[] = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
    
    // Validate and normalize each result
    return companies
      .map((company: RawCompanyAnalysis) => ({
        ticker: company.ticker?.toUpperCase() || '',
        companyName: company.companyName || '',
        sentiment: normalizeSentiment(company.sentiment || ''),
        reliabilityScore: normalizeScore(company.reliabilityScore || 0),
        reasoning: company.reasoning || 'No reasoning provided',
      }))
      .filter((result: AnalysisResult) => result.ticker && result.reliabilityScore > 0);
  } catch (error) {
    console.error('Ollama analysis error:', error);
    throw new Error(
      error instanceof Error 
        ? `AI analysis failed: ${error.message}. Ensure Ollama service is running.` 
        : 'AI analysis failed'
    );
  }
}

/**
 * Build the analysis prompt for Ollama to detect multiple companies
 */
function buildAnalysisPrompt(text: string): string {
  return `You are a financial analyst AI. Analyze the following text and extract information about ALL companies mentioned.

For EACH company found, provide:

1. **ticker**: The stock ticker symbol (e.g., AAPL, MSFT, TSLA)
2. **companyName**: The full company name (e.g., Apple Inc., Microsoft Corporation)
3. **sentiment**: The sentiment expressed about THIS SPECIFIC COMPANY in the text (BULLISH, BEARISH, or NEUTRAL)
4. **reliabilityScore**: Your confidence in this analysis on a scale of 1-10, where:
   - 1-3: Low reliability (speculation, rumors, unverified sources)
   - 4-6: Medium reliability (some factual basis but uncertain)
   - 7-9: High reliability (well-sourced, factual, logical analysis)
   - 10: Very high reliability (official announcements, verified data)
5. **reasoning**: A brief explanation (1-2 sentences) of why you assigned this sentiment and reliability score FOR THIS COMPANY

Text to analyze:
"""
${text}
"""

IMPORTANT: 
- If the text mentions multiple companies, return an array with one entry per company
- Each company should have its own sentiment based on what the text says about it specifically
- If a company is just mentioned in passing without sentiment, you can omit it or mark as NEUTRAL with lower reliability

Respond ONLY with valid JSON in this exact format (no additional text, no markdown):

For multiple companies:
{
  "companies": [
    {
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "sentiment": "BULLISH",
      "reliabilityScore": 7,
      "reasoning": "The text mentions Apple's strong earnings growth and positive market outlook."
    },
    {
      "ticker": "MSFT",
      "companyName": "Microsoft Corporation",
      "sentiment": "BEARISH",
      "reliabilityScore": 6,
      "reasoning": "Concerns raised about Microsoft's cloud growth slowdown."
    }
  ]
}

For a single company:
{
  "companies": [
    {
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "sentiment": "BULLISH",
      "reliabilityScore": 7,
      "reasoning": "The text discusses positive earnings and product innovation."
    }
  ]
}

If you cannot identify ANY companies or tickers, respond with:
{
  "companies": []
}`;
}

/**
 * Normalize sentiment to valid enum value
 */
function normalizeSentiment(sentiment: string): 'BULLISH' | 'BEARISH' | 'NEUTRAL' {
  const upper = sentiment?.toUpperCase();
  if (upper === 'BULLISH' || upper === 'POSITIVE' || upper === 'LONG') return 'BULLISH';
  if (upper === 'BEARISH' || upper === 'NEGATIVE' || upper === 'SHORT') return 'BEARISH';
  return 'NEUTRAL';
}

/**
 * Normalize reliability score to 1-10 range
 */
function normalizeScore(score: number | string): number {
  const num = typeof score === 'string' ? parseInt(score, 10) : score;
  if (isNaN(num) || num < 1) return 1;
  if (num > 10) return 10;
  return Math.round(num);
}

/**
 * Check if Ollama service is available (health check)
 */
export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
