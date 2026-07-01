# 📈 MarketWhisper

> **AI-Powered Market Intelligence Dashboard**  
> Transform proprietary financial blog content into actionable insights using AI transcription, web scraping, and RAG technology.

[![CI](https://github.com/IvanAbadLopez/marketwhisper/actions/workflows/ci.yml/badge.svg)](https://github.com/IvanAbadLopez/marketwhisper/actions)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🎯 Project Overview

**MarketWhisper** is a Master's Thesis (TFM) project that leverages exclusive access to daily financial analysis videos and special situations blog content to provide personalized market intelligence through AI-powered processing and analysis.

### Key Features (Planned)

- 🎥 **Automated Video Processing**: Download and transcribe daily analysis videos using OpenAI Whisper
- 📰 **Content Scraping**: Extract special situations articles (mergers, spinoffs, bankruptcies, etc.)
- 🤖 **AI-Powered Insights**: RAG (Retrieval-Augmented Generation) with Google Gemini API
- 🔍 **Semantic Search**: Natural language queries across all processed content using pgvector
- 📊 **Sentiment Analysis**: Track bullish/bearish mentions of stocks over time
- 💬 **AI Chat Interface**: Ask questions about market trends with context-aware responses
- 📈 **Interactive Charts**: Visualize trends and insights with Recharts

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | NextAuth.js v5 (JWT) |
| **Database** | Neon PostgreSQL + Prisma ORM |
| **AI/ML** | OpenAI Whisper (local) + Google Gemini API |
| **Scraping** | Playwright (Python) |
| **Deployment** | Vercel |
| **CI/CD** | GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ (recommended via [nvm](https://github.com/nvm-sh/nvm))
- Python 3.10+ (for scraping scripts)
- NVIDIA GPU (optional, for faster Whisper transcription)
- PostgreSQL database (or Neon account)

### Installation

```bash
# Clone the repository
git clone git@github.com:IvanAbadLopez/marketwhisper.git
cd marketwhisper

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install playwright whisper torch

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Configuration

Create `.env.local` with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# AI
GEMINI_API_KEY=""

# Blog credentials (for scraping)
BLOG_USERNAME=""
BLOG_PASSWORD=""
```

### Database Setup

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

See [TESTING.md](TESTING.md) for detailed testing documentation.

Visit [http://localhost:3000](http://localhost:3000) to see the app.

**Demo Login**:
- Email: `demo@marketwhisper.com`
- Password: `demo1234`

---

## 📁 Project Structure

```
marketwhisper/
├── .github/workflows/    # CI/CD pipelines
├── prisma/              # Database schema
├── public/              # Static assets
├── scripts/             # Python scraping/transcription
│   ├── download_video.py
│   ├── download_situations.py
│   ├── transcribe.py
│   └── sync_all.py
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── (auth)/      # Login/Register pages
│   │   ├── api/         # API routes
│   │   └── layout.tsx   # Root layout
│   ├── components/      # React components
│   └── lib/             # Utilities (auth, prisma, etc.)
└── copilot-instructions.md  # Detailed technical guide
```

---

## 🗄️ Database Schema

### Core Models

- **User**: Authentication and profile
- **Video**: Daily analysis videos with metadata
- **Transcript**: Whisper-generated transcriptions
- **Mention**: Stock/company mentions with sentiment
- **SpecialSituation**: Blog articles (mergers, spinoffs, etc.)

See [prisma/schema.prisma](prisma/schema.prisma) for full schema.

---

## 🤖 Python Scripts

### Transcribe Video

```bash
cd scripts
python transcribe.py --video-path ../downloads/videos/video.mp4 --model base
```

**Available models**: `tiny`, `base`, `small`, `medium`, `large-v3`

### Run Full Sync

```bash
python sync_all.py
# Downloads videos → Transcribes → Updates database
```

---

## 📊 Current Status

**✅ Completed**
- [x] Next.js 16 project setup
- [x] Authentication (NextAuth.js v5)
- [x] Neon PostgreSQL database
- [x] Prisma 7 ORM with driver adapters
- [x] Login/Register pages
- [x] Middleware route protection
- [x] GitHub Actions CI/CD (lint + typecheck + test + build)
- [x] Testing suite (Vitest + Playwright)
- [x] Python scripts structure
- [x] Layout & navigation (sidebar, sync button)
**🚧 In Progress**
- [ ] Neon database connection
- [ ] Layout & navigation
- [ ] Sync API with SSE
- [ ] Video/Situations pages

**📅 Planned**
- [ ] Semantic search
- [ ] AI chat interface
- [ ] Insights dashboard
- [ ] Deployment to Vercel

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
