/**
 * Error handler plugin for API Gateway
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

import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Log error
  request.log.error(error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return reply.status(400).send({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
    });
  }

  // Handle Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.validation,
      },
    });
  }

  // Handle known error codes
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : error.message;

  return reply.status(statusCode).send({
    success: false,
    error: {
      message,
      code: error.code || 'INTERNAL_ERROR',
    },
  });
}
