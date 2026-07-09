import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from './date';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, params?: any) => {
    const translations: Record<string, string | ((p: any) => string)> = {
      'relativeTime.justNow': 'just now',
      'relativeTime.minutesAgo': (p) => p.count === 1 ? '1 minute ago' : `${p.count} minutes ago`,
      'relativeTime.hoursAgo': (p) => p.count === 1 ? '1 hour ago' : `${p.count} hours ago`,
      'relativeTime.daysAgo': (p) => p.count === 1 ? '1 day ago' : `${p.count} days ago`,
      'relativeTime.monthsAgo': (p) => p.count === 1 ? '1 month ago' : `${p.count} months ago`,
    };
    const value = translations[key];
    return typeof value === 'function' ? value(params) : value;
  }
}));

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 1 minute ago', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const thirtySecondsAgo = new Date('2026-07-09T09:59:30Z');
    const result = formatRelativeTime(thirtySecondsAgo, t);
    expect(result).toBe('just now');
  });

  it('returns "1 minute ago" for singular minute', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const oneMinuteAgo = new Date('2026-07-09T09:59:00Z');
    const result = formatRelativeTime(oneMinuteAgo, t);
    expect(result).toBe('1 minute ago');
  });

  it('returns "X minutes ago" for plural minutes', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const fiveMinutesAgo = new Date('2026-07-09T09:55:00Z');
    const result = formatRelativeTime(fiveMinutesAgo, t);
    expect(result).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for singular hour', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const oneHourAgo = new Date('2026-07-09T09:00:00Z');
    const result = formatRelativeTime(oneHourAgo, t);
    expect(result).toBe('1 hour ago');
  });

  it('returns "X hours ago" for plural hours', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const fiveHoursAgo = new Date('2026-07-09T05:00:00Z');
    const result = formatRelativeTime(fiveHoursAgo, t);
    expect(result).toBe('5 hours ago');
  });

  it('returns "1 day ago" for singular day', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const oneDayAgo = new Date('2026-07-08T10:00:00Z');
    const result = formatRelativeTime(oneDayAgo, t);
    expect(result).toBe('1 day ago');
  });

  it('returns "X days ago" for plural days', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const fiveDaysAgo = new Date('2026-07-04T10:00:00Z');
    const result = formatRelativeTime(fiveDaysAgo, t);
    expect(result).toBe('5 days ago');
  });

  it('returns "1 month ago" for singular month', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const oneMonthAgo = new Date('2026-06-09T10:00:00Z');
    const result = formatRelativeTime(oneMonthAgo, t);
    expect(result).toBe('1 month ago');
  });

  it('returns "X months ago" for plural months', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const threeMonthsAgo = new Date('2026-04-09T10:00:00Z');
    const result = formatRelativeTime(threeMonthsAgo, t);
    expect(result).toBe('3 months ago');
  });

  // Boundary tests
  it('returns "just now" for exactly 59 seconds ago', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000);
    const result = formatRelativeTime(fiftyNineSecondsAgo, t);
    expect(result).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 60 seconds', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
    const result = formatRelativeTime(sixtySecondsAgo, t);
    expect(result).toBe('1 minute ago');
  });

  it('returns "59 minutes ago" for exactly 59 minutes 59 seconds', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const fiftyNineMinutesFiftyNineSecondsAgo = new Date(now.getTime() - (59 * 60 + 59) * 1000);
    const result = formatRelativeTime(fiftyNineMinutesFiftyNineSecondsAgo, t);
    expect(result).toBe('59 minutes ago');
  });

  it('returns "1 hour ago" for exactly 60 minutes', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = formatRelativeTime(sixtyMinutesAgo, t);
    expect(result).toBe('1 hour ago');
  });

  it('returns "23 hours ago" for exactly 23 hours 59 minutes', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const twentyThreeHoursFiftyNineMinutesAgo = new Date(now.getTime() - (23 * 60 + 59) * 60 * 1000);
    const result = formatRelativeTime(twentyThreeHoursFiftyNineMinutesAgo, t);
    expect(result).toBe('23 hours ago');
  });

  it('returns "1 day ago" for exactly 24 hours', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twentyFourHoursAgo, t);
    expect(result).toBe('1 day ago');
  });

  it('returns "29 days ago" for exactly 29 days 23 hours', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const twentyNineDaysTwentyThreeHoursAgo = new Date(now.getTime() - (29 * 24 + 23) * 60 * 60 * 1000);
    const result = formatRelativeTime(twentyNineDaysTwentyThreeHoursAgo, t);
    expect(result).toBe('29 days ago');
  });

  it('returns "1 month ago" for exactly 30 days', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(thirtyDaysAgo, t);
    expect(result).toBe('1 month ago');
  });

  // Error case tests
  it('returns empty string for future dates', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const futureDate = new Date('2026-07-09T11:00:00Z');
    const result = formatRelativeTime(futureDate, t);
    expect(result).toBe('');
  });

  it('returns empty string for invalid dates', async () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    const { useTranslations } = await import('next-intl');
    const t = useTranslations();
    
    const invalidDate = new Date('invalid');
    const result = formatRelativeTime(invalidDate, t);
    expect(result).toBe('');
  });
});
