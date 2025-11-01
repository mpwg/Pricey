/**
 * Route registration for API Gateway
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

import { healthRoutes } from './health.js';
import { receiptsRoutes } from './receipts.js';

export async function registerRoutes(app: FastifyInstance) {
  // Register health check routes
  await app.register(healthRoutes);

  // API v1 routes
  await app.register(
    async (api) => {
      // Root endpoint
      api.get('/', async () => {
        return {
          success: true,
          data: {
            message: 'Pricey API v1',
            version: '0.1.0',
            documentation: '/api/v1/docs',
          },
        };
      });

      // Register receipts routes
      await api.register(receiptsRoutes, { prefix: '/receipts' });
    },
    { prefix: '/api/v1' }
  );
}
