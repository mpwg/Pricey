/**
 * Tests for queue service (BullMQ job management)
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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hoist mocks to run before imports
const { mockQueue, mockJob, MockQueue } = vi.hoisted(() => {
  const mockJob = {
    id: '123',
    progress: 50,
    attemptsMade: 1,
    failedReason: null as string | null,
    getState: vi.fn().mockResolvedValue('active'),
  };

  const mockQueue = {
    add: vi.fn().mockResolvedValue(mockJob),
    getJob: vi.fn().mockResolvedValue(mockJob),
    close: vi.fn().mockResolvedValue(undefined),
  };

  const MockQueue = vi.fn().mockImplementation(function () {
    return mockQueue;
  });

  return { mockQueue, mockJob, MockQueue };
});

// Mock environment configuration
vi.mock('../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
  },
}));

// Mock BullMQ
vi.mock('bullmq', () => {
  return {
    Queue: MockQueue,
  };
});

import { QueueService } from './queue.service.js';

describe('QueueService', () => {
  let queueService: QueueService;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    mockJob.getState.mockResolvedValue('active');
    mockQueue.getJob.mockResolvedValue(mockJob);

    // Create fresh instance
    queueService = new QueueService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize BullMQ queue with correct configuration', () => {
      expect(queueService).toBeDefined();
    });

    it('should create queue with Redis connection', () => {
      expect(MockQueue).toHaveBeenCalledWith('ocr-processing', {
        connection: {
          url: 'redis://localhost:6379',
        },
        defaultJobOptions: expect.objectContaining({
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        }),
      });
    });
  });

  describe('queueOCRJob', () => {
    it('should queue a job with receiptId and imageUrl', async () => {
      const receiptId = 'receipt-123';
      const imageUrl = 'http://localhost:9000/receipts/test.jpg';

      await queueService.queueOCRJob(receiptId, imageUrl);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-receipt',
        {
          receiptId,
          imageUrl,
        },
        {
          jobId: receiptId,
        }
      );
    });

    it('should use receiptId as jobId for idempotency', async () => {
      const receiptId = 'unique-receipt-id';
      const imageUrl = 'http://localhost:9000/receipts/test.jpg';

      await queueService.queueOCRJob(receiptId, imageUrl);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          jobId: receiptId,
        })
      );
    });

    it('should queue multiple jobs independently', async () => {
      await queueService.queueOCRJob('receipt-1', 'http://test.com/1.jpg');
      await queueService.queueOCRJob('receipt-2', 'http://test.com/2.jpg');

      expect(mockQueue.add).toHaveBeenCalledTimes(2);
    });

    it('should handle long URLs', async () => {
      const longUrl =
        'http://localhost:9000/pricey-receipts/receipts/2024-01-15/550e8400-e29b-41d4-a716-446655440000.jpg';

      await queueService.queueOCRJob('receipt-123', longUrl);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-receipt',
        expect.objectContaining({
          imageUrl: longUrl,
        }),
        expect.any(Object)
      );
    });

    it('should propagate queue errors', async () => {
      mockQueue.add.mockRejectedValueOnce(new Error('Queue full'));

      await expect(
        queueService.queueOCRJob('receipt-123', 'http://test.com/img.jpg')
      ).rejects.toThrow('Queue full');
    });

    it('should handle UUID-based receipt IDs', async () => {
      // Reset mock from previous test
      mockQueue.add.mockResolvedValue(mockJob);

      const uuidReceiptId = '550e8400-e29b-41d4-a716-446655440000';

      await queueService.queueOCRJob(uuidReceiptId, 'http://test.com/img.jpg');

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          receiptId: uuidReceiptId,
        }),
        expect.any(Object)
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status for existing job', async () => {
      mockJob.getState.mockResolvedValue('active');
      mockJob.id = 'job-123';
      mockJob.progress = 75;
      mockJob.attemptsMade = 2;
      mockJob.failedReason = null;
      mockQueue.getJob.mockResolvedValue(mockJob);

      const status = await queueService.getJobStatus('job-123');

      expect(status).toEqual({
        id: 'job-123',
        state: 'active',
        progress: 75,
        attemptsMade: 2,
        failedReason: null,
      });
    });

    it('should return null for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const status = await queueService.getJobStatus('nonexistent-job');

      expect(status).toBeNull();
    });

    it('should handle completed job state', async () => {
      mockJob.getState.mockResolvedValue('completed');
      mockJob.id = 'job-123';

      const status = await queueService.getJobStatus('job-123');

      expect(status?.state).toBe('completed');
    });

    it('should handle failed job state', async () => {
      mockJob.getState.mockResolvedValue('failed');
      mockJob.failedReason = 'OCR processing error';

      const status = await queueService.getJobStatus('job-123');

      expect(status?.state).toBe('failed');
      expect(status?.failedReason).toBe('OCR processing error');
    });

    it('should handle waiting job state', async () => {
      mockJob.getState.mockResolvedValue('waiting');
      mockJob.progress = 0;

      const status = await queueService.getJobStatus('job-123');

      expect(status?.state).toBe('waiting');
      expect(status?.progress).toBe(0);
    });

    it('should handle delayed job state', async () => {
      mockJob.getState.mockResolvedValue('delayed');

      const status = await queueService.getJobStatus('job-123');

      expect(status?.state).toBe('delayed');
    });

    it('should track retry attempts', async () => {
      mockJob.attemptsMade = 3;

      const status = await queueService.getJobStatus('job-123');

      expect(status?.attemptsMade).toBe(3);
    });

    it('should handle jobs with progress updates', async () => {
      mockJob.progress = 33;

      const status = await queueService.getJobStatus('job-123');

      expect(status?.progress).toBe(33);
    });

    it('should call getJob with correct jobId', async () => {
      await queueService.getJobStatus('test-job-id');

      expect(mockQueue.getJob).toHaveBeenCalledWith('test-job-id');
    });

    it('should handle multiple status checks', async () => {
      await queueService.getJobStatus('job-1');
      await queueService.getJobStatus('job-2');
      await queueService.getJobStatus('job-3');

      expect(mockQueue.getJob).toHaveBeenCalledTimes(3);
    });
  });

  describe('close', () => {
    it('should close the queue connection', async () => {
      await queueService.close();

      expect(mockQueue.close).toHaveBeenCalled();
    });

    it('should handle close errors gracefully', async () => {
      mockQueue.close.mockRejectedValueOnce(
        new Error('Connection already closed')
      );

      await expect(queueService.close()).rejects.toThrow(
        'Connection already closed'
      );
    });

    it('should allow multiple close calls', async () => {
      // Reset mock from previous test
      mockQueue.close.mockResolvedValue(undefined);

      await queueService.close();
      vi.clearAllMocks();

      // Second close should still work
      await queueService.close();

      expect(mockQueue.close).toHaveBeenCalled();
    });
  });

  describe('retry configuration', () => {
    it('should configure exponential backoff', () => {
      // Check the queue was created with backoff config
      expect(MockQueue).toHaveBeenCalledWith(
        'ocr-processing',
        expect.objectContaining({
          defaultJobOptions: expect.objectContaining({
            backoff: {
              type: 'exponential',
              delay: 2000,
            },
          }),
        })
      );
    });

    it('should configure retry attempts', () => {
      expect(MockQueue).toHaveBeenCalledWith(
        'ocr-processing',
        expect.objectContaining({
          defaultJobOptions: expect.objectContaining({
            attempts: 3,
          }),
        })
      );
    });

    it('should configure job cleanup', () => {
      expect(MockQueue).toHaveBeenCalledWith(
        'ocr-processing',
        expect.objectContaining({
          defaultJobOptions: expect.objectContaining({
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
          }),
        })
      );
    });
  });
});
