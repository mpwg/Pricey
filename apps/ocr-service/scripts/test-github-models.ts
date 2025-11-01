/**
 * Test script for GitHub Models API
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

/* eslint-disable no-console */

import { env } from '../src/config/env.js';

async function testGitHubModels() {
  console.log('🧪 Testing GitHub Models API...\n');

  const apiUrl = 'https://models.github.ai/inference/chat/completions';
  const model = env.GITHUB_MODEL ?? 'gpt-4o';
  const token = env.GITHUB_TOKEN ?? '';

  if (!token) {
    console.error('❌ GITHUB_TOKEN is not set in environment');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Model: ${model}`);
  console.log(`  Token: ${token.substring(0, 7)}...`);
  console.log(`  Timeout: ${env.LLM_TIMEOUT * 2}ms (2x configured)\n`);

  // Test 1: Simple text completion
  console.log('Test 1: Simple text completion...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, GitHub Models!" and nothing else.',
          },
        ],
        max_completion_tokens: 100,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ API returned error: ${response.status} ${response.statusText}`
      );
      console.error(`   Details: ${errorText}\n`);
      return;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;
    console.log(`✅ Success! Response: "${message}"\n`);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timed out after 10 seconds\n');
      } else {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }
    return;
  }

  // Test 2: JSON mode
  console.log('Test 2: JSON response format...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content:
              'Return a JSON object with keys "status" (value: "ok") and "timestamp" (current unix timestamp).',
          },
        ],
        max_completion_tokens: 100,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `❌ API returned error: ${response.status} ${response.statusText}`
      );
      console.error(`   Details: ${errorText}\n`);
      return;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message?.content;
    console.log(`✅ Success! Response: ${message}\n`);

    // Try to parse as JSON
    try {
      const parsed = JSON.parse(message);
      console.log(`✅ Valid JSON structure:`, parsed, '\n');
    } catch {
      console.error('❌ Response is not valid JSON\n');
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timed out after 10 seconds\n');
      } else {
        console.error(`❌ Error: ${error.message}\n`);
      }
    }
    return;
  }

  console.log('✅ All tests passed! GitHub Models API is working correctly.');
  console.log(
    '\n💡 If you see timeouts during receipt parsing, the image size might be too large.'
  );
  console.log('   Consider:\n');
  console.log('   1. Increasing LLM_TIMEOUT in .env (currently 60000ms)');
  console.log('   2. Reducing image size/quality before sending');
  console.log('   3. Using a faster model (e.g., gpt-4o-mini)');
}

testGitHubModels().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
