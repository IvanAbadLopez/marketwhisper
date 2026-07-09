# Analyst Sentiment Integration - Design Document

**Date:** 2026-07-09  
**Feature:** Finnhub Analyst Recommendations Integration  
**Status:** Approved  

## Overview

Add analyst sentiment data from Finnhub to complement user-submitted text analyses. This provides an objective, market-based sentiment score alongside the subjective sentiment from user texts.

## Motivation

Currently, MarketWhisper analyzes sentiment and reliability only from user-submitted texts (news, tweets, analysis). However, Finnhub's `recommendation_trends` endpoint provides analyst consensus data (Strong Buy, Buy, Hold, Sell, Strong Sell) that represents professional opinions — a valuable complement to user sentiment.

**Key Benefits:**
- Objective market sentiment (analysts) vs subjective user sentiment (your texts)
- Visual trend analysis with recharts (4-period historical view)
- Integrated into Ollama AI reports for comprehensive analysis
- No schema migration required (field already exists)

## Architecture

### Data Flow

```
Finnhub API (recommendation_trends)
    ↓
Python Service (services/enrichment/main.py)
    ↓ persists JSON
CompanyEnrichment.recommendations (Prisma)
    ↓ reads
TypeScript processEnrichment
    ↓ calculates score + feeds prompt
Ollama AI Analysis
    ↓ UI reads
EnrichmentDisplay Component
    ↓ renders
AnalystSentimentChart (recharts) + numeric breakdown
```

### Technology Stack

- **Data Source:** Finnhub `recommendation_trends` API (free tier, 60 calls/min)
- **Persistence:** `CompanyEnrichment.recommendations Json?` (existing field)
- **Charting:** recharts ^3.9.1 (already installed)
- **AI Integration:** Ollama llama3.1:8b (existing)

### FSD Placement

Following Feature-Sliced Design:

- **Helper:** `src/features/enrich-company/api/processEnrichment.ts` (calcAnalystScore)
- **Types:** Same file (AnalystRecommendation interface)
- **Chart Component:** `src/entities/company/ui/AnalystSentimentChart.tsx` (new)
- **Integration:** `src/entities/company/ui/EnrichmentDisplay.tsx` (modify)

## Components

### 1. Score Calculation

**Function:** `calcAnalystScore(r: AnalystRecommendation): number | null`

**Algorithm:**
```
weighted = strongBuy * 2 + buy * 1 + hold * 0 + sell * -1 + strongSell * -2
total = strongBuy + buy + hold + sell + strongSell
score = weighted / (total * 2)  // normalized to [-1, 1]
```

**Interpretation:**
- `+1.0` → 100% Strong Buy (max bullish)
- `+0.5` → Majority Buy/Strong Buy
- `0.0` → Neutral (mostly Hold or balanced)
- `-0.5` → Majority Sell
- `-1.0` → 100% Strong Sell (max bearish)

**Edge Cases:**
- `total = 0` → return `null` (no recommendations available)

### 2. Chart Component

**File:** `src/entities/company/ui/AnalystSentimentChart.tsx`

**Features:**
- Recharts `LineChart` with 4 data points (Finnhub periods)
- Y-axis fixed to [-1, 1] range
- `ReferenceLine` at y=0 (neutral marker)
- Line color: green (#22c55e) if latest > 0, red (#ef4444) if < 0
- Tooltip showing period + formatted score
- Height: ~200px (compact for integration)

**Props:**
```typescript
interface AnalystSentimentChartProps {
  recommendations: AnalystRecommendation[];
}
```

### 3. Numeric Breakdown

Display below the chart:

```
Latest (2026-07-01): 12 Strong Buy • 18 Buy • 5 Hold • 1 Sell • 0 Strong Sell
Score: +0.73 (Bullish)
```

**Score Labels:**
- `> +0.6`: "Strong Bullish"
- `+0.2 to +0.6`: "Bullish"
- `-0.2 to +0.2`: "Neutral"
- `-0.6 to -0.2`: "Bearish"
- `< -0.6`: "Strong Bearish"

### 4. Ollama Prompt Integration

**Modification:** `generateAnalysisPrompt` in `processEnrichment.ts`

Add section after "52-Week Performance" and before "User Text Analyses":

```
**Analyst Recommendations (Latest Period: 2026-07-01):**
- Strong Buy: 12 | Buy: 18 | Hold: 5 | Sell: 1 | Strong Sell: 0
- Consensus Score: +0.73 (Bullish)
```

**Impact:** Ollama can now mention analyst consensus in the "Market Sentiment" and "Investment Outlook" sections of the AI report.

**Cost:** ~100 tokens extra per enrichment (negligible with 1000-token generation limit).

## Data Model

### Python (services/enrichment/main.py)

**Existing Model (no changes needed):**
```python
class Recommendation(BaseModel):
    period: str
    strongBuy: int
    buy: int
    hold: int
    sell: int
    strongSell: int
```

**Usage:**
```python
rec_trends = finnhub_client.recommendation_trends(ticker_upper)
recommendations = [Recommendation(**r) for r in (rec_trends or [])]
```

### TypeScript (processEnrichment.ts)

**New Interface:**
```typescript
interface AnalystRecommendation {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}
```

**Add to FinnhubData:**
```typescript
interface FinnhubData {
  // ...existing fields...
  recommendations?: AnalystRecommendation[];
}
```

### Persistence

**No migration required** — `CompanyEnrichment.recommendations Json?` already exists.

**Storage:** Each enrichment saves a snapshot of ~4 periods returned by Finnhub at that moment. No custom historical accumulation (simple approach).

## Error Handling

### Python Service

- `recommendation_trends()` fails → log warning, return `recommendations: []`
- Don't block enrichment for missing recommendations (complementary data)
- Finnhub rate limits already handled in existing code

### TypeScript

- `finnhubData.recommendations` undefined/null/[] → don't render analyst section
- `calcAnalystScore` returns null → display "N/A" instead of score
- Chart with < 2 points → show "Insufficient data for trend chart"

### UI States

- **No enrichment:** Don't show analyst section (as currently)
- **Enrichment without recommendations:** "Analyst recommendations not available for this ticker"
- **Recommendations but score=null:** Show numeric breakdown without calculated score

### Backward Compatibility

- Old enrichments (without `recommendations` field) → work normally
- JSON nullable field → no breaking changes

## Testing Strategy

### Unit Tests (TypeScript)

**File:** `src/features/enrich-company/api/calcAnalystScore.test.ts`

Test cases:
- All strongBuy (15 analysts) → score = +1.0
- All strongSell (10 analysts) → score = -1.0
- Balanced mix (5/5/5/5/5) → score ≈ 0.0
- Total = 0 → score = null
- Typical bullish (12/18/5/1/0) → score ≈ +0.73
- Typical bearish (0/3/8/15/10) → score ≈ -0.64

**File:** `src/features/enrich-company/api/processEnrichment.test.ts`

- Mock Finnhub response with recommendations
- Verify persistence in `companyEnrichment.recommendations`
- Verify prompt includes analyst section when data exists

### Integration Tests

- Enrich company with real Finnhub data → verify chart renders
- Test error scenarios (API failure, empty recommendations)

### E2E Tests (Optional)

- Enrich AAPL → verify analyst sentiment chart appears
- Visual regression: screenshot of `AnalystSentimentChart`

**Expected Test Count:** +5-7 new unit tests (meets TFM mandatory testing requirement)

## Implementation Plan

The implementation will follow this sequence:

1. **Python Service** - Fetch and map recommendations from Finnhub
2. **TypeScript Types & Helpers** - Add interfaces and calcAnalystScore function
3. **Persist Data** - Update processEnrichment to save recommendations
4. **Ollama Prompt** - Integrate analyst data into AI analysis prompt
5. **Chart Component** - Build AnalystSentimentChart with recharts
6. **UI Integration** - Add chart to EnrichmentDisplay
7. **Tests** - Unit tests for score calculation and integration tests
8. **Verification** - Manual test with real enrichment

## Success Criteria

- ✅ Analyst recommendations fetched from Finnhub and persisted
- ✅ Score calculation produces correct values (-1 to +1 range)
- ✅ Chart renders with 4 historical data points
- ✅ Ollama AI report mentions analyst consensus
- ✅ Error states handled gracefully (missing data, API failures)
- ✅ All tests passing (5-7 new unit tests)
- ✅ No schema migration required
- ✅ Backward compatible with existing enrichments

## Non-Goals (Out of Scope)

- ❌ Custom historical accumulation beyond Finnhub's 4 periods
- ❌ Finnhub `company_news` integration (separate feature)
- ❌ Paid Finnhub endpoints (news sentiment aggregation)
- ❌ Real-time price alerts based on analyst changes
- ❌ Analyst sentiment on company list/cards (only detail page)

## Future Enhancements

If we want to extend this feature later:

1. **Long-term historical tracking:** Create `AnalystSentimentSnapshot` model to accumulate data over months
2. **Correlation analysis:** Compare analyst score vs user sentiment score trends
3. **Alerts:** Notify when analyst consensus shifts significantly (e.g., from Hold to Buy)
4. **News integration:** Add Finnhub company news headlines to enrich context
