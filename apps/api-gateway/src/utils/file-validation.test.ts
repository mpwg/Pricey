/**
 * Example unit tests demonstrating testing patterns
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
import { validateFileSize, validateImageType } from './file-validation';

describe('file-validation', () => {
  describe('validateFileSize', () => {
    it('should accept files under 10MB', () => {
      const result = validateFileSize(5 * 1024 * 1024); // 5MB
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept files at exactly 10MB', () => {
      const result = validateFileSize(10 * 1024 * 1024);
      expect(result.valid).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const result = validateFileSize(11 * 1024 * 1024); // 11MB
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be less than 10MB');
    });

    it('should reject zero-sized files', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be greater than 0');
    });

    it('should reject negative file sizes', () => {
      const result = validateFileSize(-1);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be greater than 0');
    });

    it('should handle very large file sizes', () => {
      const result = validateFileSize(Number.MAX_SAFE_INTEGER);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateImageType', () => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    validTypes.forEach((mimeType) => {
      it(`should accept ${mimeType}`, () => {
        const result = validateImageType(mimeType);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject PDF files', () => {
      const result = validateImageType('application/pdf');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an image');
    });

    it('should reject video files', () => {
      const result = validateImageType('video/mp4');
      expect(result.valid).toBe(false);
    });

    it('should reject text files', () => {
      const result = validateImageType('text/plain');
      expect(result.valid).toBe(false);
    });

    it('should handle empty mime type', () => {
      const result = validateImageType('');
      expect(result.valid).toBe(false);
    });

    it('should be case insensitive', () => {
      const result = validateImageType('IMAGE/JPEG');
      expect(result.valid).toBe(true);
    });
  });
});
