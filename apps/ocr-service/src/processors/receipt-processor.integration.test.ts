/**
 * Integration tests for receipt processor using real receipt images with GitHub Models (Copilot)
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

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ReceiptProcessor } from './receipt-processor.js';

// Mock env to force GitHub Models provider for integration tests
vi.mock('../config/env.js', async () => {
  const actual =
    await vi.importActual<typeof import('../config/env.js')>(
      '../config/env.js'
    );
  return {
    ...actual,
    env: {
      ...actual.env,
      LLM_PROVIDER: 'github' as const,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'test-token',
      GITHUB_MODEL: process.env.GITHUB_MODEL || 'gpt-5-mini',
      LLM_TIMEOUT: 60000,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
    },
  };
});

describe('ReceiptProcessor - GitHub Models (Copilot) Integration', () => {
  const hasGitHubToken = Boolean(process.env.GITHUB_TOKEN);

  beforeAll(() => {
    if (!hasGitHubToken) {
      console.warn(
        '⚠️  GITHUB_TOKEN not set - integration tests will use mock responses'
      );
    }
  });

  describe('with real receipt image', () => {
    it('should process receipt image using GitHub Models (Copilot)', async () => {
      // Skip if no GitHub token available
      if (!hasGitHubToken) {
        return;
      }

      // Load the real receipt image
      const samplePath = join(process.cwd(), '../../samples/Rechung_1.png');
      const imageBuffer = readFileSync(samplePath);

      // Verify image was loaded
      expect(imageBuffer.length).toBeGreaterThan(0);

      // Create processor and process the image
      const processor = new ReceiptProcessor();
      const result = await processor.process(imageBuffer);

      // Verify basic structure
      expect(result).toBeDefined();
      expect(result.rawText).toBe(''); // Vision models don't use OCR

      // Verify confidence is reasonable (GitHub Models should provide good confidence)
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);

      // Verify items were extracted - this is the key test
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);

      // Verify each item has required fields
      result.items.forEach((item) => {
        expect(item.name).toBeTruthy();
        expect(typeof item.name).toBe('string');
        expect(item.price).toBeGreaterThanOrEqual(0);
        expect(item.quantity).toBeGreaterThanOrEqual(0);
      });

      // Verify store name was extracted
      expect(result.storeName).toBeTruthy();
      expect(typeof result.storeName).toBe('string');

      // Verify calculated total is reasonable
      expect(result.calculatedTotal).toBeGreaterThanOrEqual(0);

      // If LLM extracted a total, it should be close to calculated
      if (result.total !== null) {
        const difference = Math.abs(result.total - result.calculatedTotal);
        const percentDiff =
          (difference / Math.max(result.total, result.calculatedTotal)) * 100;
        // Allow up to 10% difference (LLM might include tax, discounts, etc.)
        expect(percentDiff).toBeLessThan(10);
      }
    }, 90000); // 90 second timeout for real API call
  });

  describe('error handling', () => {
    it('should handle invalid image data gracefully', async () => {
      if (!hasGitHubToken) {
        return;
      }

      const processor = new ReceiptProcessor();
      const invalidBuffer = Buffer.from('not-an-image');

      // GitHub Models should return empty/null result for invalid images
      const result = await processor.process(invalidBuffer);

      expect(result).toBeDefined();
      expect(result.storeName).toBeNull();
      expect(result.items).toHaveLength(0);
      expect(result.total).toBeNull();
      expect(result.calculatedTotal).toBe(0);
    }, 30000);

    it('should handle empty image buffer', async () => {
      if (!hasGitHubToken) {
        return;
      }

      const processor = new ReceiptProcessor();
      const emptyBuffer = Buffer.alloc(0);

      const result = await processor.process(emptyBuffer);

      expect(result).toBeDefined();
      expect(result.storeName).toBeNull();
      expect(result.items).toHaveLength(0);
    }, 30000);
  });
});
