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

import pino from 'pino';
import { TesseractOCR } from '../ocr/tesseract.js';
import {
  LlmReceiptParser,
  type LlmReceiptItem,
} from '../parsers/llm-receipt-parser.js';
import { calculateTotal } from '../parsers/total-parser.js';

const logger = pino({ name: 'receipt-processor' });

export interface ProcessedReceipt {
  storeName: string | null;
  date: Date | null;
  items: LlmReceiptItem[];
  total: number | null;
  calculatedTotal: number;
  rawText: string;
  confidence: number;
}

export class ReceiptProcessor {
  private ocr: TesseractOCR;
  private llmParser: LlmReceiptParser;

  constructor() {
    this.ocr = new TesseractOCR();
    this.llmParser = new LlmReceiptParser();
  }

  /**
   * Process a receipt image using OCR + LLM parsing
   * @param imageBuffer - Receipt image buffer
   * @returns Processed receipt data
   */
  async process(imageBuffer: Buffer): Promise<ProcessedReceipt> {
    logger.info('Starting receipt processing with LLM parser');

    // Step 1: Run OCR to extract text
    logger.info('Running OCR');
    const { text: rawText, confidence: ocrConfidence } =
      await this.ocr.processReceipt(imageBuffer);
    logger.info(
      {
        confidence: (ocrConfidence * 100).toFixed(1) + '%',
        textLength: rawText.length,
      },
      'OCR complete'
    );

    // Step 2: Parse with LLM
    logger.info('Parsing receipt with LLM');
    const llmData = await this.llmParser.parse(rawText);
    logger.info(
      {
        storeName: llmData.storeName,
        date: llmData.date,
        itemCount: llmData.items.length,
        total: llmData.total,
        llmConfidence: llmData.confidence,
      },
      'LLM parsing complete'
    );

    // Step 3: Convert date string to Date object
    let date: Date | null = null;
    if (llmData.date) {
      try {
        date = new Date(llmData.date);
        // Validate date is reasonable
        if (isNaN(date.getTime())) {
          logger.warn({ dateString: llmData.date }, 'Invalid date from LLM');
          date = null;
        }
      } catch (error) {
        logger.warn(
          { error, dateString: llmData.date },
          'Failed to parse date'
        );
      }
    }

    // Step 4: Calculate total from items for verification
    const calculatedTotal = calculateTotal(llmData.items);
    logger.info(
      {
        extractedTotal: llmData.total?.toFixed(2) || 'none',
        calculatedTotal: calculatedTotal.toFixed(2),
        difference: llmData.total
          ? Math.abs(llmData.total - calculatedTotal).toFixed(2)
          : 'N/A',
      },
      'Total comparison'
    );

    // Combine OCR and LLM confidence
    const combinedConfidence = (ocrConfidence + llmData.confidence) / 2;

    return {
      storeName: llmData.storeName,
      date,
      items: llmData.items,
      total: llmData.total,
      calculatedTotal,
      rawText,
      confidence: combinedConfidence,
    };
  }
}
