# 📈 MarketWhisper

> **AI-Powered Market Intelligence Platform**  
> Analyze financial texts with AI to detect companies, sentiment, and reliability scores. Track market intelligence in real-time.

[![CI](https://github.com/IvanAbadLopez/marketwhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanAbadLopez/marketwhisper/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Project Overview

**MarketWhisper** is a Master's Thesis (TFM) project that provides AI-powered market intelligence analysis through direct text input and AI analysis.

### Key Features

- 🤖 **AI Text Analysis**: Paste any financial text (news, tweets, articles) and get instant AI-powered analysis
- 🏢 **Multi-Company Detection**: Automatically detects and analyzes multiple companies in a single text
- 📊 **Sentiment Tracking**: BULLISH, BEARISH, or NEUTRAL sentiment for each company mentioned
- 🎯 **Reliability Scoring**: AI confidence scores (1-10) for each analysis
- 📈 **Aggregated Metrics**: Track average sentiment and reliability over time per company
- 🔍 **Company Dashboard**: View all analyses, sentiment trends, and insights per ticker
- 💬 **Local AI**: Uses Gemini AI for analysis (configurable, no external API costs)
- 🐳 **Full Docker Stack**: PostgreSQL + Next.js ready to deploy
- 🔐 **Multi-Auth**: Email/password, Google, GitHub authentication

#### Multi-Company Analysis Example

Input this text:
```
Apple stock rose 5% on strong iPhone sales while Microsoft fell 2% 
due to cloud growth concerns. Tesla announced record deliveries.
```

Output:
- ✅ **AAPL** - BULLISH (8/10) - "Strong iPhone sales indicate positive earnings"
- ⚠️ **MSFT** - BEARISH (7/10) - "Cloud growth concerns suggest potential issues"
- ✅ **TSLA** - BULLISH (8/10) - "Record deliveries show strong demand"

See [docs/multi-company-analysis.md](docs/multi-company-analysis.md) for detailed documentation.

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | NextAuth.js v5 (JWT) |
| **Database** | PostgreSQL 16 + Prisma 7 ORM + pgvector |
| **AI/ML** | Google Gemini AI (flash-latest) |
| **Deployment** | Docker Compose |
| **Testing** | Vitest + Playwright + Testing Library |
| **CI/CD** | GitHub Actions |

---

## 🚀 Getting Started

### 🐳 Quick Start with Docker (Recommended)

**The easiest way to run MarketWhisper is using Docker:**

```bash
# Clone the repository
git clone https://github.com/IvanAbadLopez/marketwhisper.git
cd marketwhisper

# Start the application
docker compose up
```

🎉 **That's it!** Open http://localhost:3000 in your browser.

**Demo credentials:**
- Email: `demo@marketwhisper.com`
- Password: `MarketWhisper2026!`

**First steps after login:**
1. Click "Analyze Text" button in the header
2. Paste any financial text (e.g., news about AAPL, MSFT, etc.)
3. View results showing detected companies with sentiment and reliability
4. Navigate to companies page to see aggregated analysis

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

# Optional: OAuth providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Optional: AI API (or use local models)
GEMINI_API_KEY=""

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

## 📁 Project Structure

```
marketwhisper/
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # 📚 Documentation
│   ├── testing.md        # Testing guide
│   ├── docker.md         # Docker deployment
│   └── multi-company-analysis.md
├── prisma/              # Database schema
├── public/              # Static assets
├── scripts/             # Database utilities
│   ├── legacy/          # Archived scripts (old scraping approach)
│   ├── seed_companies.py
│   ├── seed_content.py
│   └── clean_content.py
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # Login/Register pages
│   │   ├── api/         # API routes
│   │   ├── companies/   # Company pages
│   │   ├── chat/        # AI chat interface
│   │   └── layout.tsx   # Root layout
│   ├── components/      # React components
│   ├── lib/             # Utilities (auth, prisma, gemini)
│   └── types/           # TypeScript types
└── copilot-instructions.md  # Detailed technical guide
```

---

## 🗄️ Database Schema

### Core Models

- **User**: Authentication and profile
- **Company**: Stock tickers, metadata, aggregated scores
- **Analysis**: AI-generated analysis with sentiment and reliability
- **Content**: Legacy content model (preserved for future use)
- **Account/Session**: NextAuth.js tables

See [prisma/schema.prisma](prisma/schema.prisma) for full schema.

---

## 🤖 How It Works

1. **User Input**: Paste financial text in the "Analyze Text" form
2. **AI Analysis**: Gemini AI analyzes the text to detect:
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
- [x] AI text analysis with Gemini
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
