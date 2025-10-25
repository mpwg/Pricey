/**
 * Store detection from receipt text
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

interface StorePattern {
  name: string;
  patterns: RegExp[];
}

const STORE_PATTERNS: StorePattern[] = [
  {
    name: 'Walmart',
    patterns: [
      /walmart/i,
      /wal\s*mart/i,
      /walmart\s*supercenter/i,
      /neighborhood\s*market/i,
    ],
  },
  {
    name: 'Target',
    patterns: [/target/i, /target\s*corp/i, /supertarget/i],
  },
  {
    name: 'Costco',
    patterns: [/costco/i, /costco\s*wholesale/i],
  },
  {
    name: 'Kroger',
    patterns: [/kroger/i, /kroger\s*co/i],
  },
  {
    name: 'Safeway',
    patterns: [/safeway/i],
  },
  {
    name: 'Whole Foods',
    patterns: [/whole\s*foods/i, /wfm/i],
  },
  {
    name: "Trader Joe's",
    patterns: [/trader\s*joe/i, /tj's/i],
  },
  {
    name: 'CVS',
    patterns: [/cvs/i, /cvs\s*pharmacy/i],
  },
  {
    name: 'Walgreens',
    patterns: [/walgreens/i, /wag/i],
  },
  {
    name: 'Rite Aid',
    patterns: [/rite\s*aid/i],
  },
  {
    name: 'Home Depot',
    patterns: [/home\s*depot/i, /the\s*home\s*depot/i],
  },
  {
    name: "Lowe's",
    patterns: [/lowe'?s/i],
  },
  {
    name: 'Best Buy',
    patterns: [/best\s*buy/i],
  },
  {
    name: 'Apple Store',
    patterns: [/apple\s*store/i, /apple\s*retail/i],
  },
  {
    name: "Macy's",
    patterns: [/macy'?s/i],
  },
  {
    name: 'Nordstrom',
    patterns: [/nordstrom/i],
  },
  {
    name: "Kohl's",
    patterns: [/kohl'?s/i],
  },
  {
    name: "Sam's Club",
    patterns: [/sam'?s\s*club/i],
  },
  {
    name: "BJ's",
    patterns: [/bj'?s\s*wholesale/i, /bj'?s/i],
  },
  {
    name: 'Amazon',
    patterns: [/amazon/i, /amazon\.com/i],
  },
  {
    name: '7-Eleven',
    patterns: [/7-eleven/i, /7\s*eleven/i],
  },
  {
    name: 'Starbucks',
    patterns: [/starbucks/i],
  },
];

/**
 * Detect store name from receipt text
 * @param text - OCR extracted text
 * @returns Store name or null if not detected
 */
export function detectStore(text: string): string | null {
  // Search only the first 10 lines (store name is usually at the top)
  const firstLines = text.split('\n').slice(0, 10).join('\n');

  for (const store of STORE_PATTERNS) {
    for (const pattern of store.patterns) {
      if (pattern.test(firstLines)) {
        return store.name;
      }
    }
  }

  return null;
}

/**
 * Calculate fuzzy match score using Levenshtein distance
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score (0-1)
 */
export function fuzzyMatch(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);

  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create matrix
  const matrix: number[][] = Array.from({ length: len1 + 1 }, () =>
    Array(len2 + 1).fill(0)
  );

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    matrix[i]![0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0]![j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1, // deletion
        matrix[i]![j - 1]! + 1, // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      );
    }
  }

  return matrix[len1]![len2]!;
}
