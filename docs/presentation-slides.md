# 📊 MarketWhisper - Presentation Slides Content

> **Instructions**: Use this content to create your slides in Google Slides, PowerPoint, or Canva.  
> **Target**: 12-15 slides, ~10-15 minutes presentation

---

## Slide 1: Title Slide

**MarketWhisper**  
*AI-Powered Market Intelligence Platform*

- Master's Thesis Project (TFM)
- Ivan Abad López
- July 2026

**Live Demo**: https://marketwhisper.vercel.app

---

## Slide 2: The Problem

### 📰 Information Overload in Financial Markets

- Thousands of news articles, tweets, reports daily
- Manual analysis is slow and prone to bias
- Hard to track sentiment across multiple companies
- Difficult to aggregate insights over time

**💡 Solution Needed**: Automated AI analysis + sentiment tracking

---

## Slide 3: What is MarketWhisper?

### AI-Powered Market Intelligence Platform

**Core Functionality**:
- 📝 Paste any financial text (news, tweets, reports)
- 🤖 AI analyzes and detects companies mentioned
- 📊 Get sentiment scores (BULLISH/BEARISH/NEUTRAL)
- 🎯 Track reliability and aggregate metrics
- 💼 Enrich with real-time financial data
- 📈 Calculate investment scores & target prices

**Target Users**: Investors, analysts, traders, financial professionals

---

## Slide 4: Key Features

### 🎯 Core Capabilities

1. **Multi-Company Detection** - Analyze text mentioning multiple companies at once
2. **Sentiment Analysis** - BULLISH, BEARISH, or NEUTRAL with AI reasoning
3. **Reliability Scoring** - Confidence level (1-10) for each analysis
4. **Company Dashboard** - Aggregated metrics, trends, enrichment data
5. **Financial Enrichment** - Live data from Finnhub (quotes, news, recommendations)
6. **Global Investment Score** - 0-100 score combining multiple factors
7. **Background Job Queue** - Real-time processing with progress tracking

---

## Slide 5: Demo - Multi-Company Analysis

### Example Input:
```
Apple stock rose 5% on strong iPhone sales while Microsoft 
fell 2% due to cloud growth concerns. Tesla announced 
record deliveries exceeding analyst expectations.
```

### AI Output:
- ✅ **AAPL** - BULLISH (8/10)  
  *"Strong iPhone sales indicate positive earnings potential"*

- ⚠️ **MSFT** - BEARISH (7/10)  
  *"Cloud growth concerns suggest near-term headwinds"*

- ✅ **TSLA** - BULLISH (9/10)  
  *"Record deliveries demonstrate strong demand"*

---

## Slide 6: Architecture Overview

### 🏗️ Technology Stack

**Frontend**
- Next.js 16 (App Router) + React 19
- TypeScript (strict mode)
- Tailwind CSS 4 + shadcn/ui

**Backend**
- Next.js API Routes
- PostgreSQL 16 + Prisma ORM
- NextAuth.js v5 (authentication)

**AI & Data**
- Groq API (llama-3.3-70b-versatile)
- Finnhub API (financial data)

**Deployment**
- Vercel (serverless)
- Neon PostgreSQL (serverless DB)
- $0/month (all free tiers!)

---

## Slide 7: Database Schema

### 🗄️ Core Data Models

**5 Main Tables**:

1. **User** - Authentication and profiles
2. **Company** - Tickers, aggregated scores, valuation
3. **Analysis** - User text analysis with sentiment/reasoning
4. **CompanyEnrichment** - Finnhub data + AI insights
5. **Job** - Background task processing & status

**Key Relationships**:
- User 1:N Analysis
- Company 1:N Analysis
- Company 1:1 CompanyEnrichment (latest)
- User 1:N Job

---

## Slide 8: AI Analysis Pipeline

### 🤖 How It Works (Step-by-Step)

1. **User Input** → Paste financial text in form

2. **Company Detection** → AI identifies tickers (AAPL, MSFT, etc.)

3. **Sentiment Analysis** → For each company:
   - Classify: BULLISH / BEARISH / NEUTRAL
   - Score: Reliability 1-10
   - Generate: Detailed reasoning

4. **Data Storage** → Save to PostgreSQL

5. **Aggregation** → Calculate weighted averages per company

6. **Visualization** → Display cards with metrics

**Speed**: ~2-5 seconds with Groq API (70B parameter model)

---

## Slide 9: Company Enrichment

### 💼 Real-Time Financial Data

**Finnhub API Integration**:

✅ **Profile Data**
- Company name, logo, industry, sector
- Market cap, shares outstanding

✅ **Market Metrics**
- Current price, daily change
- 52-week high/low
- Beta, P/E ratio

✅ **News Feed**
- Latest headlines with sentiment

✅ **Analyst Recommendations**
- Buy/Hold/Sell ratings
- Price targets

**AI Enhancement**: Groq generates summary + investment insights

---

## Slide 10: Global Investment Score

### 🎯 Comprehensive Company Evaluation (0-100)

**Formula** (weighted average):

- **40%** - Fundamental Score
  - Market cap, revenue growth
  - Profit margins, debt levels

- **30%** - Technical Score
  - Price momentum, volatility
  - Relative strength

- **20%** - Sentiment Score
  - Aggregated AI analysis
  - News sentiment

- **10%** - Analyst Score
  - Recommendations distribution

**Output**: Single actionable score + color-coded visualization

---

## Slide 11: User Interface Highlights

### 📱 Modern, Responsive Design

**Key Pages**:

1. **Analyze Text** - Simple form for instant analysis
2. **Companies List** - All tracked companies with scores
3. **Company Detail** - Deep dive with charts & insights
4. **Job Queue** - Real-time processing status
5. **Discover** - Search & add new companies

**Features**:
- 🌙 Dark/Light mode
- 📱 Mobile-responsive
- ⚡ Real-time updates
- 🔒 Secure authentication

---

## Slide 12: Testing & Quality

### 🧪 Comprehensive Test Coverage

**Unit Tests** (Vitest)
- 233 passing tests
- Business logic, utilities, components
- API route handlers

**E2E Tests** (Playwright)
- Authentication flows
- Analysis workflows
- Multi-company scenarios
- Performance benchmarks

**CI/CD**
- GitHub Actions (automated testing)
- Security audit (npm audit)
- Dependabot (vulnerability monitoring)

---

## Slide 13: Security Features

### 🔒 Production-Ready Security

**Implemented OWASP Top 10 Protections**:

✅ **Rate Limiting** - Prevent abuse (login, analyze, API calls)
✅ **Input Validation** - Robust email/password/text validation
✅ **Security Headers** - CSP, HSTS, X-Frame-Options, etc.
✅ **Anti-Enumeration** - Timing-safe authentication
✅ **Error Handling** - Safe error messages (no leaks)
✅ **Prompt Hardening** - Injection protection for AI prompts
✅ **Dependency Scanning** - Automated security audits

**Current Status**: 0 high/critical vulnerabilities

---

## Slide 14: Results & Impact

### 📊 What We've Built

**✅ Completed Features**:
- AI text analysis with multi-company detection
- Real-time financial data enrichment
- Company dashboard with aggregated metrics
- Background job processing system
- Secure authentication & authorization
- Production deployment (serverless)
- Comprehensive testing suite

**📈 Technical Achievements**:
- 233 unit tests passing
- Docker + Vercel deployment
- Feature-Sliced Design architecture
- Zero-cost production hosting

**🎯 Ready for**: Real-world usage by investors and analysts

---

## Slide 15: Future Enhancements

### 🚀 Potential Extensions

**Short-Term**:
- 📊 Historical trend charts (time-series sentiment)
- 🔍 Semantic search across analyses
- 📥 Export functionality (CSV, PDF reports)
- 📱 Mobile app (React Native)

**Long-Term**:
- 🤝 Real-time collaboration features
- 🔔 Price alerts & notifications
- 🤖 Enhanced AI chat interface
- 📈 Portfolio tracking & recommendations
- 🌍 Multi-language support

---

## Slide 16: Conclusions

### 🎓 Key Takeaways

**Technical**:
- Successfully integrated AI (Groq) for financial analysis
- Built scalable serverless architecture
- Implemented production-grade security
- Achieved comprehensive test coverage

**Business Value**:
- Automates tedious manual analysis
- Provides actionable investment insights
- Scales to handle multiple companies
- Zero operational costs (free tiers)

**Learning**:
- Full-stack Next.js development
- AI/LLM integration patterns
- Financial data APIs
- Modern DevOps practices

---

## Slide 17: Thank You

### Questions?

**Live Demo**: https://marketwhisper.vercel.app

**GitHub**: https://github.com/IvanAbadLopez/marketwhisper

**Demo Credentials**:
- Email: demo@marketwhisper.com
- Password: MarketWhisper2026!

**Contact**:
- Ivan Abad López
- GitHub: @IvanAbadLopez

---

## 📝 Notes for Presenter

### Tips for Each Slide:

**Slide 1-3**: Set context, explain problem space
**Slide 4-5**: Show core features, live demo if possible
**Slide 6-7**: Technical overview (adjust depth based on audience)
**Slide 8-10**: Deep dive into AI pipeline & scoring
**Slide 11**: Show UI screenshots/video
**Slide 12-13**: Emphasize quality & security
**Slide 14-16**: Results, future vision, conclusions
**Slide 17**: Q&A

### Recommended Visuals:

- Screenshots of the actual app (home, analyze, company detail)
- Architecture diagram (frontend → API → AI/DB)
- Database schema diagram
- Flow chart of analysis pipeline
- Example sentiment cards with colors
- Global score visualization
- Mobile responsive screenshots

### Demo Flow (if doing live demo):

1. Login with demo account
2. Navigate to "Analyze Text"
3. Paste example financial text (Apple, Microsoft, Tesla)
4. Submit and show job queue
5. Navigate to company detail page
6. Show enrichment data & global score
7. Highlight key features

### Time Management:

- Introduction: 2 min
- Problem & Solution: 2 min
- Features & Demo: 4 min
- Technical Deep Dive: 3 min
- Security & Testing: 2 min
- Results & Future: 2 min
- Q&A: 5 min

**Total**: ~20 minutes (adjust based on requirements)
