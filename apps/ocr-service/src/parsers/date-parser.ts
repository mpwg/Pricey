/**
 * Date extraction from receipt text using chrono-node
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

import * as chrono from 'chrono-node';
import { isFuture, subYears } from 'date-fns';

/**
 * Date indicators that suggest a date is nearby in the text
 * These help prioritize parsing results that are more likely to be receipt dates
 */
const DATE_INDICATORS = [
  /date:/i,
  /purchase\s*date:/i,
  /sale\s*date:/i,
  /trans\s*date:/i,
  /transaction\s*date:/i,
];

/**
 * Extract date from receipt text using chrono-node natural language parser
 * @param text - OCR extracted text
 * @returns Date or null if not found
 */
export function extractDate(text: string): Date | null {
  const lines = text.split('\n');
  const referenceDate = new Date();

  // First, try to find date near indicators (more likely to be the purchase date)
  for (const line of lines) {
    for (const indicator of DATE_INDICATORS) {
      if (indicator.test(line)) {
        const date = parseDateFromLine(line, referenceDate);
        if (date) {
          return date;
        }
      }
    }
  }

  // If not found near indicators, search all lines
  for (const line of lines) {
    const date = parseDateFromLine(line, referenceDate);
    if (date) {
      return date;
    }
  }

  return null;
}

/**
 * Parse date from a single line using chrono-node
 * @param line - Text line
 * @param referenceDate - Reference date for parsing relative dates
 * @returns Date or null
 */
function parseDateFromLine(line: string, referenceDate: Date): Date | null {
  // Use chrono's strict mode to avoid false positives
  // chrono.strict only recognizes formal date patterns
  const results = chrono.strict.parse(line, referenceDate);

  // Try each parsed result until we find a valid receipt date
  for (const result of results) {
    const date = result.start.date();

    if (isValidReceiptDate(date)) {
      return date;
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
  // Date must not be in the future
  if (isFuture(date)) {
    return false;
  }

  // Date must not be more than 1 year old (with 1 day buffer for edge cases)
  const oneYearOneDayAgo = subYears(new Date(), 1);
  oneYearOneDayAgo.setDate(oneYearOneDayAgo.getDate() - 1);

  return date >= oneYearOneDayAgo;
}
