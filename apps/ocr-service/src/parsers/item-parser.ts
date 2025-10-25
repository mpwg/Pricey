/**
 * Receipt item extraction from text
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

export interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  lineNumber: number;
  confidence: number;
}

// Patterns for price detection
const PRICE_PATTERNS = [
  /\$?\s*(\d+\.\d{2})\s*$/i, // Price at end of line
  /\$\s*(\d+\.\d{2})/i, // Dollar sign followed by price
  /(\d+\.\d{2})\s*(?:ea|each)?$/i, // Price with optional "ea" or "each"
];

// Patterns for quantity detection
const QUANTITY_PATTERNS = [
  /^(\d+)\s*@/i, // "2 @ $3.99"
  /^(\d+)\s*x/i, // "2 x Item"
  /qty:?\s*(\d+)/i, // "Qty: 2"
];

// Lines to skip (not items)
const SKIP_PATTERNS = [
  /^total/i,
  /^subtotal/i,
  /^tax/i,
  /^payment/i,
  /^change/i,
  /^cash/i,
  /^card/i,
  /^thank\s*you/i,
  /^please/i,
  /^store/i,
  /^customer/i,
  /^cashier/i,
  /^register/i,
  /^transaction/i,
  /^receipt/i,
  /^date/i,
  /^time/i,
  /^items?\s*purchased/i,
  /^\s*$/,
  /^[-=*]+$/,
];

/**
 * Extract items from receipt text
 * @param text - OCR extracted text
 * @returns Array of receipt items
 */
export function extractItems(text: string): ReceiptItem[] {
  const lines = text.split('\n');
  const items: ReceiptItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Skip non-item lines
    if (shouldSkipLine(line)) {
      continue;
    }

    // Try to extract item from line
    const item = extractItemFromLine(line, i);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Check if a line should be skipped
 * @param line - Text line
 * @returns True if should skip
 */
function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some((pattern) => pattern.test(line));
}

/**
 * Extract item from a single line
 * @param line - Text line
 * @param lineNumber - Line number in receipt
 * @returns Receipt item or null
 */
function extractItemFromLine(
  line: string,
  lineNumber: number
): ReceiptItem | null {
  // Try to extract price
  let price: number | null = null;
  let priceMatch: RegExpMatchArray | null = null;

  for (const pattern of PRICE_PATTERNS) {
    const match = line.match(pattern);
    if (match?.[1]) {
      const parsedPrice = parseFloat(match[1]);
      if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice < 10000) {
        price = parsedPrice;
        priceMatch = match;
        break;
      }
    }
  }

  if (!price || !priceMatch) {
    return null;
  }

  // Extract item name (everything before the price)
  const name = line.substring(0, priceMatch.index).trim().replace(/\s+/g, ' ');

  if (!name || name.length < 2) {
    return null;
  }

  // Try to extract quantity
  let quantity = 1;
  for (const pattern of QUANTITY_PATTERNS) {
    const match = name.match(pattern);
    if (match?.[1]) {
      const parsedQty = parseInt(match[1], 10);
      if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty < 100) {
        quantity = parsedQty;
        break;
      }
    }
  }

  // Calculate confidence based on pattern matching
  const confidence = calculateConfidence(line, name, price);

  return {
    name: cleanItemName(name),
    price,
    quantity,
    lineNumber,
    confidence,
  };
}

/**
 * Clean up item name
 * @param name - Raw item name
 * @returns Cleaned name
 */
function cleanItemName(name: string): string {
  return (
    name
      // Remove quantity patterns
      .replace(/^\d+\s*[@x]\s*/i, '')
      .replace(/qty:?\s*\d+/i, '')
      // Remove extra whitespace
      .trim()
      .replace(/\s+/g, ' ')
  );
}

/**
 * Calculate confidence score for extracted item
 * @param line - Original line
 * @param name - Extracted name
 * @param price - Extracted price
 * @returns Confidence score (0-1)
 */
function calculateConfidence(
  line: string,
  name: string,
  price: number
): number {
  let confidence = 0.5; // Base confidence

  // Boost confidence if price is well-formatted
  if (/\$\s*\d+\.\d{2}/.test(line)) {
    confidence += 0.2;
  }

  // Boost confidence if name is reasonable length
  if (name.length >= 5 && name.length <= 50) {
    confidence += 0.1;
  }

  // Boost confidence if price is reasonable
  if (price >= 0.5 && price <= 500) {
    confidence += 0.1;
  }

  // Reduce confidence if line has unusual characters
  if (/[^a-z0-9\s$.,@-]/i.test(line)) {
    confidence -= 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}
