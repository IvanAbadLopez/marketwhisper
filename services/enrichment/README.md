# Company Enrichment Service

Python FastAPI microservice that fetches public financial data from Finnhub.

## Features

- Company basic information (sector, industry, market cap, website)
- Key financial metrics (EPS, P/E ratio, profit margins, dividend yield)
- Price data (52-week high/low from metrics)

## Endpoints

### `GET /health`
Health check endpoint for Docker health monitoring.

**Response:**
```json
{
  "status": "healthy",
  "service": "enrichment",
  "timestamp": "2026-07-08T12:00:00.000Z",
  "providers": {
    "finnhub": true
  }
}
```

### `GET /api/enrich-finnhub/{ticker}`
Fetch comprehensive financial data for a company ticker from Finnhub.

**Parameters:**
- `ticker` (path): Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)

## Development

### Local

```bash
# Install dependencies
pip install -r requirements.txt

# Set API key
export FINNHUB_API_KEY="your_key_here"

# Run server
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Test endpoint
curl http://localhost:8001/api/enrich-finnhub/AAPL
```

### Docker

```bash
# Build
docker build -t marketwhisper-enrichment .

# Run
docker run -p 8001:8001 -e FINNHUB_API_KEY="your_key" marketwhisper-enrichment

# Health check
curl http://localhost:8001/health
```

## Dependencies

- **FastAPI**: Modern web framework for APIs
- **uvicorn**: ASGI server
- **finnhub-python**: Finnhub API client
- **pydantic**: Data validation

## Error Handling

- **404**: Ticker not found in Finnhub
- **429**: Rate limit exceeded (60 requests/minute)
- **500**: Internal server error (Finnhub failure, network issues)
- **503**: Finnhub API key not configured

## Rate Limits

Finnhub free tier: **60 requests/minute** (3,600/hour). Recommendations:
- Add cooldown between requests (implemented in Next.js API)
- Don't make large batch requests
- Respect their terms of service

## License

MIT
