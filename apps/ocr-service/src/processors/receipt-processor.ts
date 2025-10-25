/**
 * Receipt processor - orchestrates OCR and parsing
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

import * as chrono from 'chrono-node';
import { isFuture, subYears } from 'date-fns';
import { TesseractOCR } from '../ocr/tesseract.js';
import { detectStore } from '../parsers/store-detector.js';
import { extractItems, type ReceiptItem } from '../parsers/item-parser.js';
import { extractTotal, calculateTotal } from '../parsers/total-parser.js';

export interface ProcessedReceipt {
  storeName: string | null;
  date: Date | null;
  items: ReceiptItem[];
  total: number | null;
  calculatedTotal: number;
  rawText: string;
  confidence: number;
}

export class ReceiptProcessor {
  private ocr: TesseractOCR;

  constructor() {
    this.ocr = new TesseractOCR();
  }

  /**
   * Process a receipt image
   * @param imageBuffer - Receipt image buffer
   * @returns Processed receipt data
   */
  async process(imageBuffer: Buffer): Promise<ProcessedReceipt> {
    // Run OCR
    const { text: rawText, confidence } =
      await this.ocr.processReceipt(imageBuffer);

    // Extract store name
    const storeName = detectStore(rawText);

    // Extract date using chrono-node natural language parser
    const date = this.extractDate(rawText);

    // Extract items
    const items = extractItems(rawText);

    // Extract total
    const total = extractTotal(rawText);

    // Calculate total from items
    const calculatedTotal = calculateTotal(items);

    return {
      storeName,
      date,
      items,
      total,
      calculatedTotal,
      rawText,
      confidence,
    };
  }

  /**
   * Extract date from receipt text using chrono-node
   * @param text - OCR extracted text
   * @returns Date or null if not found
   */
  private extractDate(text: string): Date | null {
    // Use chrono's strict mode to avoid false positives
    const results = chrono.strict.parse(text, new Date());

    // Find the first valid receipt date
    for (const result of results) {
      const date = result.start.date();

      // Date must not be in the future
      if (isFuture(date)) {
        continue;
      }

      // Date must not be more than 1 year old (with 1 day buffer)
      const oneYearOneDayAgo = subYears(new Date(), 1);
      oneYearOneDayAgo.setDate(oneYearOneDayAgo.getDate() - 1);

      if (date >= oneYearOneDayAgo) {
        return date;
      }
    }

    return null;
  }
}
