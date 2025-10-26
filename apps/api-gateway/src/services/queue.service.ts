/**
 * Queue service for managing background jobs with BullMQ
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

import { Queue } from 'bullmq';
import { env } from '../config/env.js';

export class QueueService {
  private ocrQueue: Queue;

  constructor() {
    const redisUrl = env.REDIS_URL || 'redis://localhost:6379';

    this.ocrQueue = new Queue('ocr-processing', {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
        },
        removeOnFail: {
          count: 50, // Keep last 50 failed jobs
        },
      },
    });
  }

  /**
   * Queue a receipt for OCR processing
   * @param receiptId - Receipt ID
   * @param imageUrl - URL of the uploaded image
   */
  async queueOCRJob(receiptId: string, imageUrl: string): Promise<void> {
    await this.ocrQueue.add(
      'process-receipt',
      {
        receiptId,
        imageUrl,
      },
      {
        jobId: receiptId, // Use receiptId as job ID for idempotency
      }
    );
  }

  /**
   * Get job status
   * @param jobId - Job ID (same as receiptId)
   */
  async getJobStatus(jobId: string) {
    const job = await this.ocrQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    return {
      id: job.id,
      state,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason,
    };
  }

  /**
   * Close the queue connection
   */
  async close(): Promise<void> {
    await this.ocrQueue.close();
  }

  /**
   * Get the queue instance for Bull Board
   */
  getQueue(): Queue {
    return this.ocrQueue;
  }
}

export const queueService = new QueueService();
