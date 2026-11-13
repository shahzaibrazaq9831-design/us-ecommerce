/**
 * Rate limiting — a small, honest brake on the endpoints that cost money
 * or write to disk.
 *
 * The checkout, the review form and the newsletter all write something
 * (an order, a review, a subscriber) and all of them can be called over
 * and over by a script. This module counts the calls per client address
 * and says no when there have been too many.
 *
 * The counts live in the memory of this one server process, which is the
 * right size for a single shop on one host: no package, no database, no
 * configuration. When the store is spread over several servers, swap the
 * `hits` map for a shared store (Redis, Upstash) and the rest of the
 * code keeps working — the functions below are the whole API.
 */

interface Hit {
  /** How many calls we have seen since the window opened. */
  count: number;
  /** When the window closes (milliseconds since the epoch). */
  resetAt: number;
}

const hits = new Map<string, Hit>();

/** How often the old windows are swept out of memory. */
const SWEEP_EVERY = 100;

/** How many calls we have seen since the last sweep. */
let sinceSweep = 0;

/** Remove the windows that have closed. */
function sweep(now: number): void {
  sinceSweep += 1;
  if (sinceSweep < SWEEP_EVERY) return;

  sinceSweep = 0;
  for (const [key, hit] of hits) {
    if (hit.resetAt <= now) hits.delete(key);
  }
}

/** What the limiter says about one call. */
export interface RateLimitResult {
  /** False when the caller has used up their allowance. */
  ok: boolean;
  /** How many calls are left in this window. */
  remaining: number;
  /** How long the caller should wait, in seconds. */
  retryAfterSeconds: number;
  /** The allowance for the window. */
  limit: number;
}

/**
 * Count one call and say whether it is allowed.
 *
 * The window is fixed: the first call opens it, and the allowance is
 * used up until it closes.
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = hits.get(key);

  if (!existing || existing.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: 0, limit };
  }

  existing.count += 1;

  if (existing.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      limit,
    };
  }

  return {
    ok: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
    limit,
  };
}

/** The caller's address, as best we can tell from the request. */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/** The key one endpoint counts its calls under. */
export function rateLimitKey(request: Request, scope: string): string {
  return `${scope}:${clientAddress(request)}`;
}

/**
 * The allowances the store uses.
 *
 * They are numbers here rather than scattered through the routes, so the
 * shape of the limits can be read in one place.
 */
export const RATE_LIMITS = {
  /** Placing an order. */
  checkout: { limit: 5, windowMs: 10 * 60 * 1000 },
  /** Looking an order up. */
  orderLookup: { limit: 10, windowMs: 10 * 60 * 1000 },
  /** Writing a review. */
  review: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** Signing up for the newsletter. */
  newsletter: { limit: 5, windowMs: 60 * 60 * 1000 },
} as const;
