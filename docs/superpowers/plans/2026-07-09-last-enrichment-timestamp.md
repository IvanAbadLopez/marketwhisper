# Last Enrichment Timestamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display relative timestamp of last enrichment next to Enrich button to help users decide whether to re-enrich a company.

**Architecture:** Utility-first design with a shared `formatRelativeTime` helper in `src/shared/lib/date.ts`, component modification to `EnrichButton` to display timestamp badge below the button, and i18n support for English/Spanish pluralization. No external date libraries needed—uses native Date API + next-intl.

**Tech Stack:** TypeScript, React, next-intl (i18n), Vitest (unit tests), Testing Library (component tests), Lucide React (icons)

---

## Task 1: Create `formatRelativeTime` Utility with Tests

**Files:**
- Create: `src/shared/lib/date.ts`
- Create: `src/shared/lib/date.test.ts`

### Step 1.1: Write failing test for "just now" case

- [ ] **Step 1.1.1: Create test file**

```typescript
// src/shared/lib/date.test.ts
import { describe, it, expect, vi } from 'vitest';
import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
  it('returns "just now" for dates less than 1 minute ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const thirtySecondsAgo = new Date('2026-07-09T09:59:30Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(thirtySecondsAgo, 'en');
    expect(result).toBe('just now');
  });
});
```

- [ ] **Step 1.1.2: Run test to verify it fails**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: FAIL with "Cannot find module './date'"

### Step 1.2: Implement minimal code for "just now"

- [ ] **Step 1.2.1: Create date utility file**

```typescript
// src/shared/lib/date.ts
export function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'just now';
  
  return '';
}
```

- [ ] **Step 1.2.2: Run test to verify it passes**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS

- [ ] **Step 1.2.3: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "test: add formatRelativeTime for just now case"
```

### Step 1.3: Add test for minutes ago

- [ ] **Step 1.3.1: Write failing test**

Add to `src/shared/lib/date.test.ts`:
```typescript
  it('returns "N minutes ago" for dates less than 60 minutes ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const thirtyMinutesAgo = new Date('2026-07-09T09:30:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(thirtyMinutesAgo, 'en');
    expect(result).toBe('30 minutes ago');
  });
  
  it('returns "1 minute ago" (singular) for exactly 1 minute', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const oneMinuteAgo = new Date('2026-07-09T09:59:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(oneMinuteAgo, 'en');
    expect(result).toBe('1 minute ago');
  });
```

- [ ] **Step 1.3.2: Run test to verify it fails**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: FAIL with "Expected: '30 minutes ago', Received: ''"

### Step 1.4: Implement minutes ago logic

- [ ] **Step 1.4.1: Update implementation**

```typescript
// src/shared/lib/date.ts
export function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  
  return '';
}
```

- [ ] **Step 1.4.2: Run test to verify it passes**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS

- [ ] **Step 1.4.3: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "feat: add minutes ago formatting"
```

### Step 1.5: Add test for hours ago

- [ ] **Step 1.5.1: Write failing test**

Add to `src/shared/lib/date.test.ts`:
```typescript
  it('returns "N hours ago" for dates less than 24 hours ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const fiveHoursAgo = new Date('2026-07-09T05:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(fiveHoursAgo, 'en');
    expect(result).toBe('5 hours ago');
  });
  
  it('returns "1 hour ago" (singular) for exactly 1 hour', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const oneHourAgo = new Date('2026-07-09T09:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(oneHourAgo, 'en');
    expect(result).toBe('1 hour ago');
  });
```

- [ ] **Step 1.5.2: Run test to verify it fails**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: FAIL with "Expected: '5 hours ago', Received: ''"

### Step 1.6: Implement hours ago logic

- [ ] **Step 1.6.1: Update implementation**

```typescript
// src/shared/lib/date.ts
export function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  return '';
}
```

- [ ] **Step 1.6.2: Run test to verify it passes**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS

- [ ] **Step 1.6.3: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "feat: add hours ago formatting"
```

### Step 1.7: Add test for days ago

- [ ] **Step 1.7.1: Write failing test**

Add to `src/shared/lib/date.test.ts`:
```typescript
  it('returns "N days ago" for dates less than 30 days ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const tenDaysAgo = new Date('2026-06-29T10:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(tenDaysAgo, 'en');
    expect(result).toBe('10 days ago');
  });
  
  it('returns "1 day ago" (singular) for exactly 1 day', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const oneDayAgo = new Date('2026-07-08T10:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(oneDayAgo, 'en');
    expect(result).toBe('1 day ago');
  });
```

- [ ] **Step 1.7.2: Run test to verify it fails**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: FAIL with "Expected: '10 days ago', Received: ''"

### Step 1.8: Implement days ago logic

- [ ] **Step 1.8.1: Update implementation**

```typescript
// src/shared/lib/date.ts
export function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  return '';
}
```

- [ ] **Step 1.8.2: Run test to verify it passes**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS

- [ ] **Step 1.8.3: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "feat: add days ago formatting"
```

### Step 1.9: Add test for months ago

- [ ] **Step 1.9.1: Write failing test**

Add to `src/shared/lib/date.test.ts`:
```typescript
  it('returns "N months ago" for dates 30+ days ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const twoMonthsAgo = new Date('2026-05-09T10:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(twoMonthsAgo, 'en');
    expect(result).toBe('2 months ago');
  });
  
  it('returns "1 month ago" (singular) for exactly 1 month', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    const oneMonthAgo = new Date('2026-06-09T10:00:00Z');
    
    vi.setSystemTime(now);
    
    const result = formatRelativeTime(oneMonthAgo, 'en');
    expect(result).toBe('1 month ago');
  });
```

- [ ] **Step 1.9.2: Run test to verify it fails**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: FAIL with "Expected: '2 months ago', Received: ''"

### Step 1.10: Implement months ago logic

- [ ] **Step 1.10.1: Update implementation**

```typescript
// src/shared/lib/date.ts
export function formatRelativeTime(date: Date, locale: string): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }
  if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
}
```

- [ ] **Step 1.10.2: Run test to verify it passes**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS (all tests passing)

- [ ] **Step 1.10.3: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "feat: add months ago formatting (complete formatRelativeTime)"
```

---

## Task 2: Add i18n Translations

**Files:**
- Modify: `src/messages/en.json`
- Modify: `src/messages/es.json`

### Step 2.1: Add English translations

- [ ] **Step 2.1.1: Update en.json**

Add to `src/messages/en.json` (place after existing keys):
```json
  "relativeTime": {
    "justNow": "just now",
    "minutesAgo": "{count, plural, one {# minute ago} other {# minutes ago}}",
    "hoursAgo": "{count, plural, one {# hour ago} other {# hours ago}}",
    "daysAgo": "{count, plural, one {# day ago} other {# days ago}}",
    "monthsAgo": "{count, plural, one {# month ago} other {# months ago}}"
  }
```

- [ ] **Step 2.1.2: Verify JSON syntax**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/messages/en.json', 'utf8'))"
```

Expected: No output (valid JSON)

- [ ] **Step 2.1.3: Commit**

```bash
git add src/messages/en.json
git commit -m "i18n: add English relative time translations"
```

### Step 2.2: Add Spanish translations

- [ ] **Step 2.2.1: Update es.json**

Add to `src/messages/es.json` (place after existing keys):
```json
  "relativeTime": {
    "justNow": "ahora mismo",
    "minutesAgo": "{count, plural, one {hace # minuto} other {hace # minutos}}",
    "hoursAgo": "{count, plural, one {hace # hora} other {hace # horas}}",
    "daysAgo": "{count, plural, one {hace # día} other {hace # días}}",
    "monthsAgo": "{count, plural, one {hace # mes} other {hace # meses}}"
  }
```

- [ ] **Step 2.2.2: Verify JSON syntax**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('src/messages/es.json', 'utf8'))"
```

Expected: No output (valid JSON)

- [ ] **Step 2.2.3: Commit**

```bash
git add src/messages/es.json
git commit -m "i18n: add Spanish relative time translations"
```

---

## Task 3: Integrate i18n with `formatRelativeTime`

**Files:**
- Modify: `src/shared/lib/date.ts`
- Modify: `src/shared/lib/date.test.ts`

### Step 3.1: Update tests to use i18n keys

- [ ] **Step 3.1.1: Mock next-intl in tests**

Update `src/shared/lib/date.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatRelativeTime } from './date';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'relativeTime.justNow': 'just now',
      'relativeTime.minutesAgo': params?.count === 1 ? '1 minute ago' : `${params?.count} minutes ago`,
      'relativeTime.hoursAgo': params?.count === 1 ? '1 hour ago' : `${params?.count} hours ago`,
      'relativeTime.daysAgo': params?.count === 1 ? '1 day ago' : `${params?.count} days ago`,
      'relativeTime.monthsAgo': params?.count === 1 ? '1 month ago' : `${params?.count} months ago`,
    };
    return translations[key] || key;
  }
}));

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ... rest of existing tests (no changes needed)
});
```

- [ ] **Step 3.1.2: Run tests to verify they still pass**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS (all tests still passing with mock)

### Step 3.2: Update implementation to use next-intl

- [ ] **Step 3.2.1: Refactor to accept translate function**

Update `src/shared/lib/date.ts`:
```typescript
type TranslateFunction = (key: string, params?: Record<string, any>) => string;

export function formatRelativeTime(
  date: Date, 
  t: TranslateFunction
): string {
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return t('relativeTime.justNow');
  if (diffMinutes < 60) return t('relativeTime.minutesAgo', { count: diffMinutes });
  if (diffHours < 24) return t('relativeTime.hoursAgo', { count: diffHours });
  if (diffDays < 30) return t('relativeTime.daysAgo', { count: diffDays });
  
  const diffMonths = Math.floor(diffDays / 30);
  return t('relativeTime.monthsAgo', { count: diffMonths });
}
```

- [ ] **Step 3.2.2: Update test calls to match new signature**

Update all test calls in `src/shared/lib/date.test.ts`:
```typescript
import { useTranslations } from 'next-intl';

// Inside each test:
const t = useTranslations();
const result = formatRelativeTime(thirtySecondsAgo, t);
```

Apply to all 10 test cases.

- [ ] **Step 3.2.3: Run tests to verify they pass**

Run:
```bash
npm test src/shared/lib/date.test.ts
```

Expected: PASS (all tests passing with refactored signature)

- [ ] **Step 3.2.4: Commit**

```bash
git add src/shared/lib/date.ts src/shared/lib/date.test.ts
git commit -m "refactor: integrate next-intl with formatRelativeTime"
```

---

## Task 4: Modify `EnrichButton` Component

**Files:**
- Modify: `src/features/enrich-company/ui/EnrichButton.tsx`
- Create: `src/features/enrich-company/ui/EnrichButton.test.tsx`

### Step 4.1: Write component test for timestamp display

- [ ] **Step 4.1.1: Create test file**

```typescript
// src/features/enrich-company/ui/EnrichButton.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnrichButton } from './EnrichButton';
import { NextIntlClientProvider } from 'next-intl';

// Mock next-intl
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl');
  return {
    ...actual,
    useTranslations: () => (key: string, params?: any) => {
      if (key === 'relativeTime.hoursAgo') {
        return params?.count === 1 ? '1 hour ago' : `${params?.count} hours ago`;
      }
      return key;
    }
  };
});

describe('EnrichButton', () => {
  const messages = {};
  
  it('displays timestamp when lastEnrichment is provided', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EnrichButton 
          ticker="AAPL" 
          lastEnrichment={{ createdAt: twoHoursAgo }} 
        />
      </NextIntlClientProvider>
    );
    
    expect(screen.getByText(/2 hours ago/i)).toBeInTheDocument();
  });
  
  it('does not display timestamp when lastEnrichment is null', () => {
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EnrichButton ticker="AAPL" lastEnrichment={null} />
      </NextIntlClientProvider>
    );
    
    expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 4.1.2: Run test to verify it fails**

Run:
```bash
npm test src/features/enrich-company/ui/EnrichButton.test.tsx
```

Expected: FAIL with "lastEnrichment is not a valid prop"

### Step 4.2: Add lastEnrichment prop to component

- [ ] **Step 4.2.1: Read current EnrichButton implementation**

Run:
```bash
cat src/features/enrich-company/ui/EnrichButton.tsx
```

Note the current props interface.

- [ ] **Step 4.2.2: Update props interface**

Add to the props interface in `src/features/enrich-company/ui/EnrichButton.tsx`:
```typescript
interface EnrichButtonProps {
  ticker: string;
  lastEnrichment?: { createdAt: Date } | null;  // NEW PROP
  onSuccess?: () => void;
  variant?: "default" | "compact";
  className?: string;
}
```

- [ ] **Step 4.2.3: Import dependencies**

Add imports at top of `src/features/enrich-company/ui/EnrichButton.tsx`:
```typescript
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { formatRelativeTime } from '@/shared/lib/date';
```

- [ ] **Step 4.2.4: Add timestamp badge rendering**

Update the component JSX in `src/features/enrich-company/ui/EnrichButton.tsx`:
```typescript
export function EnrichButton({
  ticker,
  lastEnrichment,
  onSuccess,
  variant = "default",
  className,
}: EnrichButtonProps) {
  const [loading, setLoading] = useState(false);
  const t = useTranslations();
  
  // ... existing enrichment logic ...
  
  // Calculate age color
  const ageInDays = lastEnrichment 
    ? (Date.now() - lastEnrichment.createdAt.getTime()) / 86400000 
    : 0;
  
  const ageColor = ageInDays > 7 
    ? 'text-yellow-600 dark:text-yellow-400' 
    : 'text-zinc-500 dark:text-zinc-400';
  
  return (
    <div className="flex flex-col items-end gap-1">
      {/* Existing button */}
      <button
        onClick={handleEnrich}
        disabled={loading}
        className={/* ... existing classes ... */}
      >
        {/* ... existing button content ... */}
      </button>
      
      {/* New timestamp badge */}
      {lastEnrichment && !loading && (
        <div className={`flex items-center gap-1 text-xs ${ageColor}`}>
          <Clock className="w-3 h-3" />
          <span>{formatRelativeTime(lastEnrichment.createdAt, t)}</span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4.2.5: Run test to verify it passes**

Run:
```bash
npm test src/features/enrich-company/ui/EnrichButton.test.tsx
```

Expected: PASS

- [ ] **Step 4.2.6: Commit**

```bash
git add src/features/enrich-company/ui/EnrichButton.tsx src/features/enrich-company/ui/EnrichButton.test.tsx
git commit -m "feat: add timestamp display to EnrichButton"
```

### Step 4.3: Add test for stale timestamp color

- [ ] **Step 4.3.1: Write test for stale data (>7 days)**

Add to `src/features/enrich-company/ui/EnrichButton.test.tsx`:
```typescript
  it('displays yellow color for stale data (>7 days)', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EnrichButton 
          ticker="AAPL" 
          lastEnrichment={{ createdAt: tenDaysAgo }} 
        />
      </NextIntlClientProvider>
    );
    
    const timestamp = screen.getByText(/days ago/i).closest('div');
    expect(timestamp).toHaveClass('text-yellow-600');
  });
  
  it('displays gray color for fresh data (<7 days)', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EnrichButton 
          ticker="AAPL" 
          lastEnrichment={{ createdAt: twoDaysAgo }} 
        />
      </NextIntlClientProvider>
    );
    
    const timestamp = screen.getByText(/days ago/i).closest('div');
    expect(timestamp).toHaveClass('text-zinc-500');
  });
```

- [ ] **Step 4.3.2: Run test to verify it passes**

Run:
```bash
npm test src/features/enrich-company/ui/EnrichButton.test.tsx
```

Expected: PASS (color logic already implemented in Step 4.2.4)

- [ ] **Step 4.3.3: Commit**

```bash
git add src/features/enrich-company/ui/EnrichButton.test.tsx
git commit -m "test: add color tests for timestamp staleness"
```

### Step 4.4: Add test for hidden timestamp during loading

- [ ] **Step 4.4.1: Write test for loading state**

Add to `src/features/enrich-company/ui/EnrichButton.test.tsx`:
```typescript
import { fireEvent, waitFor } from '@testing-library/react';

  it('hides timestamp while loading', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    // Mock fetch to delay
    global.fetch = vi.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ ok: true, json: () => ({}) }), 100)
      )
    );
    
    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <EnrichButton 
          ticker="AAPL" 
          lastEnrichment={{ createdAt: twoHoursAgo }} 
        />
      </NextIntlClientProvider>
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // Timestamp should be hidden while loading
    await waitFor(() => {
      expect(screen.queryByText(/ago/i)).not.toBeInTheDocument();
    });
  });
```

- [ ] **Step 4.4.2: Run test to verify it passes**

Run:
```bash
npm test src/features/enrich-company/ui/EnrichButton.test.tsx
```

Expected: PASS (loading state already handled in Step 4.2.4)

- [ ] **Step 4.4.3: Commit**

```bash
git add src/features/enrich-company/ui/EnrichButton.test.tsx
git commit -m "test: verify timestamp hidden during loading"
```

---

## Task 5: Update Company Detail Page

**Files:**
- Modify: `src/app/companies/[ticker]/page.tsx`

### Step 5.1: Pass lastEnrichment prop to EnrichButton

- [ ] **Step 5.1.1: Read current page implementation**

Run:
```bash
cat src/app/companies/[ticker]/page.tsx
```

Note where `<EnrichButton>` is rendered.

- [ ] **Step 5.1.2: Update EnrichButton call**

Modify the `<EnrichButton>` usage in `src/app/companies/[ticker]/page.tsx`:
```typescript
<EnrichButton
  ticker={ticker}
  lastEnrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}
  onSuccess={fetchCompany}
  variant="default"
/>
```

- [ ] **Step 5.1.3: Verify TypeScript compilation**

Run:
```bash
npm run type-check
```

Expected: No errors

- [ ] **Step 5.1.4: Commit**

```bash
git add src/app/companies/[ticker]/page.tsx
git commit -m "feat: pass lastEnrichment to EnrichButton on detail page"
```

---

## Task 6: End-to-End Verification

**Files:**
- None (verification only)

### Step 6.1: Run all tests

- [ ] **Step 6.1.1: Run unit tests**

Run:
```bash
npm test
```

Expected: All tests PASS (68+ tests)

- [ ] **Step 6.1.2: Run type checking**

Run:
```bash
npm run type-check
```

Expected: No TypeScript errors

- [ ] **Step 6.1.3: Run production build**

Run:
```bash
npm run build
```

Expected: Build succeeds with no errors

### Step 6.2: Manual UI verification

- [ ] **Step 6.2.1: Start development server**

Run:
```bash
docker compose up -d
npm run dev
```

Navigate to: http://localhost:3000

- [ ] **Step 6.2.2: Test with enriched company**

1. Log in with demo user
2. Navigate to `/companies/AAPL` (or any enriched company)
3. Verify timestamp appears below Enrich button (e.g., "2 hours ago")
4. Verify Clock icon is present
5. Verify color is gray for fresh data, yellow for stale (>7 days)

- [ ] **Step 6.2.3: Test with un-enriched company**

1. Navigate to a company with no enrichment
2. Verify no timestamp appears (only button visible)

- [ ] **Step 6.2.4: Test during enrichment**

1. Click "Enrich with AI" button
2. Verify timestamp disappears while loading
3. Verify timestamp reappears with "just now" after enrichment completes

- [ ] **Step 6.2.5: Test Spanish translation**

1. Switch locale to Spanish (if locale switcher exists, or via URL param)
2. Verify Spanish translations appear (e.g., "hace 2 horas")
3. Verify pluralization works correctly

### Step 6.3: Final commit and documentation

- [ ] **Step 6.3.1: Update changelog**

Add to `docs/changelog-multi-company.md` (or create new changelog entry):
```markdown
## [2026-07-09] Last Enrichment Timestamp

**Feature**: Display relative timestamp of last enrichment next to Enrich button

**Changes**:
- Added `formatRelativeTime` utility in `src/shared/lib/date.ts`
- Added i18n translations for relative time (English + Spanish)
- Modified `EnrichButton` component to display timestamp badge
- Updated company detail page to pass `lastEnrichment` prop
- Added 15+ unit and component tests

**Impact**: Users can now see when data was last refreshed, reducing unnecessary API calls
```

- [ ] **Step 6.3.2: Final verification commit**

Run:
```bash
git add docs/changelog-multi-company.md
git commit -m "docs: add last enrichment timestamp feature to changelog"
```

- [ ] **Step 6.3.3: Create feature summary**

Run:
```bash
git log --oneline --grep="enrichment" | head -10
```

Verify all commits are present with descriptive messages.

---

## Completion Checklist

- [ ] All unit tests pass (formatRelativeTime utility)
- [ ] All component tests pass (EnrichButton timestamp display)
- [ ] i18n translations added (English + Spanish)
- [ ] TypeScript compilation succeeds
- [ ] Production build succeeds
- [ ] Manual UI verification complete (enriched, un-enriched, loading states)
- [ ] Locale switching verified (Spanish translations)
- [ ] Changelog updated
- [ ] All commits follow conventional commit format

**Total estimated time**: ~45-60 minutes (15 tasks × 3-4 min average)

---

## Notes for Reviewers

1. **No external dependencies added**: Uses native Date API + existing next-intl
2. **Color logic**: Gray (<7 days fresh), Yellow (>7 days stale)
3. **i18n support**: ICU MessageFormat pluralization via next-intl
4. **Test coverage**: 15+ tests (10 utility + 5 component)
5. **Accessibility**: Uses semantic HTML + Lucide icons
6. **Performance**: No unnecessary re-renders (timestamp only updates on prop change)
