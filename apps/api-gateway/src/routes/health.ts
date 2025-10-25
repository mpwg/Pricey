/**
 * Health check routes for API Gateway
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

import { FastifyInstance } from 'fastify';

import { db } from '@pricy/database';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '0.1.0',
      },
    };
  });

  app.get('/health/db', async (request, reply) => {
    try {
      await db.$queryRaw`SELECT 1`;
      return {
        success: true,
        data: {
          status: 'ok',
          database: 'connected',
        },
      };
    } catch (error) {
      request.log.error(error, 'Database health check failed');
      return reply.status(503).send({
        success: false,
        error: {
          message: 'Database connection failed',
          code: 'DATABASE_ERROR',
        },
      });
    }
  });
}
