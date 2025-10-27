/**
 * Tests for receipt processor with vision LLM
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReceiptProcessor } from './receipt-processor';

// Mock parser factory to return a mock parser
const mockParse = vi.fn();
const mockHealthCheck = vi.fn();

vi.mock('../parsers/parser-factory', () => ({
  createReceiptParser: vi.fn(() => ({
    parse: mockParse,
    healthCheck: mockHealthCheck,
  })),
  getProviderName: vi.fn(() => 'Ollama (llava)'),
}));

describe('ReceiptProcessor with Vision LLM', () => {
  let processor: ReceiptProcessor;
  const mockImageBuffer = Buffer.from('fake-image-data');

  beforeEach(() => {
    vi.clearAllMocks();
    processor = new ReceiptProcessor();
  });

  describe('Basic Receipt Processing', () => {
    it('should process a complete receipt with vision model', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Grocery Store',
        date: '2025-01-20',
        total: 45.67,
        currency: 'USD',
        items: [
          { name: 'Milk', price: 7.98, quantity: 2 },
          { name: 'Bread', price: 2.49, quantity: 1 },
        ],
        confidence: 0.95,
      });

      const result = await processor.process(mockImageBuffer);

      expect(mockParse).toHaveBeenCalledWith(mockImageBuffer);
      expect(result.storeName).toBe('Grocery Store');
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(45.67);
      expect(result.confidence).toBe(0.95);
    });

    it('should handle receipt with no items', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Empty Store',
        date: '2025-01-20',
        total: 0,
        currency: 'USD',
        items: [],
        confidence: 0.8,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.storeName).toBe('Empty Store');
    });

    it('should handle receipt with single item', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Quick Shop',
        date: '2025-01-20',
        total: 1.99,
        currency: 'USD',
        items: [{ name: 'Gum', price: 1.99, quantity: 1 }],
        confidence: 0.92,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.name).toBe('Gum');
      expect(result.total).toBe(1.99);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle LLM parsing errors gracefully', async () => {
      mockParse.mockRejectedValue(new Error('Vision model unavailable'));

      await expect(processor.process(mockImageBuffer)).rejects.toThrow(
        'Vision model unavailable'
      );
    });

    it('should handle invalid date format', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: 'invalid-date',
        total: 10.0,
        currency: 'USD',
        items: [],
        confidence: 0.7,
      });

      const result = await processor.process(mockImageBuffer);

      // Invalid date should be set to null
      expect(result.date).toBeNull();
      expect(result.storeName).toBe('Store');
    });

    it('should handle null store name', async () => {
      mockParse.mockResolvedValue({
        storeName: null,
        date: '2025-01-20',
        total: 10.0,
        currency: 'USD',
        items: [{ name: 'Item', price: 10.0, quantity: 1 }],
        confidence: 0.5,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.storeName).toBeNull();
      expect(result.items).toHaveLength(1);
    });

    it('should handle negative prices in items', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 8.0,
        currency: 'USD',
        items: [
          { name: 'Item', price: 10.0, quantity: 1 },
          { name: 'Discount', price: -2.0, quantity: 1 },
        ],
        confidence: 0.8,
      });

      const result = await processor.process(mockImageBuffer);

      // Negative prices are allowed (discounts)
      expect(result.items).toHaveLength(2);
      expect(result.items[1]!.price).toBe(-2.0);
      expect(result.total).toBe(8.0);
    });

    it('should handle empty image buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      mockParse.mockRejectedValue(new Error('Empty image'));

      await expect(processor.process(emptyBuffer)).rejects.toThrow(
        'Empty image'
      );
    });

    it('should handle low confidence scores', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 10.0,
        currency: 'USD',
        items: [],
        confidence: 0.3,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.confidence).toBe(0.3);
    });
  });

  describe('Quantity and Price Handling', () => {
    it('should handle items with fractional quantities', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Deli',
        date: '2025-01-20',
        total: 12.45,
        currency: 'USD',
        items: [{ name: 'Cheese', price: 12.45, quantity: 0.5 }],
        confidence: 0.88,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.items[0]!.quantity).toBe(0.5);
      expect(result.items[0]!.price).toBe(12.45);
    });

    it('should handle items with large quantities', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Wholesale',
        date: '2025-01-20',
        total: 100.0,
        currency: 'USD',
        items: [{ name: 'Bottled Water', price: 100.0, quantity: 50 }],
        confidence: 0.9,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.items[0]!.quantity).toBe(50);
    });
  });

  describe('Total Validation', () => {
    it('should calculate total from items', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 15.0,
        currency: 'USD',
        items: [
          { name: 'Item 1', price: 5.0, quantity: 1 },
          { name: 'Item 2', price: 10.0, quantity: 1 },
        ],
        confidence: 0.92,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.total).toBe(15.0);
      expect(result.calculatedTotal).toBeCloseTo(15.0, 2);
    });

    it('should handle total mismatch (e.g., due to tax)', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 15.75, // Includes tax
        currency: 'USD',
        items: [
          { name: 'Item 1', price: 5.0, quantity: 1 },
          { name: 'Item 2', price: 10.0, quantity: 1 },
        ],
        confidence: 0.85,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.total).toBe(15.75);
      expect(result.calculatedTotal).toBeCloseTo(15.0, 2);
      // Difference is due to tax
      expect(Math.abs(result.total! - result.calculatedTotal)).toBeCloseTo(
        0.75,
        2
      );
    });
  });

  describe('Special Receipt Types', () => {
    it('should handle receipts with discounts', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Discount Store',
        date: '2025-01-20',
        total: 8.0,
        currency: 'USD',
        items: [
          { name: 'Item', price: 10.0, quantity: 1 },
          { name: 'Discount', price: -2.0, quantity: 1 },
        ],
        confidence: 0.87,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.total).toBe(8.0);
      expect(result.calculatedTotal).toBeCloseTo(8.0, 2);
    });

    it('should handle receipts with taxes', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 10.5,
        currency: 'USD',
        items: [
          { name: 'Item', price: 10.0, quantity: 1 },
          { name: 'Tax', price: 0.5, quantity: 1 },
        ],
        confidence: 0.91,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.total).toBe(10.5);
      expect(result.calculatedTotal).toBeCloseTo(10.5, 2);
    });
  });

  describe('Integration Scenarios', () => {
    it('should process complex multi-item receipt', async () => {
      mockParse.mockResolvedValue({
        storeName: 'SuperMart',
        date: '2025-01-20',
        total: 27.43,
        currency: 'USD',
        items: [
          { name: 'Milk', price: 7.98, quantity: 2 },
          { name: 'Bread', price: 2.49, quantity: 1 },
          { name: 'Eggs', price: 4.99, quantity: 1 },
          { name: 'Cheese', price: 6.0, quantity: 0.5 },
          { name: 'Apples', price: 5.97, quantity: 3 },
        ],
        confidence: 0.93,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.items).toHaveLength(5);
      expect(result.storeName).toBe('SuperMart');
      expect(result.total).toBe(27.43);
    });

    it('should handle receipt with multiple currencies', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Airport Shop',
        date: '2025-01-20',
        total: 25.0,
        currency: 'EUR',
        items: [{ name: 'Water', price: 5.0, quantity: 1 }],
        confidence: 0.89,
      });

      const result = await processor.process(mockImageBuffer);

      // Currency is stored in LLM data but not exposed in ProcessedReceipt
      expect(result.storeName).toBe('Airport Shop');
      expect(result.total).toBe(25.0);
    });

    it('should process receipt with null date', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Grocery',
        date: null,
        total: 8.47,
        currency: 'USD',
        items: [
          { name: 'Milk', price: 3.99, quantity: 1 },
          { name: 'Bread', price: 2.49, quantity: 1 },
          { name: 'Apple', price: 1.99, quantity: 1 },
        ],
        confidence: 0.94,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.date).toBeNull();
      expect(result.items).toHaveLength(3);
    });
  });

  describe('Date Handling', () => {
    it('should parse valid ISO date', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: '2025-01-20',
        total: 10.0,
        currency: 'USD',
        items: [],
        confidence: 0.9,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.date).toBeInstanceOf(Date);
      expect(result.date?.toISOString()).toContain('2025-01-20');
    });

    it('should handle null date from LLM', async () => {
      mockParse.mockResolvedValue({
        storeName: 'Store',
        date: null,
        total: 10.0,
        currency: 'USD',
        items: [],
        confidence: 0.9,
      });

      const result = await processor.process(mockImageBuffer);

      expect(result.date).toBeNull();
    });
  });
});
