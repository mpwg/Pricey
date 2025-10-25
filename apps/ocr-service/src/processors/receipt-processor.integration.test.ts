/**
 * Integration tests for receipt processor using real receipt images
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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ReceiptProcessor } from './receipt-processor.js';

describe('ReceiptProcessor - Real Image Integration', () => {
  it('should process real receipt image from samples folder', async () => {
    // Load the real receipt image
    const samplePath = join(process.cwd(), '../../samples/Rechung_1.png');
    const imageBuffer = readFileSync(samplePath);

    // Create processor and process the image
    const processor = new ReceiptProcessor();
    const result = await processor.process(imageBuffer);

    // Verify basic structure
    expect(result).toBeDefined();
    expect(result.rawText).toBeDefined();
    expect(typeof result.rawText).toBe('string');
    expect(result.rawText.length).toBeGreaterThan(0);

    // Verify confidence is reasonable
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);

    // Verify items were extracted
    expect(Array.isArray(result.items)).toBe(true);

    // Basic assertions - we don't know exact values but can verify structure
    expect(result.calculatedTotal).toBeGreaterThanOrEqual(0);
  }, 60000); // 60 second timeout for OCR processing

  it('should handle invalid image gracefully', async () => {
    const processor = new ReceiptProcessor();
    const invalidBuffer = Buffer.from('not-an-image');

    // Should either throw or return empty result
    await expect(processor.process(invalidBuffer)).rejects.toThrow();
  });

  it('should handle empty image buffer', async () => {
    const processor = new ReceiptProcessor();
    const emptyBuffer = Buffer.alloc(0);

    await expect(processor.process(emptyBuffer)).rejects.toThrow();
  });
});
