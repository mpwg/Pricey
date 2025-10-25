/**
 * Unit tests for file validation utilities
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateImage, ValidationError } from './file-validation.js';
import type { MultipartFile } from '@fastify/multipart';

// Mock sharp using vi.hoisted() to ensure proper hoisting
const { mockSharpInstance, mockSharp } = vi.hoisted(() => {
  const mockSharpInstance = {
    metadata: vi.fn(),
  };

  const mockSharp = vi.fn(() => mockSharpInstance);

  return { mockSharpInstance, mockSharp };
});

vi.mock('sharp', () => ({
  default: mockSharp,
}));

describe('file-validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createMockFile(options: {
    bytesRead: number;
    mimetype: string;
    filename: string;
    buffer?: Buffer;
    width?: number;
    height?: number;
  }): MultipartFile {
    const buffer = options.buffer || Buffer.from('fake-image-data');

    // Set up mock sharp to return specified dimensions
    if (options.width && options.height) {
      mockSharpInstance.metadata.mockResolvedValue({
        width: options.width,
        height: options.height,
      });
    } else {
      mockSharpInstance.metadata.mockRejectedValue(new Error('Invalid image'));
    }

    return {
      file: {
        bytesRead: options.bytesRead,
      },
      mimetype: options.mimetype,
      filename: options.filename,
      toBuffer: async () => buffer,
    } as unknown as MultipartFile;
  }

  describe('validateImage - file size', () => {
    it('should accept files under 10MB', async () => {
      const file = createMockFile({
        bytesRead: 5 * 1024 * 1024, // 5MB
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should accept files at exactly 10MB', async () => {
      const file = createMockFile({
        bytesRead: 10 * 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should reject files over 10MB', async () => {
      const file = createMockFile({
        bytesRead: 11 * 1024 * 1024, // 11MB
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow(
        'File size exceeds maximum of 10MB'
      );
    });
  });

  describe('validateImage - MIME type', () => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];

    validTypes.forEach((mimeType) => {
      it(`should accept ${mimeType}`, async () => {
        const file = createMockFile({
          bytesRead: 1024 * 1024, // 1MB
          mimetype: mimeType,
          filename: 'test.jpg',
          width: 1000,
          height: 1000,
        });

        await expect(validateImage(file)).resolves.toBeUndefined();
      });
    });

    it('should reject webp images', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/webp',
        filename: 'test.webp',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject PDF files', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'application/pdf',
        filename: 'test.pdf',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow('Invalid file type');
    });

    it('should reject video files', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'video/mp4',
        filename: 'test.mp4',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
    });

    it('should reject text files', async () => {
      const file = createMockFile({
        bytesRead: 1024,
        mimetype: 'text/plain',
        filename: 'test.txt',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
    });
  });

  describe('validateImage - file extension', () => {
    it('should accept .jpg extension', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should accept .jpeg extension', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpeg',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should accept .png extension', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/png',
        filename: 'test.png',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should reject .webp extension', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg', // Valid MIME type but wrong extension
        filename: 'test.webp',
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow(
        'Invalid file extension'
      );
    });

    it('should be case insensitive for extensions', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.JPG',
        width: 1000,
        height: 1000,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });
  });

  describe('validateImage - image dimensions', () => {
    it('should accept images with valid dimensions', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 1920,
        height: 1080,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should accept images at minimum dimensions', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 500,
        height: 500,
      });

      await expect(validateImage(file)).resolves.toBeUndefined();
    });

    it('should reject images too small in width', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 400,
        height: 600,
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow(
        'Image dimensions too small'
      );
    });

    it('should reject images too small in height', async () => {
      const file = createMockFile({
        bytesRead: 1024 * 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        width: 600,
        height: 400,
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow(
        'Image dimensions too small'
      );
    });

    it('should reject corrupted images', async () => {
      const file = createMockFile({
        bytesRead: 1024,
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
        // No width/height will cause metadata to throw
      });

      await expect(validateImage(file)).rejects.toThrow(ValidationError);
      await expect(validateImage(file)).rejects.toThrow(
        'Invalid or corrupted image file'
      );
    });
  });

  describe('ValidationError', () => {
    it('should create error with message and code', () => {
      const error = new ValidationError('Test message', 'TEST_CODE');

      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.name).toBe('ValidationError');
      expect(error).toBeInstanceOf(Error);
    });
  });
});
