# Last Enrichment Timestamp - Design Document

**Date**: 2026-07-09  
**Feature**: Display relative timestamp of last enrichment next to Enrich button  
**Objective**: Help users decide whether to re-enrich a company by showing when data was last updated

## Problem Statement

Users currently have no visibility into when a company was last enriched with Finnhub data. This leads to:
- Unnecessary API calls to Finnhub (wasting rate limit quota)
- Uncertainty about data freshness
- Potential confusion about whether enrichment is needed

## Solution Overview

Add a relative timestamp indicator ("2 hours ago", "hace 2 horas") next to the Enrich button, sourced from `CompanyEnrichment.createdAt`. This provides at-a-glance feedback on data freshness before the user clicks Enrich.

## Architecture

### 1. Shared Utility: `formatRelativeTime`

**Location**: `src/shared/lib/date.ts`

**Signature**:
```typescript
export function formatRelativeTime(date: Date, locale: string): string
```

**Logic**:
```typescript
const diffMs = Date.now() - date.getTime();
const diffMinutes = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMinutes < 1) return t('relativeTime.justNow');
if (diffMinutes < 60) return t('relativeTime.minutesAgo', { count: diffMinutes });
if (diffHours < 24) return t('relativeTime.hoursAgo', { count: diffHours });
if (diffDays < 30) return t('relativeTime.daysAgo', { count: diffDays });
return t('relativeTime.monthsAgo', { count: Math.floor(diffDays / 30) });
```

**Dependencies**:
- `next-intl` for i18n pluralization
- No external date libraries (use native Date API)

### 2. Component Modification: `EnrichButton`

**Location**: `src/features/enrich-company/ui/EnrichButton.tsx`

**New Prop**:
```typescript
interface EnrichButtonProps {
  ticker: string;
  lastEnrichment?: { createdAt: Date } | null;  // NEW
  onSuccess?: () => void;
  variant?: "default" | "compact";
  className?: string;
}
```

**Visual Layout**:
```
┌─────────────────────┐
│  ✨ Enrich with AI  │  ← Main button (unchanged)
└─────────────────────┘
  🕐 2 hours ago        ← Timestamp badge (new, below button, right-aligned)
```

**Rendering Logic**:
```tsx
<div className="flex flex-col items-end gap-1">
  {/* Existing button */}
  <button>{/* ... */}</button>
  
  {/* New timestamp badge */}
  {lastEnrichment && !loading && (
    <div className={`flex items-center gap-1 text-xs ${ageColor}`}>
      <Clock className="w-3 h-3" />
      <span>{formatRelativeTime(lastEnrichment.createdAt, locale)}</span>
    </div>
  )}
</div>
```

**Color Logic**:
```typescript
const ageInDays = lastEnrichment 
  ? (Date.now() - lastEnrichment.createdAt.getTime()) / 86400000 
  : 0;

const ageColor = 
  ageInDays > 7 
    ? 'text-yellow-600 dark:text-yellow-400'  // Stale (>7 days)
    : 'text-zinc-500 dark:text-zinc-400';     // Fresh (<7 days)
```

**Behavior**:
- Timestamp **hidden** while `loading === true` (avoids visual clutter during enrichment)
- Timestamp **hidden** if `lastEnrichment` is `null` (no previous enrichment)
- Icon: Lucide `Clock` component (w-3 h-3)

### 3. Page Integration: `companies/[ticker]/page.tsx`

**Modification**:
```tsx
<EnrichButton
  ticker={ticker}
  lastEnrichment={company.enrichments?.find(e => e.source === "FINNHUB") || null}  // NEW
  onSuccess={fetchCompany}
  variant="default"
/>
```

No other changes to the page layout required.

### 4. Internationalization (i18n)

**English** (`src/messages/en.json`):
```json
{
  "relativeTime": {
    "justNow": "just now",
    "minutesAgo": "{count, plural, one {# minute ago} other {# minutes ago}}",
    "hoursAgo": "{count, plural, one {# hour ago} other {# hours ago}}",
    "daysAgo": "{count, plural, one {# day ago} other {# days ago}}",
    "monthsAgo": "{count, plural, one {# month ago} other {# months ago}}"
  }
}
```

**Spanish** (`src/messages/es.json`):
```json
{
  "relativeTime": {
    "justNow": "ahora mismo",
    "minutesAgo": "{count, plural, one {hace # minuto} other {hace # minutos}}",
    "hoursAgo": "{count, plural, one {hace # hora} other {hace # horas}}",
    "daysAgo": "{count, plural, one {hace # día} other {hace # días}}",
    "monthsAgo": "{count, plural, one {hace # mes} other {hace # meses}}"
  }
}
```

**Note**: Using ICU MessageFormat pluralization supported by `next-intl`.

## Testing Strategy

### Unit Tests: `formatRelativeTime` (`src/shared/lib/date.test.ts`)

```typescript
describe('formatRelativeTime', () => {
  it('returns "just now" for very recent dates');
  it('formats minutes correctly (singular)');
  it('formats minutes correctly (plural)');
  it('formats hours correctly');
  it('formats days correctly');
  it('formats months correctly');
  it('handles Spanish locale correctly');
  it('handles edge case: exactly 1 minute');
  it('handles edge case: exactly 24 hours');
});
```

**Total**: ~9 tests

### Component Tests: `EnrichButton.test.tsx` (additions)

```typescript
describe('EnrichButton - timestamp display', () => {
  it('does not show timestamp when lastEnrichment is null');
  it('shows timestamp when lastEnrichment is provided');
  it('hides timestamp while loading');
  it('shows fresh color for enrichment < 7 days old');
  it('shows stale color for enrichment > 7 days old');
  it('updates timestamp text in Spanish locale');
});
```

**Total**: ~6 tests

**Grand Total**: ~15 new tests

## Non-Goals (Out of Scope)

- ❌ Caching recommendation_trends API calls (decided not needed - PostgreSQL persistence sufficient)
- ❌ Automatic re-enrichment triggers based on age
- ❌ User-configurable staleness thresholds
- ❌ Timestamp in other components (only EnrichButton for now)

## Success Metrics

1. **User Behavior**: Users make fewer redundant enrichment calls for recently enriched companies
2. **UX**: Clear visibility into data freshness before clicking Enrich
3. **Code Quality**: 100% test coverage for `formatRelativeTime` utility
4. **Performance**: No measurable impact on page load (timestamp formatting is O(1))

## Future Enhancements (Not in v1)

- Show timestamp in EnrichmentDisplay header (in addition to button)
- Visual indicator (badge) if enrichment is >30 days old
- Auto-suggest re-enrichment for very stale data (>90 days)

## Dependencies

- **Existing**: `next-intl` (already in project for i18n)
- **New**: None (uses native Date API)

## Migration Notes

- No database migration required (uses existing `CompanyEnrichment.createdAt`)
- No breaking changes (new prop is optional)
- Backward compatible (timestamp hidden if `lastEnrichment` not provided)

## Files to Create/Modify

### Create:
1. `src/shared/lib/date.ts` - formatRelativeTime utility
2. `src/shared/lib/date.test.ts` - unit tests

### Modify:
3. `src/features/enrich-company/ui/EnrichButton.tsx` - add timestamp display
4. `src/app/companies/[ticker]/page.tsx` - pass lastEnrichment prop
5. `src/messages/en.json` - add relativeTime i18n keys
6. `src/messages/es.json` - add relativeTime i18n keys (Spanish)

**Total**: 2 new files, 4 modifications
