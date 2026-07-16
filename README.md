# 📈 MarketWhisper

> **AI-Powered Market Intelligence Platform**  
> Analyze financial texts with AI to detect companies, sentiment, and reliability scores. Track market intelligence in real-time with local AI processing.

[![CI](https://github.com/IvanAbadLopez/marketwhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanAbadLopez/marketwhisper/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Project Overview

**MarketWhisper** is a Master's Thesis (TFM) project that provides AI-powered market intelligence analysis. Simply paste any financial text (news articles, tweets, analyst reports), and get instant AI-powered analysis with company detection, sentiment scoring, and reliability assessment.

### Key Features

- 🤖 **Local AI Analysis**: Paste any financial text and get instant analysis using Ollama (qwen2.5:7b) - 100% local, zero API costs
- 🏢 **Multi-Company Detection**: Automatically detects and analyzes multiple companies in a single text
- 📊 **Sentiment Tracking**: BULLISH, BEARISH, or NEUTRAL sentiment for each company mentioned
- 🎯 **Reliability Scoring**: AI confidence scores (1-10) for each analysis with detailed reasoning
- 📈 **Aggregated Metrics**: Track average sentiment and reliability over time per company
- 💼 **Company Enrichment**: Fetch live financial data, news, and analyst recommendations via Finnhub API
- 🎯 **Global Investment Score**: 0-100 score combining fundamentals, technicals, sentiment, and analyst data
- 💰 **Target Price Calculation**: AI-computed fair value using Graham Number, P/E ratio, and sentiment adjustment
- 🔍 **Company Dashboard**: View all analyses, sentiment trends, enrichment data, and insights per ticker
- ⚙️ **Job Queue System**: Background processing with real-time status, progress tracking, and cancellation support
- 🐳 **Full Docker Stack**: PostgreSQL + Next.js + Ollama ready to deploy
- 🔐 **Secure Authentication**: Email/password + GitHub/Google OAuth with NextAuth.js

#### Multi-Company Analysis Example

Input this text:
```
Apple stock rose 5% on strong iPhone sales while Microsoft fell 2% 
due to cloud growth concerns. Tesla announced record deliveries.
```

Output:
- ✅ **AAPL** - BULLISH (8/10) - "Strong iPhone sales indicate positive earnings potential"
- ⚠️ **MSFT** - BEARISH (7/10) - "Cloud growth concerns suggest near-term headwinds"
- ✅ **TSLA** - BULLISH (8/10) - "Record deliveries demonstrate strong demand and execution"

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript (strict mode) |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | NextAuth.js v5 (JWT + DB sessions) |
| **Database** | PostgreSQL 16 + Prisma 7 ORM + pgvector |
| **AI/ML** | Ollama (qwen2.5:7b) - Local LLM |
| **Financial Data** | Finnhub API (real-time quotes, news, analyst data) |
| **Charts** | Recharts + lightweight-charts |
| **Deployment** | Docker Compose (local), Vercel-ready (production) |
| **Testing** | Vitest + Playwright + Testing Library (229 tests) |
| **CI/CD** | GitHub Actions |

---

## 🚀 Getting Started

### 🐳 Quick Start with Docker (Recommended)

**The easiest way to run MarketWhisper is using Docker:**

```bash
# Clone the repository
git clone https://github.com/IvanAbadLopez/marketwhisper.git
cd marketwhisper

# Create .env file (optional - only needed for Finnhub features)
cp .env.example .env
# Edit .env and add your Finnhub API key (get free key at https://finnhub.io/register)

# Start the application
docker compose up
```

🎉 **That's it!** Open http://localhost:3000 in your browser.

**Demo credentials:**
- Email: `demo@marketwhisper.com`
- Password: `MarketWhisper2026!`

**First login - explore with pre-seeded companies:**
1. Browse the 3 pre-seeded companies (AAPL, MSFT, GOOGL)
2. View company details and metrics

**Optional features** (set up after first login):

📊 **Company Search & Enrichment** (requires Finnhub API key)
- Get a free key at https://finnhub.io/register
- Add to `.env`: `FINNHUB_API_KEY="your_key_here"`
- Restart: `docker compose restart web`

🤖 **AI Text Analysis** (requires Ollama model ~5GB)
Download the model when you want to use the "Analyze Text" feature:
```bash
docker exec marketwhisper-ollama ollama pull llama3.1:8b
```
This downloads the AI model (~5GB). Then you can paste financial text and get AI-powered sentiment analysis.

For detailed Docker instructions, see [docs/docker.md](docs/docker.md)

---

### 💻 Development Workflow

For active development, you have two options:

#### Option 1: Docker Compose (Recommended)

```bash
# Start PostgreSQL + Next.js dev server
docker compose up

# In another terminal, watch for changes
docker compose exec web npm run dev
```

#### Option 2: Local Dev Server + Docker PostgreSQL

```bash
# Start only the database
docker compose up db

# In another terminal, run Next.js locally
npm run dev
```

#### Prerequisites for Local Development

- Node.js 20+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- Docker Desktop (for PostgreSQL database)

#### Installation

```bash
# Clone the repository
git clone https://github.com/IvanAbadLopez/marketwhisper.git
cd marketwhisper

# Install Node.js dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

#### Configuration for Local Development

If running `npm run dev` locally (not in Docker), create `.env.local`:

```env
# Database (connects to Docker PostgreSQL)
DATABASE_URL="postgresql://marketwhisper:marketwhisper_dev_2026@localhost:5432/marketwhisper"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="docker-dev-secret-change-in-production-please"

# Optional: AI API (or use local models)
# No AI API keys needed - Ollama runs locally!

# Optional: Financial data API
FINNHUB_API_KEY=""
```

#### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### Development

```bash
# Start Next.js dev server
npm run dev

# Run linter
npm run lint

# Type check
npx tsc --noEmit

# Build for production
npm run build
```

### Testing

MarketWhisper includes comprehensive testing with Vitest and Playwright.

```bash
# Unit & Integration tests
npm test              # Watch mode
npm test -- --run     # Single run
npm run test:ui       # Interactive UI
npm run test:coverage # With coverage

# E2E tests
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Interactive mode
npm run test:e2e:report    # View HTML report
```

See [docs/testing.md](docs/testing.md) for detailed testing documentation.

---

## � Security

### Continuous Security Monitoring

This project uses automated security checks:

- **npm audit**: Runs on every push/PR, fails CI on high/critical vulnerabilities
- **Dependabot**: Automatically creates PRs for vulnerable dependencies (weekly)
- **Rate limiting**: All public endpoints are rate-limited (see [Security Audit](docs/security-audit.md))
- **Input validation**: Robust validation on all user inputs (email, passwords, text)

### Running Security Checks Locally

```bash
# Check for vulnerable dependencies
npm audit --audit-level=high

# Fix automatically (if possible)
npm audit fix

# Fix with breaking changes (use caution)
npm audit fix --force
```

### Reporting Security Issues

If you discover a security vulnerability, please email ivan_abad_lopez@hotmail.com or open a confidential GitHub Security Advisory. **Do not open a public issue.**

---

## �📁 Project Structure

```
marketwhisper/
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # 📚 Documentation
│   ├── testing.md        # Testing guide
│   ├── docker.md         # Docker deployment
│   └── finnhub-integration.md
├── prisma/              # Database schema + migrations
├── public/              # Static assets
├── scripts/             # Utilities
│   ├── seed_companies.py  # Seed companies table
│   ├── check_user.ts      # User verification tool
│   ├── clean-tickers.sql  # SQL cleanup utilities
│   └── seed-demo.js       # Docker entrypoint seeding
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # Login/Register pages
│   │   ├── api/         # API routes
│   │   ├── analyze/     # Text analysis page
│   │   ├── companies/   # Company pages
│   │   ├── situations/  # Company list page
│   │   ├── jobs/        # Job queue page
│   │   ├── news/        # News viewer
│   │   └── layout.tsx   # Root layout
│   ├── entities/        # Business entities (FSD)
│   ├── features/        # Business features (FSD)
│   ├── widgets/         # UI widgets (FSD)
│   ├── shared/          # Shared utilities (FSD)
│   └── types/           # TypeScript types
└── copilot-instructions.md  # Detailed technical guide
```

---

## 🗄️ Database Schema

### Core Models

- **User**: Authentication and profile
- **Job**: Background processing tracking (ANALYSIS | ENRICHMENT)
- **Company**: Stock tickers, metadata, aggregated scores, valuation
- **Analysis**: User text analysis with sentiment, reliability, reasoning
- **CompanyEnrichment**: Finnhub data + AI-generated insights
- **Account/Session**: NextAuth.js tables

See [prisma/schema.prisma](prisma/schema.prisma) for full schema.

---

## 🤖 How It Works

1. **User Input**: Paste financial text in the "Analyze Text" form
2. **AI Analysis**: Ollama (local LLM) analyzes the text to detect:
   - Companies mentioned (ticker detection)
   - Sentiment for each company (BULLISH/BEARISH/NEUTRAL)
   - Reliability score (1-10)
   - Reasoning for the analysis
3. **Storage**: Each company analysis saved to PostgreSQL
4. **Aggregation**: Weighted averages calculated per company
5. **Visualization**: Company cards show sentiment/reliability thermometers

---

## 📊 Current Status

**✅ Completed**
- [x] Next.js 16 project setup with App Router
- [x] Authentication (NextAuth.js v5 - Email, Google, GitHub)
- [x] PostgreSQL database with Prisma 7
- [x] AI text analysis with Ollama (local)
- [x] Multi-company detection
- [x] Sentiment and reliability scoring
- [x] Company-centric UI with aggregated metrics
- [x] Search functionality
- [x] Docker deployment
- [x] Testing suite (19 unit + 7 E2E tests)
- [x] GitHub Actions CI/CD

**📅 Future Enhancements**
- [ ] Historical trend charts
- [ ] Semantic search across analyses
- [ ] Enhanced AI chat interface
- [ ] Export functionality (CSV, PDF reports)
- [ ] Real-time collaboration features

---

## 📚 Documentation

- [Testing Guide](docs/testing.md) - Unit and E2E testing
- [Docker Deployment](docs/docker.md) - Container setup
- [Multi-Company Analysis](docs/multi-company-analysis.md) - Feature documentation
- [Copilot Instructions](copilot-instructions.md) - Technical implementation guide

---

## 📝 License

This project is part of a Master's Thesis and is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Ivan Abad López**  
GitHub: [@IvanAbadLopez](https://github.com/IvanAbadLopez)

---

## 📚 Additional Resources

- [copilot-instructions.md](copilot-instructions.md) - Detailed technical documentation for developers
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI Whisper](https://github.com/openai/whisper)

---

**Last Updated**: July 2026  
**Status**: Active Development 🚀
