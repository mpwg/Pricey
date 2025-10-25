/**
 * Tests for store detection from receipt text
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

import { describe, it, expect } from 'vitest';
import { detectStore, fuzzyMatch } from './store-detector.js';

describe('detectStore', () => {
  describe('major retailers', () => {
    it('should detect Walmart from standard name', () => {
      const text = 'WALMART\nStore #1234';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect Walmart from "Wal Mart" with space', () => {
      const text = 'WAL MART\nDate: 01/15/2024';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect Walmart Supercenter', () => {
      const text = 'WALMART SUPERCENTER\nLocation: 123 Main St';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect Neighborhood Market', () => {
      const text = 'NEIGHBORHOOD MARKET\nWalmart Store';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect Target', () => {
      const text = 'TARGET\nStore T-0123';
      expect(detectStore(text)).toBe('Target');
    });

    it('should detect Target Corp', () => {
      const text = 'TARGET CORP\n123 Main St';
      expect(detectStore(text)).toBe('Target');
    });

    it('should detect SuperTarget', () => {
      const text = 'SUPERTARGET\nStore #1234';
      expect(detectStore(text)).toBe('Target');
    });

    it('should detect Costco', () => {
      const text = 'COSTCO WHOLESALE\nMembership #12345';
      expect(detectStore(text)).toBe('Costco');
    });

    it('should detect Costco without "Wholesale"', () => {
      const text = 'COSTCO\nDate: 01/15/2024';
      expect(detectStore(text)).toBe('Costco');
    });
  });

  describe('grocery stores', () => {
    it('should detect Kroger', () => {
      const text = 'KROGER\nFuel Points: 100';
      expect(detectStore(text)).toBe('Kroger');
    });

    it('should detect Safeway', () => {
      const text = 'SAFEWAY\nStore #5678';
      expect(detectStore(text)).toBe('Safeway');
    });

    it('should detect Whole Foods', () => {
      const text = 'WHOLE FOODS MARKET\nOrganic Products';
      expect(detectStore(text)).toBe('Whole Foods');
    });

    it('should detect Whole Foods from "WFM" abbreviation', () => {
      const text = 'WFM\nStore #123';
      expect(detectStore(text)).toBe('Whole Foods');
    });

    it("should detect Trader Joe's", () => {
      const text = "TRADER JOE'S\nDate: 01/15/2024";
      expect(detectStore(text)).toBe("Trader Joe's");
    });

    it("should detect Trader Joe's from 'TJ's' abbreviation", () => {
      const text = "TJ'S\nStore Location";
      expect(detectStore(text)).toBe("Trader Joe's");
    });
  });

  describe('pharmacies', () => {
    it('should detect CVS', () => {
      const text = 'CVS/PHARMACY\nPrescription #12345';
      expect(detectStore(text)).toBe('CVS');
    });

    it('should detect CVS Pharmacy', () => {
      const text = 'CVS PHARMACY\nStore #9876';
      expect(detectStore(text)).toBe('CVS');
    });

    it('should detect Walgreens', () => {
      const text = 'WALGREENS\nBalance Rewards';
      expect(detectStore(text)).toBe('Walgreens');
    });

    it('should detect Walgreens from "WAG" abbreviation', () => {
      const text = 'WAG #1234\nPharmacy';
      expect(detectStore(text)).toBe('Walgreens');
    });

    it('should detect Rite Aid', () => {
      const text = 'RITE AID\nWellness+ Rewards';
      expect(detectStore(text)).toBe('Rite Aid');
    });
  });

  describe('home improvement', () => {
    it('should detect Home Depot', () => {
      const text = 'HOME DEPOT\nBuild More, Save More';
      expect(detectStore(text)).toBe('Home Depot');
    });

    it('should detect The Home Depot', () => {
      const text = 'THE HOME DEPOT\nStore #1234';
      expect(detectStore(text)).toBe('Home Depot');
    });

    it("should detect Lowe's", () => {
      const text = "LOWE'S\nStore #5678";
      expect(detectStore(text)).toBe("Lowe's");
    });

    it("should detect Lowe's without apostrophe", () => {
      const text = 'LOWES\nHome Improvement';
      expect(detectStore(text)).toBe("Lowe's");
    });
  });

  describe('electronics & retail', () => {
    it('should detect Best Buy', () => {
      const text = 'BEST BUY\nGeek Squad';
      expect(detectStore(text)).toBe('Best Buy');
    });

    it('should detect Apple Store', () => {
      const text = 'APPLE STORE\nGenius Bar';
      expect(detectStore(text)).toBe('Apple Store');
    });

    it('should detect Apple Retail', () => {
      const text = 'APPLE RETAIL\nStore Location';
      expect(detectStore(text)).toBe('Apple Store');
    });
  });

  describe('department stores', () => {
    it("should detect Macy's", () => {
      const text = "MACY'S\nStar Rewards";
      expect(detectStore(text)).toBe("Macy's");
    });

    it("should detect Macy's without apostrophe", () => {
      const text = 'MACYS\nDepartment Store';
      expect(detectStore(text)).toBe("Macy's");
    });

    it('should detect Nordstrom', () => {
      const text = 'NORDSTROM\nRewards Program';
      expect(detectStore(text)).toBe('Nordstrom');
    });

    it("should detect Kohl's", () => {
      const text = "KOHL'S\nYes2You Rewards";
      expect(detectStore(text)).toBe("Kohl's");
    });

    it("should detect Kohl's without apostrophe", () => {
      const text = 'KOHLS\nDepartment Store';
      expect(detectStore(text)).toBe("Kohl's");
    });
  });

  describe('warehouse clubs', () => {
    it("should detect Sam's Club", () => {
      const text = "SAM'S CLUB\nMembership #12345";
      expect(detectStore(text)).toBe("Sam's Club");
    });

    it("should detect Sam's Club without apostrophe", () => {
      const text = 'SAMS CLUB\nWarehouse';
      expect(detectStore(text)).toBe("Sam's Club");
    });

    it("should detect BJ's Wholesale", () => {
      const text = "BJ'S WHOLESALE CLUB\nMember ID";
      expect(detectStore(text)).toBe("BJ's");
    });

    it("should detect BJ's without 'Wholesale'", () => {
      const text = "BJ'S\nMembership";
      expect(detectStore(text)).toBe("BJ's");
    });
  });

  describe('convenience & coffee', () => {
    it('should detect 7-Eleven with hyphen', () => {
      const text = '7-ELEVEN\nThank You';
      expect(detectStore(text)).toBe('7-Eleven');
    });

    it('should detect 7-Eleven with space', () => {
      const text = '7 ELEVEN\nConvenience Store';
      expect(detectStore(text)).toBe('7-Eleven');
    });

    it('should detect Starbucks', () => {
      const text = 'STARBUCKS\nCoffee';
      expect(detectStore(text)).toBe('Starbucks');
    });
  });

  describe('online retailers', () => {
    it('should detect Amazon', () => {
      const text = 'AMAZON\nOrder #123-4567890-1234567';
      expect(detectStore(text)).toBe('Amazon');
    });

    it('should detect Amazon.com', () => {
      const text = 'AMAZON.COM\nPrime Member';
      expect(detectStore(text)).toBe('Amazon');
    });
  });

  describe('case sensitivity', () => {
    it('should detect lowercase store names', () => {
      const text = 'walmart\nStore #1234';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect mixed case store names', () => {
      const text = 'TaRgEt\nStore Location';
      expect(detectStore(text)).toBe('Target');
    });

    it('should detect with extra whitespace', () => {
      const text = '  COSTCO  \n  Store #1234  ';
      expect(detectStore(text)).toBe('Costco');
    });
  });

  describe('store location in text', () => {
    it('should detect store in first line', () => {
      const text = 'WALMART\nItem 1 $5.00\nItem 2 $10.00';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect store in second line', () => {
      const text = 'Receipt\nWALMART\nItem 1 $5.00';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect store within first 10 lines', () => {
      const text =
        'Line 1\nLine 2\nLine 3\nLine 4\nLine 5\nTARGET\nItem 1 $5.00';
      expect(detectStore(text)).toBe('Target');
    });

    it('should not detect store after line 10', () => {
      const lines = Array(15).fill('Line');
      lines[12] = 'WALMART';
      const text = lines.join('\n');
      expect(detectStore(text)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should return null for empty text', () => {
      expect(detectStore('')).toBeNull();
    });

    it('should return null when no store detected', () => {
      const text = 'Random Receipt\nItem 1 $5.00\nTotal $5.00';
      expect(detectStore(text)).toBeNull();
    });

    it('should return null for unrecognized store', () => {
      const text = 'LOCAL GROCERY STORE\nDate: 01/15/2024';
      expect(detectStore(text)).toBeNull();
    });

    it('should handle receipt with only store name', () => {
      const text = 'WALMART';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should handle multi-line header with store', () => {
      const text = `
        ==============================
        WALMART SUPERCENTER #1234
        123 Main Street
        Anytown, ST 12345
        ==============================
      `;
      expect(detectStore(text)).toBe('Walmart');
    });
  });

  describe('OCR noise handling', () => {
    it('should handle common OCR errors in Walmart', () => {
      // OCR might read "WAL MART" with various spacing
      const text = 'WAL  MART\nStore #1234';
      expect(detectStore(text)).toBe('Walmart');
    });

    it('should detect store with noise around it', () => {
      const text = '***TARGET***\nStore Location';
      expect(detectStore(text)).toBe('Target');
    });

    it('should detect store with line artifacts', () => {
      const text = '--------\nCOSTCO\n--------';
      expect(detectStore(text)).toBe('Costco');
    });
  });
});

describe('fuzzyMatch', () => {
  describe('exact matches', () => {
    it('should return 1.0 for identical strings', () => {
      expect(fuzzyMatch('walmart', 'walmart')).toBe(1.0);
    });

    it('should return 1.0 for identical strings (case insensitive)', () => {
      expect(fuzzyMatch('WALMART', 'walmart')).toBe(1.0);
    });

    it('should return 1.0 for empty strings', () => {
      expect(fuzzyMatch('', '')).toBe(1.0);
    });
  });

  describe('single character differences', () => {
    it('should calculate score for one substitution', () => {
      const score = fuzzyMatch('walmart', 'walmaet'); // 1 char different
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThan(1.0);
    });

    it('should calculate score for one insertion', () => {
      const score = fuzzyMatch('walmart', 'walmartt'); // 1 char extra
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThan(1.0);
    });

    it('should calculate score for one deletion', () => {
      const score = fuzzyMatch('walmart', 'walmar'); // 1 char missing (last 't')
      expect(score).toBeGreaterThan(0.8);
      expect(score).toBeLessThan(1.0);
    });
  });

  describe('multiple character differences', () => {
    it('should calculate score for multiple substitutions', () => {
      const score = fuzzyMatch('walmart', 'walxxxx'); // 4 chars different
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.6);
    });

    it('should return lower score for very different strings', () => {
      const score = fuzzyMatch('walmart', 'target');
      expect(score).toBeLessThan(0.3);
    });

    it('should return 0 for completely different strings of same length', () => {
      const score = fuzzyMatch('aaaaaaa', 'bbbbbbb');
      expect(score).toBe(0);
    });
  });

  describe('different length strings', () => {
    it('should handle strings with different lengths', () => {
      const score = fuzzyMatch('walmart', 'wal'); // partial match
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.5);
    });

    it('should handle empty vs non-empty strings', () => {
      const score = fuzzyMatch('', 'walmart');
      expect(score).toBe(0);
    });

    it('should handle very short strings', () => {
      const score = fuzzyMatch('a', 'b');
      expect(score).toBe(0);
    });

    it('should handle one character match', () => {
      const score = fuzzyMatch('a', 'a');
      expect(score).toBe(1.0);
    });
  });

  describe('case sensitivity', () => {
    it('should be case insensitive', () => {
      expect(fuzzyMatch('WalMart', 'walmart')).toBe(1.0);
    });

    it('should handle mixed case', () => {
      expect(fuzzyMatch('TaRgEt', 'target')).toBe(1.0);
    });
  });

  describe('common OCR errors', () => {
    it('should give high score for O vs 0 confusion', () => {
      const score = fuzzyMatch('cost0', 'costo'); // O vs 0
      expect(score).toBeGreaterThanOrEqual(0.8);
    });

    it('should give high score for I vs l confusion', () => {
      const score = fuzzyMatch('waImart', 'walmart'); // I vs l
      expect(score).toBeGreaterThan(0.8);
    });

    it('should handle space removal', () => {
      const score = fuzzyMatch('walmart', 'wal mart');
      expect(score).toBeGreaterThan(0.7);
    });
  });

  describe('real-world examples', () => {
    it('should match "walmart" vs "wal mart"', () => {
      const score = fuzzyMatch('walmart', 'wal mart');
      expect(score).toBeGreaterThan(0.7);
    });

    it('should match "target" vs "targst" (OCR error)', () => {
      const score = fuzzyMatch('target', 'targst');
      expect(score).toBeGreaterThan(0.7);
    });

    it('should match close but not identical store names', () => {
      const score = fuzzyMatch('costco wholesale', 'costco');
      // "costco wholesale" vs "costco" - wholesale adds 10 chars
      // Levenshtein distance: 10, maxLen: 16 -> score = 1 - 10/16 = 0.375
      expect(score).toBeGreaterThan(0.3);
      expect(score).toBeLessThan(0.5);
    });

    it('should not match completely different stores', () => {
      const score = fuzzyMatch('walmart', 'safeway');
      expect(score).toBeLessThan(0.3);
    });
  });

  describe('edge cases', () => {
    it('should handle very long strings', () => {
      const str1 = 'a'.repeat(100);
      const str2 = 'a'.repeat(100);
      expect(fuzzyMatch(str1, str2)).toBe(1.0);
    });

    it('should handle strings with special characters', () => {
      const score = fuzzyMatch("macy's", 'macys');
      expect(score).toBeGreaterThan(0.8);
    });

    it('should handle strings with numbers', () => {
      const score = fuzzyMatch('7-eleven', '7eleven');
      expect(score).toBeGreaterThan(0.8);
    });

    it('should handle whitespace', () => {
      const score = fuzzyMatch('  walmart  ', 'walmart');
      // Note: fuzzyMatch normalizes to lowercase but doesn't trim
      // "  walmart  " (11 chars) vs "walmart" (7 chars) = 4 char difference
      expect(score).toBeGreaterThan(0.6);
      expect(score).toBeLessThan(0.7);
    });
  });
});
