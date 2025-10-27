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

    // Vision model doesn't use OCR text, so rawText is empty
    expect(result.rawText).toBe('');

    // Verify confidence is reasonable
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(1);

    // Verify items were extracted
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);

    // Verify store name was extracted
    expect(result.storeName).toBeTruthy();

    // Basic assertions - we don't know exact values but can verify structure
    expect(result.calculatedTotal).toBeGreaterThanOrEqual(0);
  }, 60000); // 60 second timeout for vision model processing

  it('should handle invalid image gracefully', async () => {
    const processor = new ReceiptProcessor();
    const invalidBuffer = Buffer.from('not-an-image');

    // Vision model returns empty result for invalid images instead of throwing
    const result = await processor.process(invalidBuffer);
    expect(result.storeName).toBeNull();
    expect(result.items).toHaveLength(0);
  });

  it('should handle empty image buffer', async () => {
    const processor = new ReceiptProcessor();
    const emptyBuffer = Buffer.alloc(0);

    // Vision model returns empty result for empty buffer instead of throwing
    const result = await processor.process(emptyBuffer);
    expect(result.storeName).toBeNull();
    expect(result.items).toHaveLength(0);
  }, 10000); // 10 second timeout
});
