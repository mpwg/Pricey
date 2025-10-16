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
