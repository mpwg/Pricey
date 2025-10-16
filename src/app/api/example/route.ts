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
import { withSecurity } from "@/lib/middleware";
import { withCache } from "@/lib/cache";

/**
 * Example protected API route with rate limiting and caching
 */

const handler = async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing query parameter" },
      { status: 400 }
    );
  }

  // Simulate product search
  const products = [{ id: "1", name: "Sample Product", price: 99.99 }];

  return NextResponse.json({
    success: true,
    query,
    results: products,
  });
};

// Apply security middleware with rate limiting
export const GET = withSecurity(
  withCache(handler, {
    ttl: 300, // Cache for 5 minutes
    tags: ["products", "search"],
  }),
  {
    rateLimit: {
      enabled: true,
      maxRequests: 30, // 30 requests
      interval: 60, // per minute
    },
    cors: {
      enabled: true,
    },
  }
);
