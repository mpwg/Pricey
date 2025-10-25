/**
 * Tests for OCR Service environment configuration validation
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

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// We test the schema directly since the module calls validateEnv() on import
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  S3_ENDPOINT: z.string().default('localhost'),
  S3_PORT: z.string().default('9000').transform(Number),
  S3_USE_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('pricy-receipts'),
  OCR_CONCURRENCY: z.string().default('5').transform(Number),
  OCR_TIMEOUT: z.string().default('30000').transform(Number),
});

describe('ocr-service env configuration', () => {
  describe('required fields', () => {
    it('should require DATABASE_URL', () => {
      const result = envSchema.safeParse({});

      expect(result.success).toBe(false);
      if (!result.success) {
        const databaseUrlError = result.error.issues.find(
          (issue) => issue.path[0] === 'DATABASE_URL'
        );
        expect(databaseUrlError).toBeDefined();
        expect(databaseUrlError?.message).toMatch(/Required|Invalid input/);
      }
    });

    it('should validate DATABASE_URL is a valid URL', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'not-a-valid-url',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        const urlError = result.error.issues.find(
          (issue) => issue.path[0] === 'DATABASE_URL'
        );
        expect(urlError).toBeDefined();
        expect(urlError?.message.toLowerCase()).toContain('invalid url');
      }
    });

    it('should accept valid DATABASE_URL', () => {
      const result = envSchema.safeParse({
        DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_URL).toBe(
          'postgresql://user:pass@localhost:5432/db'
        );
      }
    });
  });

  describe('default values', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/pricy',
    };

    it('should default NODE_ENV to development', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });

    it('should default REDIS_URL to redis://localhost:6379', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
      }
    });

    it('should default LOG_LEVEL to info', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.LOG_LEVEL).toBe('info');
      }
    });

    it('should default S3_ENDPOINT to localhost', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_ENDPOINT).toBe('localhost');
      }
    });

    it('should default S3_PORT to 9000', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_PORT).toBe(9000);
      }
    });

    it('should default S3_USE_SSL to false', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_USE_SSL).toBe(false);
      }
    });

    it('should default S3_ACCESS_KEY to minioadmin', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_ACCESS_KEY).toBe('minioadmin');
      }
    });

    it('should default S3_SECRET_KEY to minioadmin', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_SECRET_KEY).toBe('minioadmin');
      }
    });

    it('should default S3_BUCKET to pricy-receipts', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_BUCKET).toBe('pricy-receipts');
      }
    });

    it('should default OCR_CONCURRENCY to 5', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.OCR_CONCURRENCY).toBe(5);
      }
    });

    it('should default OCR_TIMEOUT to 30000', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.OCR_TIMEOUT).toBe(30000);
      }
    });
  });

  describe('type coercion and transformation', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/pricy',
    };

    it('should transform S3_PORT string to number', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        S3_PORT: '443',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_PORT).toBe(443);
        expect(typeof result.data.S3_PORT).toBe('number');
      }
    });

    it('should transform S3_USE_SSL string "true" to boolean true', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        S3_USE_SSL: 'true',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_USE_SSL).toBe(true);
        expect(typeof result.data.S3_USE_SSL).toBe('boolean');
      }
    });

    it('should transform S3_USE_SSL string "false" to boolean false', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        S3_USE_SSL: 'false',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.S3_USE_SSL).toBe(false);
      }
    });

    it('should transform OCR_CONCURRENCY string to number', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        OCR_CONCURRENCY: '10',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.OCR_CONCURRENCY).toBe(10);
        expect(typeof result.data.OCR_CONCURRENCY).toBe('number');
      }
    });

    it('should transform OCR_TIMEOUT string to number', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        OCR_TIMEOUT: '60000',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.OCR_TIMEOUT).toBe(60000);
        expect(typeof result.data.OCR_TIMEOUT).toBe('number');
      }
    });
  });

  describe('enum validation', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/pricy',
    };

    it('should accept valid NODE_ENV: development', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'development',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid NODE_ENV: production', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'production',
      });
      expect(result.success).toBe(true);
    });

    it('should accept valid NODE_ENV: test', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid NODE_ENV', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        NODE_ENV: 'staging',
      });
      expect(result.success).toBe(false);
    });

    it('should accept all valid LOG_LEVEL values', () => {
      const logLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

      logLevels.forEach((level) => {
        const result = envSchema.safeParse({
          ...validEnv,
          LOG_LEVEL: level,
        });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid LOG_LEVEL', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        LOG_LEVEL: 'verbose',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('REDIS_URL with default', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://localhost:5432/pricy',
    };

    it('should use default REDIS_URL when not provided', () => {
      const result = envSchema.safeParse(validEnv);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_URL).toBe('redis://localhost:6379');
      }
    });

    it('should accept custom REDIS_URL when provided', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        REDIS_URL: 'redis://cache.example.com:6380',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.REDIS_URL).toBe('redis://cache.example.com:6380');
      }
    });

    it('should reject invalid REDIS_URL format', () => {
      const result = envSchema.safeParse({
        ...validEnv,
        REDIS_URL: 'not-a-url',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const redisError = result.error.issues.find(
          (issue) => issue.path[0] === 'REDIS_URL'
        );
        expect(redisError?.message.toLowerCase()).toContain('invalid url');
      }
    });
  });

  describe('complete configuration', () => {
    it('should parse complete valid configuration', () => {
      const completeEnv = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/pricy',
        REDIS_URL: 'redis://cache.example.com:6379',
        LOG_LEVEL: 'warn',
        S3_ENDPOINT: 's3.amazonaws.com',
        S3_PORT: '443',
        S3_USE_SSL: 'true',
        S3_ACCESS_KEY: 'AKIAIOSFODNN7EXAMPLE',
        S3_SECRET_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        S3_BUCKET: 'production-receipts',
        OCR_CONCURRENCY: '10',
        OCR_TIMEOUT: '60000',
      };

      const result = envSchema.safeParse(completeEnv);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://user:pass@db.example.com:5432/pricy',
          REDIS_URL: 'redis://cache.example.com:6379',
          LOG_LEVEL: 'warn',
          S3_ENDPOINT: 's3.amazonaws.com',
          S3_PORT: 443,
          S3_USE_SSL: true,
          S3_ACCESS_KEY: 'AKIAIOSFODNN7EXAMPLE',
          S3_SECRET_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          S3_BUCKET: 'production-receipts',
          OCR_CONCURRENCY: 10,
          OCR_TIMEOUT: 60000,
        });
      }
    });
  });
});
