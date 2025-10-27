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
 * GitHub Models-based receipt parser using GPT-4o vision
 * Uses your GitHub Copilot subscription to access GPT-4o
 */
export class GitHubModelsReceiptParser implements IReceiptParser {
  private readonly apiUrl =
    'https://models.github.ai/inference/chat/completions';
  private readonly model: string;
  private readonly token: string;
  private readonly timeout: number;

  constructor() {
    this.model = env.GITHUB_MODEL ?? 'gpt-4o';
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
        timeout: this.timeout,
        hasToken: !!this.token,
      },
      'Initialized GitHub Models receipt parser'
    );
  }

  /**
   * Parse receipt image using GPT-4o vision
   * @param imageBuffer - Receipt image buffer
   * @returns Structured receipt data
   */
  async parse(imageBuffer: Buffer): Promise<ReceiptData> {
    logger.info(
      { imageSize: imageBuffer.length },
      'Starting GitHub Models (GPT-4o) vision parsing'
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
        'GitHub Models (GPT-4o) parsing complete'
      );

      return response;
    } catch (error) {
      logger.error({ error }, 'GitHub Models parsing failed');
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
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

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
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      };

      logger.info(
        {
          url: this.apiUrl,
          model: this.model,
          imageSize: base64Image.length,
          promptLength: prompt.length,
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
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, errorText },
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

      const content = data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in GitHub Models API response');
      }

      logger.info(
        { responseLength: content.length },
        'Received response from GitHub Models'
      );
      logger.debug({ response: content }, 'Raw GPT-4o response');

      const parsedJson = JSON.parse(content);

      // Validate with Zod
      const validated = receiptDataSchema.parse(parsedJson);

      return validated;
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
