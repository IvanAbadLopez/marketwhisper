import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from './date';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for dates less than 1 minute ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const thirtySecondsAgo = new Date('2026-07-09T09:59:30Z');
    const result = formatRelativeTime(thirtySecondsAgo);
    expect(result).toBe('just now');
  });

  it('returns "1 minute ago" for singular minute', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneMinuteAgo = new Date('2026-07-09T09:59:00Z');
    const result = formatRelativeTime(oneMinuteAgo);
    expect(result).toBe('1 minute ago');
  });

  it('returns "X minutes ago" for plural minutes', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveMinutesAgo = new Date('2026-07-09T09:55:00Z');
    const result = formatRelativeTime(fiveMinutesAgo);
    expect(result).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for singular hour', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneHourAgo = new Date('2026-07-09T09:00:00Z');
    const result = formatRelativeTime(oneHourAgo);
    expect(result).toBe('1 hour ago');
  });

  it('returns "X hours ago" for plural hours', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveHoursAgo = new Date('2026-07-09T05:00:00Z');
    const result = formatRelativeTime(fiveHoursAgo);
    expect(result).toBe('5 hours ago');
  });

  it('returns "1 day ago" for singular day', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneDayAgo = new Date('2026-07-08T10:00:00Z');
    const result = formatRelativeTime(oneDayAgo);
    expect(result).toBe('1 day ago');
  });

  it('returns "X days ago" for plural days', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveDaysAgo = new Date('2026-07-04T10:00:00Z');
    const result = formatRelativeTime(fiveDaysAgo);
    expect(result).toBe('5 days ago');
  });

  it('returns "1 month ago" for singular month', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneMonthAgo = new Date('2026-06-09T10:00:00Z');
    const result = formatRelativeTime(oneMonthAgo);
    expect(result).toBe('1 month ago');
  });

  it('returns "X months ago" for plural months', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const threeMonthsAgo = new Date('2026-04-09T10:00:00Z');
    const result = formatRelativeTime(threeMonthsAgo);
    expect(result).toBe('3 months ago');
  });

  // Boundary tests
  it('returns "just now" for exactly 59 seconds ago', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000);
    const result = formatRelativeTime(fiftyNineSecondsAgo);
    expect(result).toBe('just now');
  });

  it('returns "1 minute ago" for exactly 60 seconds', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const sixtySecondsAgo = new Date(now.getTime() - 60 * 1000);
    const result = formatRelativeTime(sixtySecondsAgo);
    expect(result).toBe('1 minute ago');
  });

  it('returns "59 minutes ago" for exactly 59 minutes 59 seconds', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiftyNineMinutesFiftyNineSecondsAgo = new Date(now.getTime() - (59 * 60 + 59) * 1000);
    const result = formatRelativeTime(fiftyNineMinutesFiftyNineSecondsAgo);
    expect(result).toBe('59 minutes ago');
  });

  it('returns "1 hour ago" for exactly 60 minutes', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const sixtyMinutesAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const result = formatRelativeTime(sixtyMinutesAgo);
    expect(result).toBe('1 hour ago');
  });

  it('returns "23 hours ago" for exactly 23 hours 59 minutes', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const twentyThreeHoursFiftyNineMinutesAgo = new Date(now.getTime() - (23 * 60 + 59) * 60 * 1000);
    const result = formatRelativeTime(twentyThreeHoursFiftyNineMinutesAgo);
    expect(result).toBe('23 hours ago');
  });

  it('returns "1 day ago" for exactly 24 hours', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twentyFourHoursAgo);
    expect(result).toBe('1 day ago');
  });

  it('returns "29 days ago" for exactly 29 days 23 hours', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const twentyNineDaysTwentyThreeHoursAgo = new Date(now.getTime() - (29 * 24 + 23) * 60 * 60 * 1000);
    const result = formatRelativeTime(twentyNineDaysTwentyThreeHoursAgo);
    expect(result).toBe('29 days ago');
  });

  it('returns "1 month ago" for exactly 30 days', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(thirtyDaysAgo);
    expect(result).toBe('1 month ago');
  });

  // Error case tests
  it('returns empty string for future dates', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const futureDate = new Date('2026-07-09T11:00:00Z');
    const result = formatRelativeTime(futureDate);
    expect(result).toBe('');
  });

  it('returns empty string for invalid dates', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const invalidDate = new Date('invalid');
    const result = formatRelativeTime(invalidDate);
    expect(result).toBe('');
  });
});
