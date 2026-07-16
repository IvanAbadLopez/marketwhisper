# MarketWhisper - GitHub Copilot Instructions

## Project Overview

**MarketWhisper** is a Master's Thesis (TFM) project - an AI-Powered Market Intelligence Platform that analyzes financial texts (news, tweets, articles, analyst reports) using local AI to detect companies, sentiment, and reliability scores. Users paste text manually, and the system provides instant AI-powered analysis with company tracking and metrics aggregation.

**Key Innovation**: Simplified workflow with direct text input → AI analysis (Groq) → company tracking. Fast serverless AI responses (~2-5s), free tier available.

## Tech Stack

### Frontend & Backend
- **Framework**: Next.js 16.2.9 (App Router, React Server Components)
- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js 20.20.2 (managed via nvm)
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Icons**: Lucide React

### Authentication
- **Library**: NextAuth.js v5.0.0-beta.31
- **Strategy**: JWT (database-backed sessions via Prisma adapter)
- **Providers**: 
  - Credentials (email/password with bcrypt)
  - GitHub OAuth
  - Google OAuth
- **Demo user**: `demo@marketwhisper.com` / `MarketWhisper2026!`

### Database
- **Provider**: PostgreSQL 16 (Docker local, production-ready for Neon/Vercel)
- **ORM**: Prisma 7.8.0
- **Extensions**: pgvector (for future embeddings/semantic search)
- **Status**: ✅ Schema complete, migrations applied, client generated

### AI & Processing
- **AI Model**: Groq API (llama-3.3-70b-versatile) - Fast LLM for text analysis
  - Detects companies/tickers mentioned in text
  - Assigns sentiment (BULLISH/BEARISH/NEUTRAL)
  - Scores reliability (1-10)
  - Provides reasoning for analysis
- **Financial Data**: Finnhub API (company enrichment, news, metrics)
- **Charts**: Recharts + lightweight-charts

### DevOps
- **VCS**: Git + GitHub (SSH configured, user: IvanAbadLopez)
- **CI/CD**: GitHub Actions (lint + type check + build on every push)
- **Deployment**: Docker Compose (local), Vercel-ready (production)

## Architecture: Feature-Sliced Design (FSD)

**MarketWhisper** follows **Feature-Sliced Design** principles for scalable and maintainable code organization.

### FSD Core Principles

1. **Isolation**: Each layer and slice is independent
2. **Public API**: Explicit exports via `index.ts` files
3. **Unidirectional flow**: Higher layers can import from lower layers, never reverse
4. **Standardization**: Consistent structure across all features

### Layer Hierarchy (Top to Bottom)

```
┌─────────────────────────────────────────┐
│  app        (Next.js routing + config)  │  ← Application initialization
├─────────────────────────────────────────┤
│  widgets    (Complex UI blocks)         │  ← Header, Sidebar, AnalysisPanel
├─────────────────────────────────────────┤
│  features   (Business functionality)    │  ← analyze-text, auth, search
├─────────────────────────────────────────┤
│  entities   (Business entities)         │  ← company, analysis, user
├─────────────────────────────────────────┤
│  shared     (Reusable code)             │  ← ui kit, utils, api client
└─────────────────────────────────────────┘
```

### Project Structure

```
marketwhisper/
├── docs/                          # Documentation
├── prisma/                        # Database schema + migrations
├── public/                        # Static assets
├── scripts/                       # Utilities
│   ├── seed_companies.py         # Seed companies table
│   ├── check_user.ts             # Check user existence
│   ├── clean-tickers.sql         # SQL cleanup utilities
│   └── seed-demo.js              # Docker entrypoint seeding
├── src/
│   ├── app/                       # ⚡ LAYER 1: Next.js routing (pages only)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Uses features/auth
│   │   │   └── register/page.tsx
│   │   ├── api/
│   │   │   ├── analyze/route.ts   # Uses features/analyze-text
│   │   │   ├── companies/route.ts # Company CRUD + enrichment
│   │   │   ├── analysis/[id]/route.ts # Delete analysis
│   │   │   ├── jobs/route.ts      # Job tracking
│   │   │   ├── news/route.ts      # Finnhub news proxy
│   │   │   └── auth/[...nextauth]/route.ts
│   │   ├── analyze/page.tsx       # Text analysis page
│   │   ├── companies/
│   │   │   └── [ticker]/page.tsx  # Company detail with enrichment
│   │   ├── situations/page.tsx    # Company list
│   │   ├── jobs/page.tsx          # Job queue monitoring
│   │   ├── news/page.tsx          # Company news viewer
│   │   ├── layout.tsx             # Root layout with providers
│   │   ├── page.tsx               # Homepage
│   │   └── globals.css
│   │
│   ├── widgets/                   # 🧩 LAYER 2: Self-contained UI blocks
│   │   ├── header/
│   │   │   ├── ui/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── UserMenu.tsx
│   │   │   ├── model/
│   │   │   │   └── types.ts
│   │   │   └── index.ts           # Public API
│   │   ├── sidebar/
│   │   │   ├── ui/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── NavItem.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── ui/
│   │   │   │   └── MainLayout.tsx
│   │   │   └── index.ts
│   │   └── analysis-panel/
│   │       ├── ui/
│   │       │   ├── AnalysisPanel.tsx
│   │       │   └── AnalysisResult.tsx
│   │       ├── model/
│   │       │   └── types.ts
│   │       └── index.ts
│   │
│   ├── features/                  # ⚙️ LAYER 3: Business functionality
│   │   ├── analyze-text/
│   │   │   ├── ui/
│   │   │   │   ├── AnalyzeTextForm.tsx
│   │   │   │   └── AnalysisLoader.tsx
│   │   │   ├── api/
│   │   │   │   └── analyzeText.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   ├── schema.ts      # Zod validation
│   │   │   │   └── hooks.ts
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   ├── ui/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── LogoutButton.tsx
│   │   │   ├── api/
│   │   │   │   ├── login.ts
│   │   │   │   ├── register.ts
│   │   │   │   └── logout.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts
│   │   │   │   └── schemas.ts
│   │   │   └── index.ts
│   │   ├── company-search/
│   │   │   ├── ui/
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   └── SearchResults.tsx
│   │   │   ├── model/
│   │   │   │   ├── useSearch.ts
│   │   │   │   └── types.ts
│   │   │   └── index.ts
│   │   └── sync-content/
│   │       ├── ui/
│   │       │   └── SyncButton.tsx
│   │       ├── api/
│   │       │   └── syncContent.ts
│   │       └── index.ts
│   │
│   ├── entities/                  # 📦 LAYER 4: Business entities
│   │   ├── company/
│   │   │   ├── ui/
│   │   │   │   ├── CompanyCard.tsx
│   │   │   │   ├── CompanyInfo.tsx
│   │   │   │   └── SentimentBadge.tsx
│   │   │   ├── api/
│   │   │   │   ├── getCompany.ts
│   │   │   │   ├── getCompanies.ts
│   │   │   │   └── updateCompany.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts       # Company type
│   │   │   │   ├── hooks.ts       # useCompany, useCompanies
│   │   │   │   └── utils.ts       # formatMarketCap, etc.
│   │   │   └── index.ts
│   │   ├── analysis/
│   │   │   ├── ui/
│   │   │   │   ├── AnalysisCard.tsx
│   │   │   │   └── ReliabilityScore.tsx
│   │   │   ├── api/
│   │   │   │   └── getAnalyses.ts
│   │   │   ├── model/
│   │   │   │   ├── types.ts       # Analysis type
│   │   │   │   └── hooks.ts
│   │   │   └── index.ts
│   │   └── user/
│   │       ├── ui/
│   │       │   ├── UserAvatar.tsx
│   │       │   └── UserProfile.tsx
│   │       ├── model/
│   │       │   ├── types.ts
│   │       │   └── hooks.ts
│   │       └── index.ts
│   │
│   ├── shared/                    # 🔧 LAYER 5: Reusable infrastructure
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── lib/
│   │   │   ├── utils.ts           # cn() helper
│   │   │   ├── formatters.ts      # Date, number formatters
│   │   │   └── validators.ts      # Common Zod schemas
│   │   ├── api/
│   │   │   ├── client.ts          # Fetch wrapper
│   │   │   ├── llm.ts             # Groq AI client
│   │   │   └── prisma.ts          # Prisma client
│   │   ├── config/
│   │   │   ├── constants.ts       # App constants
│   │   │   ├── env.ts             # Environment variables
│   │   │   └── routes.ts          # Route paths
│   │   └── types/
│   │       ├── index.ts           # Global types
│   │       └── next-auth.d.ts     # NextAuth types
│   │
│   ├── middleware.ts              # Edge middleware (route protection)
│   └── generated/                 # Prisma client (gitignored)
│       └── prisma/
│
├── .env.local                     # Environment variables (gitignored)
├── .env.example                   # Environment template
└── components.json                # shadcn/ui config
```

### FSD Segment Types

Each slice (feature/entity) can contain these segments:

- **ui/** - React components
- **api/** - API calls, data fetching
- **model/** - Types, hooks, stores, business logic
- **lib/** - Utilities specific to this slice
- **config/** - Configuration for this slice

### Import Rules (Strict Enforcement)

✅ **ALLOWED**:
```typescript
// Higher layers → Lower layers
import { Button } from "@/shared/ui/button"           // ✅ app → shared
import { CompanyCard } from "@/entities/company"       // ✅ features → entities
import { useAuth } from "@/features/auth"              // ✅ widgets → features

// Same layer (different slices)
import { SearchBar } from "@/features/company-search"  // ✅ feature → feature
```

❌ **FORBIDDEN**:
```typescript
// Lower layers → Higher layers
import { Header } from "@/widgets/header"              // ❌ shared → widgets
import { AnalyzeTextForm } from "@/features/analyze"   // ❌ entities → features

// Bypassing public API
import { LoginForm } from "@/features/auth/ui/LoginForm" // ❌ Direct import
import { LoginForm } from "@/features/auth"              // ✅ Via index.ts
```

### Public API Pattern

**Every slice MUST export via `index.ts`**:

```typescript
// features/analyze-text/index.ts
export { AnalyzeTextForm } from './ui/AnalyzeTextForm'
export { analyzeText } from './api/analyzeText'
export { useAnalysis } from './model/hooks'
export type { AnalysisFormData } from './model/types'

// ❌ Don't export internal utilities
// export { validateInput } from './lib/validators'  
```

### Adapting FSD to Next.js App Router

**Challenge**: Next.js requires routing in `/app`, but FSD suggests app layer for config only.

**Solution**: Hybrid approach

1. **`/app`** = Routing + minimal page components (composition only)
2. **Actual logic** = Lives in features/widgets/entities

**Example**:
```typescript
// ❌ BAD: Logic in page component
// app/companies/[ticker]/page.tsx
export default function CompanyPage({ params }) {
  const [company, setCompany] = useState(null)
  // ... fetch logic, rendering logic, etc.
}

// ✅ GOOD: Page is just composition
// app/companies/[ticker]/page.tsx
import { CompanyDetailWidget } from '@/widgets/company-detail'

export default function CompanyPage({ params }: { params: { ticker: string } }) {
  return <CompanyDetailWidget ticker={params.ticker} />
}

// widgets/company-detail/ui/CompanyDetailWidget.tsx
// (Contains all logic, uses entities/company, features/company-search, etc.)
```

### Migration Strategy

**Current state**: Flat structure with `/components`, `/lib`  
**Target state**: Full FSD structure

**Step-by-step migration**:
1. Create `shared/` layer first (move `/lib`, `/components/ui`)
2. Create `entities/` for business entities (company, analysis, user)
3. Create `features/` for business logic (analyze-text, auth, search)
4. Create `widgets/` for complex UI (header, sidebar, layout)
5. Refactor `/app` pages to use widgets (composition only)
6. Add public APIs (`index.ts`) to all slices
7. Enforce import rules with ESLint plugin (optional)

### FSD Development Rules

1. **One feature = One slice**: Don't create mega-features
2. **Entities are data-focused**: UI for displaying, not business logic
3. **Features own business logic**: Mutations, validations, workflows
4. **Widgets compose features + entities**: No business logic in widgets
5. **Pages are thin**: Just route params → widget props
6. **Always use public API**: Never bypass `index.ts`
7. **Cross-feature communication**: Via shared state or entities, not direct imports

### Testing with FSD

```
features/analyze-text/
├── ui/
│   ├── AnalyzeTextForm.tsx
│   └── AnalyzeTextForm.test.tsx   # ✅ Co-located tests
├── api/
│   ├── analyzeText.ts
│   └── analyzeText.test.ts        # ✅ API tests
├── model/
│   └── hooks.test.ts              # ✅ Hook tests
└── index.ts
```

## Database Schema (Prisma)

### Core Models

**User** (Auth)
- id, email, name, image, password (bcrypt), emailVerified
- Relations: accounts, sessions, jobs

**Job** (Background processing tracking)
- id, userId, type (ANALYSIS | ENRICHMENT), status (PENDING | PROCESSING | COMPLETED | FAILED | CANCELLED)
- ticker, result (JSON), errorMessage
- analysisId, enrichmentId (unique relations)
- Created for async workflows (text analysis, company enrichment)

**Company** (Tracked companies)
- id, ticker (unique), name, description, sector, industry
- marketCap, logoUrl, website
- avgSentimentScore, avgReliabilityScore, analysisCount (aggregated metrics)
- globalScore (0-100), globalScoreLabel, targetPrice (computed valuation)
- valuationBreakdown (JSON), valuationUpdatedAt
- Relations: analyses, enrichments

**Analysis** (User text analysis)
- id, text (original user input), source (optional, e.g. "Twitter")
- companyId, ticker (detected by AI)
- sentiment (BULLISH | BEARISH | NEUTRAL), reliabilityScore (1-10)
- reasoning (AI explanation in English)
- financialSnapshot (JSON snapshot at analysis time)
- jobId (optional relation for tracking)
- Created when user pastes text for AI analysis

**CompanyEnrichment** (Public financial data + AI insights)
- id, companyId, ticker, source (FINNHUB)
- status (PENDING | PROCESSING | COMPLETED | FAILED)
- financialData, priceData, newsHeadlines, recommendations (JSON from Finnhub)
- aiAnalysis (Groq-generated summary), aiModel
- jobId (optional relation for tracking)
- Created when user clicks "Enrich with public data" button

**Sentiment Enum** (shared)
- BULLISH, BEARISH, NEUTRAL

## Architecture Decisions

### Why Groq instead of Local LLM?
- **Fast**: ~2-5s responses vs ~60s with local models
- **Serverless**: No infrastructure to maintain
- **Free tier**: 1K RPM / 300K TPM for development
- **Production ready**: Stable API with JSON mode support

### Why Direct Text Input instead of Scraping/Videos?
- **Simplicity**: Clear user flow (paste → analyze → results)
- **Flexibility**: Works with any source (Twitter, Bloomberg, proprietary newsletters)
- **No infrastructure**: No need for video download/transcription/storage
- **Faster MVP**: Eliminated complex pipeline, focused on core value (AI analysis)

### Why Finnhub instead of yfinance?
- **Real-time data**: yfinance was removed in favor of live Finnhub API
- **News integration**: Finnhub provides news headlines per ticker
- **Analyst data**: Recommendations, targets, earnings estimates
- **Free tier**: 60 calls/min sufficient for MVP

### Why Job Queue System?
- **UX**: Long-running AI analysis doesn't block UI
- **Visibility**: Users see progress via /jobs page
- **Reliability**: Jobs can be cancelled, retried, monitored
- **Scalability**: Ready for background worker pool (future)

## Current State & Next Steps

### ✅ Implemented
- Text analysis with multi-company detection
- Company tracking with aggregated metrics
- AI enrichment with Finnhub data
- Job queue system with cancellation
- Global score + target price calculation
- News viewer per company
- Delete company/analysis with cascade
- Docker deployment stack

### ⚠️ Pending
- E2E tests for job cancellation flow
- Performance optimization for large text batches
- RAG/embeddings for semantic search (pgvector ready)
- Deployment to Vercel/Neon production

## Code Conventions

### Feature-Sliced Design (FSD)

- **Always create public API**: Every feature/entity/widget MUST export via `index.ts`
- **Respect layer hierarchy**: Never import from higher layers (e.g., entities can't import from features)
- **Use segments consistently**: `ui/`, `api/`, `model/`, `lib/`, `config/`
- **Keep pages thin**: App Router pages should only compose widgets, no business logic
- **One slice = One responsibility**: Don't create mega-slices
- **Cross-slice imports**: Only via public API, never direct file imports

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

**FSD Structure**:
- Slices: kebab-case (`analyze-text/`, `company-search/`)
- Segments: lowercase (`ui/`, `api/`, `model/`)
- Components: PascalCase (`AnalyzeTextForm.tsx`, `CompanyCard.tsx`)
- Public API: Always `index.ts` (exports only)
- Tests: Co-located with code (`AnalyzeTextForm.test.tsx`)

**Other Files**:
- Utilities/libs: camelCase (`formatters.ts`, `validators.ts`)
- API routes: lowercase with hyphens (`[...nextauth]/route.ts`)
- Types: PascalCase with `.ts` extension (`types.ts`)
- Config: lowercase (`constants.ts`, `env.ts`)

## Development Rules & Testing

### Testing Requirements ⚠️

**MANDATORY**: Every new feature MUST include tests before merging.

**Test Coverage Required**:
- ✅ **API Routes**: Unit tests for all endpoints (request/response, error handling)
- ✅ **Components**: Component tests for user interactions and rendering
- ✅ **Business Logic**: Unit tests for utilities, helpers, and complex functions
- ✅ **Critical Flows**: E2E tests for auth, sync, and user journeys

**Testing Framework**:
- **Unit/Integration**: Vitest + Testing Library
- **E2E**: Playwright
- **Location**: 
  - Unit tests: `src/**/*.test.ts(x)` (next to the code)
  - E2E tests: `e2e/**/*.spec.ts`

**Running Tests**:
```bash
npm test              # Unit tests (watch mode)
npm test -- --run     # Unit tests (single run)
npm run test:e2e      # E2E tests
```

**CI/CD**: All tests run automatically on push. PRs cannot merge with failing tests.

**Example Test Structure**:
```typescript
// src/app/api/sync/route.test.ts
import { describe, it, expect } from 'vitest';
import { POST } from './route';

describe('POST /api/sync', () => {
  it('should start sync process', async () => {
    const response = await POST(new Request('http://localhost:3000/api/sync'));
    expect(response.status).toBe(200);
  });
});
```

### Workflow
1. Write failing test first (TDD encouraged)
2. Implement feature
3. Verify all tests pass
4. Update documentation if needed
5. Create PR (CI will run tests)

### UI Language Policy ⚠️

**MANDATORY**: All UI text is in English (hardcoded). No UI internationalization.

**Rules**:
- ✅ **Hardcode all UI text in English** - Buttons, labels, messages, etc. are in English
- ✅ **No translation libraries for UI** - `next-intl` was removed, do not use translation hooks
- ✅ **Clear, concise English** - Use standard American English for all interface text

**Usage Example**:
```typescript
// ✅ CORRECT - Hardcoded English
<button>Analyze Text</button>
<label>Company Name</label>
<p className="text-sm text-zinc-400">No companies found</p>
```

**On-Demand AI Analysis Translation**:
- AI analysis (generated by Groq) can be translated to Spanish on demand via toggle button
- Translation endpoint: `POST /api/companies/[ticker]/enrich-finnhub/[id]/translate`
- Uses `translateToSpanish()` from `@/shared/api/translate` (Groq llama-3.3-70b-versatile)
- Cached in localStorage (24h TTL) via `translationCache.ts`
- UI component: `EnrichmentDisplay` has EN/ES toggle button with Languages icon
- **No persistence** - translations are ephemeral (not saved to database)

**Rationale**:
- TFM requirement: Interface in English, README in Spanish
- Simplified codebase: No i18n complexity, faster development
- AI translation available where it matters (analysis interpretation)

## Environment Variables

Required in `.env.local`:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"  # Change to production URL in deployment
NEXTAUTH_SECRET="y69CjqVQvFMgOMcOgAyU7c1eKpBmSW5iZKSblEXFOzc="  # Generated with: openssl rand -base64 32

# Groq API
GROQ_API_KEY=""
GROQ_MODEL="llama-3.3-70b-versatile"

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
   - Generate embeddings with Ollama (local)
   - Store in pgvector
   - Search page: `/search` (natural language queries)
   - Results: videos + situations ranked by relevance

8. **Add AI Chat Interface**
   - `/chat` page with message history
   - RAG: query embeddings → retrieve relevant context → Ollama API
   - Streaming responses (Server-Sent Events)

9. **Build Insights Page**
   - `/insights` with aggregated analysis
   - Trending stocks (most mentioned)
   - Sentiment trends over time
   - Charts with Recharts/lightweight-charts

10. **Deployment**
    - Connect GitHub repo to Vercel
    - Add environment variables to Vercel
    - Configure production database
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
