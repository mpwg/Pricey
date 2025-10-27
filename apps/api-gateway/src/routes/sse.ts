/**
 * Server-Sent Events routes for real-time updates
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
import { ReceiptStatus } from '@pricey/types';

export async function sseRoutes(app: FastifyInstance) {
  /**
   * SSE endpoint for receipt status updates
   * GET /api/v1/receipts/:id/events
   */
  app.get(
    '/:id/events',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };

      // Set CORS headers for SSE
      reply.raw.setHeader('Access-Control-Allow-Origin', '*');
      reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');

      // Set SSE headers
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');
      reply.raw.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection message
      reply.raw.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

      // Function to send status update
      const sendStatusUpdate = async () => {
        try {
          const receipt = await db.receipt.findUnique({
            where: { id },
            select: {
              status: true,
              ocrConfidence: true,
              processingTime: true,
              storeName: true,
              purchaseDate: true,
              totalAmount: true,
              items: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  quantity: true,
                },
              },
            },
          });

          if (!receipt) {
            reply.raw.write(
              `data: ${JSON.stringify({ type: 'error', message: 'Receipt not found' })}\n\n`
            );
            reply.raw.end();
            return false;
          }

          // Send status update
          reply.raw.write(
            `data: ${JSON.stringify({ type: 'status', status: receipt.status })}\n\n`
          );

          // If completed or failed, send final data and close connection
          if (
            receipt.status === ReceiptStatus.COMPLETED ||
            receipt.status === ReceiptStatus.FAILED
          ) {
            reply.raw.write(
              `data: ${JSON.stringify({
                type: 'complete',
                status: receipt.status,
                data: {
                  storeName: receipt.storeName,
                  purchaseDate: receipt.purchaseDate,
                  totalAmount: receipt.totalAmount
                    ? Number(receipt.totalAmount)
                    : null,
                  itemCount: receipt.items.length,
                  ocrConfidence: receipt.ocrConfidence,
                  processingTime: receipt.processingTime,
                },
              })}\n\n`
            );
            reply.raw.end();
            return false;
          }

          return true; // Continue polling
        } catch (error) {
          request.log.error(error, 'Error sending SSE update');
          reply.raw.write(
            `data: ${JSON.stringify({ type: 'error', message: 'Internal error' })}\n\n`
          );
          reply.raw.end();
          return false;
        }
      };

      // Send initial status
      const shouldContinue = await sendStatusUpdate();

      if (!shouldContinue) {
        return reply;
      }

      // Poll for updates every 2 seconds
      const interval = setInterval(async () => {
        const shouldContinue = await sendStatusUpdate();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, 2000);

      // Clean up on client disconnect
      request.raw.on('close', () => {
        clearInterval(interval);
        request.log.info({ receiptId: id }, 'SSE connection closed');
      });

      return reply;
    }
  );
}
