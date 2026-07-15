"""
MarketWhisper - Company Enrichment Service
FastAPI microservice that fetches public financial data from Finnhub
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import finnhub
import os
from datetime import datetime, timedelta
import logging
import urllib3
import time

# Disable SSL warnings for corporate proxy with self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Finnhub API client (initialized if API key is set)
FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
finnhub_client = None
if FINNHUB_API_KEY:
    finnhub_client = finnhub.Client(api_key=FINNHUB_API_KEY)
    logger.info("Finnhub client initialized")
else:
    logger.warning("FINNHUB_API_KEY not set - Finnhub endpoints will return 503")

app = FastAPI(
    title="MarketWhisper Enrichment Service",
    description="Fetches public financial data from Finnhub",
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
    bookValuePerShare: Optional[float] = None  # For Graham Number valuation
    roe: Optional[float] = None  # Return on Equity
    epsGrowth: Optional[float] = None  # EPS growth rate

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
    summary: Optional[str] = None
    publisher: Optional[str] = None
    link: Optional[str] = None
    publishedAt: Optional[datetime] = None
    image: Optional[str] = None

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

class SearchResult(BaseModel):
    """Single search result from Finnhub symbol lookup"""
    symbol: str
    description: str
    displaySymbol: str
    type: str

class SearchResponse(BaseModel):
    """Search response with results"""
    success: bool
    query: str
    count: int
    results: List[SearchResult]
    timestamp: datetime

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "enrichment",
        "timestamp": datetime.now().isoformat(),
        "providers": {
            "finnhub": finnhub_client is not None
        }
    }


@app.get("/api/search-finnhub", response_model=SearchResponse)
async def search_companies_finnhub(q: str):
    """
    Search for companies using Finnhub symbol lookup
    
    Args:
        q: Search query (company name or ticker symbol)
    
    Returns:
        SearchResponse with matching companies
    """
    if not finnhub_client:
        raise HTTPException(
            status_code=503,
            detail="Finnhub service unavailable. FINNHUB_API_KEY not configured."
        )
    
    if not q or not q.strip():
        raise HTTPException(
            status_code=400,
            detail="Search query 'q' parameter is required and cannot be empty."
        )
    
    try:
        query = q.strip()
        logger.info(f"[FINNHUB SEARCH] Query: {query}")
        
        # Call Finnhub symbol_lookup
        response = finnhub_client.symbol_lookup(query)
        
        if not response or 'result' not in response:
            logger.warning(f"[FINNHUB SEARCH] No results for query: {query}")
            return SearchResponse(
                success=True,
                query=query,
                count=0,
                results=[],
                timestamp=datetime.now()
            )
        
        # Map Finnhub results to our schema
        results = []
        for item in response.get('result', []):
            results.append(SearchResult(
                symbol=item.get('symbol', ''),
                description=item.get('description', ''),
                displaySymbol=item.get('displaySymbol', item.get('symbol', '')),
                type=item.get('type', '')
            ))
        
        logger.info(f"[FINNHUB SEARCH] Found {len(results)} results for: {query}")
        
        return SearchResponse(
            success=True,
            query=query,
            count=len(results),
            results=results,
            timestamp=datetime.now()
        )
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[FINNHUB SEARCH] Error searching for '{q}': {error_msg}")
        if "429" in error_msg or "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Finnhub rate limit exceeded. Please try again later."
            )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to search companies in Finnhub. Error: {error_msg}"
        )


@app.get("/api/enrich-finnhub/{ticker}", response_model=EnrichmentResponse)
async def enrich_company_finnhub(ticker: str):
    """
    Fetch comprehensive public data for a company from Finnhub
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
    
    Returns:
        EnrichmentResponse with company info, financials (from metrics), and price data
    """
    if not finnhub_client:
        raise HTTPException(
            status_code=503,
            detail="Finnhub service unavailable. FINNHUB_API_KEY not configured."
        )
    
    start_time = time.time()
    logger.info(f"[FINNHUB START] Ticker: {ticker} | Time: {datetime.now().isoformat()}")
    
    try:
        ticker_upper = ticker.upper()
        
        # 1. Fetch company profile
        try:
            profile = finnhub_client.company_profile2(symbol=ticker_upper)
            if not profile or 'name' not in profile:
                raise HTTPException(
                    status_code=404,
                    detail=f"Ticker {ticker} not found in Finnhub. Please verify the ticker symbol."
                )
            logger.info(f"[FINNHUB] Profile fetched for {ticker_upper}")
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[FINNHUB] Profile fetch failed for {ticker}: {error_msg}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail=f"Finnhub rate limit exceeded. Please try again later."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch profile from Finnhub for {ticker}. Error: {error_msg}"
            )
        
        # 2. Fetch basic financial metrics
        try:
            metrics = finnhub_client.company_basic_financials(ticker_upper, 'all')
            metric_data = metrics.get('metric', {}) if metrics else {}
            logger.info(f"[FINNHUB] Metrics fetched for {ticker_upper}: {len(metric_data)} data points")
        except Exception as e:
            logger.warning(f"[FINNHUB] Metrics fetch failed for {ticker}: {e}")
            metric_data = {}
        
        # 3. Fetch analyst recommendation trends
        try:
            rec_trends = finnhub_client.recommendation_trends(ticker_upper)
            recommendations = [
                Recommendation(
                    period=r.get('period', ''),
                    strongBuy=r.get('strongBuy', 0),
                    buy=r.get('buy', 0),
                    hold=r.get('hold', 0),
                    sell=r.get('sell', 0),
                    strongSell=r.get('strongSell', 0),
                )
                for r in (rec_trends or [])
            ]
            logger.info(f"[FINNHUB] Recommendation trends fetched for {ticker_upper}: {len(recommendations)} periods")
        except Exception as e:
            logger.warning(f"[FINNHUB] Recommendation trends fetch failed for {ticker}: {e}")
            recommendations = []
        
        # Extract company info
        company_info = CompanyInfo(
            ticker=ticker_upper,
            name=profile.get('name'),
            sector=profile.get('finnhubIndustry'),  # Finnhub uses 'finnhubIndustry'
            industry=profile.get('finnhubIndustry'),
            description=None,  # Finnhub profile2 doesn't include description
            website=profile.get('weburl'),
            employees=None,  # Not available in profile2
            marketCap=int(profile.get('marketCapitalization', 0) * 1e6) if profile.get('marketCapitalization') else None
        )
        
        # Extract financial metrics (map Finnhub fields to our schema)
        financials = FinancialMetrics(
            revenue=None,  # Not directly available in basic metrics
            netIncome=None,  # Not directly available in basic metrics
            eps=metric_data.get('epsBasic'),  # Basic EPS
            peRatio=metric_data.get('peBasicExclExtraTTM'),  # P/E ratio trailing 12 months
            debtToEquity=metric_data.get('totalDebt/totalEquityQuarterly'),  # Debt to equity ratio
            dividendYield=metric_data.get('dividendYieldIndicatedAnnual'),
            profitMargins=metric_data.get('netProfitMarginTTM'),  # Net profit margin TTM
            bookValuePerShare=metric_data.get('bookValuePerShareAnnual'),  # Book value per share
            roe=metric_data.get('roeTTM'),  # Return on equity TTM
            epsGrowth=metric_data.get('epsGrowthTTMYoy')  # EPS growth year-over-year
        )
        
        # Extract price data (use 52-week high/low from metrics)
        price = PriceData(
            currentPrice=None,  # Would need quote endpoint (not requested)
            previousClose=None,
            dayChange=None,
            dayChangePercent=None,
            fiftyTwoWeekHigh=metric_data.get('52WeekHigh'),
            fiftyTwoWeekLow=metric_data.get('52WeekLow'),
            volume=None,
            avgVolume=None
        )
        
        total_elapsed = time.time() - start_time
        logger.info(
            f"[FINNHUB COMPLETE] {ticker_upper} | "
            f"Total time: {total_elapsed:.2f}s | "
            f"Success: True"
        )
        
        return EnrichmentResponse(
            success=True,
            ticker=ticker_upper,
            companyInfo=company_info,
            financials=financials,
            price=price,
            news=[],  # News not requested
            recommendations=recommendations,
            timestamp=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[FINNHUB] Unexpected error enriching {ticker}: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch data from Finnhub for {ticker}. Error: {error_msg}"
        )


@app.get("/api/news-finnhub/{ticker}")
async def get_company_news_finnhub(ticker: str, days: int = 7):
    """
    Fetch recent news for a company from Finnhub
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
        days: Number of days to look back (default: 7, max: 365)
    
    Returns:
        List of news articles with title, summary, source, url, publishedAt
    """
    if not finnhub_client:
        raise HTTPException(
            status_code=503,
            detail="Finnhub service unavailable. FINNHUB_API_KEY not configured."
        )
    
    # Validate days parameter
    if days < 1 or days > 365:
        raise HTTPException(
            status_code=400,
            detail="Days parameter must be between 1 and 365."
        )
    
    start_time = time.time()
    logger.info(f"[FINNHUB NEWS START] Ticker: {ticker} | Days: {days} | Time: {datetime.now().isoformat()}")
    
    try:
        ticker_upper = ticker.upper()
        
        # Calculate date range (Finnhub expects YYYY-MM-DD format)
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days)
        
        to_str = to_date.strftime('%Y-%m-%d')
        from_str = from_date.strftime('%Y-%m-%d')
        
        logger.info(f"[FINNHUB NEWS] Fetching news for {ticker_upper} from {from_str} to {to_str}")
        
        # Call Finnhub company_news
        try:
            news_data = finnhub_client.company_news(ticker_upper, _from=from_str, to=to_str)
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[FINNHUB NEWS] API call failed for {ticker}: {error_msg}")
            if "429" in error_msg or "rate limit" in error_msg.lower():
                raise HTTPException(
                    status_code=429,
                    detail="Finnhub rate limit exceeded. Please try again later."
                )
            raise HTTPException(
                status_code=500,
                detail=f"Failed to fetch news from Finnhub for {ticker}. Error: {error_msg}"
            )
        
        # Map Finnhub response to NewsItem schema
        news_items = []
        for item in (news_data or []):
            news_items.append(NewsItem(
                title=item.get('headline', ''),
                summary=item.get('summary', ''),
                publisher=item.get('source', ''),
                link=item.get('url', ''),
                publishedAt=datetime.fromtimestamp(item.get('datetime', 0)) if item.get('datetime') else None,
                image=item.get('image', '')
            ))
        
        total_elapsed = time.time() - start_time
        logger.info(
            f"[FINNHUB NEWS COMPLETE] {ticker_upper} | "
            f"Articles: {len(news_items)} | "
            f"Total time: {total_elapsed:.2f}s"
        )
        
        return {
            "success": True,
            "ticker": ticker_upper,
            "news": news_items,
            "count": len(news_items),
            "fromDate": from_str,
            "toDate": to_str,
            "timestamp": datetime.now()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        logger.error(f"[FINNHUB NEWS] Unexpected error for {ticker}: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch news for {ticker}. Error: {error_msg}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
