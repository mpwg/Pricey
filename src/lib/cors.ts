import { NextRequest, NextResponse } from "next/server";

/**
 * CORS configuration for API routes
 */

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
  "http://localhost:3000",
  "https://yourdomain.com",
];

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

const ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-API-Key",
  "X-Requested-With",
];

/**
 * Apply CORS headers to response
 */
export function corsHeaders(origin?: string | null): HeadersInit {
  const isAllowedOrigin = origin && ALLOWED_ORIGINS.includes(origin);

  return {
    "Access-Control-Allow-Origin": isAllowedOrigin
      ? origin
      : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": ALLOWED_METHODS.join(", "),
    "Access-Control-Allow-Headers": ALLOWED_HEADERS.join(", "),
    "Access-Control-Max-Age": "86400", // 24 hours
    "Access-Control-Allow-Credentials": "true",
  };
}

/**
 * CORS middleware for API routes
 */
export function corsMiddleware(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin),
    });
  }

  // Check if origin is allowed
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json(
      { error: "CORS not allowed from this origin" },
      { status: 403 }
    );
  }

  return null; // Continue to next middleware/handler
}

/**
 * Add CORS headers to existing response
 */
export function withCors(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  const headers = corsHeaders(origin);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
