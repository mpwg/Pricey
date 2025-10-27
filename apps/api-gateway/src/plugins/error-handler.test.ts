/**
 * Tests for error handler plugin
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
import { z } from 'zod';
import type { FastifyRequest, FastifyReply, FastifyError } from 'fastify';
import { errorHandler } from './error-handler.js';

describe('Error Handler', () => {
  let mockRequest: FastifyRequest;
  let mockReply: FastifyReply;
  let replySend: ReturnType<typeof vi.fn>;
  let replyStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    replySend = vi.fn();
    replyStatus = vi.fn(() => ({ send: replySend }));

    mockRequest = {
      log: {
        error: vi.fn(),
      },
    } as unknown as FastifyRequest;

    mockReply = {
      status: replyStatus,
      send: replySend,
    } as unknown as FastifyReply;
  });

  describe('Zod validation errors', () => {
    it('should handle ZodError with 400 status', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number().positive(),
      });

      try {
        schema.parse({ name: 123, age: -5 });
      } catch (error) {
        errorHandler(error as FastifyError, mockRequest, mockReply);
      }

      expect(replyStatus).toHaveBeenCalledWith(400);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: expect.any(Array),
        },
      });
    });

    it('should log ZodError', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      try {
        schema.parse({ email: 123 });
      } catch (error) {
        errorHandler(error as FastifyError, mockRequest, mockReply);
        expect(mockRequest.log.error).toHaveBeenCalledWith(error);
      }
    });
  });

  describe('Fastify validation errors', () => {
    it('should handle Fastify validation error with 400 status', () => {
      const error = {
        validation: [
          {
            message: 'body.email should be string',
            dataPath: '.body.email',
          },
        ],
        statusCode: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        name: 'FastifyError',
      } as unknown as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(400);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.validation,
        },
      });
    });

    it('should log Fastify validation error', () => {
      const error = {
        validation: [{ message: 'Invalid input' }],
        statusCode: 400,
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        name: 'FastifyError',
      } as unknown as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
    });
  });

  describe('Generic errors', () => {
    it('should handle 404 errors', () => {
      const error = {
        statusCode: 404,
        message: 'Route not found',
        code: 'NOT_FOUND',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(404);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Route not found',
          code: 'NOT_FOUND',
        },
      });
    });

    it('should handle 401 unauthorized errors', () => {
      const error = {
        statusCode: 401,
        message: 'Unauthorized access',
        code: 'UNAUTHORIZED',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(401);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Unauthorized access',
          code: 'UNAUTHORIZED',
        },
      });
    });

    it('should handle 500 internal errors with generic message', () => {
      const error = {
        statusCode: 500,
        message: 'Database connection failed', // This should be hidden
        code: 'DB_ERROR',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(500);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error', // Generic message for 500
          code: 'DB_ERROR',
        },
      });
    });

    it('should default to 500 when statusCode is missing', () => {
      const error = {
        message: 'Something went wrong',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(500);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    });

    it('should use INTERNAL_ERROR code when code is missing', () => {
      const error = {
        statusCode: 500,
        message: 'Unknown error',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Internal server error',
          code: 'INTERNAL_ERROR',
        },
      });
    });

    it('should log all errors', () => {
      const error = {
        statusCode: 403,
        message: 'Forbidden',
        code: 'FORBIDDEN',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(mockRequest.log.error).toHaveBeenCalledWith(error);
    });
  });

  describe('Edge cases', () => {
    it('should handle error with statusCode 0', () => {
      const error = {
        statusCode: 0,
        message: 'Edge case error',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(500);
    });

    it('should handle custom error codes', () => {
      const error = {
        statusCode: 429,
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      } as FastifyError;

      errorHandler(error, mockRequest, mockReply);

      expect(replyStatus).toHaveBeenCalledWith(429);
      expect(replySend).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Too many requests',
          code: 'RATE_LIMIT_EXCEEDED',
        },
      });
    });
  });
});
