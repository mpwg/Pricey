/**
 * Tests for storage service (S3/MinIO file operations)
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Readable } from 'node:stream';
import type { MultipartFile } from '@fastify/multipart';

// Hoist mocks to run before imports
const { mockMinioClient } = vi.hoisted(() => {
  const mockMinioClient = {
    bucketExists: vi.fn().mockResolvedValue(true),
    makeBucket: vi.fn().mockResolvedValue(undefined),
    putObject: vi.fn().mockResolvedValue({ etag: 'mock-etag' }),
    getObject: vi.fn(),
    removeObject: vi.fn().mockResolvedValue(undefined),
  };

  return { mockMinioClient };
});

// Mock environment configuration
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    S3_ENDPOINT: 'localhost',
    S3_PORT: 9000,
    S3_BUCKET: 'pricy-receipts',
    S3_ACCESS_KEY: 'minioadmin',
    S3_SECRET_KEY: 'minioadmin',
    S3_USE_SSL: false,
  },
}));

// Mock MinIO module
vi.mock('minio', () => {
  return {
    Client: vi.fn().mockImplementation(function () {
      return mockMinioClient;
    }),
  };
});

import { StorageService } from './storage.service.js';

describe('StorageService', () => {
  let storageService: StorageService;

  beforeEach(async () => {
    // Create fresh instance for each test
    storageService = new StorageService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize MinIO client with environment config', () => {
      expect(storageService).toBeDefined();
      // @ts-expect-error - accessing private property for testing
      expect(storageService.client).toBeDefined();
    });

    it('should call ensureBucketExists on initialization', () => {
      expect(mockMinioClient.bucketExists).toHaveBeenCalled();
    });
  });

  describe('uploadReceipt', () => {
    it('should upload file and return URL', async () => {
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt.jpg',
        mimetype: 'image/jpeg',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-image-data')),
      };

      const url = await storageService.uploadReceipt(mockFile as MultipartFile);

      expect(mockFile.toBuffer).toHaveBeenCalled();
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'pricy-receipts',
        expect.stringMatching(/^receipts\/\d{4}-\d{2}-\d{2}\/.+\.jpg$/),
        expect.any(Buffer),
        expect.any(Number),
        { 'Content-Type': 'image/jpeg' }
      );
      expect(url).toMatch(/^http:\/\/.+\/pricy-receipts\/receipts\/.+\.jpg$/);
    });

    it('should handle PNG files', async () => {
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt.png',
        mimetype: 'image/png',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-png-data')),
      };

      await storageService.uploadReceipt(mockFile as MultipartFile);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'pricy-receipts',
        expect.stringMatching(/\.png$/),
        expect.any(Buffer),
        expect.any(Number),
        { 'Content-Type': 'image/png' }
      );
    });

    it('should handle PDF files', async () => {
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt.pdf',
        mimetype: 'application/pdf',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-data')),
      };

      const url = await storageService.uploadReceipt(mockFile as MultipartFile);

      expect(url).toBeDefined();
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'pricy-receipts',
        expect.stringMatching(/\.pdf$/),
        expect.any(Buffer),
        expect.any(Number),
        { 'Content-Type': 'application/pdf' }
      );
    });

    it('should generate unique keys for multiple uploads', async () => {
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt.jpg',
        mimetype: 'image/jpeg',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
      };

      const url1 = await storageService.uploadReceipt(
        mockFile as MultipartFile
      );
      const url2 = await storageService.uploadReceipt(
        mockFile as MultipartFile
      );

      expect(url1).not.toBe(url2);
    });

    it('should handle files without extension', async () => {
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt',
        mimetype: 'image/jpeg',
        toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-data')),
      };

      const url = await storageService.uploadReceipt(mockFile as MultipartFile);

      expect(url).toBeDefined();
      // Key should still be valid even without extension
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    it('should upload correct buffer length', async () => {
      const testBuffer = Buffer.from('test-image-data-12345');
      const mockFile: Partial<MultipartFile> = {
        filename: 'receipt.jpg',
        mimetype: 'image/jpeg',
        toBuffer: vi.fn().mockResolvedValue(testBuffer),
      };

      await storageService.uploadReceipt(mockFile as MultipartFile);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        testBuffer,
        testBuffer.length,
        expect.any(Object)
      );
    });
  });

  describe('downloadFile', () => {
    it('should download file and return buffer', async () => {
      const mockData = Buffer.from('mock-file-content');
      const mockStream = Readable.from([mockData]);

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const buffer = await storageService.downloadFile(
        'receipts/2024-01-15/test.jpg'
      );

      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'pricy-receipts',
        'receipts/2024-01-15/test.jpg'
      );
      expect(buffer).toEqual(mockData);
    });

    it('should handle multiple chunks', async () => {
      const chunk1 = Buffer.from('part1');
      const chunk2 = Buffer.from('part2');
      const chunk3 = Buffer.from('part3');
      const mockStream = Readable.from([chunk1, chunk2, chunk3]);

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const buffer = await storageService.downloadFile('receipts/test.jpg');

      expect(buffer).toEqual(Buffer.concat([chunk1, chunk2, chunk3]));
    });

    it('should handle stream errors', async () => {
      const mockStream = new Readable({
        read() {
          this.emit('error', new Error('Stream error'));
        },
      });

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      await expect(
        storageService.downloadFile('receipts/error.jpg')
      ).rejects.toThrow('Stream error');
    });

    it('should handle empty files', async () => {
      const mockStream = Readable.from([]);

      mockMinioClient.getObject.mockResolvedValue(mockStream);

      const buffer = await storageService.downloadFile('receipts/empty.jpg');

      expect(buffer).toEqual(Buffer.from([]));
      expect(buffer.length).toBe(0);
    });
  });

  describe('deleteFile', () => {
    it('should delete file by key', async () => {
      await storageService.deleteFile('receipts/2024-01-15/test.jpg');

      expect(mockMinioClient.removeObject).toHaveBeenCalledWith(
        'pricy-receipts',
        'receipts/2024-01-15/test.jpg'
      );
    });

    it('should handle multiple deletions', async () => {
      await storageService.deleteFile('receipts/file1.jpg');
      await storageService.deleteFile('receipts/file2.jpg');

      expect(mockMinioClient.removeObject).toHaveBeenCalledTimes(2);
    });

    it('should propagate deletion errors', async () => {
      mockMinioClient.removeObject.mockRejectedValue(
        new Error('Delete failed')
      );

      await expect(
        storageService.deleteFile('receipts/nonexistent.jpg')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getFileExtension', () => {
    it('should extract .jpg extension', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('receipt.jpg');
      expect(ext).toBe('.jpg');
    });

    it('should extract .png extension', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('receipt.png');
      expect(ext).toBe('.png');
    });

    it('should extract .pdf extension', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('document.pdf');
      expect(ext).toBe('.pdf');
    });

    it('should handle multiple dots in filename', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('receipt.backup.jpg');
      expect(ext).toBe('.jpg');
    });

    it('should handle uppercase extensions', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('RECEIPT.JPG');
      expect(ext).toBe('.jpg');
    });

    it('should return empty string for files without extension', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('receipt');
      expect(ext).toBe('');
    });

    it('should handle files with dots but no extension', () => {
      // @ts-expect-error - testing private method
      const ext = storageService.getFileExtension('file.');
      // Regex /\.[^.]+$/ doesn't match just a trailing dot
      expect(ext).toBe('');
    });
  });

  describe('generateKey', () => {
    it('should generate key with date and UUID', () => {
      // @ts-expect-error - testing private method
      const key = storageService.generateKey('.jpg');

      expect(key).toMatch(/^receipts\/\d{4}-\d{2}-\d{2}\/.+\.jpg$/);
    });

    it('should generate unique keys', () => {
      // @ts-expect-error - testing private method
      const key1 = storageService.generateKey('.jpg');
      // @ts-expect-error - testing private method
      const key2 = storageService.generateKey('.jpg');

      expect(key1).not.toBe(key2);
    });

    it('should include current date in key', () => {
      const today = new Date().toISOString().split('T')[0];

      // @ts-expect-error - testing private method
      const key = storageService.generateKey('.jpg');

      expect(key).toContain(today);
    });

    it('should handle different extensions', () => {
      // @ts-expect-error - testing private method
      const jpgKey = storageService.generateKey('.jpg');
      // @ts-expect-error - testing private method
      const pngKey = storageService.generateKey('.png');
      // @ts-expect-error - testing private method
      const pdfKey = storageService.generateKey('.pdf');

      expect(jpgKey).toMatch(/\.jpg$/);
      expect(pngKey).toMatch(/\.png$/);
      expect(pdfKey).toMatch(/\.pdf$/);
    });

    it('should handle empty extension', () => {
      // @ts-expect-error - testing private method
      const key = storageService.generateKey('');

      expect(key).toMatch(/^receipts\/\d{4}-\d{2}-\d{2}\/.+$/);
      expect(key).not.toContain('..');
    });
  });

  describe('getFileUrl', () => {
    it('should construct URL with protocol, host, port, bucket, and key', () => {
      // @ts-expect-error - testing private method
      const url = storageService.getFileUrl('receipts/2024-01-15/test.jpg');

      expect(url).toMatch(/^http:\/\/.+:\d+\/pricy-receipts\/receipts\/.+$/);
    });

    it('should use http protocol when SSL is disabled', () => {
      // @ts-expect-error - testing private method
      const url = storageService.getFileUrl('receipts/test.jpg');

      expect(url).toMatch(/^http:\/\//);
    });
  });

  describe('getKeyFromUrl', () => {
    it('should extract key from full URL', () => {
      const url =
        'http://localhost:9000/pricy-receipts/receipts/2024-01-15/abc-123.jpg';
      const key = storageService.getKeyFromUrl(url);

      expect(key).toBe('receipts/2024-01-15/abc-123.jpg');
    });

    it('should extract key with UUID', () => {
      const url =
        'http://localhost:9000/pricy-receipts/receipts/2024-01-15/550e8400-e29b-41d4-a716-446655440000.jpg';
      const key = storageService.getKeyFromUrl(url);

      expect(key).toBe(
        'receipts/2024-01-15/550e8400-e29b-41d4-a716-446655440000.jpg'
      );
    });

    it('should handle different file extensions', () => {
      const jpgUrl =
        'http://localhost:9000/pricy-receipts/receipts/2024-01-15/test.jpg';
      const pngUrl =
        'http://localhost:9000/pricy-receipts/receipts/2024-01-15/test.png';

      expect(storageService.getKeyFromUrl(jpgUrl)).toContain('.jpg');
      expect(storageService.getKeyFromUrl(pngUrl)).toContain('.png');
    });

    it('should return original string if no match found', () => {
      const invalidUrl = 'invalid-url';
      const key = storageService.getKeyFromUrl(invalidUrl);

      expect(key).toBe(invalidUrl);
    });

    it('should handle HTTPS URLs', () => {
      const url =
        'https://s3.amazonaws.com/pricy-receipts/receipts/2024-01-15/test.jpg';
      const key = storageService.getKeyFromUrl(url);

      expect(key).toBe('receipts/2024-01-15/test.jpg');
    });

    it('should handle URLs with different ports', () => {
      const url =
        'http://localhost:8080/pricy-receipts/receipts/2024-01-15/test.jpg';
      const key = storageService.getKeyFromUrl(url);

      expect(key).toBe('receipts/2024-01-15/test.jpg');
    });
  });

  describe('ensureBucketExists', () => {
    it('should create bucket if it does not exist', async () => {
      mockMinioClient.bucketExists.mockResolvedValue(false);
      mockMinioClient.makeBucket.mockResolvedValue(undefined);

      // Create new instance to trigger ensureBucketExists
      const newService = new StorageService();
      // @ts-expect-error - accessing private property
      const client = newService.client;

      // Wait for async initialization
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(client.bucketExists).toHaveBeenCalled();
      expect(client.makeBucket).toHaveBeenCalledWith(
        'pricy-receipts',
        'us-east-1'
      );
    });

    it('should not create bucket if it already exists', async () => {
      // Reset mocks from previous tests
      mockMinioClient.bucketExists.mockClear();
      mockMinioClient.makeBucket.mockClear();
      mockMinioClient.bucketExists.mockResolvedValue(true);

      const newService = new StorageService();
      // @ts-expect-error - accessing private property
      const client = newService.client;

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(client.bucketExists).toHaveBeenCalled();
      expect(client.makeBucket).not.toHaveBeenCalled();
    });

    it('should handle bucket creation errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockMinioClient.bucketExists.mockRejectedValue(
        new Error('Network error')
      );

      // Should not throw, just log error
      expect(() => new StorageService()).not.toThrow();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
