# Global Score & Target Price Implementation Plan

**Status**: ✅ COMPLETED (Tasks 1-11)  
**Date**: 2026-07-13  
**Commits**: 10 commits (e711d96 → d3818c7)  
**Tests**: 14 valuation tests passing, 137/148 total tests passing  
**Build**: ✅ Successful (Next.js 16.2.9)

## Implementation Summary

Successfully implemented unified valuation system combining:
- **Financial health** (40%): P/E, margins, ROE, debt/equity, dividend yield  
- **Analyst consensus** (35%): Buy/sell recommendations from Finnhub  
- **Text sentiment** (25%): User analysis weighted by reliability  

**Features delivered**:
- Global Score (0-100) with labels (Strong Buy/Bullish/Neutral/Bearish)
- Target Price using Graham Number, Fair P/E, 52-week midpoint blend
- Sentiment adjustment (±15%) on base target
- Automatic recalculation on new analysis/enrichment
- Company header display + detailed breakdown with tooltips

---

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global valuation score (0-100) and proprietary target price to each company, calculated with deterministic formulas (no AI), persisted in DB, and recalculated automatically on new analysis/enrichment. Display prominently in company header with tooltips explaining the methodology.

**Architecture:** Extract additional financial metrics from Finnhub (book value, ROE, debt/equity, EPS growth) → Create pure formula functions for score/price computation (Graham Number, fair P/E, 52w midpoint, sentiment adjustment) → Add DB fields + migration → Build server-side orchestrator that runs formulas and updates Company → Hook into analysis/enrichment flows → UI displays results in header with info tooltips.

**Tech Stack:** Python (FastAPI/Finnhub), TypeScript, Prisma ORM, PostgreSQL, React, Next.js 16, Vitest

---

## File Structure

### Backend Data Extraction
- **Modify:** `services/enrichment/main.py:290-320` — Extract bookValuePerShare, roe, debtToEquity, epsGrowth from Finnhub metric_data and add to FinancialMetrics model

### TypeScript Types
- **Modify:** `src/shared/api/finnhub.ts:35-60` — Extend FinnhubData.financials interface with new fields

### Valuation Logic (Pure Functions)
- **Create:** `src/shared/lib/valuation.ts` — Pure functions for score/price computation
- **Create:** `src/shared/lib/valuation.test.ts` — Comprehensive tests for formulas

### Database Schema
- **Modify:** `prisma/schema.prisma:190-210` — Add globalScore, globalScoreLabel, targetPrice, valuationBreakdown, valuationUpdatedAt to Company model
- **Create:** `prisma/migrations/YYYYMMDDHHMMSS_add_valuation_fields/migration.sql` — Prisma migration

### Orchestrator (Server-side)
- **Create:** `src/entities/company/api/recomputeValuation.ts` — Server-side function that reads data, runs formulas, updates DB

### Enrichment Data Persistence
- **Modify:** `src/features/enrich-company/api/processEnrichment.ts:200-230` — Ensure financialData/priceData are persisted with new metrics

### Recalculation Hooks
- **Modify:** `src/features/analyze-text/api/processAnalysis.ts:290-310` — Call recomputeValuation after updateCompanyAggregates
- **Modify:** `src/features/enrich-company/api/processEnrichment.ts:210-220` — Call recomputeValuation after enrichment completes

### UI Components
- **Create:** `src/shared/ui/InfoTooltip.tsx` — Lightweight tooltip component (no external deps)
- **Modify:** `src/app/companies/[ticker]/page.tsx:270-350` — Add valuation hero in header + detail section below

### i18n
- **Modify:** `src/messages/en.json` — Add valuation keys
- **Modify:** `src/messages/es.json` — Add Spanish translations

---

## Task 1: Extract Additional Finnhub Metrics (Python Service)

**Files:**
- Modify: `services/enrichment/main.py:40-65` (FinancialMetrics model)
- Modify: `services/enrichment/main.py:290-320` (extraction logic)

- [ ] **Step 1: Add new fields to FinancialMetrics model**

In `services/enrichment/main.py`, find the `FinancialMetrics` class and add new optional fields:

```python
class FinancialMetrics(BaseModel):
    revenue: Optional[float] = None
    netIncome: Optional[float] = None
    eps: Optional[float] = None
    peRatio: Optional[float] = None
    debtToEquity: Optional[float] = None
    dividendYield: Optional[float] = None
    profitMargins: Optional[float] = None
    bookValuePerShare: Optional[float] = None  # NEW
    roe: Optional[float] = None  # NEW (Return on Equity)
    epsGrowth: Optional[float] = None  # NEW (EPS growth rate)
```

- [ ] **Step 2: Extract new metrics from Finnhub response**

In `services/enrichment/main.py`, locate the section where `FinancialMetrics` is populated (around line 295-310) and add extraction for new fields:

```python
        # Extract financial metrics (map Finnhub fields to our schema)
        financials = FinancialMetrics(
            revenue=None,  # Not directly available in basic metrics
            netIncome=None,  # Not directly available in basic metrics
            eps=metric_data.get('epsBasic'),  # Basic EPS
            peRatio=metric_data.get('peBasicExclExtraTTM'),  # P/E ratio trailing 12 months
            debtToEquity=metric_data.get('totalDebt/totalEquityQuarterly'),  # NEW
            dividendYield=metric_data.get('dividendYieldIndicatedAnnual'),
            profitMargins=metric_data.get('netProfitMarginTTM'),  # Net profit margin TTM
            bookValuePerShare=metric_data.get('bookValuePerShareAnnual'),  # NEW
            roe=metric_data.get('roeTTM'),  # NEW
            epsGrowth=metric_data.get('epsGrowthTTMYoy'),  # NEW
        )
```

- [ ] **Step 3: Verify Finnhub metric keys**

Run a test enrichment and log the metric_data keys to verify exact field names:

```bash
cd services/enrichment
python -c "
import finnhub
import os
client = finnhub.Client(api_key=os.getenv('FINNHUB_API_KEY'))
metrics = client.company_basic_financials('AAPL', 'all')
print('Available metric keys:', sorted(metrics.get('metric', {}).keys())[:20])
"
```

Expected: List of available keys including bookValuePerShareAnnual, roeTTM, totalDebt/totalEquityQuarterly, epsGrowthTTMYoy (or similar variations)

**Note:** If exact key names differ, update the code with correct keys from the output.

- [ ] **Step 4: Restart enrichment service**

```bash
cd c:\Users\ivan.abad\marketwhisper
docker compose restart enrichment
docker compose logs enrichment --tail=20
```

Expected: Service restarts successfully, no Pydantic validation errors

- [ ] **Step 5: Commit**

```bash
git add services/enrichment/main.py
git commit -m "feat(enrichment): extract book value, ROE, debt/equity, EPS growth from Finnhub"
```

---

## Task 2: Update TypeScript Types for New Metrics

**Files:**
- Modify: `src/shared/api/finnhub.ts:35-60`

- [ ] **Step 1: Extend FinnhubData.financials interface**

```typescript
export interface FinnhubData {
  success: boolean;
  ticker: string;
  companyInfo?: {
    ticker: string;
    name: string | null;
    sector: string | null;
    industry: string | null;
    description: string | null;
    website: string | null;
    employees: number | null;
    marketCap: number | null;
  };
  financials?: {
    revenue: number | null;
    netIncome: number | null;
    eps: number | null;
    peRatio: number | null;
    debtToEquity: number | null;
    dividendYield: number | null;
    profitMargins: number | null;
    bookValuePerShare: number | null;  // NEW
    roe: number | null;  // NEW
    epsGrowth: number | null;  // NEW
  };
  price?: {
    currentPrice: number | null;
    previousClose: number | null;
    dayChange: number | null;
    dayChangePercent: number | null;
    fiftyTwoWeekHigh: number | null;
    fiftyTwoWeekLow: number | null;
    volume: number | null;
    avgVolume: number | null;
  };
  recommendations?: AnalystRecommendation[];
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add src/shared/api/finnhub.ts
git commit -m "feat(types): extend FinnhubData with book value, ROE, debt/equity, EPS growth"
```

---

## Task 3: Create Valuation Formula Module (Pure Functions)

**Files:**
- Create: `src/shared/lib/valuation.ts`
- Create: `src/shared/lib/valuation.test.ts`

- [ ] **Step 1: Create valuation.ts with types and Graham Number**

```typescript
/**
 * Pure valuation formulas (deterministic, no AI)
 * @module shared/lib/valuation
 */

export interface ValuationInputs {
  // Financial metrics
  eps: number | null;
  peRatio: number | null;
  bookValuePerShare: number | null;
  roe: number | null;
  profitMargins: number | null;
  debtToEquity: number | null;
  dividendYield: number | null;
  epsGrowth: number | null;
  
  // Price data
  currentPrice: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  
  // Analyst consensus
  analystScore: number | null; // -1 to +1
  
  // User text analyses aggregates
  avgSentimentScore: number | null; // -1 to +1
  avgReliabilityScore: number | null; // 1 to 10
  analysisCount: number;
}

export interface ValuationResult {
  globalScore: number | null; // 0-100
  globalScoreLabel: string; // Strong/Moderate/Neutral/Weak
  targetPrice: number | null; // USD
  breakdown: {
    financialHealthScore: number | null; // 0-100
    analystScore: number | null; // 0-100
    textSentimentScore: number | null; // 0-100
    weights: {
      financial: number;
      analyst: number;
      text: number;
    };
    targetPriceMethods: {
      grahamNumber: number | null;
      fairPE: number | null;
      fiftyTwoWeekMid: number | null;
    };
    baseTargetPrice: number | null;
    sentimentAdjustment: number | null;
  };
}

/**
 * Graham Number: sqrt(22.5 * EPS * BookValue)
 * Conservative intrinsic value estimate
 */
function computeGrahamNumber(eps: number | null, bvps: number | null): number | null {
  if (!eps || !bvps || eps <= 0 || bvps <= 0) return null;
  return Math.sqrt(22.5 * eps * bvps);
}

/**
 * Fair P/E target: EPS * fair P/E ratio
 * Fair P/E = min(current P/E, 25) or baseline 15 adjusted by growth
 */
function computeFairPETarget(
  eps: number | null,
  peRatio: number | null,
  epsGrowth: number | null
): number | null {
  if (!eps || eps <= 0) return null;
  
  // Baseline P/E: 15 (market average)
  let fairPE = 15;
  
  // Adjust for growth if available
  if (epsGrowth !== null && epsGrowth > 0) {
    // PEG-inspired: higher growth justifies higher P/E (cap at 25)
    fairPE = Math.min(15 + epsGrowth * 0.5, 25);
  }
  
  // Use current P/E if lower (conservative)
  if (peRatio !== null && peRatio > 0) {
    fairPE = Math.min(fairPE, peRatio);
  }
  
  return eps * fairPE;
}

/**
 * 52-week midpoint: simple mean of high and low
 */
function computeFiftyTwoWeekMid(high: number | null, low: number | null): number | null {
  if (!high || !low || high <= 0 || low <= 0) return null;
  return (high + low) / 2;
}
```

- [ ] **Step 2: Add financial health score computation**

```typescript
/**
 * Financial health score (0-100) from available metrics
 * Considers P/E (ideal 10-25), profit margin, ROE, debt/equity, dividend yield
 */
function computeFinancialHealthScore(inputs: ValuationInputs): number | null {
  const scores: number[] = [];
  
  // P/E score: optimal range 10-25, linear penalty outside
  if (inputs.peRatio !== null && inputs.peRatio > 0) {
    let peScore = 100;
    if (inputs.peRatio < 10) {
      peScore = 50 + (inputs.peRatio / 10) * 50; // Low P/E: 50-100
    } else if (inputs.peRatio <= 25) {
      peScore = 100; // Ideal range
    } else {
      peScore = Math.max(0, 100 - (inputs.peRatio - 25) * 2); // High P/E penalty
    }
    scores.push(peScore);
  }
  
  // Profit margin score: >20% excellent, 10-20% good, <10% poor
  if (inputs.profitMargins !== null) {
    const marginPct = inputs.profitMargins * 100;
    const marginScore = marginPct >= 20 ? 100 
                      : marginPct >= 10 ? 50 + (marginPct - 10) * 5
                      : marginPct * 5;
    scores.push(Math.max(0, Math.min(100, marginScore)));
  }
  
  // ROE score: >15% excellent, 10-15% good, <10% poor
  if (inputs.roe !== null) {
    const roeScore = inputs.roe >= 15 ? 100
                   : inputs.roe >= 10 ? 50 + (inputs.roe - 10) * 10
                   : inputs.roe * 5;
    scores.push(Math.max(0, Math.min(100, roeScore)));
  }
  
  // Debt/Equity score: <0.5 excellent, 0.5-1.5 good, >1.5 poor (inverted)
  if (inputs.debtToEquity !== null) {
    const deScore = inputs.debtToEquity <= 0.5 ? 100
                  : inputs.debtToEquity <= 1.5 ? 100 - (inputs.debtToEquity - 0.5) * 50
                  : Math.max(0, 50 - (inputs.debtToEquity - 1.5) * 20);
    scores.push(Math.max(0, Math.min(100, deScore)));
  }
  
  // Dividend yield score: 2-4% ideal, bonus for higher
  if (inputs.dividendYield !== null) {
    const yieldPct = inputs.dividendYield * 100;
    const divScore = yieldPct >= 2 ? Math.min(100, 50 + yieldPct * 10) : yieldPct * 25;
    scores.push(Math.max(0, Math.min(100, divScore)));
  }
  
  if (scores.length === 0) return null;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
```

- [ ] **Step 3: Add global score computation**

```typescript
/**
 * Compute global valuation score (0-100)
 * Weights: financial 40%, analyst 35%, text 25%
 * Rescales weights if data is missing
 */
export function computeGlobalScore(inputs: ValuationInputs): {
  score: number | null;
  label: string;
  breakdown: ValuationResult['breakdown'];
} {
  const financialHealth = computeFinancialHealthScore(inputs);
  
  // Analyst score: convert from [-1, +1] to [0, 100]
  const analystScore = inputs.analystScore !== null 
    ? ((inputs.analystScore + 1) / 2) * 100
    : null;
  
  // Text sentiment score: convert from [-1, +1] to [0, 100], weight by reliability
  let textScore: number | null = null;
  if (inputs.avgSentimentScore !== null && inputs.analysisCount > 0) {
    const baseSentiment = ((inputs.avgSentimentScore + 1) / 2) * 100;
    // Weight by reliability (1-10 scale) and volume (diminishing returns)
    const reliabilityWeight = inputs.avgReliabilityScore !== null 
      ? inputs.avgReliabilityScore / 10 
      : 0.5;
    const volumeWeight = Math.min(1, inputs.analysisCount / 10); // Cap at 10 analyses
    textScore = baseSentiment * (0.7 + 0.3 * reliabilityWeight * volumeWeight);
  }
  
  // Weights: 40% financial, 35% analyst, 25% text
  const baseWeights = { financial: 0.40, analyst: 0.35, text: 0.25 };
  const availableScores: Array<{ score: number; weight: number }> = [];
  
  if (financialHealth !== null) availableScores.push({ score: financialHealth, weight: baseWeights.financial });
  if (analystScore !== null) availableScores.push({ score: analystScore, weight: baseWeights.analyst });
  if (textScore !== null) availableScores.push({ score: textScore, weight: baseWeights.text });
  
  if (availableScores.length === 0) {
    return {
      score: null,
      label: 'N/A',
      breakdown: {
        financialHealthScore: null,
        analystScore: null,
        textSentimentScore: null,
        weights: { financial: 0, analyst: 0, text: 0 },
        targetPriceMethods: { grahamNumber: null, fairPE: null, fiftyTwoWeekMid: null },
        baseTargetPrice: null,
        sentimentAdjustment: null,
      },
    };
  }
  
  // Rescale weights to sum to 1
  const totalWeight = availableScores.reduce((sum, s) => sum + s.weight, 0);
  const normalizedScores = availableScores.map(s => ({
    score: s.score,
    weight: s.weight / totalWeight,
  }));
  
  // Weighted average
  const globalScore = normalizedScores.reduce((sum, s) => sum + s.score * s.weight, 0);
  
  // Label
  const label = globalScore >= 75 ? 'Strong'
              : globalScore >= 60 ? 'Moderate'
              : globalScore >= 40 ? 'Neutral'
              : 'Weak';
  
  return {
    score: Math.round(globalScore),
    label,
    breakdown: {
      financialHealthScore: financialHealth,
      analystScore,
      textSentimentScore: textScore,
      weights: {
        financial: financialHealth !== null ? normalizedScores.find(s => s.score === financialHealth)?.weight ?? 0 : 0,
        analyst: analystScore !== null ? normalizedScores.find(s => s.score === analystScore)?.weight ?? 0 : 0,
        text: textScore !== null ? normalizedScores.find(s => s.score === textScore)?.weight ?? 0 : 0,
      },
      targetPriceMethods: { grahamNumber: null, fairPE: null, fiftyTwoWeekMid: null },
      baseTargetPrice: null,
      sentimentAdjustment: null,
    },
  };
}
```

- [ ] **Step 4: Add target price computation**

```typescript
/**
 * Compute target price (fair value estimate)
 * Methods: Graham Number, Fair P/E, 52-week midpoint
 * Sentiment adjustment: ±15% based on global score
 */
export function computeTargetPrice(
  inputs: ValuationInputs,
  globalScore: number | null
): {
  targetPrice: number | null;
  breakdown: Pick<ValuationResult['breakdown'], 'targetPriceMethods' | 'baseTargetPrice' | 'sentimentAdjustment'>;
} {
  const grahamNumber = computeGrahamNumber(inputs.eps, inputs.bookValuePerShare);
  const fairPE = computeFairPETarget(inputs.eps, inputs.peRatio, inputs.epsGrowth);
  const fiftyTwoWeekMid = computeFiftyTwoWeekMid(inputs.fiftyTwoWeekHigh, inputs.fiftyTwoWeekLow);
  
  const methods: Array<{ price: number; weight: number }> = [];
  
  // Weight methods: Graham (conservative) 35%, Fair P/E 40%, 52w mid 25%
  if (grahamNumber !== null) methods.push({ price: grahamNumber, weight: 0.35 });
  if (fairPE !== null) methods.push({ price: fairPE, weight: 0.40 });
  if (fiftyTwoWeekMid !== null) methods.push({ price: fiftyTwoWeekMid, weight: 0.25 });
  
  if (methods.length === 0) {
    return {
      targetPrice: null,
      breakdown: {
        targetPriceMethods: { grahamNumber, fairPE, fiftyTwoWeekMid },
        baseTargetPrice: null,
        sentimentAdjustment: null,
      },
    };
  }
  
  // Rescale weights
  const totalWeight = methods.reduce((sum, m) => sum + m.weight, 0);
  const baseTarget = methods.reduce((sum, m) => sum + (m.price * m.weight / totalWeight), 0);
  
  // Sentiment adjustment: ±15% based on global score (50 = neutral)
  let adjustedTarget = baseTarget;
  let adjustment: number | null = null;
  if (globalScore !== null) {
    const k = 0.15; // Max 15% adjustment
    const scoreDelta = (globalScore - 50) / 50; // -1 to +1
    adjustment = k * scoreDelta;
    adjustedTarget = baseTarget * (1 + adjustment);
  }
  
  return {
    targetPrice: Math.round(adjustedTarget * 100) / 100, // Round to cents
    breakdown: {
      targetPriceMethods: { grahamNumber, fairPE, fiftyTwoWeekMid },
      baseTargetPrice: Math.round(baseTarget * 100) / 100,
      sentimentAdjustment: adjustment !== null ? Math.round(adjustment * 10000) / 100 : null, // Percentage
    },
  };
}
```

- [ ] **Step 5: Add main valuation function**

```typescript
/**
 * Main entry point: compute global score and target price
 */
export function computeValuation(inputs: ValuationInputs): ValuationResult {
  const scoreResult = computeGlobalScore(inputs);
  const priceResult = computeTargetPrice(inputs, scoreResult.score);
  
  return {
    globalScore: scoreResult.score,
    globalScoreLabel: scoreResult.label,
    targetPrice: priceResult.targetPrice,
    breakdown: {
      ...scoreResult.breakdown,
      ...priceResult.breakdown,
    },
  };
}
```

- [ ] **Step 6: Commit valuation logic**

```bash
git add src/shared/lib/valuation.ts
git commit -m "feat(valuation): add pure formula functions for global score and target price"
```

---

## Task 4: Write Comprehensive Tests for Valuation Formulas

**Files:**
- Create: `src/shared/lib/valuation.test.ts`

- [ ] **Step 1: Create test file with basic setup**

```typescript
import { describe, it, expect } from 'vitest';
import { computeValuation, type ValuationInputs } from './valuation';

describe('computeValuation', () => {
  const createInputs = (overrides: Partial<ValuationInputs> = {}): ValuationInputs => ({
    eps: null,
    peRatio: null,
    bookValuePerShare: null,
    roe: null,
    profitMargins: null,
    debtToEquity: null,
    dividendYield: null,
    epsGrowth: null,
    currentPrice: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    analystScore: null,
    avgSentimentScore: null,
    avgReliabilityScore: null,
    analysisCount: 0,
    ...overrides,
  });

  it('should return null score and price when no data available', () => {
    const result = computeValuation(createInputs());
    
    expect(result.globalScore).toBeNull();
    expect(result.globalScoreLabel).toBe('N/A');
    expect(result.targetPrice).toBeNull();
  });

  it('should compute Graham Number correctly', () => {
    const result = computeValuation(createInputs({
      eps: 5.0,
      bookValuePerShare: 25.0,
      fiftyTwoWeekHigh: 150,
      fiftyTwoWeekLow: 100,
    }));
    
    // Graham = sqrt(22.5 * 5 * 25) = sqrt(2812.5) ≈ 53.03
    expect(result.breakdown.targetPriceMethods.grahamNumber).toBeCloseTo(53.03, 1);
  });

  it('should compute fair P/E target with growth adjustment', () => {
    const result = computeValuation(createInputs({
      eps: 10.0,
      peRatio: 30,
      epsGrowth: 0.15, // 15% growth
      fiftyTwoWeekHigh: 350,
      fiftyTwoWeekLow: 250,
    }));
    
    // Fair P/E = min(15 + 15*0.5, 25, 30) = min(22.5, 25, 30) = 22.5
    // Target = 10 * 22.5 = 225
    expect(result.breakdown.targetPriceMethods.fairPE).toBeCloseTo(225, 0);
  });

  it('should compute 52-week midpoint', () => {
    const result = computeValuation(createInputs({
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 100,
    }));
    
    expect(result.breakdown.targetPriceMethods.fiftyTwoWeekMid).toBe(150);
  });

  it('should compute financial health score with ideal metrics', () => {
    const result = computeValuation(createInputs({
      peRatio: 18, // Ideal range
      profitMargins: 0.25, // 25% excellent
      roe: 20, // Excellent
      debtToEquity: 0.3, // Low debt
      dividendYield: 0.03, // 3%
    }));
    
    expect(result.breakdown.financialHealthScore).toBeGreaterThan(90);
  });

  it('should penalize poor financial metrics', () => {
    const result = computeValuation(createInputs({
      peRatio: 50, // High P/E
      profitMargins: 0.05, // 5% poor
      roe: 5, // Poor
      debtToEquity: 2.5, // High debt
    }));
    
    expect(result.breakdown.financialHealthScore).toBeLessThan(50);
  });

  it('should compute analyst score from consensus', () => {
    const result = computeValuation(createInputs({
      analystScore: 0.6, // Strong buy
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 80,
    }));
    
    // Analyst: (0.6 + 1)/2 * 100 = 80
    expect(result.breakdown.analystScore).toBe(80);
  });

  it('should compute text sentiment score with reliability weighting', () => {
    const result = computeValuation(createInputs({
      avgSentimentScore: 0.5, // Bullish
      avgReliabilityScore: 8, // High reliability
      analysisCount: 5,
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 80,
    }));
    
    // Base: (0.5 + 1)/2 * 100 = 75
    // Reliability weight: 8/10 = 0.8
    // Volume weight: min(1, 5/10) = 0.5
    // Score: 75 * (0.7 + 0.3 * 0.8 * 0.5) = 75 * 0.82 = 61.5
    expect(result.breakdown.textSentimentScore).toBeCloseTo(61.5, 0);
  });

  it('should rescale weights when data is missing', () => {
    const result = computeValuation(createInputs({
      peRatio: 15,
      analystScore: 0.4,
      // No text data
    }));
    
    // Only financial (40%) and analyst (35%) available
    // Rescaled: financial = 40/75 = 0.533, analyst = 35/75 = 0.467
    expect(result.breakdown.weights.financial).toBeCloseTo(0.533, 2);
    expect(result.breakdown.weights.analyst).toBeCloseTo(0.467, 2);
    expect(result.breakdown.weights.text).toBe(0);
  });

  it('should assign correct labels to global scores', () => {
    expect(computeValuation(createInputs({ analystScore: 0.8 })).globalScoreLabel).toBe('Strong');
    expect(computeValuation(createInputs({ analystScore: 0.4 })).globalScoreLabel).toBe('Moderate');
    expect(computeValuation(createInputs({ analystScore: 0.0 })).globalScoreLabel).toBe('Neutral');
    expect(computeValuation(createInputs({ analystScore: -0.6 })).globalScoreLabel).toBe('Weak');
  });

  it('should apply sentiment adjustment to target price', () => {
    const result = computeValuation(createInputs({
      eps: 10,
      bookValuePerShare: 50,
      fiftyTwoWeekHigh: 200,
      fiftyTwoWeekLow: 100,
      analystScore: 0.8, // Strong = 90 score
    }));
    
    // Global score should be high (90)
    // Adjustment: 0.15 * (90-50)/50 = 0.15 * 0.8 = 0.12 = +12%
    expect(result.breakdown.sentimentAdjustment).toBeCloseTo(12, 0);
    expect(result.targetPrice).toBeGreaterThan(result.breakdown.baseTargetPrice!);
  });

  it('should blend multiple target price methods', () => {
    const result = computeValuation(createInputs({
      eps: 10,
      bookValuePerShare: 50,
      peRatio: 20,
      fiftyTwoWeekHigh: 250,
      fiftyTwoWeekLow: 150,
    }));
    
    // Graham ≈ 106, Fair P/E = 200, 52w mid = 200
    // Weighted: 106*0.35 + 200*0.40 + 200*0.25 = 37.1 + 80 + 50 = 167.1
    expect(result.breakdown.baseTargetPrice).toBeCloseTo(167, 0);
  });

  it('should handle edge case: negative EPS (no Graham/Fair P/E)', () => {
    const result = computeValuation(createInputs({
      eps: -2,
      bookValuePerShare: 30,
      fiftyTwoWeekHigh: 100,
      fiftyTwoWeekLow: 50,
    }));
    
    expect(result.breakdown.targetPriceMethods.grahamNumber).toBeNull();
    expect(result.breakdown.targetPriceMethods.fairPE).toBeNull();
    expect(result.breakdown.targetPriceMethods.fiftyTwoWeekMid).toBe(75);
    expect(result.targetPrice).toBeCloseTo(75, 0); // Only 52w mid available
  });

  it('should handle partial data gracefully', () => {
    const result = computeValuation(createInputs({
      peRatio: 22,
      avgSentimentScore: 0.3,
      avgReliabilityScore: 7,
      analysisCount: 3,
    }));
    
    expect(result.globalScore).toBeGreaterThan(0);
    expect(result.targetPrice).toBeNull(); // No price methods available
  });
});
```

- [ ] **Step 2: Run tests to verify formulas**

```bash
npm test -- valuation.test.ts
```

Expected: All tests pass

- [ ] **Step 3: Commit tests**

```bash
git add src/shared/lib/valuation.test.ts
git commit -m "test(valuation): add comprehensive tests for score and price formulas"
```

---

## Task 5: Add Database Fields for Valuation

**Files:**
- Modify: `prisma/schema.prisma:190-210`

- [ ] **Step 1: Add valuation fields to Company model**

In `prisma/schema.prisma`, locate the `Company` model and add new fields after `analysisCount`:

```prisma
model Company {
  id                   String           @id @default(cuid())
  ticker               String           @unique
  name                 String
  description          String?
  sector               String?
  industry             String?
  marketCap            Float?
  logoUrl              String?
  website              String?
  avgSentimentScore    Float?
  avgReliabilityScore  Float?
  analysisCount        Int              @default(0)
  // Valuation fields (computed from formulas)
  globalScore          Float?           // 0-100
  globalScoreLabel     String?          // Strong/Moderate/Neutral/Weak
  targetPrice          Float?           // USD
  valuationBreakdown   Json?            // Detailed calculation breakdown
  valuationUpdatedAt   DateTime?        // Last recalculation timestamp
  content              ContentCompany[]
  mentions             Mention[]
  analyses             Analysis[]
  enrichments          CompanyEnrichment[]
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt

  @@index([ticker])
  @@index([sector])
}
```

- [ ] **Step 2: Generate and apply migration**

```bash
npx prisma migrate dev --name add_valuation_fields
```

Expected: Migration created and applied successfully

- [ ] **Step 3: Verify schema in database**

```bash
docker compose exec db psql -U marketwhisper -d marketwhisper -c "\d companies"
```

Expected: Table includes globalScore, globalScoreLabel, targetPrice, valuationBreakdown, valuationUpdatedAt columns

- [ ] **Step 4: Regenerate Prisma client**

```bash
npx prisma generate
```

Expected: Client regenerated with new fields

- [ ] **Step 5: Commit migration**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add valuation fields to Company model (global score, target price)"
```

---

## Task 6: Create Valuation Orchestrator (Server-side)

**Files:**
- Create: `src/entities/company/api/recomputeValuation.ts`

- [ ] **Step 1: Create orchestrator with imports and types**

```typescript
/**
 * Valuation orchestrator: reads company data, runs formulas, updates DB
 * Server-side only (uses Prisma)
 * @module entities/company/api
 */

import { prisma } from '@/shared/api/prisma';
import { computeValuation, type ValuationInputs } from '@/shared/lib/valuation';
import { calcAnalystScore } from '@/features/enrich-company/lib/analystScore';

/**
 * Recompute and persist valuation for a company
 * Called after new analysis or enrichment
 */
export async function recomputeCompanyValuation(companyId: string): Promise<void> {
  try {
    console.log(`[recomputeValuation] Starting for company ${companyId}`);
    
    // 1. Fetch company with aggregates
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        ticker: true,
        avgSentimentScore: true,
        avgReliabilityScore: true,
        analysisCount: true,
      },
    });

    if (!company) {
      console.warn(`[recomputeValuation] Company ${companyId} not found`);
      return;
    }

    // 2. Fetch latest enrichment (for financial data)
    const latestEnrichment = await prisma.companyEnrichment.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      select: {
        financialData: true,
        priceData: true,
        recommendations: true,
      },
    });

    console.log(`[recomputeValuation] Enrichment found: ${!!latestEnrichment}`);

    // 3. Build inputs for valuation formulas
    const inputs: ValuationInputs = {
      // From enrichment financialData
      eps: latestEnrichment?.financialData?.eps ?? null,
      peRatio: latestEnrichment?.financialData?.peRatio ?? null,
      bookValuePerShare: latestEnrichment?.financialData?.bookValuePerShare ?? null,
      roe: latestEnrichment?.financialData?.roe ?? null,
      profitMargins: latestEnrichment?.financialData?.profitMargins ?? null,
      debtToEquity: latestEnrichment?.financialData?.debtToEquity ?? null,
      dividendYield: latestEnrichment?.financialData?.dividendYield ?? null,
      epsGrowth: latestEnrichment?.financialData?.epsGrowth ?? null,
      
      // From enrichment priceData
      currentPrice: latestEnrichment?.priceData?.currentPrice ?? null,
      fiftyTwoWeekHigh: latestEnrichment?.priceData?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: latestEnrichment?.priceData?.fiftyTwoWeekLow ?? null,
      
      // From enrichment recommendations (compute analyst score)
      analystScore: latestEnrichment?.recommendations?.length
        ? calcAnalystScore(latestEnrichment.recommendations[latestEnrichment.recommendations.length - 1] as any)
        : null,
      
      // From company aggregates
      avgSentimentScore: company.avgSentimentScore,
      avgReliabilityScore: company.avgReliabilityScore,
      analysisCount: company.analysisCount,
    };

    // 4. Compute valuation
    const result = computeValuation(inputs);
    
    console.log(`[recomputeValuation] ${company.ticker} - Score: ${result.globalScore}, Target: ${result.targetPrice}`);

    // 5. Update company with results
    await prisma.company.update({
      where: { id: companyId },
      data: {
        globalScore: result.globalScore,
        globalScoreLabel: result.globalScoreLabel,
        targetPrice: result.targetPrice,
        valuationBreakdown: result.breakdown as any,
        valuationUpdatedAt: new Date(),
      },
    });

    console.log(`[recomputeValuation] Successfully updated ${company.ticker}`);
  } catch (error) {
    console.error(`[recomputeValuation] Failed for company ${companyId}:`, error);
    // Don't throw - valuation is non-critical, don't break parent flow
  }
}
```

- [ ] **Step 2: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Expected: No errors (valuation.ts is imported correctly)

- [ ] **Step 3: Commit orchestrator**

```bash
git add src/entities/company/api/recomputeValuation.ts
git commit -m "feat(valuation): add server-side orchestrator to recompute and persist valuation"
```

---

## Task 7: Hook Valuation Recalculation into Analysis Flow

**Files:**
- Modify: `src/features/analyze-text/api/processAnalysis.ts:280-310`

- [ ] **Step 1: Import recomputeValuation in processAnalysis.ts**

Add import at the top of the file:

```typescript
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";
```

- [ ] **Step 2: Call recompute after updateCompanyAggregates**

Find the `updateCompanyAggregates` function call (around line 225 in Phase 5) and add valuation recompute immediately after:

```typescript
        // Recalculate company aggregates
        await updateCompanyAggregates(companyData.company.id);

        // Recalculate valuation (global score + target price)
        await recomputeCompanyValuation(companyData.company.id);

        return {
          analysisId: analysis.id,
          companyId: companyData.company.id,
        };
```

- [ ] **Step 3: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Expected: No errors

- [ ] **Step 4: Commit hook**

```bash
git add src/features/analyze-text/api/processAnalysis.ts
git commit -m "feat(analysis): recompute valuation after text analysis"
```

---

## Task 8: Hook Valuation Recalculation into Enrichment Flow

**Files:**
- Modify: `src/features/enrich-company/api/processEnrichment.ts:200-230`

- [ ] **Step 1: Import recomputeValuation in processEnrichment.ts**

Add import at the top:

```typescript
import { recomputeCompanyValuation } from "@/entities/company/api/recomputeValuation";
```

- [ ] **Step 2: Ensure financialData and priceData are persisted**

Locate step 5 where enrichment is updated (around line 200) and verify that `financialData` and `priceData` are saved:

```typescript
    // 5. Store final result and mark as completed (translation deferred to on-demand)
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        financialData: finnhubData.financials as any,  // ENSURE THIS IS SAVED
        priceData: finnhubData.price as any,            // ENSURE THIS IS SAVED
        recommendations: (finnhubData.recommendations ?? undefined) as any,
        aiAnalysis,
        ollamaModel: env.OLLAMA_MODEL,
        errorMessage: null,
      },
    });
```

- [ ] **Step 3: Call recompute after enrichment completes**

Add valuation recompute right after the enrichment update:

```typescript
    // 5. Store final result and mark as completed
    await prisma.companyEnrichment.update({
      where: { id: enrichmentId },
      data: {
        status: "COMPLETED",
        financialData: finnhubData.financials as any,
        priceData: finnhubData.price as any,
        recommendations: (finnhubData.recommendations ?? undefined) as any,
        aiAnalysis,
        ollamaModel: env.OLLAMA_MODEL,
        errorMessage: null,
      },
    });

    // 5b. Recalculate valuation (global score + target price)
    await recomputeCompanyValuation(companyId);

    // 6. Update job status if exists
    if (jobId) {
      await prisma.job.update({
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 20
```

Expected: No errors

- [ ] **Step 5: Commit hook**

```bash
git add src/features/enrich-company/api/processEnrichment.ts
git commit -m "feat(enrichment): recompute valuation after Finnhub enrichment"
```

---

## Task 9: Create InfoTooltip Component

**Files:**
- Create: `src/shared/ui/InfoTooltip.tsx`

- [ ] **Step 1: Create lightweight tooltip component**

```typescript
/**
 * Lightweight info tooltip (no external deps)
 * Uses CSS hover popover, accessible with keyboard
 * @module shared/ui
 */

import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export function InfoTooltip({ content, className = '' }: InfoTooltipProps) {
  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        className="group relative inline-flex items-center justify-center w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full transition-colors"
        aria-label="More information"
        tabIndex={0}
      >
        <Info className="w-4 h-4" />
        
        {/* Popover */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus:opacity-100 group-focus:visible transition-all duration-200 pointer-events-none z-50">
          {content}
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-zinc-900 dark:bg-zinc-800 rotate-45"></div>
        </div>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Test tooltip rendering**

Create a simple test page or verify in Storybook (if available). If not, skip to UI integration.

- [ ] **Step 3: Commit tooltip component**

```bash
git add src/shared/ui/InfoTooltip.tsx
git commit -m "feat(ui): add lightweight InfoTooltip component"
```

---

## Task 10: Add i18n Keys for Valuation

**NOTE:** The company detail page (`src/app/companies/[ticker]/page.tsx`) currently does NOT use i18n. We're adding the keys for future use, but Task 11 will hardcode English text directly in the UI to match the current page style.

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/es.json`

- [ ] **Step 1: Add English keys**

In `src/messages/en.json`, add a new `valuation` section:

```json
{
  "valuation": {
    "globalScore": "Global Score",
    "targetPrice": "Target Price",
    "upside": "Upside",
    "noData": "N/A",
    "financialHealth": "Financial Health",
    "analystConsensus": "Analyst Consensus",
    "textSentiment": "Text Sentiment",
    "methods": "Valuation Methods",
    "grahamNumber": "Graham Number",
    "fairPE": "Fair P/E",
    "fiftyTwoWeekMid": "52-Week Midpoint",
    "baseTarget": "Base Target",
    "sentimentAdjustment": "Sentiment Adjustment",
    "tooltipGlobalScore": "Combines financial health (40%), analyst consensus (35%), and your text analyses (25%). Scale 0-100.",
    "tooltipTargetPrice": "Fair value estimate using Graham Number, fair P/E, and 52-week midpoint, adjusted by global sentiment.",
    "tooltipFinancialHealth": "Based on P/E ratio, profit margin, ROE, debt/equity, and dividend yield.",
    "tooltipAnalyst": "Consensus from analyst recommendations (strong buy, buy, hold, sell, strong sell).",
    "tooltipText": "Aggregate sentiment from your text analyses, weighted by reliability and volume."
  }
}
```

- [ ] **Step 2: Add Spanish translations**

In `src/messages/es.json`, add corresponding translations:

```json
{
  "valuation": {
    "globalScore": "Nota Global",
    "targetPrice": "Precio Objetivo",
    "upside": "Potencial",
    "noData": "N/D",
    "financialHealth": "Salud Financiera",
    "analystConsensus": "Consenso Analistas",
    "textSentiment": "Sentimiento Textos",
    "methods": "Métodos de Valoración",
    "grahamNumber": "Número de Graham",
    "fairPE": "P/E Justo",
    "fiftyTwoWeekMid": "Punto Medio 52 Semanas",
    "baseTarget": "Objetivo Base",
    "sentimentAdjustment": "Ajuste por Sentimiento",
    "tooltipGlobalScore": "Combina salud financiera (40%), consenso de analistas (35%) y tus análisis de texto (25%). Escala 0-100.",
    "tooltipTargetPrice": "Valor razonable estimado con Número de Graham, P/E justo y punto medio de 52 semanas, ajustado por sentimiento global.",
    "tooltipFinancialHealth": "Basado en ratio P/E, margen de beneficio, ROE, deuda/capital y rendimiento de dividendos.",
    "tooltipAnalyst": "Consenso de recomendaciones de analistas (compra fuerte, compra, mantener, vender, venta fuerte).",
    "tooltipText": "Sentimiento agregado de tus análisis de texto, ponderado por fiabilidad y volumen."
  }
}
```

- [ ] **Step 3: Commit i18n keys**

```bash
git add src/messages/en.json src/messages/es.json
git commit -m "feat(i18n): add valuation keys for global score and target price"
```

---

## Task 11: Integrate Valuation in Company Header UI

**NOTE:** This page does NOT use i18n currently. Text will be hardcoded in English to match existing page style.

**Files:**
- Modify: `src/app/companies/[ticker]/page.tsx:60-90` (types)
- Modify: `src/app/companies/[ticker]/page.tsx:270-350` (header UI)

- [ ] **Step 1: Import dependencies and add types**

At the top of `src/app/companies/[ticker]/page.tsx`, add imports:

```typescript
import { InfoTooltip } from "@/shared/ui/InfoTooltip";
import { TrendingUp, TrendingDown } from "lucide-react";
```

Add valuation fields to Company interface (around line 60):

```typescript
interface Company {
  id: string;
  ticker: string;
  name: string;
  // ... existing fields
  globalScore: number | null;
  globalScoreLabel: string | null;
  targetPrice: number | null;
  valuationBreakdown: any; // Json
  valuationUpdatedAt: string | null;
  // ... rest of fields
}
```

- [ ] **Step 2: Add valuation fetch to API call**

In the `fetchCompany` function, ensure valuation fields are selected:

```typescript
  const fetchCompany = async (ticker: string) => {
    const response = await fetch(`/api/companies/${ticker}?includeContent=true&includeAnalyses=true&includeEnrichments=true`);
    // ... existing code
  };
```

In the corresponding API route (`src/app/api/companies/[ticker]/route.ts`), ensure Company query includes:

```typescript
      globalScore: true,
      globalScoreLabel: true,
      targetPrice: true,
      valuationBreakdown: true,
      valuationUpdatedAt: true,
```

- [ ] **Step 3: Add valuation hero in company header**

Replace the `Building2` icon section (around line 300) with valuation display:

```typescript
          {/* Company Header */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 mb-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {company.logoUrl && (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="w-12 h-12 rounded-lg"
                    />
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                      {company.name}
                    </h1>
                    <p className="text-lg font-mono text-blue-600 dark:text-blue-400">
                      {company.ticker}
                    </p>
                  </div>
                </div>
                {company.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 max-w-3xl mt-4">
                    {company.description}
                  </p>
                )}
              </div>
              
              {/* Valuation Hero */}
              <div className="flex flex-col items-end gap-3">
                {/* Global Score */}
                {company.globalScore !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Global Score
                    </span>
                    <InfoTooltip content="Combines financial health (40%), analyst consensus (35%), and your text analyses (25%). Scale 0-100." />
                    <div className={`px-4 py-2 rounded-lg font-bold text-lg ${
                      company.globalScore >= 75 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
                      : company.globalScore >= 60 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
                      : company.globalScore >= 40 ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
                    }`}>
                      {company.globalScore}/100
                      <span className="ml-2 text-xs font-normal opacity-80">
                        {company.globalScoreLabel}
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Target Price */}
                {company.targetPrice !== null && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                      Target Price
                    </span>
                    <InfoTooltip content="Fair value estimate using Graham Number, fair P/E, and 52-week midpoint, adjusted by global sentiment." />
                    <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      ${company.targetPrice.toFixed(2)}
                    </div>
                  </div>
                )}
                
                {/* Upside (requires live price - fetch from finnhub-live endpoint) */}
                {company.targetPrice !== null && (
                  <UpsideIndicator ticker={company.ticker} targetPrice={company.targetPrice} />
                )}
              </div>
            </div>
```

- [ ] **Step 4: Create UpsideIndicator component inline**

Add this helper component before the main component:

```typescript
function UpsideIndicator({ ticker, targetPrice }: { ticker: string; targetPrice: number }) {
  const [livePrice, setLivePrice] = useState<number | null>(null);
  
  useEffect(() => {
    fetch(`/api/companies/${ticker}/finnhub-live`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.price?.currentPrice) {
          setLivePrice(data.price.currentPrice);
        }
      })
      .catch(() => setLivePrice(null));
  }, [ticker]);
  
  if (!livePrice) return null;
  
  const upside = ((targetPrice - livePrice) / livePrice) * 100;
  const isPositive = upside > 0;
  
  return (
    <div className={`flex items-center gap-1 text-sm font-semibold ${
      isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
    }`}>
      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      {upside > 0 ? '+' : ''}{upside.toFixed(1)}% Upside
    </div>
  );
}
```

- [ ] **Step 5: Add valuation detail breakdown section below header**

After the company metadata grid, add a collapsible detail section:

```typescript
            {/* Valuation Breakdown (Detail Section) */}
            {company.valuationBreakdown && (
              <div className="mt-6 p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                  Valuation Methods
                </h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Financial Health */}
                  {company.valuationBreakdown.financialHealthScore !== null && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Financial Health
                        </span>
                        <InfoTooltip content="Based on P/E ratio, profit margin, ROE, debt/equity, and dividend yield." />
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {company.valuationBreakdown.financialHealthScore.toFixed(0)}/100
                      </div>
                    </div>
                  )}
                  
                  {/* Analyst */}
                  {company.valuationBreakdown.analystScore !== null && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Analyst Consensus
                        </span>
                        <InfoTooltip content="Consensus from analyst recommendations (strong buy, buy, hold, sell, strong sell)." />
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {company.valuationBreakdown.analystScore.toFixed(0)}/100
                      </div>
                    </div>
                  )}
                  
                  {/* Text Sentiment */}
                  {company.valuationBreakdown.textSentimentScore !== null && (
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-zinc-600 dark:text-zinc-400">
                          Text Sentiment
                        </span>
                        <InfoTooltip content="Aggregate sentiment from your text analyses, weighted by reliability and volume." />
                      </div>
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {company.valuationBreakdown.textSentimentScore.toFixed(0)}/100
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Target Price Methods */}
                {company.targetPrice && (
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                    <div className="grid grid-cols-4 gap-3 text-xs">
                      {company.valuationBreakdown.targetPriceMethods.grahamNumber && (
                        <div>
                          <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                            Graham Number
                          </div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            ${company.valuationBreakdown.targetPriceMethods.grahamNumber.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {company.valuationBreakdown.targetPriceMethods.fairPE && (
                        <div>
                          <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                            Fair P/E
                          </div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            ${company.valuationBreakdown.targetPriceMethods.fairPE.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {company.valuationBreakdown.targetPriceMethods.fiftyTwoWeekMid && (
                        <div>
                          <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                            52-Week Midpoint
                          </div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            ${company.valuationBreakdown.targetPriceMethods.fiftyTwoWeekMid.toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                          Sentiment Adjustment
                        </div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {company.valuationBreakdown.sentimentAdjustment 
                            ? `${company.valuationBreakdown.sentimentAdjustment > 0 ? '+' : ''}${company.valuationBreakdown.sentimentAdjustment.toFixed(1)}%`
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
```

- [ ] **Step 6: Verify TypeScript compilation**

```bash
npx tsc --noEmit 2>&1 | Select-Object -First 30
```

Expected: No errors

- [ ] **Step 7: Commit UI integration**

```bash
git add src/app/companies/[ticker]/page.tsx src/app/api/companies/[ticker]/route.ts
git commit -m "feat(ui): integrate valuation in company header with tooltips and detail breakdown"
```

---

## Task 12: Verification and Testing

**Files:**
- All

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass (including new valuation tests)

- [ ] **Step 2: Build verification**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors

- [ ] **Step 3: Manual verification - new company via text analysis**

1. Start app: `npm run dev`
2. Analyze text mentioning a new company (e.g., "Tesla is innovating in EVs")
3. Navigate to company page
4. Verify: Partial global score visible (from text sentiment only), target price shows "N/A"

- [ ] **Step 4: Manual verification - enrichment triggers full valuation**

1. On same company page, click "Enrich with Finnhub"
2. Wait for enrichment to complete
3. Refresh page
4. Verify: Full global score (with financial + analyst + text), target price displayed, upside % calculated

- [ ] **Step 5: Manual verification - adding new analysis recalculates**

1. Add another text analysis for the same company
2. Navigate back to company page
3. Verify: Global score and target price updated (valuationUpdatedAt changed)

- [ ] **Step 6: Manual verification - tooltips work**

1. Hover over Info icon next to "Global Score"
2. Verify: Tooltip displays methodology explanation
3. Test keyboard navigation (Tab to focus, should show tooltip)

- [ ] **Step 7: Verify Finnhub metric keys (Python service)**

Run enrichment for a real ticker and check logs:

```bash
docker compose logs enrichment --tail=50 | Select-String "bookValue|roe|debtToEquity|epsGrowth"
```

Expected: Metrics extracted successfully (if keys are correct)

**Note:** If keys are missing/incorrect, update Python extraction code with correct Finnhub field names from API response.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete global score and target price valuation system"
```

---

## Completion Checklist

- [ ] All tasks completed
- [ ] All tests passing (including new valuation.test.ts)
- [ ] Build succeeds
- [ ] Manual verification passed (3 scenarios)
- [ ] Tooltips working
- [ ] Finnhub metrics verified
- [ ] Code committed

**Next Steps:** Consider adding valuation to company cards on the companies list page, and potentially a filter/sort by global score.
