# Feature-Sliced Design (FSD) - Migration Guide

**Status**: � In Progress - Step 1 Complete!  
**Target**: Q3 2026  
**Current**: Step 1 ✅ → Step 2 (Next)

---

## 🎯 Migration Overview

Transform MarketWhisper from a flat component structure to Feature-Sliced Design for better scalability and maintainability.

### Current Structure (Flat)

```
src/
├── app/                    # Routing + business logic mixed
├── components/             # All components flat
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── SyncButton.tsx
├── lib/                    # All utilities flat
│   ├── auth.ts
│   ├── gemini.ts
│   └── utils.ts
└── types/
```

### Target Structure (FSD)

```
src/
├── app/                    # ⚡ Only routing (thin pages)
├── widgets/                # 🧩 Complex UI blocks
├── features/               # ⚙️ Business functionality
├── entities/               # 📦 Business entities
└── shared/                 # 🔧 Reusable infrastructure
```

---

## 📅 Migration Steps

### Step 1: Create `shared/` Layer (Week 1)

Move all reusable infrastructure to `shared/`:

**Actions**:
1. Create `src/shared/` directory structure
2. Move `lib/utils.ts` → `shared/lib/utils.ts`
3. Move `components/ui/*` → `shared/ui/*` (shadcn components)
4. Create `shared/api/client.ts` (fetch wrapper)
5. Move `lib/gemini.ts` → `shared/api/gemini.ts`
6. Move `lib/prisma.ts` → `shared/api/prisma.ts`
7. Create `shared/config/constants.ts`
8. Create `shared/config/env.ts`
9. Add public API: `shared/index.ts`

**Files to migrate**:
```bash
# Before
src/lib/utils.ts
src/lib/gemini.ts
src/lib/prisma.ts
src/components/ui/button.tsx
src/components/ui/card.tsx
# ... all shadcn components

# After
src/shared/lib/utils.ts
src/shared/api/gemini.ts
src/shared/api/prisma.ts
src/shared/ui/button.tsx
src/shared/ui/card.tsx
src/shared/config/constants.ts
src/shared/config/env.ts
src/shared/index.ts
```

**Testing**: All imports still work, no broken references.

---

### Step 2: Create `entities/` Layer (Week 2)

Extract business entities (company, analysis, user):

**Actions**:
1. Create `entities/company/` slice
   - `ui/CompanyCard.tsx` (extract from pages)
   - `ui/CompanyInfo.tsx`
   - `ui/SentimentBadge.tsx`
   - `api/getCompany.ts`
   - `api/getCompanies.ts`
   - `model/types.ts` (Company, CompanyWithAnalysis)
   - `model/hooks.ts` (useCompany, useCompanies)
   - `model/utils.ts` (formatMarketCap, getSentimentColor)
   - `index.ts` (public API)

2. Create `entities/analysis/` slice
   - `ui/AnalysisCard.tsx`
   - `ui/ReliabilityScore.tsx`
   - `api/getAnalyses.ts`
   - `model/types.ts`
   - `model/hooks.ts`
   - `index.ts`

3. Create `entities/user/` slice
   - `ui/UserAvatar.tsx`
   - `ui/UserProfile.tsx`
   - `model/types.ts`
   - `model/hooks.ts`
   - `index.ts`

**Testing**: Entity components render correctly, hooks work.

---

### Step 3: Create `features/` Layer (Week 3-4)

Extract business features (analyze-text, auth, search):

**Actions**:
1. Create `features/analyze-text/` slice
   - Move `SyncButton.tsx` logic → `ui/AnalyzeTextForm.tsx`
   - Create `api/analyzeText.ts` (POST /api/analyze)
   - Create `model/types.ts` (AnalysisFormData, AnalysisResult)
   - Create `model/schema.ts` (Zod validation)
   - Create `model/hooks.ts` (useAnalyzeText)
   - Add `index.ts`

2. Create `features/auth/` slice
   - Move `app/(auth)/login/page.tsx` → `ui/LoginForm.tsx`
   - Move `app/(auth)/register/page.tsx` → `ui/RegisterForm.tsx`
   - Create `ui/LogoutButton.tsx`
   - Create `api/login.ts`, `api/register.ts`, `api/logout.ts`
   - Create `model/types.ts`, `model/schemas.ts`
   - Move `lib/auth.ts` → `model/auth.ts`
   - Add `index.ts`

3. Create `features/company-search/` slice
   - Extract search logic from `app/companies/page.tsx`
   - Create `ui/SearchBar.tsx`
   - Create `ui/SearchResults.tsx`
   - Create `model/useSearch.ts` (client-side search hook)
   - Create `model/types.ts`
   - Add `index.ts`

**Testing**: Features work independently, can be composed.

---

### Step 4: Create `widgets/` Layer (Week 5)

Extract complex UI blocks (header, sidebar, layout):

**Actions**:
1. Create `widgets/header/` slice
   - Move `components/Header.tsx` → `ui/Header.tsx`
   - Create `ui/UserMenu.tsx` (uses entities/user + features/auth)
   - Create `model/types.ts`
   - Add `index.ts`

2. Create `widgets/sidebar/` slice
   - Move `components/Sidebar.tsx` → `ui/Sidebar.tsx`
   - Create `ui/NavItem.tsx`
   - Create `model/navItems.ts` (navigation config)
   - Add `index.ts`

3. Create `widgets/layout/` slice
   - Move `components/MainLayout.tsx` → `ui/MainLayout.tsx`
   - Compose header + sidebar widgets
   - Add `index.ts`

4. Create `widgets/analysis-panel/` slice
   - Create `ui/AnalysisPanel.tsx` (uses features/analyze-text)
   - Create `ui/AnalysisResult.tsx` (uses entities/analysis)
   - Add `index.ts`

**Testing**: Widgets compose correctly, all features/entities work.

---

### Step 5: Refactor `app/` Pages (Week 6)

Make pages thin - only composition of widgets:

**Actions**:
1. Refactor `app/page.tsx` (homepage)
   ```typescript
   // Before: Business logic in page
   export default function HomePage() {
     const [companies, setCompanies] = useState([])
     // ... fetch logic, rendering
   }
   
   // After: Pure composition
   import { DashboardWidget } from '@/widgets/dashboard'
   export default function HomePage() {
     return <DashboardWidget />
   }
   ```

2. Refactor `app/companies/[ticker]/page.tsx`
   ```typescript
   // Before: Fetch + render in page
   export default function CompanyPage({ params }) {
     // ... logic
   }
   
   // After: Pass props to widget
   import { CompanyDetailWidget } from '@/widgets/company-detail'
   export default function CompanyPage({ params }: { params: { ticker: string } }) {
     return <CompanyDetailWidget ticker={params.ticker} />
   }
   ```

3. Refactor auth pages
   ```typescript
   // app/(auth)/login/page.tsx
   import { LoginForm } from '@/features/auth'
   export default function LoginPage() {
     return <LoginForm />
   }
   ```

4. Keep API routes in `app/api/` (minimal logic, delegate to features)

**Testing**: All pages work, e2e tests pass.

---

## 🔍 Migration Checklist

### Pre-Migration
- [x] Backup current codebase (git commit)
- [x] All tests passing (19 unit + 7 E2E)
- [x] Build successful (`npm run build`)
- [x] Document current structure

### During Migration
- [x] **Step 1: `shared/` layer ✅ (Commit: ceffc0f)**
  - Created `src/shared/` with api/, lib/, config/
  - Moved utils.ts, gemini.ts, prisma.ts
  - Created constants.ts, env.ts
  - Public API via index.ts
  - 16 files updated
  - Build ✓ | Tests ✓ 15/15
- [ ] Step 2: `entities/` layer
- [ ] Step 3: `features/` layer
- [ ] Step 4: `widgets/` layer
- [ ] Step 5: Refactor `app/` pages

### Post-Migration
- [ ] All tests passing
- [ ] Build successful
- [ ] No broken imports (TypeScript errors)
- [ ] ESLint passing
- [ ] Update documentation
- [ ] Add FSD linting rules (optional)

---

## 📐 FSD Quick Reference

### Layer Hierarchy (Import Direction)

```
app       ↓ can import from all layers
widgets   ↓ can import from features, entities, shared
features  ↓ can import from entities, shared
entities  ↓ can import from shared
shared    ↓ no dependencies (standalone)
```

### Public API Pattern

```typescript
// ✅ GOOD: features/analyze-text/index.ts
export { AnalyzeTextForm } from './ui/AnalyzeTextForm'
export { analyzeText } from './api/analyzeText'
export { useAnalyzeText } from './model/hooks'
export type { AnalysisFormData } from './model/types'

// ✅ GOOD: Usage
import { AnalyzeTextForm, useAnalyzeText } from '@/features/analyze-text'

// ❌ BAD: Direct import
import { AnalyzeTextForm } from '@/features/analyze-text/ui/AnalyzeTextForm'
```

### Segment Types

- **ui/** - React components
- **api/** - API calls, data fetching
- **model/** - Types, hooks, stores, validation
- **lib/** - Utilities specific to this slice
- **config/** - Configuration for this slice

---

## 🚀 Benefits After Migration

1. **Scalability**: Add new features without touching existing code
2. **Maintainability**: Clear structure, easy to navigate
3. **Reusability**: Entities and features are portable
4. **Testing**: Isolated slices, easier to test
5. **Onboarding**: New developers understand structure quickly
6. **Refactoring**: Change internal implementation without affecting imports

---

## 📚 Resources

- [Feature-Sliced Design](https://feature-sliced.design/)
- [FSD Documentation](https://feature-sliced.design/docs)
- [FSD Examples](https://github.com/feature-sliced/examples)
- [Next.js + FSD](https://feature-sliced.design/docs/guides/examples/nextjs)

---

**Last Updated**: 2026-07-02  
**Next Review**: After Step 1 completion
