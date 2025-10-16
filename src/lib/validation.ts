import { z } from "zod";

/**
 * Input sanitization and validation utilities
 */

/**
 * Sanitize HTML to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate email
 */
export const emailSchema = z.string().email().trim().toLowerCase();

export function validateEmail(email: string): {
  valid: boolean;
  email?: string;
  error?: string;
} {
  const result = emailSchema.safeParse(email);
  if (result.success) {
    return { valid: true, email: result.data };
  }
  return { valid: false, error: result.error.issues[0]?.message };
}

/**
 * Validate product search query
 */
export const searchQuerySchema = z
  .string()
  .min(1, "Search query cannot be empty")
  .max(200, "Search query is too long")
  .transform((val) => val.trim());

/**
 * Validate price
 */
export const priceSchema = z
  .number()
  .positive("Price must be positive")
  .finite("Price must be a valid number")
  .max(1000000, "Price is too high");

/**
 * Validate pagination params
 */
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});

/**
 * API key validation
 */
export function validateApiKey(apiKey: string | null): boolean {
  if (!apiKey) return false;

  // Check if API key matches expected format (e.g., pk_xxx or sk_xxx)
  const apiKeyRegex = /^(pk|sk)_[a-zA-Z0-9]{32,}$/;
  return apiKeyRegex.test(apiKey);
}

/**
 * Remove potentially dangerous characters from user input
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .substring(0, 1000); // Limit length
}

/**
 * Validate product URL for scraping
 */
export const productUrlSchema = z
  .string()
  .url("Invalid URL")
  .refine((url) => {
    const parsed = new URL(url);
    // Add whitelist of allowed domains for scraping
    const allowedDomains = [
      "amazon.com",
      "ebay.com",
      "walmart.com",
      // Add more as needed
    ];
    return allowedDomains.some((domain) => parsed.hostname.includes(domain));
  }, "URL domain not allowed for scraping");

/**
 * Validate and sanitize object with unknown keys
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key as keyof T] = sanitizeInput(value) as T[keyof T];
    } else if (typeof value === "number" || typeof value === "boolean") {
      sanitized[key as keyof T] = value as T[keyof T];
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === "string" ? sanitizeInput(item) : item
      ) as T[keyof T];
    }
  }

  return sanitized;
}
