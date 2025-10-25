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

const TOTAL_INDICATORS = [
  /total/i,
  /amount\s*due/i,
  /balance\s*due/i,
  /grand\s*total/i,
  /total\s*amount/i,
];

const PRICE_PATTERN = /\$?\s*(\d+\.\d{2})/;

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
      // Extract price from this line
      const match = line.match(PRICE_PATTERN);
      if (match?.[1]) {
        const total = parseFloat(match[1]);
        if (!isNaN(total) && total > 0 && total < 10000) {
          return total;
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
  const variance = Math.abs(extractedTotal - calculatedTotal) / extractedTotal;
  return variance <= 0.05; // Allow 5% variance for tax/discounts
}
