/**
 * Tests for health check routes
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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import Fastify from 'fastify';
import { healthRoutes } from './health.js';
import { db } from '@pricey/database';

vi.mock('@pricey/database', () => ({
  db: {
    $queryRaw: vi.fn(),
  },
}));

describe('Health Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return success status', async () => {
      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toMatchObject({
        success: true,
        data: {
          status: 'ok',
          version: '0.1.0',
        },
      });
    });

    it('should include timestamp in response', async () => {
      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      expect(body.data.timestamp).toBeDefined();
      expect(new Date(body.data.timestamp)).toBeInstanceOf(Date);
    });

    it('should return valid ISO timestamp', async () => {
      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      const body = JSON.parse(response.body);
      const timestamp = new Date(body.data.timestamp);
      expect(timestamp.toISOString()).toBe(body.data.timestamp);
    });
  });

  describe('GET /health/db', () => {
    it('should return success when database is connected', async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ result: 1 }]);

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: true,
        data: {
          status: 'ok',
          database: 'connected',
        },
      });
    });

    it('should execute database query', async () => {
      vi.mocked(db.$queryRaw).mockResolvedValue([{ result: 1 }]);

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(db.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should return 503 when database connection fails', async () => {
      vi.mocked(db.$queryRaw).mockRejectedValue(
        new Error('Connection timeout')
      );

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: false,
        error: {
          message: 'Database connection failed',
          code: 'DATABASE_ERROR',
        },
      });
    });

    it('should log database errors', async () => {
      const error = new Error('Database connection timeout');
      vi.mocked(db.$queryRaw).mockRejectedValue(error);

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(db.$queryRaw).toHaveBeenCalled();
      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        success: false,
        error: {
          message: 'Database connection failed',
          code: 'DATABASE_ERROR',
        },
      });
    });

    it('should handle database network errors', async () => {
      vi.mocked(db.$queryRaw).mockRejectedValue(new Error('ENOTFOUND'));

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(response.statusCode).toBe(503);
    });

    it('should handle database authentication errors', async () => {
      vi.mocked(db.$queryRaw).mockRejectedValue(
        new Error('Authentication failed')
      );

      const app = Fastify({ logger: false });
      await app.register(healthRoutes);

      const response = await app.inject({
        method: 'GET',
        url: '/health/db',
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('DATABASE_ERROR');
    });
  });
});
