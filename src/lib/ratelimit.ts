export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter suitable for containerized API routes.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 30, windowMs: 60 * 1000 }
): { allowed: boolean; remaining: number; resetInMs: number } {
  const now = Date.now();
  const record = memoryStore.get(identifier);

  if (!record || now > record.resetAt) {
    memoryStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetInMs: config.windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetAt - now),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetInMs: Math.max(0, record.resetAt - now),
  };
}

export function clearRateLimits(): void {
  memoryStore.clear();
}
