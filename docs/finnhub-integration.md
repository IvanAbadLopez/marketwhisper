# Finnhub Integration Guide

## Overview
MarketWhisper now supports **two** financial data sources for company enrichment:
- **Yahoo Finance** — Free, comprehensive data (prices, financials, news, analyst recommendations)
- **Finnhub** — Free tier with 60 req/min, provides profile, financial metrics, and 52-week ranges

Both sources generate AI analysis using **Ollama** (llama3.1:8b).

---

## Setup Instructions

### 1. Get your Finnhub API Key (Free)
1. Register at [https://finnhub.io/register](https://finnhub.io/register)
2. Copy your **API Key** from the dashboard
3. Free tier limits: **60 requests/minute** (generous)

### 2. Configure Environment Variables

Add to your `.env.local` (or `.env` for Docker):

```env
FINNHUB_API_KEY="your_api_key_here"
```

The enrichment service (Python) needs this key to make API calls to Finnhub.

### 3. Restart Services

**Local development:**
```bash
# Restart the enrichment service
docker compose restart enrichment
```

**Full Docker deployment:**
```bash
docker compose down
docker compose up --build -d
```

---

## How to Use

### In the Company Detail Page (`/companies/[TICKER]`)
1. You'll see **two tabs**: **Yahoo Finance** and **Finnhub**
2. Click on the tab you want to view/enrich
3. Click the **"Enrich with [Source]"** button for that tab
4. The enrichment runs in the background (you can keep browsing)
5. Refresh the page or wait for auto-update to see results

### Data Comparison

| Feature | Yahoo Finance | Finnhub |
|---------|---------------|---------|
| **Price data** | ✅ Current, 52W high/low, volume | ⚠️ Only 52W high/low |
| **Financial metrics** | ✅ Revenue, net income, EPS, P/E, debt/equity, margins | ⚠️ EPS, P/E, margins only |
| **News** | ✅ Recent headlines | ❌ Not fetched (free tier limitation) |
| **Analyst recommendations** | ✅ Buy/sell/hold counts | ❌ Not available in free tier |
| **AI Analysis** | ✅ Ollama-generated | ✅ Ollama-generated |
| **Rate limits** | ⚠️ Can be restrictive (~2000/hour) | ✅ 60/min (3600/hour) |

### When to Use Each Source
- **Yahoo Finance**: For comprehensive data (news, recommendations, full financials)
- **Finnhub**: As fallback when Yahoo hits rate limits, or for basic company profiles

---

## Architecture

### Backend (Python Enrichment Service)
- **File**: `services/enrichment/main.py`
- **New endpoint**: `GET /api/enrich-finnhub/{ticker}`
- **Library**: `finnhub-python==2.4.20`
- **Logic**:
  1. Fetch `company_profile2` → name, sector, marketCap, website
  2. Fetch `company_basic_financials` (metric=all) → EPS, P/E, margins, 52W
  3. Return structured response (same format as Yahoo)

### Frontend (Next.js)
- **Routes**:
  - `POST /api/companies/[ticker]/enrich-finnhub` — Start enrichment
  - `GET /api/companies/[ticker]/enrich-finnhub/[id]` — Poll status
- **Components**:
  - `EnrichButton` — Now accepts `source` prop ("YAHOO" | "FINNHUB")
  - `EnrichmentTabs` — Tab UI to switch between Yahoo/Finnhub data
  - `EnrichmentDisplay` — Unified display component for both sources
- **Database**:
  - `CompanyEnrichment.source` — Enum field to distinguish data source

---

## Troubleshooting

### "Finnhub service unavailable. FINNHUB_API_KEY not configured"
- **Cause**: The API key is missing or not loaded by the enrichment service
- **Fix**: 
  1. Verify `.env.local` has `FINNHUB_API_KEY="..."`
  2. Restart enrichment service: `docker compose restart enrichment`
  3. Check logs: `docker logs marketwhisper-enrichment --tail 20`

### "Finnhub rate limit exceeded"
- **Cause**: You hit the 60 req/min limit (unlikely unless batch enriching)
- **Fix**: Wait 1 minute, or use Yahoo Finance instead

### Enrichment stuck on "Pending"
- **Cause**: Enrichment service may be down, or Ollama is unreachable
- **Fix**:
  1. Check service health: `docker ps` (all containers should be "healthy")
  2. Check enrichment logs: `docker logs marketwhisper-enrichment`
  3. Check Ollama logs: `docker logs marketwhisper-ollama`

### No data showing after enrichment
- **Cause**: Ticker may not exist in Finnhub's database
- **Fix**: Try a common ticker like `AAPL`, `MSFT`, `TSLA` first
- **Note**: Finnhub primarily covers **US stocks**. International tickers may not work.

---

## Database Schema

```prisma
model CompanyEnrichment {
  id              String            @id @default(cuid())
  companyId       String
  ticker          String
  source          EnrichmentSource  @default(YAHOO)  // NEW FIELD
  status          EnrichmentStatus  @default(PENDING)
  financialData   Json?
  priceData       Json?
  newsHeadlines   Json?
  recommendations Json?
  aiAnalysis      String?
  ollamaModel     String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([source])  // NEW INDEX
}

enum EnrichmentSource {
  YAHOO
  FINNHUB
}
```

**Migration applied**: `20260704150143_add_enrichment_source`

---

## Credits
- **Yahoo Finance**: [yfinance](https://github.com/ranaroussi/yfinance) by Ran Aroussi
- **Finnhub**: [finnhub.io](https://finnhub.io) — Financial APIs for developers

---

## Future Enhancements
- [ ] Merge/compare data from both sources in one view
- [ ] Add more Finnhub endpoints (real-time quotes, earnings calendar)
- [ ] Support for other providers (Alpha Vantage, Twelve Data, Polygon.io)
- [ ] Cached enrichment results (reduce API calls)
