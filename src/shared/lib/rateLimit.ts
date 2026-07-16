/**
 * Simple in-memory rate limiter (resets per instance, no Redis required)
 * Suitable for demo/TFM deployment. For production, use @upstash/ratelimit.
 * 
 * Uses sliding window with Map<key, { count, resetAt }>
 * Keys are typically: `ip:endpoint` or `userId:endpoint`
 */

interface RateLimitRecord {
  count: number;
  resetAt: number; // timestamp in ms
}

const store = new Map<string, RateLimitRecord>();

// Cleanup old entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /**
   * Max requests allowed in the window
   */
  max: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // timestamp when limit resets
}

/**
 * Check if a request is rate-limited
 * @param key - Unique identifier (e.g., "user:123:analyze" or "ip:1.2.3.4:login")
 * @param options - Rate limit configuration
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

  // No record or expired window → allow and create new record
  if (!record || record.resetAt < now) {
    const resetAt = now + options.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: options.max,
      remaining: options.max - 1,
      reset: resetAt,
    };
  }

  // Within window → increment count
  record.count++;
  store.set(key, record);

  // Check if limit exceeded
  if (record.count > options.max) {
    return {
      success: false,
      limit: options.max,
      remaining: 0,
      reset: record.resetAt,
    };
  }

  return {
    success: true,
    limit: options.max,
    remaining: options.max - record.count,
    reset: record.resetAt,
  };
}

/**
 * Get client IP from request (works with Vercel, local dev, proxies)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  
  // Fallback for local dev
  return 'unknown';
}
