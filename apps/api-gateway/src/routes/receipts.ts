/**
 * Receipt upload routes
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

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '@pricey/database';
import { storageService } from '../services/storage.service.js';
import { queueService } from '../services/queue.service.js';
import { validateImage, ValidationError } from '../utils/file-validation.js';
import { sseRoutes } from './sse.js';

export async function receiptsRoutes(app: FastifyInstance) {
  // Register SSE routes
  await app.register(sseRoutes);

  /**
   * List all receipts
   * GET /api/v1/receipts
   */
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const receipts = await db.receipt.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      });

      return reply.send({
        receipts: receipts.map((receipt) => ({
          id: receipt.id,
          imageUrl: receipt.imageUrl,
          storeName: receipt.storeName,
          store: receipt.store,
          purchaseDate: receipt.purchaseDate,
          totalAmount: receipt.totalAmount ? Number(receipt.totalAmount) : null,
          status: receipt.status,
          itemCount: receipt.items.length,
          createdAt: receipt.createdAt,
          updatedAt: receipt.updatedAt,
        })),
      });
    } catch (error) {
      request.log.error(error, 'Error fetching receipts');
      return reply.code(500).send({
        error: 'Failed to fetch receipts',
        code: 'FETCH_ERROR',
      });
    }
  });

  /**
   * Upload a receipt for OCR processing
   * POST /api/v1/receipts/upload
   */
  app.post('/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Get the uploaded file
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          error: 'No file provided',
          code: 'NO_FILE',
        });
      }

      // Validate the image
      await validateImage(data);

      // Upload to storage
      const imageUrl = await storageService.uploadReceipt(data);

      // Queue OCR job first (before creating receipt record)
      // This ensures the job exists before we create the receipt
      // Create receipt record with PROCESSING status immediately
      const receipt = await db.receipt.create({
        data: {
          imageUrl,
          status: 'PROCESSING',
        },
      });

      // Queue OCR job after receipt is created
      await queueService.queueOCRJob(receipt.id, imageUrl);

      return reply.code(201).send({
        id: receipt.id,
        status: 'PROCESSING',
        uploadedAt: receipt.createdAt,
        processingStartedAt: new Date(),
        imageUrl,
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return reply.code(400).send({
          error: error.message,
          code: error.code,
        });
      }

      request.log.error(error, 'Error uploading receipt');
      return reply.code(500).send({
        error: 'Failed to upload receipt',
        code: 'UPLOAD_ERROR',
      });
    }
  });

  /**
   * Get receipt processing status
   * GET /api/v1/receipts/:id/status
   */
  app.get(
    '/:id/status',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      try {
        const receipt = await db.receipt.findUnique({
          where: { id },
          include: {
            items: {
              select: {
                id: true,
                name: true,
                price: true,
                quantity: true,
                confidence: true,
              },
            },
          },
        });

        if (!receipt) {
          return reply.code(404).send({
            error: 'Receipt not found',
            code: 'NOT_FOUND',
          });
        }

        // Calculate progress based on status
        let progress = 0;
        if (receipt.status === 'PENDING') progress = 0;
        else if (receipt.status === 'PROCESSING') progress = 50;
        else if (receipt.status === 'COMPLETED') progress = 100;
        else if (receipt.status === 'FAILED') progress = 0;

        const response: Record<string, unknown> = {
          id: receipt.id,
          status: receipt.status,
          progress,
        };

        if (receipt.status === 'COMPLETED' && receipt.items.length > 0) {
          response.ocrResult = {
            storeName: receipt.storeName,
            date: receipt.purchaseDate,
            items: receipt.items.map((item) => ({
              name: item.name,
              price: Number(item.price),
              quantity: item.quantity,
              confidence: item.confidence,
            })),
            total: receipt.totalAmount ? Number(receipt.totalAmount) : null,
          };
          response.processingTime = receipt.processingTime;
        }

        return reply.send(response);
      } catch (error) {
        request.log.error(error, 'Error fetching receipt status');
        return reply.code(500).send({
          error: 'Failed to fetch receipt status',
          code: 'FETCH_ERROR',
        });
      }
    }
  );

  /**
   * Get full receipt details
   * GET /api/v1/receipts/:id
   */
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    try {
      const receipt = await db.receipt.findUnique({
        where: { id },
        include: {
          items: {
            select: {
              id: true,
              name: true,
              price: true,
              quantity: true,
              category: true,
              lineNumber: true,
              confidence: true,
            },
          },
          store: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
            },
          },
        },
      });

      if (!receipt) {
        return reply.code(404).send({
          error: 'Receipt not found',
          code: 'NOT_FOUND',
        });
      }

      return reply.send({
        id: receipt.id,
        imageUrl: receipt.imageUrl,
        storeName: receipt.storeName,
        store: receipt.store,
        purchaseDate: receipt.purchaseDate,
        totalAmount: receipt.totalAmount ? Number(receipt.totalAmount) : null,
        status: receipt.status,
        ocrProvider: receipt.ocrProvider,
        ocrConfidence: receipt.ocrConfidence,
        rawOcrText: receipt.rawOcrText,
        processingTime: receipt.processingTime,
        items: receipt.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: Number(item.price),
          quantity: item.quantity,
          category: item.category,
          lineNumber: item.lineNumber,
          confidence: item.confidence,
        })),
        createdAt: receipt.createdAt,
        updatedAt: receipt.updatedAt,
      });
    } catch (error) {
      request.log.error(error, 'Error fetching receipt details');
      return reply.code(500).send({
        error: 'Failed to fetch receipt details',
        code: 'FETCH_ERROR',
      });
    }
  });
}
