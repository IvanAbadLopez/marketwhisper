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
});
