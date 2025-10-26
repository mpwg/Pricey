/**
 * Fastify application setup for API Gateway
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

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastify from 'fastify';

import { env } from './config/env.js';
import { errorHandler } from './plugins/error-handler.js';
import { bullBoardPlugin } from './plugins/bull-board.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = fastify({
    logger: {
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
    },
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    requestIdHeader: 'x-request-id',
  });

  // Register plugins
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1, // Only 1 file per request
    },
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW,
  });

  // Set error handler
  app.setErrorHandler(errorHandler);

  // Register Bull Board (queue monitoring dashboard)
  if (env.NODE_ENV === 'development') {
    await app.register(bullBoardPlugin);
  }

  // Add request logging
  app.addHook('onRequest', async (request) => {
    request.log.info(
      {
        url: request.url,
        method: request.method,
        requestId: request.id,
      },
      'Incoming request'
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        url: request.url,
        method: request.method,
        statusCode: reply.statusCode,
        requestId: request.id,
      },
      'Request completed'
    );
  });

  // Register routes
  await registerRoutes(app);

  return app;
}
