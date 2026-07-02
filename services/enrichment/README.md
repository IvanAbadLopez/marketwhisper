# Company Enrichment Service

Python FastAPI microservice that fetches public financial data from Yahoo Finance (yfinance).

## Features

- Company basic information (sector, industry, employees, market cap, website, description)
- Key financial metrics (revenue, net income, EPS, P/E ratio, debt/equity, profit margins)
- Current price data (current price, 52-week high/low, day change, volume)
- Recent news headlines (title, publisher, link, date)
- Analyst recommendations (strong buy, buy, hold, sell, strong sell)

## Endpoints

### `GET /health`
Health check endpoint for Docker health monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "enrichment",
  "timestamp": "2026-07-02T12:00:00.000Z"
}
```

### `GET /api/enrich/{ticker}`
Fetch comprehensive financial data for a company ticker.

**Parameters:**
- `ticker` (path): Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)

**Response:**
```json
{
  "success": true,
  "ticker": "AAPL",
  "companyInfo": {
    "ticker": "AAPL",
    "name": "Apple Inc.",
    "sector": "Technology",
    "industry": "Consumer Electronics",
    "description": "Apple Inc. designs, manufactures...",
    "website": "https://www.apple.com",
    "employees": 164000,
    "marketCap": 3450000000000
  },
  "financials": {
    "revenue": 394328000000,
    "netIncome": 99633000000,
    "eps": 6.13,
    "peRatio": 32.5,
    "debtToEquity": 1.73,
    "dividendYield": 0.0045,
    "profitMargins": 0.25
  },
  "price": {
    "currentPrice": 199.5,
    "previousClose": 198.0,
    "dayChange": 1.5,
    "dayChangePercent": 0.76,
    "fiftyTwoWeekHigh": 205.0,
    "fiftyTwoWeekLow": 165.0,
    "volume": 45000000,
    "avgVolume": 50000000
  },
  "news": [
    {
      "title": "Apple announces new product...",
      "publisher": "Reuters",
      "link": "https://reuters.com/...",
      "publishedAt": "2026-07-01T15:30:00Z"
    }
  ],
  "recommendations": [
    {
      "period": "2026-06",
      "strongBuy": 15,
      "buy": 20,
      "hold": 10,
      "sell": 2,
      "strongSell": 0
    }
  ],
  "timestamp": "2026-07-02T12:00:00.000Z"
}
```

## Development

### Local Testing

```bash
# Install dependencies
pip install -r requirements.txt

# Run service
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Test endpoint
curl http://localhost:8001/api/enrich/AAPL
```

### Docker

```bash
# Build
docker build -t marketwhisper-enrichment .

# Run
docker run -p 8001:8001 marketwhisper-enrichment

# Health check
curl http://localhost:8001/health
```

## Dependencies

- **FastAPI**: Modern web framework for APIs
- **uvicorn**: ASGI server
- **yfinance**: Yahoo Finance data fetcher
- **pydantic**: Data validation

## Error Handling

- **404**: Ticker not found in Yahoo Finance
- **500**: Internal server error (yfinance failure, network issues)

All errors return:
```json
{
  "error": "Ticker INVALID not found"
}
```

## Rate Limits

Yahoo Finance has informal rate limits. Recommendations:
- Add cooldown between requests (implemented in Next.js API)
- Don't scrape large batches
- Respect their terms of service
