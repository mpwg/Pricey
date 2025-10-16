/**
 * Pricey - Find the best price
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

interface RateLimitConfig {
  interval: number; // Time window in seconds
  maxRequests: number; // Max requests per interval
}

const defaultConfig: RateLimitConfig = {
  interval: 60, // 1 minute
  maxRequests: 60, // 60 requests per minute
};

/**
 * Rate limiting middleware using Redis
 *
 * @param identifier - Unique identifier (IP, user ID, API key)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig = defaultConfig
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const window = config.interval * 1000; // Convert to milliseconds

  try {
    // Get current count
    const current = await redis.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= config.maxRequests) {
      const ttl = await redis.ttl(key);
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        reset: now + ttl * 1000,
      };
    }

    // Increment counter
    const pipeline = redis.pipeline();
    pipeline.incr(key);

    if (count === 0) {
      pipeline.expire(key, config.interval);
    }

    await pipeline.exec();

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - count - 1,
      reset: now + window,
    };
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail open - allow request if Redis is down
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      reset: now + window,
    };
  }
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  config?: RateLimitConfig
): Promise<NextResponse | null> {
  // Get identifier from IP or API key
  const identifier =
    req.headers.get("x-api-key") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "anonymous";

  const result = await rateLimit(identifier, config);

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": result.limit.toString(),
          "X-RateLimit-Remaining": result.remaining.toString(),
          "X-RateLimit-Reset": result.reset.toString(),
          "Retry-After": Math.ceil(
            (result.reset - Date.now()) / 1000
          ).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  return NextResponse.next({
    headers: {
      "X-RateLimit-Limit": result.limit.toString(),
      "X-RateLimit-Remaining": result.remaining.toString(),
      "X-RateLimit-Reset": result.reset.toString(),
    },
  });
}
