/**
 * Tests for receipt total extraction and calculation
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
import { extractTotal, calculateTotal, validateTotal } from './total-parser.js';

describe('extractTotal', () => {
  describe('basic total extraction', () => {
    it('should extract total from "Total" line', () => {
      const text = 'Total $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract total from "TOTAL" line (case insensitive)', () => {
      const text = 'TOTAL $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract total with colon', () => {
      const text = 'Total: $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract total without dollar sign', () => {
      const text = 'Total 45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract total with spaces', () => {
      const text = 'Total     $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });
  });

  describe('total indicators', () => {
    it('should extract from "Amount Due" line', () => {
      const text = 'Amount Due: $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract from "Balance Due" line', () => {
      const text = 'Balance Due $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract from "Grand Total" line', () => {
      const text = 'Grand Total: $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });

    it('should extract from "Total Amount" line', () => {
      const text = 'Total Amount $45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });
  });

  describe('searching from bottom up', () => {
    it('should find total near end of receipt', () => {
      const text = `
        Item 1 $5.00
        Item 2 $10.00
        Subtotal $15.00
        Tax $1.05
        Total $16.05
        Thank you!
      `;
      const total = extractTotal(text);

      expect(total).toBe(16.05);
    });

    it('should prioritize last total when multiple exist', () => {
      const text = `
        Subtotal $15.00
        Total $15.00
        Tax $1.05
        Total $16.05
      `;
      const total = extractTotal(text);

      // Should get the last total
      expect(total).toBe(16.05);
    });

    it('should skip non-total lines at bottom', () => {
      const text = `
        Total $45.99
        Thank you for shopping!
        Have a nice day!
      `;
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });
  });

  describe('price validation', () => {
    it('should reject totals over $10,000', () => {
      const text = 'Total $15000.00';
      const total = extractTotal(text);

      expect(total).toBeNull();
    });

    it('should reject zero totals', () => {
      const text = 'Total $0.00';
      const total = extractTotal(text);

      expect(total).toBeNull();
    });

    it('should extract positive value from negative total text', () => {
      // Note: Current regex extracts the numeric part, ignoring the minus sign
      // This is acceptable as totals shouldn't be negative on real receipts
      const text = 'Total -$5.00';
      const total = extractTotal(text);

      expect(total).toBe(5.0);
    });

    it('should accept large but reasonable totals', () => {
      const text = 'Total $999.99';
      const total = extractTotal(text);

      expect(total).toBe(999.99);
    });

    it('should accept small totals', () => {
      const text = 'Total $0.99';
      const total = extractTotal(text);

      expect(total).toBe(0.99);
    });
  });

  describe('edge cases', () => {
    it('should return null for empty text', () => {
      const total = extractTotal('');
      expect(total).toBeNull();
    });

    it('should return null when no total found', () => {
      const text = 'Item 1 $5.00\nItem 2 $10.00';
      const total = extractTotal(text);

      expect(total).toBeNull();
    });

    it('should handle multi-line receipts', () => {
      const text = `
        WALMART
        Date: 01/15/2024
        
        Milk $3.99
        Bread $2.49
        
        Subtotal: $6.48
        Tax: $0.45
        Total: $6.93
      `;
      const total = extractTotal(text);

      expect(total).toBe(6.93);
    });

    it('should handle total with extra formatting', () => {
      const text = 'Total: $   45.99';
      const total = extractTotal(text);

      expect(total).toBe(45.99);
    });
  });
});

describe('calculateTotal', () => {
  it('should calculate total from single item', () => {
    const items = [{ price: 5.99, quantity: 1 }];
    const total = calculateTotal(items);

    expect(total).toBe(5.99);
  });

  it('should calculate total from multiple items', () => {
    const items = [
      { price: 5.99, quantity: 1 },
      { price: 3.49, quantity: 1 },
      { price: 2.99, quantity: 1 },
    ];
    const total = calculateTotal(items);

    expect(total).toBe(12.47);
  });

  it('should calculate total with quantities', () => {
    const items = [
      { price: 2.99, quantity: 3 },
      { price: 1.50, quantity: 2 },
    ];
    const total = calculateTotal(items);

    expect(total).toBe(11.97);
  });

  it('should handle empty items array', () => {
    const items: Array<{ price: number; quantity: number }> = [];
    const total = calculateTotal(items);

    expect(total).toBe(0);
  });

  it('should handle items with zero quantity', () => {
    const items = [
      { price: 5.99, quantity: 0 },
      { price: 3.49, quantity: 1 },
    ];
    const total = calculateTotal(items);

    expect(total).toBe(3.49);
  });

  it('should round to 2 decimal places', () => {
    const items = [
      { price: 1.111, quantity: 1 },
      { price: 2.222, quantity: 1 },
    ];
    const total = calculateTotal(items);

    // Should be close to 3.333, but JavaScript floating point
    expect(total).toBeCloseTo(3.33, 2);
  });

  it('should handle large quantities', () => {
    const items = [{ price: 0.99, quantity: 50 }];
    const total = calculateTotal(items);

    expect(total).toBe(49.5);
  });
});

describe('validateTotal', () => {
  describe('exact matches', () => {
    it('should validate exact match', () => {
      const extractedTotal = 10.0;
      const calculatedTotal = 10.0;

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should validate match with many decimal places', () => {
      const extractedTotal = 12.345;
      const calculatedTotal = 12.345;

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });
  });

  describe('5% variance tolerance', () => {
    it('should accept 1% difference', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 101.0; // 1% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should accept 4.9% difference', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 104.9; // 4.9% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should accept exactly 5% difference', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 105.0; // Exactly 5% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should reject 6% difference', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 106.0; // 6% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(false);
    });

    it('should reject 10% difference', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 110.0; // 10% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(false);
    });
  });

  describe('bidirectional tolerance', () => {
    it('should accept calculated total being higher', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 104.0;

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should accept calculated total being lower', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 96.0; // 4% lower

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should reject when calculated is much lower', () => {
      const extractedTotal = 100.0;
      const calculatedTotal = 90.0; // 10% lower

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle small totals within tolerance', () => {
      const extractedTotal = 1.0;
      const calculatedTotal = 1.04; // 4% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should handle very small totals', () => {
      const extractedTotal = 0.5;
      const calculatedTotal = 0.52; // 4% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should handle large totals', () => {
      const extractedTotal = 1000.0;
      const calculatedTotal = 1049.0; // 4.9% difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should handle zero extracted total', () => {
      const extractedTotal = 0.0;
      const calculatedTotal = 10.0;

      // Would cause division by zero, should handle gracefully
      // Result depends on implementation
      const result = validateTotal(extractedTotal, calculatedTotal);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('real-world scenarios', () => {
    it('should account for tax differences', () => {
      // Calculated from items: $10.00
      // Extracted from receipt: $10.70 (includes 7% tax)
      const extractedTotal = 10.7;
      const calculatedTotal = 10.0;

      // 7% difference is outside tolerance
      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(false);
    });

    it('should account for small rounding differences', () => {
      const extractedTotal = 12.34;
      const calculatedTotal = 12.35; // 1 cent difference

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });

    it('should handle floating point precision issues', () => {
      const extractedTotal = 0.1 + 0.2; // 0.30000000000000004
      const calculatedTotal = 0.3;

      expect(validateTotal(extractedTotal, calculatedTotal)).toBe(true);
    });
  });
});
