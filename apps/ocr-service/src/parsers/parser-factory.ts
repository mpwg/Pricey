/**
 * Factory for creating receipt parsers based on LLM provider
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

import pino from 'pino';
import { env } from '../config/env.js';
import { type IReceiptParser } from './base-receipt-parser.js';
import { OllamaReceiptParser } from './llm-receipt-parser.js';
import { GitHubModelsReceiptParser } from './github-models-receipt-parser.js';

const logger = pino({ name: 'parser-factory' });

/**
 * Create a receipt parser based on the configured LLM provider
 * @returns Receipt parser instance
 * @throws Error if provider is not supported
 */
export function createReceiptParser(): IReceiptParser {
  const provider = env.LLM_PROVIDER;

  logger.info({ provider }, 'Creating receipt parser');

  switch (provider) {
    case 'ollama':
      return new OllamaReceiptParser();

    case 'github':
      return new GitHubModelsReceiptParser();

    case 'openai':
      // TODO: Implement OpenAI parser
      throw new Error(
        'OpenAI provider not yet implemented. Please use "ollama" or "github".'
      );

    default:
      throw new Error(
        `Unsupported LLM provider: ${provider}. Supported providers: ollama, github, openai`
      );
  }
}

/**
 * Get the display name for the current LLM provider
 * @returns Human-readable provider name
 */
export function getProviderName(): string {
  const provider = env.LLM_PROVIDER;

  switch (provider) {
    case 'ollama':
      return `Ollama (${env.LLM_MODEL})`;
    case 'github':
      return `GitHub Models (${env.GITHUB_MODEL ?? 'gpt-4o'})`;
    case 'openai':
      return 'OpenAI';
    default:
      return provider;
  }
}
