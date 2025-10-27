/**
 * GitHub Models-based receipt parser using GPT-4o vision
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
import {
  type IReceiptParser,
  type ReceiptData,
  receiptDataSchema,
  buildStandardPrompt,
} from './base-receipt-parser.js';

const logger = pino({ name: 'github-models-receipt-parser' });

/**
 * GitHub Models-based receipt parser with vision capabilities
 * Uses your GitHub Copilot subscription to access vision models
 */
export class GitHubModelsReceiptParser implements IReceiptParser {
  private readonly apiUrl =
    'https://models.github.ai/inference/chat/completions';
  private readonly model: string;
  private readonly token: string;
  private readonly timeout: number;

  constructor() {
    this.model = env.GITHUB_MODEL ?? 'gpt-5-mini';
    this.token = env.GITHUB_TOKEN ?? '';
    this.timeout = env.LLM_TIMEOUT;

    if (!this.token) {
      throw new Error(
        'GITHUB_TOKEN is required for GitHub Models. Please set it in your .env file.'
      );
    }

    logger.info(
      {
        model: this.model,
        configuredTimeout: this.timeout,
        actualApiTimeout: this.timeout * 2,
        hasToken: !!this.token,
        tokenPrefix: this.token.substring(0, 7) + '...',
      },
      'Initialized GitHub Models receipt parser'
    );
  }

  /**
   * Parse receipt image using vision model
   * @param imageBuffer - Receipt image buffer
   * @returns Structured receipt data
   */
  async parse(imageBuffer: Buffer): Promise<ReceiptData> {
    logger.info(
      { imageSize: imageBuffer.length, model: this.model },
      'Starting GitHub Models vision parsing'
    );

    const base64Image = imageBuffer.toString('base64');
    const prompt = buildStandardPrompt();

    try {
      const startTime = Date.now();

      const response = await this.callGitHubModelsAPI(prompt, base64Image);

      const duration = Date.now() - startTime;
      logger.info(
        {
          duration,
          model: this.model,
          itemCount: response.items.length,
          storeName: response.storeName,
        },
        'GitHub Models parsing complete'
      );

      return response;
    } catch (error) {
      // Enhanced error logging
      if (error instanceof Error) {
        logger.error(
          {
            name: error.name,
            message: error.message,
            stack: error.stack,
            isAbortError: error.name === 'AbortError',
          },
          'GitHub Models parsing failed'
        );
      } else {
        logger.error(
          { error: String(error) },
          'GitHub Models parsing failed with unknown error'
        );
      }

      // Return empty result on failure
      return {
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      };
    }
  }

  /**
   * Call GitHub Models API with vision
   * @param prompt - System prompt
   * @param base64Image - Base64 encoded image
   * @returns Parsed and validated receipt data
   */
  private async callGitHubModelsAPI(
    prompt: string,
    base64Image: string
  ): Promise<ReceiptData> {
    const controller = new AbortController();
    // Use 2x the configured timeout for GitHub Models (remote API is slower)
    const apiTimeout = this.timeout * 2;
    const timeoutId = setTimeout(() => {
      logger.warn(
        { timeout: apiTimeout },
        'GitHub Models API timeout - aborting request'
      );
      controller.abort();
    }, apiTimeout);

    try {
      const requestBody = {
        model: this.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' },
      };

      logger.info(
        {
          url: this.apiUrl,
          model: this.model,
          imageSize: base64Image.length,
          promptLength: prompt.length,
          timeout: apiTimeout,
        },
        'Sending request to GitHub Models API'
      );

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }).catch((fetchError) => {
        // Capture fetch errors (network, abort, etc.)
        if (fetchError.name === 'AbortError') {
          throw new Error(`Request timed out after ${apiTimeout}ms`);
        }
        throw new Error(`Network error: ${fetchError.message}`);
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          {
            status: response.status,
            statusText: response.statusText,
            errorText,
          },
          'GitHub Models API returned error'
        );
        throw new Error(
          `GitHub Models API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as {
        choices: Array<{
          message: {
            content: string;
          };
        }>;
      };

      if (!data.choices || data.choices.length === 0) {
        logger.error(
          { response: data },
          'GitHub Models API returned no choices'
        );
        throw new Error('No choices in GitHub Models API response');
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        logger.error(
          { choice: data.choices[0] },
          'GitHub Models API returned empty content'
        );
        throw new Error('No content in GitHub Models API response');
      }

      logger.info(
        { responseLength: content.length, model: this.model },
        'Received response from GitHub Models'
      );
      logger.debug(
        { response: content, model: this.model },
        'Raw model response'
      );

      let parsedJson;
      try {
        parsedJson = JSON.parse(content);
      } catch (parseError) {
        logger.error(
          {
            content,
            parseError:
              parseError instanceof Error
                ? parseError.message
                : String(parseError),
          },
          'Failed to parse JSON from GitHub Models response'
        );
        throw new Error('Invalid JSON in GitHub Models response');
      }

      // Validate with Zod
      try {
        const validated = receiptDataSchema.parse(parsedJson);
        return validated;
      } catch (validationError) {
        logger.error(
          {
            parsedJson,
            validationError:
              validationError instanceof Error
                ? validationError.message
                : String(validationError),
          },
          'Failed to validate GitHub Models response'
        );
        throw new Error('Invalid receipt data structure from GitHub Models');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if GitHub Models service is available
   * @returns True if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(5000),
      });
      return response.ok || response.status === 400; // 400 is ok, means API is reachable
    } catch (error) {
      logger.error({ error }, 'GitHub Models health check failed');
      return false;
    }
  }
}
