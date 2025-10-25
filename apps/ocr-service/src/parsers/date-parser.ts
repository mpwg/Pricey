/**
 * Date extraction from receipt text
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

const DATE_PATTERNS = [
  // MM/DD/YYYY
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  // DD/MM/YYYY
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
  // YYYY-MM-DD
  /(\d{4})-(\d{1,2})-(\d{1,2})/,
  // Month DD, YYYY
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i,
  // DD Month YYYY
  /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i,
];

const DATE_INDICATORS = [
  /date:/i,
  /purchase\s*date:/i,
  /sale\s*date:/i,
  /trans\s*date:/i,
  /transaction\s*date:/i,
];

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

/**
 * Extract date from receipt text
 * @param text - OCR extracted text
 * @returns Date or null if not found
 */
export function extractDate(text: string): Date | null {
  const lines = text.split('\n');

  // First, try to find date near indicators
  for (const line of lines) {
    for (const indicator of DATE_INDICATORS) {
      if (indicator.test(line)) {
        const date = parseDateFromLine(line);
        if (date && isValidReceiptDate(date)) {
          return date;
        }
      }
    }
  }

  // If not found, search all lines
  for (const line of lines) {
    const date = parseDateFromLine(line);
    if (date && isValidReceiptDate(date)) {
      return date;
    }
  }

  return null;
}

/**
 * Parse date from a single line
 * @param line - Text line
 * @returns Date or null
 */
function parseDateFromLine(line: string): Date | null {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      try {
        return parseMatchedDate(match);
      } catch {
        continue;
      }
    }
  }
  return null;
}

/**
 * Parse date from regex match
 * @param match - Regex match result
 * @returns Date
 */
function parseMatchedDate(match: RegExpMatchArray): Date | null {
  const [_full, ...parts] = match;

  // Handle different date formats
  if (parts.length === 3) {
    // Check if it's a month name format
    if (isNaN(Number(parts[0]))) {
      // Month DD, YYYY
      const month = MONTH_MAP[parts[0]!.toLowerCase().substring(0, 3)];
      const day = Number(parts[1]);
      const year = Number(parts[2]);
      return month !== undefined ? new Date(year, month, day) : null;
    } else if (isNaN(Number(parts[1]))) {
      // DD Month YYYY
      const day = Number(parts[0]);
      const month = MONTH_MAP[parts[1]!.toLowerCase().substring(0, 3)];
      const year = Number(parts[2]);
      return month !== undefined ? new Date(year, month, day) : null;
    } else {
      // Numeric format - try different interpretations
      const a = Number(parts[0]);
      const b = Number(parts[1]);
      const c = Number(parts[2]);

      // If first part is 4 digits, it's YYYY-MM-DD
      if (a > 1900) {
        return new Date(a, b - 1, c);
      }

      // Try MM/DD/YYYY (US format)
      if (a <= 12 && b <= 31) {
        return new Date(c, a - 1, b);
      }

      // Try DD/MM/YYYY (EU format)
      if (b <= 12 && a <= 31) {
        return new Date(c, b - 1, a);
      }
    }
  }

  return null;
}

/**
 * Validate that the date is reasonable for a receipt
 * @param date - Date to validate
 * @returns True if valid
 */
function isValidReceiptDate(date: Date): boolean {
  const now = new Date();
  const oneYearAgo = new Date(
    now.getFullYear() - 1,
    now.getMonth(),
    now.getDate()
  );

  // Date must be in the past but not more than 1 year old
  return date <= now && date >= oneYearAgo;
}
