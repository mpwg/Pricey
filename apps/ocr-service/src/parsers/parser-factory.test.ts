/**
 * Tests for parser factory
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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReceiptParser, getProviderName } from './parser-factory.js';
import { OllamaReceiptParser } from './llm-receipt-parser.js';
import { GitHubModelsReceiptParser } from './github-models-receipt-parser.js';

vi.mock('../config/env.js');
vi.mock('./llm-receipt-parser.js');
vi.mock('./github-models-receipt-parser.js');

describe('parser-factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReceiptParser', () => {
    it('should create Ollama parser when provider is ollama', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'ollama';

      const parser = createReceiptParser();

      expect(parser).toBeInstanceOf(OllamaReceiptParser);
    });

    it('should create GitHub Models parser when provider is github', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'github';
      vi.mocked(env).GITHUB_TOKEN = 'test-token';

      const parser = createReceiptParser();

      expect(parser).toBeInstanceOf(GitHubModelsReceiptParser);
    });

    it('should throw error for openai provider (not implemented)', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'openai';

      expect(() => createReceiptParser()).toThrow(
        'OpenAI provider not yet implemented'
      );
    });

    it('should throw error for unsupported provider', async () => {
      const { env } = await import('../config/env.js');
      // @ts-expect-error - Testing invalid provider
      vi.mocked(env).LLM_PROVIDER = 'invalid';

      expect(() => createReceiptParser()).toThrow('Unsupported LLM provider');
    });
  });

  describe('getProviderName', () => {
    it('should return Ollama display name', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'ollama';
      vi.mocked(env).LLM_MODEL = 'llava';

      const name = getProviderName();

      expect(name).toBe('Ollama (llava)');
    });

    it('should return GitHub Models display name', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'github';
      vi.mocked(env).GITHUB_MODEL = 'gpt-5-mini';

      const name = getProviderName();

      expect(name).toBe('GitHub Models (gpt-5-mini)');
    });

    it('should return GitHub Models with default model if not set', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'github';
      // @ts-expect-error - Testing undefined model
      vi.mocked(env).GITHUB_MODEL = undefined;

      const name = getProviderName();

      expect(name).toBe('GitHub Models (gpt-4o)');
    });

    it('should return OpenAI for openai provider', async () => {
      const { env } = await import('../config/env.js');
      vi.mocked(env).LLM_PROVIDER = 'openai';

      const name = getProviderName();

      expect(name).toBe('OpenAI');
    });

    it('should return provider name for unknown providers', async () => {
      const { env } = await import('../config/env.js');
      // @ts-expect-error - Testing unknown provider
      vi.mocked(env).LLM_PROVIDER = 'claude';

      const name = getProviderName();

      expect(name).toBe('claude');
    });
  });
});
