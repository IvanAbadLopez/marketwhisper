# Finnhub Integration Guide

## Overview
MarketWhisper uses **Finnhub** as its financial data source for company enrichment, providing:
- Company profile (name, sector, market cap, website)
- Financial metrics (EPS, P/E ratio, profit margins, dividend yield)
- 52-week high/low price data

All enrichment data is analyzed using **Ollama** (llama3.1:8b) to generate AI-powered investment insights.

---

## Setup Instructions

### 1. Get your Finnhub API Key (Free)
1. Register at [https://finnhub.io/register](https://finnhub.io/register)
2. Copy your **API Key** from the dashboard
3. Free tier limits: **60 requests/minute** (3,600/hour)

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
1. Navigate to any company detail page
2. Find the **"Financial Data"** section
3. Click the **"Enrich with Finnhub"** button
4. The enrichment runs in the background (status shows: Queued → Analyzing → Success)
5. The page will auto-refresh to display the enrichment results

### Available Data

| Feature | Finnhub Free Tier |
|---------|-------------------|
| **Company Info** | ✅ Name, sector, industry, market cap, website |
| **Financial Metrics** | ✅ EPS, P/E ratio, profit margins, dividend yield |
| **Price Data** | ✅ 52-week high/low |
| **AI Analysis** | ✅ Ollama-generated investment insights (EN + ES) |
| **Rate Limits** | ✅ 60 requests/minute |

---

## Architecture

### Backend (Python Enrichment Service)
- **File**: `services/enrichment/main.py`
- **Endpoint**: `GET /api/enrich-finnhub/{ticker}`
- **Library**: `finnhub-python==2.4.20`
- **Logic**:
  1. Fetch `company_profile2` → name, sector, marketCap, website
  2. Fetch `company_basic_financials` (metric=all) → EPS, P/E, margins, 52W high/low
  3. Return structured response to Next.js API

### Frontend (Next.js)
- **Routes**:
  - `POST /api/companies/[ticker]/enrich-finnhub` — Start enrichment job
  - `GET /api/companies/[ticker]/enrich-finnhub/[id]` — Poll job status
- **Components**:
  - `EnrichButton` — Triggers enrichment and shows status (Queued/Analyzing/Success)
  - `EnrichmentDisplay` — Displays financial data and AI analysis
- **Database**:
  - `CompanyEnrichment` model stores enrichment data with `source: FINNHUB`

---

## Troubleshooting

### "Finnhub service unavailable. FINNHUB_API_KEY not configured"
- **Cause**: The API key is missing or not loaded by the enrichment service
- **Fix**: 
  1. Verify `.env.local` has `FINNHUB_API_KEY="..."`
  2. Restart enrichment service: `docker compose restart enrichment`
  3. Check logs: `docker logs marketwhisper-enrichment --tail 20`

### "Finnhub rate limit exceeded"
  2. Restart the service: `docker compose restart enrichment`

### "Finnhub rate limit exceeded"
- **Cause**: You hit the 60 req/min limit (unlikely unless batch enriching)
- **Fix**: Wait 1 minute before retrying

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
  source          EnrichmentSource  @default(FINNHUB)
  status          EnrichmentStatus  @default(PENDING)
  financialData   Json?
  priceData       Json?
  newsHeadlines   Json?
  recommendations Json?
  aiAnalysis      String?
  aiAnalysisEs    String?
  ollamaModel     String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([source])
}

enum EnrichmentSource {
  FINNHUB
}
```

**Migration**: `20260708162748_init` (clean schema without legacy sources)

---

## Credits
- **Finnhub**: [finnhub.io](https://finnhub.io) — Financial APIs for developers
- **Ollama**: [ollama.ai](https://ollama.ai) — Local AI models

---

## Future Enhancements
- [ ] Add more Finnhub endpoints (real-time quotes, earnings calendar, company news)
- [ ] Support for other providers (Alpha Vantage, Twelve Data, Polygon.io)
- [ ] Cached enrichment results (reduce API calls)
- [ ] Batch enrichment for multiple tickers
