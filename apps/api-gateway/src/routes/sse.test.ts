/**
 * Tests for Server-Sent Events routes
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

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import Fastify from 'fastify';
import { sseRoutes } from './sse.js';
import { db } from '@pricey/database';
import { ReceiptStatus } from '@pricey/types';

vi.mock('@pricey/database', () => ({
  db: {
    receipt: {
      findUnique: vi.fn(),
    },
  },
}));

describe('SSE Routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /:id/events', () => {
    it('should set correct SSE headers', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      expect(response.headers['content-type']).toBe('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
      expect(response.headers['x-accel-buffering']).toBe('no');
    });

    it('should set CORS headers', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should send connection message', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      const payload = response.payload;
      expect(payload).toContain('data: {"type":"connected"}');
    });

    it('should send processing status', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      const payload = response.payload;
      expect(payload).toContain('"type":"status"');
    });

    it('should send complete message for completed receipt', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-01'),
        totalAmount: 99.99,
        items: [
          { id: '1', name: 'Item 1', price: 49.99, quantity: 1 },
          { id: '2', name: 'Item 2', price: 50.0, quantity: 1 },
        ],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      expect(response.body).toContain('"type":"complete"');
      expect(response.body).toContain('"storeName":"Test Store"');
      expect(response.body).toContain('"itemCount":2');
      expect(response.body).toContain('"ocrConfidence":0.95');
    });

    it('should send failed status for failed receipt', async () => {
      const mockReceipt = {
        status: ReceiptStatus.FAILED,
        ocrConfidence: null,
        processingTime: 500,
        storeName: null,
        purchaseDate: null,
        totalAmount: null,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-receipt-id/events',
      });

      expect(response.body).toContain(`"status":"${ReceiptStatus.FAILED}"`);
    });

    it('should handle receipt not found', async () => {
      vi.mocked(db.receipt.findUnique).mockResolvedValue(null);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent-id/events',
      });

      expect(response.body).toContain('"type":"error"');
      expect(response.body).toContain('"message":"Receipt not found"');
    });

    it('should handle database errors', async () => {
      vi.mocked(db.receipt.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-id/events',
      });

      expect(response.body).toContain('"type":"error"');
      expect(response.body).toContain('"message":"Internal error"');
    });

    it('should convert totalAmount to number', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.9,
        processingTime: 1000,
        storeName: 'Store',
        purchaseDate: new Date(),
        totalAmount: 123.45,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-id/events',
      });

      expect(response.body).toContain('"totalAmount":123.45');
    });

    it('should handle null totalAmount', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.9,
        processingTime: 1000,
        storeName: 'Store',
        purchaseDate: new Date(),
        totalAmount: null,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-id/events',
      });

      expect(response.body).toContain('"totalAmount":null');
    });

    it('should query database with correct receipt ID', async () => {
      const receiptId = 'test-receipt-123';
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      await app.inject({
        method: 'GET',
        url: `/${receiptId}/events`,
      });

      expect(db.receipt.findUnique).toHaveBeenCalledWith({
        where: { id: receiptId },
        select: expect.objectContaining({
          status: true,
          ocrConfidence: true,
          processingTime: true,
          storeName: true,
          purchaseDate: true,
          totalAmount: true,
          items: expect.any(Object),
        }),
      });
    });

    it('should handle pending status', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.95,
        processingTime: 1500,
        storeName: 'Test Store',
        purchaseDate: new Date('2025-01-15'),
        totalAmount: 99.99,
        items: [],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-id/events',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should include item count in complete message', async () => {
      const mockReceipt = {
        status: ReceiptStatus.COMPLETED,
        ocrConfidence: 0.85,
        processingTime: 2000,
        storeName: 'Test Store',
        purchaseDate: new Date(),
        totalAmount: 150.0,
        items: [
          { id: '1', name: 'Item 1', price: 50, quantity: 1 },
          { id: '2', name: 'Item 2', price: 50, quantity: 1 },
          { id: '3', name: 'Item 3', price: 50, quantity: 1 },
        ],
      };

      vi.mocked(db.receipt.findUnique).mockResolvedValue(mockReceipt as never);

      await app.register(sseRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/test-id/events',
      });

      expect(response.body).toContain('"itemCount":3');
    });
  });
});
