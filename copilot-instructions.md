# MarketWhisper - GitHub Copilot Instructions

## Project Overview

**MarketWhisper** is a Master's Thesis (TFM) project - a Market Intelligence Dashboard that processes proprietary financial blog content (daily analysis videos + special situations articles) using AI transcription, scraping, and RAG (Retrieval-Augmented Generation) to provide personalized market insights.

**Key Differentiator**: Leverages user's exclusive access to daily video analysis and special situations blog content that isn't publicly available elsewhere.

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 16.2.9 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20.20.2 (managed via nvm)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Icons**: Lucide React

### Authentication
- **Library**: NextAuth.js v5.0.0-beta.31
- **Strategy**: JWT (not database sessions)
- **Providers**: 
  - Credentials (email/password with bcrypt)
  - Google OAuth (not yet configured)
  - GitHub OAuth (not yet configured)
- **Current State**: Demo user mode (database not connected)
  - Email: `demo@marketwhisper.com`
  - Password: `demo1234`

### Database (Planned)
- **Provider**: Neon PostgreSQL (not yet configured)
- **ORM**: Prisma
- **Status**: Schema complete, Prisma Client not generated (`DATABASE_URL` not set)
- **Extensions**: pgvector (for embeddings/semantic search)

### AI & Processing
- **Transcription**: OpenAI Whisper (local, open-source, GPU-accelerated)
- **Scraping**: Playwright (Python scripts)
- **AI Model**: Google Gemini API (planned for RAG/insights)
- **Charts**: Recharts + lightweight-charts

### DevOps
- **VCS**: Git + GitHub (SSH configured, user: IvanAbadLopez)
- **CI/CD**: GitHub Actions (lint + type check + build on every push)
- **Deployment**: Vercel (planned)

## Project Structure

```
marketwhisper/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD pipeline (ESLint, TypeScript, Build)
├── prisma/
│   └── schema.prisma              # Database schema (User, Video, Transcript, etc.)
├── public/                        # Static assets
├── scripts/                       # Python automation scripts
│   ├── download_video.py          # Playwright: download daily analysis videos
│   ├── download_situations.py     # Playwright: scrape special situations blog
│   ├── transcribe.py              # Whisper: transcribe videos to text
│   └── sync_all.py                # Orchestrator: run all scrapers + transcription
├── src/
│   ├── app/
│   │   ├── (auth)/                # Auth route group (no layout)
│   │   │   ├── login/page.tsx     # Login page (credentials + social)
│   │   │   └── register/page.tsx  # Registration page
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── [...nextauth]/route.ts  # NextAuth API handler
│   │   │       └── register/route.ts       # User registration endpoint
│   │   ├── layout.tsx             # Root layout (SessionProvider)
│   │   ├── page.tsx               # Homepage (placeholder, needs redesign)
│   │   └── globals.css            # Global styles + CSS variables
│   ├── components/
│   │   └── ui/                    # shadcn/ui components (manually configured)
│   ├── lib/
│   │   ├── auth.ts                # NextAuth configuration
│   │   ├── prisma.ts              # Prisma client (disabled until DB connected)
│   │   └── utils.ts               # cn() utility for classnames
│   └── middleware.ts              # Route protection (Edge Runtime compatible)
├── .env.local                     # Local environment variables (gitignored)
├── .env.example                   # Environment variables template
├── .gitignore                     # Protects credentials, downloads, cookies, DB
└── components.json                # shadcn/ui configuration
```

## Database Schema (Prisma)

### Core Models

**User**
- id, email, name, image, password (bcrypt), emailVerified
- Relations: accounts, sessions, videos

**Video** (Daily analysis videos)
- id, url, title, uploadDate, status (enum), downloadPath, thumbnailUrl
- Relations: transcript, mentions
- Status: PENDING | DOWNLOADING | TRANSCRIBING | PROCESSING | COMPLETED | FAILED

**Transcript** (Whisper output)
- id, videoId, fullText, segments (JSON), processingDate
- Relations: video, mentions

**Mention** (Stocks/companies mentioned in transcripts)
- id, transcriptId, symbol, companyName, sentiment, confidence, mentionedAt
- Sentiment: BULLISH | BEARISH | NEUTRAL

**SpecialSituation** (Blog articles)
- id, title, url, situationType, status, publishDate, summary, content
- Types: MERGER | SPINOFF | BANKRUPTCY | RESTRUCTURING | SPECIAL_DIVIDEND | TENDER_OFFER | OTHER
- Status: ACTIVE | RESOLVED | MONITORING | ARCHIVED

## Architecture Decisions

### Why JWT instead of Database Sessions?
- Faster authentication (no DB roundtrip on every request)
- Easier to scale horizontally (stateless)
- Neon free tier has connection limits

### Why Whisper Local instead of Cloud API?
- User has NVIDIA GPU for acceleration
- Videos are proprietary content (privacy concern)
- Cost savings (no per-minute API fees)
- Full control over model size (tiny → large-v3)

### Why Playwright instead of simple HTTP scraping?
- Blog likely has JavaScript rendering
- Requires authentication (cookies/sessions)
- Need to handle dynamic content loading

### Why Edge Runtime for Middleware?
- Next.js 16 best practice
- Faster response times for auth checks
- Cookie-based auth check (no Prisma needed)

## Current Limitations & Workarounds

### Prisma Client Not Generated
**Problem**: `@prisma/client` not generated because `DATABASE_URL` not set  
**Impact**: Can't query database  
**Workaround**: Demo user hardcoded in `src/lib/auth.ts`  
**Resolution**: Configure Neon → set `DATABASE_URL` → run `npx prisma generate && npx prisma db push`

### Corporate Proxy SSL Issues
**Problem**: Self-signed certificates break `npx shadcn init`  
**Workaround**: Manually configured shadcn/ui files  
**Files created**: `components.json`, `lib/utils.ts`, tailwind config adjustments

### Python Scripts Not Implemented
**Status**: Skeleton code exists, blog-specific logic pending  
**Required**: 
- Blog credentials in `.env` (`BLOG_USERNAME`, `BLOG_PASSWORD`)
- Playwright selectors for video/article elements
- Download directory structure

## Code Conventions

### TypeScript
- Strict mode enabled
- No unused variables (ESLint enforced)
- Prefer `import` over `require`
- Use `async/await` over `.then()` chains

### React/Next.js
- Use App Router (not Pages Router)
- Server Components by default, Client Components only when needed (`"use client"`)
- Prefer Server Actions over API routes when possible
- Keep components small and focused

### Styling
- Tailwind utility-first approach
- Use `cn()` helper from `lib/utils.ts` for conditional classes
- Dark mode: class-based (not media query)
- CSS variables for theme colors (in `globals.css`)

### Prisma
- Use camelCase for model fields
- Always include relations in schema
- Add indexes for frequently queried fields
- Use enums for status/type fields

### File Naming
- Components: PascalCase (`LoginForm.tsx`)
- Utilities/libs: camelCase (`auth.ts`, `utils.ts`)
- API routes: lowercase with hyphens (`[...nextauth]/route.ts`)
- Types: PascalCase with `.ts` extension (`types.ts`)

## Environment Variables

Required in `.env.local`:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"  # Change to production URL in deployment
NEXTAUTH_SECRET="y69CjqVQvFMgOMcOgAyU7c1eKpBmSW5iZKSblEXFOzc="  # Generated with: openssl rand -base64 32

# OAuth Providers (optional, not configured yet)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Google Gemini API (for RAG/insights)
GEMINI_API_KEY=""

# Blog credentials (for scraping scripts)
BLOG_USERNAME=""
BLOG_PASSWORD=""
```

## Git Workflow

- **Main branch**: Protected, requires passing CI
- **Commit format**: Conventional Commits (`feat:`, `fix:`, `ci:`, `docs:`, etc.)
- **Before push**: Lint + type check locally (`npm run lint && npx tsc --noEmit`)
- **CI runs on**: Every push to main, every PR

## Next Steps (Ordered by Priority)

1. **Configure Neon Database**
   - Create account at neon.tech
   - Copy connection string to `.env.local`
   - Run `npx prisma generate && npx prisma db push`
   - Remove demo user from auth.ts
   - Enable OAuth callbacks in auth.ts

2. **Build Layout & Navigation**
   - Header component (logo, user menu, logout)
   - Sidebar (Videos, Situations, Search, Insights)
   - SyncButton component (triggers scraping)
   - Redesign homepage (dashboard with widgets)

3. **Implement Sync API**
   - Create `/api/sync` route with Server-Sent Events
   - Call Python scripts via subprocess
   - Stream progress: "Downloading...", "Transcribing...", "Processing..."
   - Update database with results

4. **Implement Python Scripts**
   - `download_video.py`: Playwright automation for video downloads
   - `download_situations.py`: Scrape special situations articles
   - `transcribe.py`: Already complete, test with real videos
   - `sync_all.py`: Orchestrate all scripts, error handling

5. **Build Video Features**
   - List page: `/videos` (grid/list view, filters by date/status)
   - Detail page: `/videos/[id]` (player, transcript, mentions)
   - Sentiment badges for mentions

6. **Build Situations Features**
   - List page: `/situations` (cards, filters by type/status)
   - Detail page: `/situations/[id]` (article content, timeline)

7. **Implement Semantic Search**
   - Generate embeddings with Gemini API
   - Store in pgvector
   - Search page: `/search` (natural language queries)
   - Results: videos + situations ranked by relevance

8. **Add AI Chat Interface**
   - `/chat` page with message history
   - RAG: query embeddings → retrieve relevant context → Gemini API
   - Streaming responses (Server-Sent Events)

9. **Build Insights Page**
   - `/insights` with aggregated analysis
   - Trending stocks (most mentioned)
   - Sentiment trends over time
   - Charts with Recharts/lightweight-charts

10. **Deployment**
    - Connect GitHub repo to Vercel
    - Add environment variables to Vercel
    - Configure Neon production database
    - Test OAuth providers in production
    - Custom domain (optional)

## Common Tasks

### Start Development Server
```bash
cd marketwhisper
npm run dev
# Visit: http://localhost:3000
```

### Run Tests/Checks Locally
```bash
npm run lint              # ESLint
npx tsc --noEmit         # TypeScript type check
npm run build            # Build production bundle
```

### Database Operations
```bash
# Generate Prisma Client (after setting DATABASE_URL)
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Open Prisma Studio (database GUI)
npx prisma studio

# Create migration (for production)
npx prisma migrate dev --name <migration_name>
```

### Python Scripts
```bash
cd scripts

# Download videos
python download_video.py

# Download situations
python download_situations.py

# Transcribe a video
python transcribe.py --video-path ../downloads/videos/video.mp4 --model base

# Run full sync
python sync_all.py
```

## Important Notes for Copilot

1. **Always check if Prisma is enabled**: Currently disabled in `src/lib/prisma.ts`. Don't suggest database queries until Neon is configured.

2. **Use demo user for auth testing**: Until database is connected, only `demo@marketwhisper.com / demo1234` works for login.

3. **Middleware is Edge Runtime**: Can't use Prisma, Node.js APIs, or heavy libraries in `middleware.ts`. Keep it lightweight.

4. **Don't hardcode secrets**: Use environment variables from `.env.local`, never commit secrets to Git.

5. **Python scripts are stubs**: The logic for blog-specific selectors isn't implemented yet. Suggest placeholder comments or ask user for blog structure.

6. **Corporate environment**: User has SSL/proxy issues. If suggesting `npx` commands that download from npm, warn about potential certificate errors.

7. **GPU available**: User has NVIDIA GPU, prefer local Whisper over cloud APIs for transcription.

8. **Bilingual context**: User speaks Spanish, but code/comments should be in English for consistency.

## Helpful Resources

- Next.js 16 Docs: https://nextjs.org/docs
- NextAuth.js v5 (Beta): https://authjs.dev/getting-started/migrating-to-v5
- Prisma Docs: https://www.prisma.io/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com
- Neon PostgreSQL: https://neon.tech/docs
- Whisper: https://github.com/openai/whisper
- Playwright Python: https://playwright.dev/python/docs/intro

---

**Last Updated**: 2026-07-01  
**Project Status**: Authentication complete, ready for layout + database configuration
