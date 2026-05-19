import { NextResponse } from "next/server";

type RateLimitEntry = {
  hits: number[];
  updatedAt: number;
};

type RateLimitOptions = {
  identifier: string;
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  success: boolean;
};

declare global {
  var __burgerRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const RATE_LIMIT_STORE = globalThis.__burgerRateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalThis.__burgerRateLimitStore) {
  globalThis.__burgerRateLimitStore = RATE_LIMIT_STORE;
}

function createStoreKey(options: RateLimitOptions) {
  return `${options.key}:${options.identifier}`;
}

function pruneExpiredEntries(now: number) {
  if (RATE_LIMIT_STORE.size < 5000) {
    return;
  }

  for (const [key, entry] of RATE_LIMIT_STORE.entries()) {
    if (now - entry.updatedAt > 1000 * 60 * 60) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
}

export function getClientIdentifier(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    request.headers.get("cf-connecting-ip")
    || request.headers.get("x-real-ip")
    || "unknown"
  );
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowStart = now - options.windowMs;
  const storeKey = createStoreKey(options);
  const existingEntry = RATE_LIMIT_STORE.get(storeKey);
  const activeHits = existingEntry?.hits.filter((timestamp) => timestamp > windowStart) ?? [];
  const resetAt = activeHits[0] ? activeHits[0] + options.windowMs : now + options.windowMs;

  pruneExpiredEntries(now);

  if (activeHits.length >= options.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));

    RATE_LIMIT_STORE.set(storeKey, {
      hits: activeHits,
      updatedAt: now,
    });

    return {
      limit: options.limit,
      remaining: 0,
      resetAt,
      retryAfterSeconds,
      success: false,
    };
  }

  const nextHits = [...activeHits, now];

  RATE_LIMIT_STORE.set(storeKey, {
    hits: nextHits,
    updatedAt: now,
  });

  return {
    limit: options.limit,
    remaining: Math.max(0, options.limit - nextHits.length),
    resetAt: nextHits[0] + options.windowMs,
    retryAfterSeconds: Math.max(1, Math.ceil(options.windowMs / 1000)),
    success: true,
  };
}

export function createRateLimitResponse(
  result: RateLimitResult,
  message = "Too many requests. Please try again in a moment."
) {
  const response = NextResponse.json(
    { error: message },
    { status: 429 }
  );

  response.headers.set("Retry-After", String(result.retryAfterSeconds));
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  return response;
}
