/**
 * Receipt processor - processes receipts using vision LLM
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
import {
  type IReceiptParser,
  type ReceiptItem,
} from '../parsers/base-receipt-parser.js';
import {
  createReceiptParser,
  getProviderName,
} from '../parsers/parser-factory.js';
import { calculateTotal } from '../parsers/total-parser.js';

const logger = pino({ name: 'receipt-processor' });

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
  private parser: IReceiptParser;

  constructor() {
    this.parser = createReceiptParser();
    logger.info(
      { provider: getProviderName() },
      'Initialized receipt processor'
    );
  }

  /**
   * Process a receipt image using vision LLM
   * @param imageBuffer - Receipt image buffer
   * @returns Processed receipt data
   */
  async process(imageBuffer: Buffer): Promise<ProcessedReceipt> {
    logger.info('Starting receipt processing with vision LLM');

    // Parse directly with vision LLM (no OCR needed)
    logger.info('Parsing receipt image with vision LLM');
    const llmData = await this.parser.parse(imageBuffer);
    logger.info(
      {
        storeName: llmData.storeName,
        date: llmData.date,
        itemCount: llmData.items.length,
        total: llmData.total,
        llmConfidence: llmData.confidence,
      },
      'Vision LLM parsing complete'
    );

    // Convert date string to Date object
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

    // Calculate total from items for verification
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

    return {
      storeName: llmData.storeName,
      date,
      items: llmData.items,
      total: llmData.total,
      calculatedTotal,
      rawText: '', // No OCR text with vision model
      confidence: llmData.confidence,
    };
  }
}
