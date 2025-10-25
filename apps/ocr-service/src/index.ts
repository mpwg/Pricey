/**
 * OCR Service - Receipt processing worker
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

import { pino } from 'pino';
import { env } from './config/env.js';
import { createOCRWorker } from './worker/ocr-worker.js';

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

async function main() {
  logger.info('Starting OCR Service...');

  // Create and start worker
  const worker = createOCRWorker();

  logger.info(
    {
      concurrency: env.OCR_CONCURRENCY,
      redisUrl: env.REDIS_URL,
    },
    'OCR worker started'
  );

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down OCR service...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((error) => {
  logger.error(error, 'Fatal error');
  process.exit(1);
});
