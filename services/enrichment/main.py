"""
MarketWhisper - Company Enrichment Service
FastAPI microservice that fetches public financial data from Yahoo Finance (yfinance)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import yfinance as yf
from datetime import datetime
import logging
import urllib3
import json
import time
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

# Disable SSL warnings for corporate proxy with self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RateLimitError(Exception):
    """Raised when Yahoo Finance returns a rate limit response (HTTP 429 or HTML instead of JSON)."""
    pass

app = FastAPI(
    title="MarketWhisper Enrichment Service",
    description="Fetches public financial data from Yahoo Finance",
    version="1.0.0"
)

# CORS configuration - allow Next.js to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CompanyInfo(BaseModel):
    """Company basic information"""
    ticker: str
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None
    marketCap: Optional[int] = None

class FinancialMetrics(BaseModel):
    """Key financial metrics"""
    revenue: Optional[int] = None
    netIncome: Optional[int] = None
    eps: Optional[float] = None
    peRatio: Optional[float] = None
    debtToEquity: Optional[float] = None
    dividendYield: Optional[float] = None
    profitMargins: Optional[float] = None

class PriceData(BaseModel):
    """Current price and trading data"""
    currentPrice: Optional[float] = None
    previousClose: Optional[float] = None
    dayChange: Optional[float] = None
    dayChangePercent: Optional[float] = None
    fiftyTwoWeekHigh: Optional[float] = None
    fiftyTwoWeekLow: Optional[float] = None
    volume: Optional[int] = None
    avgVolume: Optional[int] = None

class NewsItem(BaseModel):
    """News headline"""
    title: str
    publisher: Optional[str] = None
    link: Optional[str] = None
    publishedAt: Optional[datetime] = None

class Recommendation(BaseModel):
    """Analyst recommendation"""
    period: str
    strongBuy: int
    buy: int
    hold: int
    sell: int
    strongSell: int

class EnrichmentResponse(BaseModel):
    """Complete enrichment response"""
    success: bool
    ticker: str
    companyInfo: Optional[CompanyInfo] = None
    financials: Optional[FinancialMetrics] = None
    price: Optional[PriceData] = None
    news: List[NewsItem] = []
    recommendations: List[Recommendation] = []
    error: Optional[str] = None
    timestamp: datetime

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "enrichment", "timestamp": datetime.now().isoformat()}


@retry(
    retry=retry_if_exception_type(RateLimitError),
    stop=stop_after_attempt(4),  # 1 initial attempt + 3 retries
    wait=wait_exponential(multiplier=2, min=2, max=8),  # waits: 2s, 4s, 8s
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def fetch_ticker_info(ticker: str) -> Dict[str, Any]:
    """
    Fetch ticker info from Yahoo Finance with retry on rate limiting.

    Retries up to 3 times with exponential backoff (2s, 4s, 8s) when a rate
    limit is detected. Non-rate-limit errors (404, invalid ticker) are raised
    immediately without retry.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Raw info dict from yfinance

    Raises:
        RateLimitError: When Yahoo Finance rate limit is hit (triggers retry)
        HTTPException: For non-retryable errors (404, invalid ticker)
    """
    # Disable SSL verification for corporate proxy
    import requests
    session = requests.Session()
    session.verify = False

    logger.info(f"[YFINANCE] Fetching info for {ticker}")
    stock = yf.Ticker(ticker.upper(), session=session)

    try:
        info = stock.info
    except json.JSONDecodeError as e:
        # HTML instead of JSON => almost always rate limiting. Retryable.
        logger.warning(f"[RATE LIMIT?] JSON decode error for {ticker}: {str(e)}")
        raise RateLimitError(f"Yahoo Finance returned invalid response for {ticker} (likely rate limited)")
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg or "too many requests" in error_msg.lower():
            logger.warning(f"[RATE LIMIT DETECTED] HTTP 429 for {ticker}")
            raise RateLimitError(f"Yahoo Finance rate limit (429) for {ticker}")
        if "404" in error_msg or "not found" in error_msg.lower():
            logger.warning(f"[TICKER NOT FOUND] {ticker} returned 404")
            raise HTTPException(
                status_code=404,
                detail=f"Ticker {ticker} not found in Yahoo Finance. Please verify the ticker symbol.",
            )
        # Unknown error - not retryable
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data from Yahoo Finance for {ticker}. Error: {error_msg}",
        )

    return info


@app.get("/api/enrich/{ticker}", response_model=EnrichmentResponse)
async def enrich_company(ticker: str):
    """
    Fetch comprehensive public data for a company from Yahoo Finance
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
    
    Returns:
        EnrichmentResponse with company info, financials, price, news, and recommendations
    """
    start_time = time.time()
    logger.info(f"[ENRICH START] Ticker: {ticker} | Time: {datetime.now().isoformat()}")
    
    try:
        # Fetch data from yfinance with automatic retry on rate limiting
        try:
            info = fetch_ticker_info(ticker)
            elapsed = time.time() - start_time
            logger.info(f"[YFINANCE SUCCESS] {ticker} fetched in {elapsed:.2f}s | Data points: {len(info)}")
        except RateLimitError as e:
            # All retries exhausted - still rate limited
            elapsed = time.time() - start_time
            logger.error(f"[RATE LIMIT] {ticker} still rate limited after retries ({elapsed:.2f}s): {str(e)}")
            raise HTTPException(
                status_code=429,
                detail=f"Yahoo Finance rate limit exceeded after 3 retries. Please try again in a few minutes. Ticker: {ticker}",
            )
        
        # Check if ticker is valid (info dict has meaningful data)
        if not info or len(info) < 5 or 'symbol' not in info:
            raise HTTPException(
                status_code=404, 
                detail=f"Ticker {ticker} not found or returned empty data. The ticker may be invalid or delisted."
            )
        
        # Extract company info
        company_info = CompanyInfo(
            ticker=ticker.upper(),
            name=info.get('longName') or info.get('shortName'),
            sector=info.get('sector'),
            industry=info.get('industry'),
            description=info.get('longBusinessSummary'),
            website=info.get('website'),
            employees=info.get('fullTimeEmployees'),
            marketCap=info.get('marketCap')
        )
        
        # Extract financial metrics
        financials = FinancialMetrics(
            revenue=info.get('totalRevenue'),
            netIncome=info.get('netIncomeToCommon'),
            eps=info.get('trailingEps'),
            peRatio=info.get('trailingPE') or info.get('forwardPE'),
            debtToEquity=info.get('debtToEquity'),
            dividendYield=info.get('dividendYield'),
            profitMargins=info.get('profitMargins')
        )
        
        # Extract price data
        current_price = info.get('currentPrice') or info.get('regularMarketPrice')
        previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')
        
        day_change = None
        day_change_percent = None
        if current_price and previous_close:
            day_change = current_price - previous_close
            day_change_percent = (day_change / previous_close) * 100
        
        price = PriceData(
            currentPrice=current_price,
            previousClose=previous_close,
            dayChange=day_change,
            dayChangePercent=day_change_percent,
            fiftyTwoWeekHigh=info.get('fiftyTwoWeekHigh'),
            fiftyTwoWeekLow=info.get('fiftyTwoWeekLow'),
            volume=info.get('volume'),
            avgVolume=info.get('averageVolume')
        )
        
        # Extract news (limit to 10 most recent)
        news_items = []
        try:
            news = stock.news[:10] if hasattr(stock, 'news') and stock.news else []
            for article in news:
                news_items.append(NewsItem(
                    title=article.get('title', ''),
                    publisher=article.get('publisher', ''),
                    link=article.get('link', ''),
                    publishedAt=datetime.fromtimestamp(article.get('providerPublishTime', 0)) if article.get('providerPublishTime') else None
                ))
        except Exception as e:
            logger.warning(f"Failed to fetch news for {ticker}: {e}")
        
        # Extract analyst recommendations
        recommendations_list = []
        try:
            recommendations = stock.recommendations
            if recommendations is not None and not recommendations.empty:
                # Get last 4 periods (usually last 4 months)
                recent_recs = recommendations.tail(4)
                for idx, row in recent_recs.iterrows():
                    recommendations_list.append(Recommendation(
                        period=idx.strftime('%Y-%m') if hasattr(idx, 'strftime') else str(idx),
                        strongBuy=int(row.get('strongBuy', 0)),
                        buy=int(row.get('buy', 0)),
                        hold=int(row.get('hold', 0)),
                        sell=int(row.get('sell', 0)),
                        strongSell=int(row.get('strongSell', 0))
                    ))
        except Exception as e:
            logger.warning(f"Failed to fetch recommendations for {ticker}: {e}")
        
        total_elapsed = time.time() - start_time
        logger.info(
            f"[ENRICH COMPLETE] {ticker} | "
            f"Total time: {total_elapsed:.2f}s | "
            f"News: {len(news_items)} | "
            f"Recommendations: {len(recommendations_list)} | "
            f"Success: True"
        )
        
        return EnrichmentResponse(
            success=True,
            ticker=ticker.upper(),
            companyInfo=company_info,
            financials=financials,
            price=price,
            news=news_items,
            recommendations=recommendations_list,
            timestamp=datetime.now()
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is (they have proper status codes)
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Unexpected error enriching {ticker}: {error_msg}", exc_info=True)
        
        # Check if it's a JSON parsing error (common when rate limited)
        if "Expecting value" in error_msg or "JSONDecodeError" in str(type(e).__name__):
            raise HTTPException(
                status_code=429,
                detail=f"Yahoo Finance rate limit exceeded or service unavailable. Please try again later. Ticker: {ticker}"
            )
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data for {ticker}. The ticker may be invalid or Yahoo Finance is unavailable."
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
