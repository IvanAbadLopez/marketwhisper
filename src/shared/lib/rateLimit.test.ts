import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkRateLimit, getClientIp } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within limit', () => {
    const result1 = checkRateLimit('test:key', { max: 3, windowMs: 60000 });
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = checkRateLimit('test:key', { max: 3, windowMs: 60000 });
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);
  });

  it('blocks requests exceeding limit', () => {
    checkRateLimit('test:key2', { max: 2, windowMs: 60000 });
    checkRateLimit('test:key2', { max: 2, windowMs: 60000 });
    
    const result = checkRateLimit('test:key2', { max: 2, windowMs: 60000 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('resets after window expires', () => {
    checkRateLimit('test:key3', { max: 1, windowMs: 60000 });
    const blocked = checkRateLimit('test:key3', { max: 1, windowMs: 60000 });
    expect(blocked.success).toBe(false);

    vi.advanceTimersByTime(61000);

    const allowed = checkRateLimit('test:key3', { max: 1, windowMs: 60000 });
    expect(allowed.success).toBe(true);
    expect(allowed.remaining).toBe(0);
  });

  it('returns correct reset timestamp', () => {
    const now = Date.now();
    const result = checkRateLimit('test:key4', { max: 5, windowMs: 120000 });
    
    expect(result.reset).toBeGreaterThan(now);
    expect(result.reset).toBeLessThanOrEqual(now + 120000);
  });

  it('isolates different keys', () => {
    checkRateLimit('user:1', { max: 1, windowMs: 60000 });
    checkRateLimit('user:1', { max: 1, windowMs: 60000 });
    
    const result = checkRateLimit('user:2', { max: 1, windowMs: 60000 });
    expect(result.success).toBe(true);
  });

  it('returns correct limit values', () => {
    const result = checkRateLimit('test:key5', { max: 10, windowMs: 60000 });
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
  });

  it('handles zero remaining correctly', () => {
    checkRateLimit('test:key6', { max: 1, windowMs: 60000 });
    const result = checkRateLimit('test:key6', { max: 1, windowMs: 60000 });
    
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('maintains count within window', () => {
    const result1 = checkRateLimit('test:key7', { max: 5, windowMs: 60000 });
    expect(result1.remaining).toBe(4);
    
    vi.advanceTimersByTime(30000);
    
    const result2 = checkRateLimit('test:key7', { max: 5, windowMs: 60000 });
    expect(result2.remaining).toBe(3);
  });

  it('allows first request immediately after expiration', () => {
    checkRateLimit('test:key8', { max: 1, windowMs: 60000 });
    checkRateLimit('test:key8', { max: 1, windowMs: 60000 });
    
    vi.advanceTimersByTime(60001);
    
    const result = checkRateLimit('test:key8', { max: 1, windowMs: 60000 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(request)).toBe('1.2.3.4');
  });

  it('extracts IP from x-real-ip header', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-real-ip': '9.8.7.6' },
    });
    expect(getClientIp(request)).toBe('9.8.7.6');
  });

  it('returns unknown when no headers present', () => {
    const request = new Request('http://localhost');
    expect(getClientIp(request)).toBe('unknown');
  });

  it('prioritizes x-forwarded-for over x-real-ip', () => {
    const request = new Request('http://localhost', {
      headers: {
        'x-forwarded-for': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
      },
    });
    expect(getClientIp(request)).toBe('1.1.1.1');
  });

  it('handles multiple IPs in x-forwarded-for', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' },
    });
    expect(getClientIp(request)).toBe('1.1.1.1');
  });

  it('trims whitespace from forwarded IP', () => {
    const request = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '  1.1.1.1  ' },
    });
    expect(getClientIp(request)).toBe('1.1.1.1');
  });
});
