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

// Patterns for price detection (US and European formats)
const PRICE_PATTERNS = [
  // US format: $12.99, 12.99
  /\$?\s*(\d+\.\d{2})\s*$/i,
  /\$\s*(\d+\.\d{2})/i,
  /(\d+\.\d{2})\s*(?:ea|each)?$/i,

  // European format: 12,99 or 12.99 or just numbers at end
  /(\d+[,.]?\d{2})\s*€?\s*$/i, // Price at end of line with optional €
  /€\s*(\d+[,.]?\d{2})/i, // Euro sign followed by price

  // Austrian format: "2 229" means 2.29 (with space as decimal separator)
  /(\d+)\s+(\d{2,3})\s*$/i, // Two or three digit cents after space

  // Simple number at end (cents only, like "299" for 2.99)
  /\b(\d{2,4})\s*$/i, // 2-4 digits at end of line
];

// Patterns for quantity detection
const QUANTITY_PATTERNS = [
  /^(\d+)\s*[@x×]\s*/i, // "2 @ $3.99" or "2 x Item" or "2 × Item"
  /qty:?\s*(\d+)/i, // "Qty: 2"
  /menge:?\s*(\d+)/i, // "Menge: 2" (German)
  /anzahl:?\s*(\d+)/i, // "Anzahl: 2" (German)
];

// Lines to skip (not items)
const SKIP_PATTERNS = [
  /^total/i,
  /^subtotal/i,
  /^summe/i, // German
  /^zwischensumme/i, // German
  /^tax/i,
  /^mwst/i, // German VAT
  /^mehrwertsteuer/i, // German VAT
  /^ust/i, // Austrian VAT
  /^payment/i,
  /^bezahl/i, // German
  /^change/i,
  /^cash/i,
  /^card/i,
  /^karte/i, // German
  /^thank\s*you/i,
  /^danke/i, // German
  /^vielen.*dank/i, // German
  /^please/i,
  /^bitte/i, // German
  /^store/i,
  /^gesch[äa]ft/i, // German
  /^customer/i,
  /^kunde/i, // German
  /^cashier/i,
  /^kassa/i, // Austrian
  /^register/i,
  /^transaction/i,
  /^transaktion/i, // German
  /^receipt/i,
  /^rechnung/i, // German/Austrian
  /^beleg/i, // German
  /^date/i,
  /^datum/i, // German
  /^time/i,
  /^uhr/i, // German
  /^zeit/i, // German
  /^items?\s*purchased/i,
  /^artikel/i, // German
  /^lieferung/i, // Delivery
  /^bestellung/i, // Order
  /^rechnungsadresse/i, // Billing address
  /^\s*$/,
  /^[-=*]+$/,
  /^art\s+ne\s+produkt/i, // Table headers
  /^preis.*pro/i, // Price headers
  /^menge/i, // Quantity header alone
  /^enhelt/i, // Unit header
  /uid.*nummer/i, // Tax ID
  /firmenbuch/i, // Company registry
  /^\d{2}[-./]\d{2}[-./]\d{2,4}/i, // Date lines
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
  let matchedPattern: RegExp | null = null;

  for (const pattern of PRICE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      let parsedPrice: number;

      // Handle space-separated format (Austrian): "2 229" = 2.29
      if (match[1] && match[2]) {
        parsedPrice = parseFloat(`${match[1]}.${match[2]}`);
      }
      // Handle comma or dot as decimal separator
      else if (match[1]) {
        const priceStr = match[1].replace(',', '.');
        parsedPrice = parseFloat(priceStr);

        // If no decimal separator and 2-4 digits, it's cents
        if (
          !/[.,]/.test(match[1]) &&
          match[1].length >= 2 &&
          match[1].length <= 4
        ) {
          parsedPrice = parsedPrice / 100;
        }
      } else {
        continue;
      }

      if (!isNaN(parsedPrice) && parsedPrice > 0 && parsedPrice < 10000) {
        price = parsedPrice;
        priceMatch = match;
        matchedPattern = pattern;
        break;
      }
    }
  }

  if (!price || !priceMatch) {
    return null;
  }

  // Extract item name (everything before the price)
  const nameEndIndex = priceMatch.index ?? line.length;
  let name = line.substring(0, nameEndIndex).trim();

  // Remove article numbers at the start (e.g., "00-7225")
  name = name.replace(/^\d{2,}-\d+\s+/, '');
  name = name.replace(/^[a-z]{2,}-\d+\s+/i, '');

  // Clean up
  name = name.replace(/\s+/g, ' ').trim();

  if (!name || name.length < 2) {
    return null;
  }

  // Try to extract quantity from the beginning of the line
  let quantity = 1;
  for (const pattern of QUANTITY_PATTERNS) {
    const match = line.match(pattern);
    if (match?.[1]) {
      const parsedQty = parseInt(match[1], 10);
      if (!isNaN(parsedQty) && parsedQty > 0 && parsedQty < 100) {
        quantity = parsedQty;
        break;
      }
    }
  }

  // Calculate confidence based on pattern matching
  const confidence = calculateConfidence(line, name, price, matchedPattern);

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
 * @param _pattern - Matched price pattern (unused but kept for future use)
 * @returns Confidence score (0-1)
 */
function calculateConfidence(
  line: string,
  name: string,
  price: number,
  _pattern: RegExp | null
): number {
  let confidence = 0.5; // Base confidence

  // Boost confidence if price is well-formatted with currency symbol
  if (/[$€]\s*\d+[.,]?\d{2}/.test(line)) {
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
  if (/[^a-zäöüß0-9\s$€.,@×x-]/i.test(line)) {
    confidence -= 0.1;
  }

  return Math.max(0, Math.min(1, confidence));
}
