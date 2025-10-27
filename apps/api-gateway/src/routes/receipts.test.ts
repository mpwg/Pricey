/**
 * Receipt routes integration tests
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { ReceiptStatus } from '@pricey/types';

// Mock environment first before any imports
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    LOG_LEVEL: 'error',
    CORS_ORIGIN: '*',
    RATE_LIMIT_MAX: 100,
    RATE_LIMIT_WINDOW: '1m',
    S3_ENDPOINT: 'http://localhost:9000',
    S3_ACCESS_KEY: 'test',
    S3_SECRET_KEY: 'test',
    S3_BUCKET: 'test',
    S3_REGION: 'us-east-1',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

// Mock dependencies at module level
vi.mock('@pricey/database', () => ({
  db: {
    receipt: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../services/storage.service.js', () => ({
  storageService: {
    uploadReceipt: vi.fn(),
    downloadFile: vi.fn(),
    deleteFile: vi.fn(),
  },
}));

vi.mock('../services/queue.service.js', () => ({
  queueService: {
    queueOCRJob: vi.fn(),
    getJobStatus: vi.fn(),
  },
}));

vi.mock('../utils/file-validation.js', async () => {
  const actual = await vi.importActual<
    typeof import('../utils/file-validation.js')
  >('../utils/file-validation.js');
  return {
    ...actual,
    validateImage: vi.fn(),
  };
});

import { db } from '@pricey/database';
import { storageService } from '../services/storage.service.js';
import { queueService } from '../services/queue.service.js';
import { validateImage, ValidationError } from '../utils/file-validation.js';
import { buildApp } from '../app.js';

// Helper to create Decimal-like mock objects
function createDecimalMock(value: number) {
  return {
    toNumber: () => value,
    toString: () => value.toString(),
    valueOf: () => value, // This makes Number() work correctly
  };
}

describe('Receipt Routes Integration Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await buildApp();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /api/v1/receipts/upload', () => {
    it('should upload a receipt successfully', async () => {
      // Mock implementations
      const mockReceiptId = 'receipt-123';
      const mockImageUrl = 'https://s3.example.com/receipts/receipt-123.jpg';
      const mockCreatedAt = new Date('2025-10-25T10:00:00Z');

      vi.mocked(validateImage).mockResolvedValue(undefined);
      vi.mocked(storageService.uploadReceipt).mockResolvedValue(mockImageUrl);
      vi.mocked(db.receipt.create).mockResolvedValue({
        id: mockReceiptId,
        imageUrl: mockImageUrl,
        status: ReceiptStatus.PENDING,
        createdAt: mockCreatedAt,
        updatedAt: mockCreatedAt,
        storeName: null,
        storeId: null,
        purchaseDate: null,
        totalAmount: null,
        ocrProvider: 'llm',
        ocrConfidence: null,
        rawOcrText: null,
        processingTime: null,
      } as never);
      vi.mocked(queueService.queueOCRJob).mockResolvedValue(undefined);
      vi.mocked(db.receipt.update).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.PROCESSING,
      } as never);

      // Create a mock file
      const fileContent = Buffer.from('fake-image-content');

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----boundary',
        },
        payload: [
          '------boundary',
          'Content-Disposition: form-data; name="file"; filename="receipt.jpg"',
          'Content-Type: image/jpeg',
          '',
          fileContent.toString(),
          '------boundary--',
        ].join('\r\n'),
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        status: ReceiptStatus.PROCESSING,
        uploadedAt: mockCreatedAt.toISOString(),
        processingStartedAt: expect.any(String),
        imageUrl: mockImageUrl,
      });

      // Verify service calls
      expect(validateImage).toHaveBeenCalledOnce();
      expect(storageService.uploadReceipt).toHaveBeenCalledOnce();
      expect(db.receipt.create).toHaveBeenCalledWith({
        data: {
          imageUrl: mockImageUrl,
          status: ReceiptStatus.PROCESSING,
        },
      });
      expect(queueService.queueOCRJob).toHaveBeenCalledWith(
        mockReceiptId,
        mockImageUrl
      );
    });

    it('should return 400 when no file is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----boundary',
        },
        payload: '------boundary--',
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'No file provided',
        code: 'NO_FILE',
      });
    });

    it('should return 400 when file validation fails', async () => {
      vi.mocked(validateImage).mockRejectedValue(
        new ValidationError('File too large', 'FILE_TOO_LARGE')
      );

      const fileContent = Buffer.from('fake-image-content');
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----boundary',
        },
        payload: [
          '------boundary',
          'Content-Disposition: form-data; name="file"; filename="receipt.jpg"',
          'Content-Type: image/jpeg',
          '',
          fileContent.toString(),
          '------boundary--',
        ].join('\r\n'),
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
      });
      expect(validateImage).toHaveBeenCalledOnce();
    });

    it('should return 500 when upload service fails', async () => {
      vi.mocked(validateImage).mockResolvedValue(undefined);
      vi.mocked(storageService.uploadReceipt).mockRejectedValue(
        new Error('S3 upload failed')
      );

      const fileContent = Buffer.from('fake-image-content');
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/receipts/upload',
        headers: {
          'content-type': 'multipart/form-data; boundary=----boundary',
        },
        payload: [
          '------boundary',
          'Content-Disposition: form-data; name="file"; filename="receipt.jpg"',
          'Content-Type: image/jpeg',
          '',
          fileContent.toString(),
          '------boundary--',
        ].join('\r\n'),
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Failed to upload receipt',
        code: 'UPLOAD_ERROR',
      });
    });
  });

  describe('GET /api/v1/receipts/:id/status', () => {
    it('should return status for pending receipt', async () => {
      const mockReceiptId = 'receipt-123';
      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.PENDING,
        items: [],
        storeName: null,
        purchaseDate: null,
        totalAmount: null,
        processingTime: null,
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}/status`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        status: ReceiptStatus.PENDING,
        progress: 0,
      });
    });

    it('should return status for processing receipt', async () => {
      const mockReceiptId = 'receipt-123';
      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.PROCESSING,
        items: [],
        storeName: null,
        purchaseDate: null,
        totalAmount: null,
        processingTime: null,
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}/status`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        status: ReceiptStatus.PROCESSING,
        progress: 50,
      });
    });

    it('should return status with OCR results for completed receipt', async () => {
      const mockReceiptId = 'receipt-123';
      const mockPurchaseDate = new Date('2025-10-20');

      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.COMPLETED,
        storeName: 'Walmart',
        purchaseDate: mockPurchaseDate,
        totalAmount: createDecimalMock(45.67) as never,
        processingTime: 1250,
        items: [
          {
            id: 'item-1',
            name: 'Milk',
            price: createDecimalMock(3.99) as never,
            quantity: 2,
            confidence: 0.95,
          },
          {
            id: 'item-2',
            name: 'Bread',
            price: createDecimalMock(2.49) as never,
            quantity: 1,
            confidence: 0.88,
          },
        ],
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}/status`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        status: ReceiptStatus.COMPLETED,
        progress: 100,
        ocrResult: {
          storeName: 'Walmart',
          date: mockPurchaseDate.toISOString(),
          items: [
            { name: 'Milk', price: 3.99, quantity: 2, confidence: 0.95 },
            { name: 'Bread', price: 2.49, quantity: 1, confidence: 0.88 },
          ],
          total: 45.67,
        },
        processingTime: 1250,
      });
    });

    it('should return status for failed receipt', async () => {
      const mockReceiptId = 'receipt-123';
      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: 'FAILED',
        items: [],
        storeName: null,
        purchaseDate: null,
        totalAmount: null,
        processingTime: null,
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}/status`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        status: ReceiptStatus.FAILED,
        progress: 0,
      });
    });

    it('should return 404 when receipt not found', async () => {
      vi.mocked(db.receipt.findUnique).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts/nonexistent-id/status',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Receipt not found',
        code: 'NOT_FOUND',
      });
    });

    it('should return 500 when database query fails', async () => {
      vi.mocked(db.receipt.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts/receipt-123/status',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Failed to fetch receipt status',
        code: 'FETCH_ERROR',
      });
    });
  });

  describe('GET /api/v1/receipts/:id', () => {
    it('should return full receipt details', async () => {
      const mockReceiptId = 'receipt-123';
      const mockCreatedAt = new Date('2025-10-20T10:00:00Z');
      const mockUpdatedAt = new Date('2025-10-20T10:02:30Z');
      const mockPurchaseDate = new Date('2025-10-20');

      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        imageUrl: 'https://s3.example.com/receipts/receipt-123.jpg',
        storeName: 'Target',
        purchaseDate: mockPurchaseDate,
        totalAmount: createDecimalMock(89.99) as never,
        status: ReceiptStatus.COMPLETED,
        ocrProvider: 'llm',
        ocrConfidence: 0.92,
        rawOcrText: 'TARGET\nReceipt text...',
        processingTime: 1850,
        createdAt: mockCreatedAt,
        updatedAt: mockUpdatedAt,
        store: {
          id: 'store-1',
          name: 'Target',
          logoUrl: 'https://example.com/logos/target.png',
        },
        items: [
          {
            id: 'item-1',
            name: 'Shampoo',
            price: createDecimalMock(7.99) as never,
            quantity: 1,
            category: 'Personal Care',
            lineNumber: 1,
            confidence: 0.96,
          },
          {
            id: 'item-2',
            name: 'Paper Towels',
            price: createDecimalMock(12.99) as never,
            quantity: 2,
            category: 'Household',
            lineNumber: 2,
            confidence: 0.89,
          },
        ],
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        id: mockReceiptId,
        imageUrl: 'https://s3.example.com/receipts/receipt-123.jpg',
        storeName: 'Target',
        store: {
          id: 'store-1',
          name: 'Target',
          logoUrl: 'https://example.com/logos/target.png',
        },
        purchaseDate: mockPurchaseDate.toISOString(),
        totalAmount: 89.99,
        status: ReceiptStatus.COMPLETED,
        ocrProvider: 'llm',
        ocrConfidence: 0.92,
        rawOcrText: 'TARGET\nReceipt text...',
        processingTime: 1850,
        items: [
          {
            id: 'item-1',
            name: 'Shampoo',
            price: 7.99,
            quantity: 1,
            category: 'Personal Care',
            lineNumber: 1,
            confidence: 0.96,
          },
          {
            id: 'item-2',
            name: 'Paper Towels',
            price: 12.99,
            quantity: 2,
            category: 'Household',
            lineNumber: 2,
            confidence: 0.89,
          },
        ],
        createdAt: mockCreatedAt.toISOString(),
        updatedAt: mockUpdatedAt.toISOString(),
      });
    });

    it('should handle receipt with null store', async () => {
      const mockReceiptId = 'receipt-123';

      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        imageUrl: 'https://s3.example.com/receipts/receipt-123.jpg',
        storeName: null,
        store: null,
        purchaseDate: null,
        totalAmount: null,
        status: ReceiptStatus.PENDING,
        ocrProvider: 'llm',
        ocrConfidence: null,
        rawOcrText: null,
        processingTime: null,
        items: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.storeName).toBeNull();
      expect(body.store).toBeNull();
      expect(body.totalAmount).toBeNull();
    });

    it('should return 404 when receipt not found', async () => {
      vi.mocked(db.receipt.findUnique).mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts/nonexistent-id',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Receipt not found',
        code: 'NOT_FOUND',
      });
    });

    it('should return 500 when database query fails', async () => {
      vi.mocked(db.receipt.findUnique).mockRejectedValue(
        new Error('Database connection timeout')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts/receipt-123',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Failed to fetch receipt details',
        code: 'FETCH_ERROR',
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle completed receipt with no items', async () => {
      const mockReceiptId = 'receipt-123';
      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.COMPLETED,
        items: [],
        storeName: 'Unknown Store',
        purchaseDate: new Date(),
        totalAmount: null,
        processingTime: 1000,
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}/status`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.progress).toBe(100);
      expect(body).not.toHaveProperty('ocrResult'); // No ocrResult when items array is empty
    });

    it('should handle Decimal types correctly in response', async () => {
      const mockReceiptId = 'receipt-123';

      // Test with Decimal-like object
      vi.mocked(db.receipt.findUnique).mockResolvedValue({
        id: mockReceiptId,
        status: ReceiptStatus.COMPLETED,
        totalAmount: createDecimalMock(123.45) as never,
        items: [
          {
            id: 'item-1',
            name: 'Item',
            price: createDecimalMock(123.45) as never,
            quantity: 1,
            category: null,
            lineNumber: 1,
            confidence: 0.9,
          },
        ],
        imageUrl: 'https://example.com/image.jpg',
        storeName: 'Store',
        store: null,
        purchaseDate: new Date(),
        ocrProvider: 'llm',
        ocrConfidence: 0.9,
        rawOcrText: null,
        processingTime: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as never);

      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/receipts/${mockReceiptId}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.totalAmount).toBe(123.45);
      expect(body.items[0].price).toBe(123.45);
    });
  });

  describe('GET /api/v1/receipts', () => {
    it('should return an empty list when no receipts exist', async () => {
      vi.mocked(db.receipt.findMany).mockResolvedValue([]);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ receipts: [] });
    });

    it('should return a list of receipts', async () => {
      const mockReceipts = [
        {
          id: 'receipt-1',
          imageUrl: 'https://example.com/receipt1.jpg',
          storeName: 'Store A',
          storeId: 'store-1',
          purchaseDate: new Date('2025-10-25T10:00:00Z'),
          totalAmount: createDecimalMock(99.99),
          status: ReceiptStatus.COMPLETED,
          createdAt: new Date('2025-10-25T10:00:00Z'),
          updatedAt: new Date('2025-10-25T10:05:00Z'),
          items: [
            {
              id: 'item-1',
              name: 'Item 1',
              price: createDecimalMock(49.99),
              quantity: 1,
            },
            {
              id: 'item-2',
              name: 'Item 2',
              price: createDecimalMock(50.0),
              quantity: 1,
            },
          ],
          store: {
            id: 'store-1',
            name: 'Store A',
            logoUrl: 'https://example.com/logo.jpg',
          },
        },
        {
          id: 'receipt-2',
          imageUrl: 'https://example.com/receipt2.jpg',
          storeName: 'Store B',
          storeId: null,
          purchaseDate: new Date('2025-10-24T15:00:00Z'),
          totalAmount: createDecimalMock(149.5),
          status: ReceiptStatus.PROCESSING,
          createdAt: new Date('2025-10-24T15:00:00Z'),
          updatedAt: new Date('2025-10-24T15:01:00Z'),
          items: [],
          store: null,
        },
      ];

      vi.mocked(db.receipt.findMany).mockResolvedValue(mockReceipts as never);

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);

      expect(body.receipts).toHaveLength(2);
      expect(body.receipts[0]).toEqual({
        id: 'receipt-1',
        imageUrl: 'https://example.com/receipt1.jpg',
        storeName: 'Store A',
        store: {
          id: 'store-1',
          name: 'Store A',
          logoUrl: 'https://example.com/logo.jpg',
        },
        purchaseDate: '2025-10-25T10:00:00.000Z',
        totalAmount: 99.99,
        status: ReceiptStatus.COMPLETED,
        itemCount: 2,
        createdAt: '2025-10-25T10:00:00.000Z',
        updatedAt: '2025-10-25T10:05:00.000Z',
      });

      expect(body.receipts[1]).toEqual({
        id: 'receipt-2',
        imageUrl: 'https://example.com/receipt2.jpg',
        storeName: 'Store B',
        store: null,
        purchaseDate: '2025-10-24T15:00:00.000Z',
        totalAmount: 149.5,
        status: ReceiptStatus.PROCESSING,
        itemCount: 0,
        createdAt: '2025-10-24T15:00:00.000Z',
        updatedAt: '2025-10-24T15:01:00.000Z',
      });

      expect(db.receipt.findMany).toHaveBeenCalledWith({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      });
    });

    it('should handle database errors gracefully', async () => {
      vi.mocked(db.receipt.findMany).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/receipts',
      });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'Failed to fetch receipts',
        code: 'FETCH_ERROR',
      });
    });
  });
});
