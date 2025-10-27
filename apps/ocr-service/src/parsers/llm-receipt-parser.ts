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
import { z } from 'zod';
import { env } from '../config/env.js';

const logger = pino({ name: 'llm-receipt-parser' });

// Zod schema for LLM response validation
const receiptItemSchema = z.object({
  name: z.string().describe('Product name'),
  price: z.number().describe('Price per unit'),
  quantity: z.number().default(1).describe('Quantity purchased'),
});

const llmReceiptSchema = z.object({
  storeName: z
    .string()
    .nullable()
    .describe('Name of the store or merchant (e.g., "Walmart", "Target")'),
  date: z
    .string()
    .nullable()
    .describe('Purchase date in ISO 8601 format (YYYY-MM-DD)'),
  items: z
    .array(receiptItemSchema)
    .describe('List of purchased items with name, price, and quantity'),
  total: z
    .number()
    .nullable()
    .describe('Total amount from receipt (including tax)'),
  currency: z
    .string()
    .default('USD')
    .describe('Currency code (e.g., USD, EUR, CHF)'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .default(0.8)
    .describe('Confidence score of the extraction (0-1)'),
});

export type LlmReceiptItem = z.infer<typeof receiptItemSchema>;
export type LlmReceiptData = z.infer<typeof llmReceiptSchema>;

/**
 * LLM-based receipt parser
 * Uses structured output to extract receipt data from OCR text
 */
export class LlmReceiptParser {
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
      'Initialized LLM receipt parser'
    );
  }

  /**
   * Parse receipt image using vision LLM with structured output
   * @param imageBuffer - Receipt image buffer
   * @returns Structured receipt data
   */
  async parse(imageBuffer: Buffer): Promise<LlmReceiptData> {
    logger.info(
      { imageSize: imageBuffer.length },
      'Starting vision LLM parsing'
    );

    const prompt = this.buildPrompt();
    const schema = this.buildJsonSchema();
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
        'Vision LLM parsing complete'
      );

      return response;
    } catch (error) {
      logger.error({ error }, 'Vision LLM parsing failed');
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
   * Build the prompt for the vision LLM
   * @returns Formatted prompt for image analysis
   */
  private buildPrompt(): string {
    return `You are an expert receipt parser. Analyze this receipt image and extract structured data.

IMPORTANT INSTRUCTIONS:
- Extract the store/merchant name exactly as it appears on the receipt
- Parse the date in ISO 8601 format (YYYY-MM-DD)
- List ALL items with their prices and quantities
- If quantity is not specified, assume 1
- Extract the total amount (including tax)
- Be precise with numbers (do not round)
- If a field cannot be determined, set it to null
- Set confidence between 0 and 1 based on image quality and clarity

Extract the following information in valid JSON format.`;
  }

  /**
   * Build JSON schema for structured output
   * @returns JSON schema object
   */
  private buildJsonSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        storeName: {
          type: ['string', 'null'],
          description: 'Name of the store or merchant',
        },
        date: {
          type: ['string', 'null'],
          description: 'Purchase date in ISO 8601 format (YYYY-MM-DD)',
        },
        items: {
          type: 'array',
          description: 'List of purchased items',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Product name',
              },
              price: {
                type: 'number',
                description: 'Price per unit',
              },
              quantity: {
                type: 'number',
                description: 'Quantity purchased',
                default: 1,
              },
            },
            required: ['name', 'price'],
          },
        },
        total: {
          type: ['number', 'null'],
          description: 'Total amount from receipt',
        },
        currency: {
          type: 'string',
          description: 'Currency code',
          default: 'USD',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score (0-1)',
          minimum: 0,
          maximum: 1,
          default: 0.8,
        },
      },
      required: [
        'storeName',
        'date',
        'items',
        'total',
        'currency',
        'confidence',
      ],
    };
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
  ): Promise<LlmReceiptData> {
    const url = `${this.baseUrl}/api/generate`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as { response: string };
      const parsedJson = JSON.parse(data.response);

      // Validate with Zod
      const validated = llmReceiptSchema.parse(parsedJson);

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
