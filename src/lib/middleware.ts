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
import { rateLimitMiddleware } from "@/lib/rate-limit";
import { corsMiddleware, withCors } from "@/lib/cors";

/**
 * Middleware composer for API routes
 * Combines rate limiting, CORS, and other security features
 */

export type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export interface SecurityConfig {
  rateLimit?: {
    enabled: boolean;
    maxRequests?: number;
    interval?: number;
  };
  cors?: {
    enabled: boolean;
  };
  apiKey?: {
    required: boolean;
  };
}

const defaultConfig: SecurityConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 60,
    interval: 60,
  },
  cors: {
    enabled: true,
  },
  apiKey: {
    required: false,
  },
};

/**
 * Verify API key from request
 */
function verifyApiKey(req: NextRequest): boolean {
  const apiKey = req.headers.get("x-api-key");
  const validKeys = process.env.API_KEYS?.split(",") || [];

  if (validKeys.length === 0) {
    console.error("No API keys configured in environment variables");
    return false;
  }

  return apiKey ? validKeys.includes(apiKey) : false;
}

/**
 * Apply security middleware to API handler
 */
export function withSecurity(
  handler: ApiHandler,
  config: SecurityConfig = defaultConfig
): ApiHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    // 1. CORS check
    if (config.cors?.enabled) {
      const corsResponse = corsMiddleware(req);
      if (corsResponse) return corsResponse;
    }

    // 2. API Key validation
    if (config.apiKey?.required) {
      if (!verifyApiKey(req)) {
        return NextResponse.json(
          { error: "Unauthorized", message: "Invalid or missing API key" },
          { status: 401 }
        );
      }
    }

    // 3. Rate limiting
    if (config.rateLimit?.enabled) {
      const rateLimitResponse = await rateLimitMiddleware(req, {
        maxRequests: config.rateLimit.maxRequests || 60,
        interval: config.rateLimit.interval || 60,
      });

      if (rateLimitResponse && rateLimitResponse.status === 429) {
        return rateLimitResponse;
      }
    }

    // 4. Execute handler
    try {
      const response = await handler(req);

      // 5. Add CORS headers to response
      if (config.cors?.enabled) {
        return withCors(response, req.headers.get("origin"));
      }

      return response;
    } catch (error) {
      console.error("API error:", error);

      return NextResponse.json(
        {
          error: "Internal Server Error",
          message:
            process.env.NODE_ENV === "development"
              ? (error as Error).message
              : "An unexpected error occurred",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Example usage in an API route:
 *
 * export const GET = withSecurity(async (req: NextRequest) => {
 *   const data = await fetchData();
 *   return NextResponse.json(data);
 * }, {
 *   rateLimit: { enabled: true, maxRequests: 100 },
 *   cors: { enabled: true },
 *   apiKey: { required: true },
 * });
 */
