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

# Disable SSL warnings for corporate proxy with self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.get("/api/enrich/{ticker}", response_model=EnrichmentResponse)
async def enrich_company(ticker: str):
    """
    Fetch comprehensive public data for a company from Yahoo Finance
    
    Args:
        ticker: Stock ticker symbol (e.g., AAPL, MSFT, GOOGL)
    
    Returns:
        EnrichmentResponse with company info, financials, price, news, and recommendations
    """
    logger.info(f"Enriching company: {ticker}")
    
    try:
        # Fetch data from yfinance
        # Disable SSL verification for corporate proxy
        import requests
        session = requests.Session()
        session.verify = False
        
        stock = yf.Ticker(ticker.upper(), session=session)
        info = stock.info
        
        # Check if ticker is valid
        if not info or 'symbol' not in info:
            raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
        
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
        raise
    except Exception as e:
        logger.error(f"Error enriching {ticker}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch data for {ticker}: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
