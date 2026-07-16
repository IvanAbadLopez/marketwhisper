/**
 * Test script to compare llama-3.3-70b-versatile precision
 * Run with: npx tsx scripts/test-groq-model.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local for test
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Disable SSL verification for corporate proxy
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Inline Groq client to avoid env.ts dependency
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

interface GroqChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

async function callGroq(prompt: string, timeoutMs: number = 60000): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not found in .env.local');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        response_format: { type: 'json_object' },
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error (${response.status}): ${errorText}`);
    }

    const data: GroqChatResponse = await response.json();
    return data.choices[0]?.message?.content || '{}';
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function detectCompanies(text: string) {
  const prompt = `You are a financial analysis assistant. Extract company tickers and names from the provided text.

USER TEXT TO ANALYZE:
---BEGIN USER TEXT---
${text}
---END USER TEXT---

Respond ONLY with valid JSON (no additional text):
{
  "companies": [
    { "ticker": "AAPL", "companyName": "Apple Inc." },
    { "ticker": "", "companyName": "Alibaba" }
  ]
}`;

  const responseText = await callGroq(prompt, 30000);
  const parsed = JSON.parse(responseText);
  const companies = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
  return companies.map((c: any) => ({
    ticker: c.ticker?.toUpperCase() || '',
    companyName: c.companyName || '',
  }));
}

async function analyzeWithFinancials(text: string, companies: any[]) {
  const prompt = `You are a financial analysis assistant. Analyze the provided user text about companies.

USER TEXT TO ANALYZE:
---BEGIN USER TEXT---
${text}
---END USER TEXT---

For EACH company (${companies.map(c => c.ticker || c.companyName).join(', ')}), provide:
1. ticker
2. companyName
3. sentiment: BULLISH, BEARISH, or NEUTRAL
4. reliabilityScore: 1-10
5. reasoning: 2-3 sentences

Respond ONLY with valid JSON:
{
  "companies": [
    {
      "ticker": "AAPL",
      "companyName": "Apple Inc.",
      "sentiment": "BULLISH",
      "reliabilityScore": 8,
      "reasoning": "..."
    }
  ]
}`;

  const responseText = await callGroq(prompt, 30000);
  const parsed = JSON.parse(responseText);
  const analyses = Array.isArray(parsed.companies) ? parsed.companies : [parsed];
  return analyses.map((c: any) => ({
    ticker: c.ticker?.toUpperCase() || '',
    companyName: c.companyName || '',
    sentiment: c.sentiment || 'NEUTRAL',
    reliabilityScore: c.reliabilityScore || 5,
    reasoning: c.reasoning || 'No reasoning provided',
  }));
}

const testText = `
Alibaba Group reported strong Q3 earnings with revenue up 8% YoY to $33.7B, 
beating analyst estimates. Cloud computing revenue surged 21%, showing momentum 
in their strategic pivot to AI and cloud services. The company announced a $25B 
share buyback program, signaling management confidence.

However, regulatory concerns persist in China's tech sector. E-commerce GMV 
growth slowed to 2%, below expectations of 5%. Competition from Pinduoduo and 
JD.com intensifies. International expansion faces headwinds in Europe and US.

Meanwhile, Apple posted record iPhone sales in China despite economic slowdown, 
with Services revenue hitting all-time high. But supply chain risks remain due 
to geopolitical tensions.
`;

async function testModelPrecision() {
  console.log('🧪 Testing Groq llama-3.3-70b-versatile precision\n');
  console.log('📝 Test text (multi-company, mixed sentiment):');
  console.log(testText.substring(0, 200) + '...\n');
  
  try {
    // Phase 1: Company detection
    console.log('⏱️  Phase 1: Detecting companies...');
    const startDetect = Date.now();
    const companies = await detectCompanies(testText);
    const detectTime = Date.now() - startDetect;
    
    console.log(`✅ Detected ${companies.length} companies in ${detectTime}ms:`);
    companies.forEach(c => console.log(`   - ${c.ticker || 'N/A'} (${c.companyName})`));
    
    // Phase 2: Analysis with financials (will use mock/no finnhub for this test)
    console.log('\n⏱️  Phase 2: Analyzing sentiment + reasoning...');
    const startAnalyze = Date.now();
    const analyses = await analyzeWithFinancials(testText, companies);
    const analyzeTime = Date.now() - startAnalyze;
    
    console.log(`✅ Completed analysis in ${analyzeTime}ms\n`);
    
    // Display results
    console.log('📊 RESULTS:\n');
    analyses.forEach((analysis, idx) => {
      console.log(`${idx + 1}. ${analysis.ticker} - ${analysis.companyName}`);
      console.log(`   Sentiment: ${analysis.sentiment}`);
      console.log(`   Reliability: ${analysis.reliabilityScore}/10`);
      console.log(`   Reasoning: ${analysis.reasoning}`);
      console.log('');
    });
    
    console.log(`⏱️  Total time: ${detectTime + analyzeTime}ms`);
    
    // Evaluate quality
    console.log('\n🎯 QUALITY ASSESSMENT:');
    const hasAlibaba = analyses.some(a => a.ticker === 'BABA' || a.companyName.includes('Alibaba'));
    const hasApple = analyses.some(a => a.ticker === 'AAPL' || a.companyName.includes('Apple'));
    
    console.log(`   ✓ Detected Alibaba: ${hasAlibaba ? '✅' : '❌'}`);
    console.log(`   ✓ Detected Apple: ${hasApple ? '✅' : '❌'}`);
    
    const alibabaAnalysis = analyses.find(a => a.ticker === 'BABA' || a.companyName.includes('Alibaba'));
    if (alibabaAnalysis) {
      const hasMixedSentiment = alibabaAnalysis.reasoning.toLowerCase().includes('however') || 
                                 alibabaAnalysis.reasoning.toLowerCase().includes('but') ||
                                 alibabaAnalysis.reasoning.toLowerCase().includes('concern');
      console.log(`   ✓ Alibaba: Captured mixed sentiment (positive earnings + concerns): ${hasMixedSentiment ? '✅' : '❌'}`);
      console.log(`   ✓ Alibaba: Sentiment is ${alibabaAnalysis.sentiment} (expected BULLISH or NEUTRAL)`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

testModelPrecision();
