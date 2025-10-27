/**
 * Base interface for receipt parsers
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

// Shared schema for all parsers
export const receiptItemSchema = z.object({
  name: z.string().describe('Product name'),
  price: z.number().describe('Price per unit'),
  quantity: z.number().default(1).describe('Quantity purchased'),
});

export const receiptDataSchema = z.object({
  storeName: z.string().nullable().describe('Name of the store or merchant'),
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

export type ReceiptItem = z.infer<typeof receiptItemSchema>;
export type ReceiptData = z.infer<typeof receiptDataSchema>;

/**
 * Base interface for receipt parsers
 * All LLM providers must implement this interface
 */
export interface IReceiptParser {
  /**
   * Parse receipt image using vision LLM
   * @param imageBuffer - Receipt image buffer
   * @returns Structured receipt data
   */
  parse(imageBuffer: Buffer): Promise<ReceiptData>;

  /**
   * Check if the LLM service is available
   * @returns True if service is healthy
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Build a standard prompt for receipt parsing
 * Can be customized by individual parsers if needed
 */
export function buildStandardPrompt(): string {
  return `You are an expert receipt parser with vision capabilities. Analyze the receipt image and extract structured data.

CRITICAL INSTRUCTIONS:
- Look at the IMAGE carefully and read ALL text visible in the receipt
- Extract the store/merchant name exactly as it appears at the top
- Find and parse the purchase date in ISO 8601 format (YYYY-MM-DD)
- List EVERY SINGLE item you can see with their exact prices and quantities
- If quantity is not shown, assume 1
- Extract the total amount (including tax) from the bottom of the receipt
- Use exact numbers from the receipt (do not round)
- If a field is not visible or unclear, set it to null
- Set confidence based on image quality and text clarity (0-1 scale)

YOU MUST READ THE ACTUAL IMAGE. Do not make up generic data.

Return ONLY valid JSON with this structure:
{
  "storeName": "string or null",
  "date": "YYYY-MM-DD or null",
  "items": [
    {
      "name": "string",
      "price": number,
      "quantity": number
    }
  ],
  "total": number or null,
  "currency": "USD",
  "confidence": number between 0 and 1
}`;
}

/**
 * Build JSON schema for structured output
 * Used by providers that support JSON schema validation
 */
export function buildJsonSchema(): Record<string, unknown> {
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
    required: ['storeName', 'date', 'items', 'total', 'currency', 'confidence'],
  };
}
