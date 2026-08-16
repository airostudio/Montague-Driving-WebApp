// In-memory sliding-window rate limiter. Suitable for a single-instance MVP
// deployment; swap for a shared store (e.g. Redis/Upstash) once running
// multiple server instances so limits are enforced consistently.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAtMs: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  const allowed = bucket.timestamps.length < limit;
  if (allowed) {
    bucket.timestamps.push(now);
  }
  buckets.set(key, bucket);

  const oldest = bucket.timestamps[0] ?? now;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.timestamps.length),
    resetAtMs: oldest + windowMs,
  };
}

// Route calculation quota: 50 requests per hour per user, as a sensible
// per-driver default (configurable per company in a future iteration).
export const ROUTE_CALCULATION_LIMIT = 50;
export const ROUTE_CALCULATION_WINDOW_MS = 60 * 60 * 1000;
