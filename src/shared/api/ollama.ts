/**
 * Ollama AI Client (Local LLM)
 * Handles text analysis for company detection, sentiment, and reliability scoring
 * Supports multiple company detection in a single text
 */

import { env } from '@/shared/config/env';
import type { FinnhubData } from './finnhub';
import { formatFinancialsBlock } from './finnhub';

export interface AnalysisResult {
  ticker: string;
  companyName: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  reliabilityScore: number; // 1-10
  reasoning: string;
}

export interface CompanyDetection {
  ticker: string;
  companyName: string;
}

interface RawCompanyDetection {
  ticker?: string;
  companyName?: string;
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
const OLLAMA_MODEL = env.OLLAMA_MODEL;

/**
 * Detect companies in text (lightweight, no sentiment analysis)
 * Phase 1 of the 2-call analysis pipeline
 */
export async function detectCompanies(text: string): Promise<CompanyDetection[]> {
  const prompt = buildDetectionPrompt(text);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s for detection

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        keep_alive: '30m',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    console.log('[detectCompanies] Raw Ollama response:', data.response);
    
    const parsed = JSON.parse(data.response);
    console.log('[detectCompanies] Parsed JSON:', JSON.stringify(parsed, null, 2));
    
    const companies: RawCompanyDetection[] = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
    console.log('[detectCompanies] Extracted companies array:', JSON.stringify(companies, null, 2));
    
    const filtered = companies
      .map((company: RawCompanyDetection) => ({
        ticker: company.ticker?.toUpperCase() || '',
        companyName: company.companyName || '',
      }))
      .filter((result: CompanyDetection) => result.ticker || result.companyName);
    
    console.log('[detectCompanies] Filtered results:', JSON.stringify(filtered, null, 2));
    
    return filtered;
  } catch (error) {
    console.error('Ollama detection error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI detection timed out (> 60s).');
    }
    throw new Error(
      error instanceof Error 
        ? `AI detection failed: ${error.message}. Ensure Ollama service is running.` 
        : 'AI detection failed'
    );
  }
}

/**
 * Analyze text with financial data for ALL companies
 * Phase 2 of the 2-call analysis pipeline - single call for all companies
 */
export async function analyzeWithFinancials(
  text: string,
  companies: Array<{ ticker: string; companyName: string; finnhubData?: FinnhubData | null }>
): Promise<AnalysisResult[]> {
  const prompt = buildEnrichedAnalysisPrompt(text, companies);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000); // 120s for analysis

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        keep_alive: '30m',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    const parsed = JSON.parse(data.response);
    
    const analyses: RawCompanyAnalysis[] = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
    
    return analyses
      .map((company: RawCompanyAnalysis) => ({
        ticker: company.ticker?.toUpperCase() || '',
        companyName: company.companyName || '',
        sentiment: normalizeSentiment(company.sentiment || ''),
        reliabilityScore: normalizeScore(company.reliabilityScore || 0),
        reasoning: company.reasoning || 'No reasoning provided',
      }))
      .filter((result: AnalysisResult) => (result.ticker || result.companyName) && result.reliabilityScore > 0);
  } catch (error) {
    console.error('Ollama analysis error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI analysis timed out (> 120s).');
    }
    throw new Error(
      error instanceof Error 
        ? `AI analysis failed: ${error.message}. Ensure Ollama service is running.` 
        : 'AI analysis failed'
    );
  }
}

/**
 * Legacy wrapper for backward compatibility
 * @deprecated Use detectCompanies + analyzeWithFinancials instead
 */
export async function analyzeText(text: string): Promise<AnalysisResult[]> {
  const prompt = buildAnalysisPrompt(text);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        format: 'json',
        keep_alive: '30m',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data: OllamaResponse = await response.json();
    const responseText = data.response;
    
    const parsed = JSON.parse(responseText);
    
    const companies: RawCompanyAnalysis[] = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
    
    return companies
      .map((company: RawCompanyAnalysis) => ({
        ticker: company.ticker?.toUpperCase() || '',
        companyName: company.companyName || '',
        sentiment: normalizeSentiment(company.sentiment || ''),
        reliabilityScore: normalizeScore(company.reliabilityScore || 0),
        reasoning: company.reasoning || 'No reasoning provided',
      }))
      .filter((result: AnalysisResult) => (result.ticker || result.companyName) && result.reliabilityScore > 0);
  } catch (error) {
    console.error('Ollama analysis error:', error);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI analysis timed out (> 120s). Try with shorter text or wait for the model to warm up.');
    }
    throw new Error(
      error instanceof Error 
        ? `AI analysis failed: ${error.message}. Ensure Ollama service is running.` 
        : 'AI analysis failed'
    );
  }
}

/**
 * Build detection prompt (Phase 1 - lightweight)
 */
function buildDetectionPrompt(text: string): string {
  return `You are a financial analyst AI. Extract ALL companies mentioned in the following text.

The text may be in ANY LANGUAGE. Detect companies mentioned by name even if no ticker is stated.

For EACH company found, provide:
1. **ticker**: The stock ticker symbol if you know it (e.g., AAPL, BABA). Leave EMPTY ("") if uncertain.
2. **companyName**: The company name as mentioned in the text (e.g., Apple Inc., Alibaba).

Text to analyze:
"""
${text}
"""

Respond ONLY with valid JSON (no additional text, no markdown):

{
  "companies": [
    { "ticker": "AAPL", "companyName": "Apple Inc." },
    { "ticker": "", "companyName": "Alibaba" }
  ]
}

If you cannot identify ANY companies, respond with:
{
  "companies": []
}`;
}

/**
 * Build enriched analysis prompt (Phase 2 - with financial data)
 */
function buildEnrichedAnalysisPrompt(
  text: string,
  companies: Array<{ ticker: string; companyName: string; finnhubData?: FinnhubData | null }>
): string {
  let prompt = `You are a financial analyst AI. Analyze the following text about companies, considering both the narrative AND the fundamental financial data.

**IMPORTANT**: Contrast the sentiment expressed in the text against the financial fundamentals. If the text is optimistic but the fundamentals are weak (high P/E, declining margins, negative analyst consensus), ADJUST the sentiment DOWN and note the divergence in your reasoning. Vice versa if the text is pessimistic but fundamentals are strong.

Text to analyze:
"""
${text}
"""

**Financial Data:**
`;

  companies.forEach(({ ticker, companyName, finnhubData }) => {
    if (finnhubData && finnhubData.success) {
      prompt += formatFinancialsBlock(ticker, finnhubData) + '\n\n';
    } else {
      prompt += `**${ticker}** (${companyName}): No financial data available.\n\n`;
    }
  });

  prompt += `**Task:**
For EACH company above, provide:
1. **ticker**: The stock ticker symbol (${companies.map(c => c.ticker).join(', ')})
2. **companyName**: The company name
3. **sentiment**: BULLISH, BEARISH, or NEUTRAL - based on BOTH the text AND the financial data. Detect divergences!
4. **reliabilityScore**: Your confidence (1-10). Higher if text and fundamentals agree, lower if they diverge.
5. **reasoning**: 2-3 sentences explaining your verdict. Mention if the fundamentals contradict the text's tone.

Respond ONLY with valid JSON (no additional text, no markdown):

{
  "companies": [
    {
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "sentiment": "BULLISH",
      "reliabilityScore": 8,
      "reasoning": "The text praises strong earnings, and the fundamentals support this with a reasonable P/E of 28 and solid margins. Analyst consensus is Buy."
    }
  ]
}`;

  return prompt;
}

/**
 * Build the analysis prompt for Ollama to detect multiple companies
 */
function buildAnalysisPrompt(text: string): string {
  return `You are a financial analyst AI. Analyze the following text and extract information about ALL companies mentioned.

The text may be in ANY LANGUAGE (English, Spanish, Chinese, etc.). Detect companies mentioned by name even if no ticker is explicitly stated.

For EACH company found, provide:

1. **ticker**: The stock ticker symbol (e.g., AAPL, MSFT, TSLA, BABA). If you are UNCERTAIN about the ticker, leave it EMPTY ("") but still provide the companyName.
2. **companyName**: The full company name as mentioned in the text (e.g., Apple Inc., Microsoft Corporation, Alibaba, Tencent)
3. **sentiment**: The sentiment expressed about THIS SPECIFIC COMPANY in the text (BULLISH, BEARISH, or NEUTRAL)
4. **reliabilityScore**: Your confidence in this analysis on a scale of 1-10, where:
   - 1-3: Low reliability (speculation, rumors, unverified sources)
   - 4-6: Medium reliability (some factual basis but uncertain)
   - 7-9: High reliability (well-sourced, factual, logical analysis)
   - 10: Very high reliability (official announcements, verified data)
5. **reasoning**: A brief explanation (1-2 sentences) of why you assigned this sentiment and reliability score FOR THIS COMPANY

EXAMPLES of ticker mappings for reference:
- Alibaba → BABA (US ADR)
- Tencent → TCEHY (US ADR)
- Apple → AAPL
- Microsoft → MSFT

Text to analyze:
"""
${text}
"""

IMPORTANT: 
- Detect companies mentioned ONLY BY NAME (e.g., "Alibaba" without ticker)
- If the text mentions multiple companies, return an array with one entry per company
- Each company should have its own sentiment based on what the text says about it specifically
- If you cannot determine the ticker, provide the companyName anyway and leave ticker EMPTY
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
      "ticker": "BABA",
      "companyName": "Alibaba",
      "sentiment": "BULLISH",
      "reliabilityScore": 7,
      "reasoning": "The text discusses positive earnings and product innovation."
    }
  ]
}

For a company WITHOUT ticker:
{
  "companies": [
    {
      "ticker": "",
      "companyName": "Alibaba",
      "sentiment": "BULLISH",
      "reliabilityScore": 7,
      "reasoning": "Strong market position but ticker uncertain."
    }
  ]
}

If you cannot identify ANY companies, respond with:
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
