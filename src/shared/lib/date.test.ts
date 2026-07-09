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
    const result = formatRelativeTime(thirtySecondsAgo, 'en');
    expect(result).toBe('just now');
  });

  it('returns "1 minute ago" for singular minute', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneMinuteAgo = new Date('2026-07-09T09:59:00Z');
    const result = formatRelativeTime(oneMinuteAgo, 'en');
    expect(result).toBe('1 minute ago');
  });

  it('returns "X minutes ago" for plural minutes', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveMinutesAgo = new Date('2026-07-09T09:55:00Z');
    const result = formatRelativeTime(fiveMinutesAgo, 'en');
    expect(result).toBe('5 minutes ago');
  });

  it('returns "1 hour ago" for singular hour', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneHourAgo = new Date('2026-07-09T09:00:00Z');
    const result = formatRelativeTime(oneHourAgo, 'en');
    expect(result).toBe('1 hour ago');
  });

  it('returns "X hours ago" for plural hours', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveHoursAgo = new Date('2026-07-09T05:00:00Z');
    const result = formatRelativeTime(fiveHoursAgo, 'en');
    expect(result).toBe('5 hours ago');
  });

  it('returns "1 day ago" for singular day', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneDayAgo = new Date('2026-07-08T10:00:00Z');
    const result = formatRelativeTime(oneDayAgo, 'en');
    expect(result).toBe('1 day ago');
  });

  it('returns "X days ago" for plural days', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const fiveDaysAgo = new Date('2026-07-04T10:00:00Z');
    const result = formatRelativeTime(fiveDaysAgo, 'en');
    expect(result).toBe('5 days ago');
  });

  it('returns "1 month ago" for singular month', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const oneMonthAgo = new Date('2026-06-09T10:00:00Z');
    const result = formatRelativeTime(oneMonthAgo, 'en');
    expect(result).toBe('1 month ago');
  });

  it('returns "X months ago" for plural months', () => {
    const now = new Date('2026-07-09T10:00:00Z');
    vi.setSystemTime(now);
    
    const threeMonthsAgo = new Date('2026-04-09T10:00:00Z');
    const result = formatRelativeTime(threeMonthsAgo, 'en');
    expect(result).toBe('3 months ago');
  });
});
