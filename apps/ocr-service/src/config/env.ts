/**
 * Environment configuration for OCR Service
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

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
  // S3/MinIO Storage Configuration
  S3_ENDPOINT: z.string().default('localhost'),
  S3_PORT: z.string().default('9000').transform(Number),
  S3_USE_SSL: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  S3_ACCESS_KEY: z.string().default('minioadmin'),
  S3_SECRET_KEY: z.string().default('minioadmin'),
  S3_BUCKET: z.string().default('pricey-receipts'),
  // OCR Configuration
  OCR_CONCURRENCY: z.string().default('5').transform(Number),
  OCR_TIMEOUT: z.string().default('30000').transform(Number), // 30 seconds
  // LLM Parser Configuration
  LLM_PROVIDER: z.enum(['ollama', 'openai', 'github']).default('ollama'),
  // Use http://localhost:10000 for Mac's accelerated Ollama, http://localhost:11434 for Docker
  LLM_BASE_URL: z.string().url().default('http://localhost:11434'),
  LLM_MODEL: z.string().default('llava'), // Vision model for direct image parsing
  LLM_TIMEOUT: z.string().default('60000').transform(Number), // 60 seconds
  LLM_TEMPERATURE: z.string().default('0.1').transform(Number), // Low temperature for structured output
  // GitHub Models Configuration (for GitHub Copilot users)
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_MODEL: z.string().default('gpt-4o'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:');
      error.issues.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const env = validateEnv();
