/**
 * Tests for GitHub Models receipt parser
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
import { GitHubModelsReceiptParser } from './github-models-receipt-parser.js';

// Mock the env module before importing anything else
vi.mock('../config/env.js', () => ({
  env: {
    GITHUB_TOKEN: 'test-token-123',
    GITHUB_MODEL: 'gpt-5-mini',
    LLM_TIMEOUT: 60000,
    LLM_PROVIDER: 'github',
  },
}));

describe('GitHubModelsReceiptParser', () => {
  let parser: GitHubModelsReceiptParser;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    parser = new GitHubModelsReceiptParser();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(parser).toBeDefined();
    });

    it('should throw error if GITHUB_TOKEN is not set', async () => {
      // Reset modules first
      vi.resetModules();

      // Mock with empty token
      vi.doMock('../config/env.js', () => ({
        env: {
          GITHUB_TOKEN: '',
          GITHUB_MODEL: 'gpt-5-mini',
          LLM_TIMEOUT: 60000,
          LLM_PROVIDER: 'github',
        },
      }));

      const { GitHubModelsReceiptParser: Parser } = await import(
        './github-models-receipt-parser.js'
      );

      expect(() => new Parser()).toThrow(
        'GITHUB_TOKEN is required for GitHub Models'
      );

      // Clean up
      vi.doUnmock('../config/env.js');
      vi.resetModules();
    });
  });

  describe('parse', () => {
    const mockImageBuffer = Buffer.from('fake-image-data');
    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              storeName: 'Test Store',
              date: '2025-10-27',
              items: [
                { name: 'Item 1', price: 10.99, quantity: 2 },
                { name: 'Item 2', price: 5.49, quantity: 1 },
              ],
              total: 27.47,
              currency: 'USD',
              confidence: 0.95,
            }),
          },
        },
      ],
    };

    it('should successfully parse a receipt image', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: 'Test Store',
        date: '2025-10-27',
        items: [
          { name: 'Item 1', price: 10.99, quantity: 2 },
          { name: 'Item 2', price: 5.49, quantity: 1 },
        ],
        total: 27.47,
        currency: 'USD',
        confidence: 0.95,
      });
    });

    it('should send correct request to GitHub Models API', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      await parser.parse(mockImageBuffer);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      const [url, options] = callArgs!;

      expect(url).toBe('https://models.github.ai/inference/chat/completions');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-token-123',
        'X-GitHub-Api-Version': '2022-11-28',
      });

      const body = JSON.parse(options.body);
      expect(body.model).toBe('gpt-5-mini');
      expect(body.messages[0].role).toBe('user');
      expect(body.messages[0].content).toHaveLength(2);
      expect(body.messages[0].content[0].type).toBe('text');
      expect(body.messages[0].content[1].type).toBe('image_url');
      expect(body.messages[0].content[1].image_url.url).toContain(
        'data:image/jpeg;base64,'
      );
      expect(body.temperature).toBe(0.1);
      expect(body.response_format).toEqual({ type: 'json_object' });
    });

    it('should include base64 encoded image in request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      });

      await parser.parse(mockImageBuffer);

      const callArgs = fetchMock.mock.calls[0];
      expect(callArgs).toBeDefined();
      const body = JSON.parse(callArgs![1].body);
      const imageUrl = body.messages[0].content[1].image_url.url;
      const base64Part = imageUrl.split('base64,')[1];

      expect(base64Part).toBe(mockImageBuffer.toString('base64'));
    });

    it('should handle API errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });
    });

    it('should handle timeout', async () => {
      // Reset modules to load with new timeout
      vi.resetModules();

      // Create a parser with short timeout
      vi.doMock('../config/env.js', () => ({
        env: {
          GITHUB_TOKEN: 'test-token-123',
          GITHUB_MODEL: 'gpt-5-mini',
          LLM_TIMEOUT: 50, // Very short timeout
          LLM_PROVIDER: 'github',
        },
      }));

      const { GitHubModelsReceiptParser: TimeoutParser } = await import(
        './github-models-receipt-parser.js'
      );
      const timeoutParser = new TimeoutParser();

      // Mock fetch to respect AbortSignal and take longer than timeout
      fetchMock.mockImplementationOnce(
        (_url: string, options: { signal?: AbortSignal }) =>
          new Promise((resolve, reject) => {
            const signal = options?.signal;
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(
                  new DOMException('The operation was aborted', 'AbortError')
                );
              });
            }
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => mockApiResponse,
                }),
              200 // Resolve after 200ms, timeout is 50ms
            );
          })
      );

      const result = await timeoutParser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });

      // Clean up
      vi.doUnmock('../config/env.js');
      vi.resetModules();
    });

    it('should handle invalid JSON response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: 'not valid json',
              },
            },
          ],
        }),
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });
    });

    it('should handle missing choices in response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [],
        }),
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });
    });

    it('should validate response data with Zod schema', async () => {
      const invalidResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                storeName: 'Test Store',
                // Missing required fields
                items: 'not-an-array',
              }),
            },
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => invalidResponse,
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0,
      });
    });

    it('should handle null values in response', async () => {
      const responseWithNulls = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                storeName: null,
                date: null,
                items: [],
                total: null,
                currency: 'USD',
                confidence: 0.5,
              }),
            },
          },
        ],
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithNulls,
      });

      const result = await parser.parse(mockImageBuffer);

      expect(result).toEqual({
        storeName: null,
        date: null,
        items: [],
        total: null,
        currency: 'USD',
        confidence: 0.5,
      });
    });
  });

  describe('healthCheck', () => {
    it('should return true when API is accessible', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
      });

      const result = await parser.healthCheck();

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://models.github.ai/inference/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-123',
          }),
        })
      );
    });

    it('should return true for 400 errors (API reachable)', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
      });

      const result = await parser.healthCheck();

      expect(result).toBe(true);
    });

    it('should return false when API is not accessible', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await parser.healthCheck();

      expect(result).toBe(false);
    });

    it('should timeout after 5 seconds', async () => {
      // Mock a long-running fetch that respects AbortSignal
      fetchMock.mockImplementationOnce(
        (_url: string, options: { signal?: AbortSignal }) =>
          new Promise((resolve, reject) => {
            const signal = options?.signal;
            if (signal) {
              signal.addEventListener('abort', () => {
                reject(
                  new DOMException('The operation was aborted', 'AbortError')
                );
              });
            }
            setTimeout(() => resolve({ ok: true }), 10000); // 10 seconds, longer than 5s timeout
          })
      );

      const result = await parser.healthCheck();

      expect(result).toBe(false);
    }, 15000); // Increase test timeout to 15s to allow for the 5s health check timeout + buffer
  });

  describe('edge cases', () => {
    it('should handle very large images', async () => {
      const largeBuffer = Buffer.alloc(10 * 1024 * 1024); // 10MB
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  storeName: 'Test',
                  date: '2025-10-27',
                  items: [],
                  total: null,
                  currency: 'USD',
                  confidence: 0.5,
                }),
              },
            },
          ],
        }),
      });

      const result = await parser.parse(largeBuffer);

      expect(result.storeName).toBe('Test');
    });

    it('should handle empty image buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  storeName: null,
                  date: null,
                  items: [],
                  total: null,
                  currency: 'USD',
                  confidence: 0,
                }),
              },
            },
          ],
        }),
      });

      const result = await parser.parse(emptyBuffer);

      expect(result).toBeDefined();
    });

    it('should handle receipts with many items', async () => {
      const manyItems = Array.from({ length: 100 }, (_, i) => ({
        name: `Item ${i + 1}`,
        price: Math.random() * 100,
        quantity: Math.floor(Math.random() * 10) + 1,
      }));

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  storeName: 'Big Store',
                  date: '2025-10-27',
                  items: manyItems,
                  total: 1000.0,
                  currency: 'USD',
                  confidence: 0.9,
                }),
              },
            },
          ],
        }),
      });

      const result = await parser.parse(Buffer.from('test'));

      expect(result.items).toHaveLength(100);
    });

    it('should handle different currencies', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  storeName: 'Euro Store',
                  date: '2025-10-27',
                  items: [{ name: 'Item', price: 10.0, quantity: 1 }],
                  total: 10.0,
                  currency: 'EUR',
                  confidence: 0.95,
                }),
              },
            },
          ],
        }),
      });

      const result = await parser.parse(Buffer.from('test'));

      expect(result.currency).toBe('EUR');
    });

    it('should handle fractional quantities', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  storeName: 'Store',
                  date: '2025-10-27',
                  items: [{ name: 'Bulk Item', price: 5.0, quantity: 2.5 }],
                  total: 12.5,
                  currency: 'USD',
                  confidence: 0.9,
                }),
              },
            },
          ],
        }),
      });

      const result = await parser.parse(Buffer.from('test'));

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.quantity).toBe(2.5);
    });
  });
});
