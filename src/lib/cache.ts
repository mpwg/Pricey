import { NextRequest, NextResponse } from "next/server";
import { redis } from "./redis";

/**
 * Response caching strategies using Redis
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  revalidate?: number; // Revalidation time (ISR style)
}

/**
 * Generate cache key from request
 */
export function getCacheKey(req: NextRequest, prefix: string = "api"): string {
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  const path = url.pathname;

  return `${prefix}:${path}${searchParams ? `:${searchParams}` : ""}`;
}

/**
 * Get cached response
 */
export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error("Cache get error:", error);
    return null;
  }
}

/**
 * Set cached response
 */
export async function setCachedResponse(
  key: string,
  data: any,
  options: CacheOptions = {}
): Promise<void> {
  const { ttl = 300, tags = [] } = options; // Default 5 minutes

  try {
    const value = JSON.stringify(data);

    // Set main cache
    await redis.setex(key, ttl, value);

    // Store cache tags for invalidation
    if (tags.length > 0) {
      const tagKey = `cache:tags:${key}`;
      await redis.setex(tagKey, ttl, JSON.stringify(tags));

      // Add key to each tag set
      for (const tag of tags) {
        await redis.sadd(`cache:tag:${tag}`, key);
        await redis.expire(`cache:tag:${tag}`, ttl);
      }
    }
  } catch (error) {
    console.error("Cache set error:", error);
  }
}

/**
 * Invalidate cache by tag
 */
export async function invalidateCacheByTag(tag: string): Promise<void> {
  try {
    const keys = await redis.smembers(`cache:tag:${tag}`);

    if (keys.length > 0) {
      await redis.del(...keys);
      await redis.del(`cache:tag:${tag}`);
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

/**
 * Invalidate specific cache key
 */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
}

/**
 * Cache middleware wrapper for API routes
 */
export function withCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: CacheOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return handler(req);
    }

    const cacheKey = getCacheKey(req);

    // Try to get from cache
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": `public, max-age=${options.ttl || 300}`,
        },
      });
    }

    // Execute handler
    const response = await handler(req);
    const data = await response.json();

    // Cache the response
    await setCachedResponse(cacheKey, data, options);

    return NextResponse.json(data, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": `public, max-age=${options.ttl || 300}`,
      },
    });
  };
}

/**
 * Stale-While-Revalidate caching strategy
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, revalidate = 60 } = options;

  const cached = await getCachedResponse(key);
  const cacheTime = await redis.get(`${key}:time`);
  const now = Date.now();

  // Return cached data if available and fresh
  if (cached && cacheTime) {
    const age = now - parseInt(cacheTime, 10);

    if (age < revalidate * 1000) {
      return cached;
    }

    // Return stale data and revalidate in background
    if (age < ttl * 1000) {
      // Revalidate in background
      fetcher().then((data) => {
        setCachedResponse(key, data, options);
        redis.set(`${key}:time`, now.toString(), "EX", ttl);
      });

      return cached;
    }
  }

  // Fetch fresh data
  const data = await fetcher();
  await setCachedResponse(key, data, options);
  await redis.set(`${key}:time`, now.toString(), "EX", ttl);

  return data;
}
