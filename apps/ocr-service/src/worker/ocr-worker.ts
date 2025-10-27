/**
 * BullMQ worker for OCR processing
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

import { Worker, Job } from 'bullmq';
import { db } from '@pricey/database';
import { env } from '../config/env.js';
import { storageService } from '../services/storage.service.js';
import { ReceiptProcessor } from '../processors/receipt-processor.js';
import { pino } from 'pino';

const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

interface OCRJobData {
  receiptId: string;
  imageUrl: string;
}

const receiptProcessor = new ReceiptProcessor();

async function processOCRJob(job: Job<OCRJobData>) {
  const { receiptId, imageUrl } = job.data;
  const startTime = Date.now();

  logger.info({ receiptId, imageUrl }, 'Starting OCR processing');

  try {
    // Update status to PROCESSING
    await db.receipt.update({
      where: { id: receiptId },
      data: { status: 'PROCESSING' },
    });

    // Download image from S3
    const key = storageService.getKeyFromUrl(imageUrl);
    const imageBuffer = await storageService.downloadFile(key);

    logger.info({ receiptId, key }, 'Downloaded image from storage');

    // Process receipt
    const result = await receiptProcessor.process(imageBuffer);

    logger.info(
      { receiptId, itemCount: result.items.length },
      'OCR processing complete'
    );

    const processingTime = Date.now() - startTime;

    // Update receipt in database
    await db.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'COMPLETED',
        storeName: result.storeName,
        purchaseDate: result.date,
        totalAmount: result.total,
        rawOcrText: result.rawText,
        ocrConfidence: result.confidence,
        processingTime,
        items: {
          createMany: {
            data: result.items.map((item, index) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              lineNumber: item.lineNumber ?? index + 1,
              confidence: item.confidence,
            })),
          },
        },
      },
    });

    logger.info({ receiptId, processingTime }, 'Receipt saved to database');

    return { success: true, itemCount: result.items.length };
  } catch (error) {
    logger.error({ receiptId, error }, 'OCR processing failed');

    // Update receipt status to FAILED
    await db.receipt.update({
      where: { id: receiptId },
      data: {
        status: 'FAILED',
        processingTime: Date.now() - startTime,
      },
    });

    throw error;
  }
}

export function createOCRWorker() {
  const worker = new Worker('ocr-processing', processOCRJob, {
    connection: {
      url: env.REDIS_URL,
    },
    concurrency: env.OCR_CONCURRENCY,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs per minute
    },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err }, 'Job failed');
  });

  worker.on('error', (err) => {
    logger.error({ error: err }, 'Worker error');
  });

  return worker;
}
