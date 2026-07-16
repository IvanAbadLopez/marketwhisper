interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (record.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  max: number;
  
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const record = store.get(key);

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

  record.count++;
  store.set(key, record);

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

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}
