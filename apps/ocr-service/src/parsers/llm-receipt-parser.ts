/**
 * LLM-based receipt parser using Ollama
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
  buildJsonSchema,
} from './base-receipt-parser.js';

const logger = pino({ name: 'ollama-receipt-parser' });

/**
 * Ollama-based receipt parser
 * Uses Ollama vision models (LLaVA, Llama 3.2 Vision, etc.)
 */
export class OllamaReceiptParser implements IReceiptParser {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly temperature: number;

  constructor() {
    this.baseUrl = env.LLM_BASE_URL;
    this.model = env.LLM_MODEL;
    this.timeout = env.LLM_TIMEOUT;
    this.temperature = env.LLM_TEMPERATURE;

    logger.info(
      {
        baseUrl: this.baseUrl,
        model: this.model,
        timeout: this.timeout,
        temperature: this.temperature,
      },
      'Initialized Ollama receipt parser'
    );
  }

  /**
   * Parse receipt image using Ollama vision model
   * @param imageBuffer - Receipt image buffer
   * @returns Structured receipt data
   */
  async parse(imageBuffer: Buffer): Promise<ReceiptData> {
    logger.info(
      { imageSize: imageBuffer.length },
      'Starting Ollama vision parsing'
    );

    const prompt = buildStandardPrompt();
    const schema = buildJsonSchema();
    const base64Image = imageBuffer.toString('base64');

    try {
      const startTime = Date.now();

      // Call Ollama API with vision model
      const response = await this.callOllamaVision(prompt, base64Image, schema);

      const duration = Date.now() - startTime;
      logger.info(
        {
          duration,
          model: this.model,
          itemCount: response.items.length,
          storeName: response.storeName,
        },
        'Ollama vision parsing complete'
      );

      return response;
    } catch (error) {
      logger.error({ error }, 'Ollama vision parsing failed');
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
   * Call Ollama vision API with image input
   * @param prompt - Prompt text
   * @param base64Image - Base64 encoded image
   * @param schema - JSON schema for structured output
   * @returns Parsed and validated receipt data
   */
  private async callOllamaVision(
    prompt: string,
    base64Image: string,
    schema: Record<string, unknown>
  ): Promise<ReceiptData> {
    const url = `${this.baseUrl}/api/generate`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const requestBody = {
        model: this.model,
        prompt,
        images: [base64Image], // Vision model requires images array
        stream: false,
        format: schema, // Structured output with JSON schema
        options: {
          temperature: this.temperature,
          top_p: 0.9,
          top_k: 40,
        },
      };

      logger.info(
        {
          url,
          model: this.model,
          imageSize: base64Image.length,
          hasImage: !!base64Image,
          promptLength: prompt.length,
        },
        'Sending request to Ollama vision API'
      );

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, errorText },
          'Ollama API returned error'
        );
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as { response: string };

      logger.info(
        { responseLength: data.response.length },
        'Received response from Ollama'
      );
      logger.debug({ response: data.response }, 'Raw LLM response');

      const parsedJson = JSON.parse(data.response);

      // Validate with Zod
      const validated = receiptDataSchema.parse(parsedJson);

      return validated;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if LLM service is available
   * @returns True if service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/api/tags`;
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      logger.error({ error }, 'LLM health check failed');
      return false;
    }
  }
}
