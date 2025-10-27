/**
 * Total amount extraction from receipt text
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

import { isValidAustrianTotalCents } from './constants.js';

const TOTAL_INDICATORS = [
  /total/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /grand\s*total/i,
  /total\s*amount/i,
  /summe/i, // German
  /endsumme/i, // German
  /gesamtsumme/i, // German
  /gesamtwert/i, // German
  /gesamt.*brutto/i, // German gross total
  /zu\s*zahlen/i, // German "to pay"
];

const PRICE_PATTERNS = [
  /\$?\s*(\d+\.\d{2})/, // US format
  /€?\s*(\d+[,.]?\d{2})/, // European format with €
  /(\d+[,.]?\d{2})\s*€/, // Euro after number
  /(\d{2,3})[,.](\d{2})/, // European decimal format
  /(\d+)\s+(\d{2})/, // Space-separated (Austrian format)
];

/**
 * Extract total amount from receipt text
 * @param text - OCR extracted text
 * @returns Total amount or null
 */
export function extractTotal(text: string): number | null {
  const lines = text.split('\n');

  // Search from bottom up (total is usually near the end)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]?.trim();
    if (!line) continue;

    // Check if line contains a total indicator
    const hasIndicator = TOTAL_INDICATORS.some((pattern) => pattern.test(line));

    if (hasIndicator) {
      // Try each price pattern
      for (const pattern of PRICE_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          let total: number;

          // Handle space-separated format (Austrian): "50 28" = 50.28
          if (match[1] && match[2] && isValidAustrianTotalCents(match[2])) {
            total = parseFloat(`${match[1]}.${match[2]}`);
          }
          // Handle comma or dot as decimal separator
          else if (match[1]) {
            const priceStr = match[1].replace(',', '.');
            total = parseFloat(priceStr);
          } else {
            continue;
          }

          if (!isNaN(total) && total > 0 && total < 10000) {
            return total;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Calculate total from items
 * @param items - Array of items with prices and quantities
 * @returns Calculated total
 */
export function calculateTotal(
  items: Array<{ price: number; quantity: number }>
): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/**
 * Validate total against calculated total
 * @param extractedTotal - Total from receipt
 * @param calculatedTotal - Total calculated from items
 * @returns True if totals match (within 5% variance)
 */
export function validateTotal(
  extractedTotal: number,
  calculatedTotal: number
): boolean {
  if (extractedTotal <= 0) {
    return false;
  }
  const variance = Math.abs(extractedTotal - calculatedTotal) / extractedTotal;
  return variance <= 0.05; // Allow 5% variance for tax/discounts
}
