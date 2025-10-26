#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Load test for receipt upload endpoint
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

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3001';
const CONCURRENT_UPLOADS = parseInt(process.env.CONCURRENT || '10', 10);
const SAMPLE_IMAGE = join(__dirname, '../../../samples/Rechung_1.png');

/**
 * Upload a single receipt
 */
async function uploadReceipt(imageBuffer: Buffer, index: number) {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/png' });
    formData.append('file', blob, `test-receipt-${index}.png`);

    const response = await fetch(`${API_URL}/api/v1/receipts/upload`, {
      method: 'POST',
      body: formData,
    });

    const uploadTime = Date.now() - startTime;

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        uploadTime,
        error: `HTTP ${response.status}: ${error}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      uploadTime,
      receiptId: data.id,
    };
  } catch (error) {
    const uploadTime = Date.now() - startTime;
    return {
      success: false,
      uploadTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check processing status
 */
async function checkStatus(receiptId: string) {
  const startTime = Date.now();

  try {
    const response = await fetch(
      `${API_URL}/api/v1/receipts/${receiptId}/status`
    );

    if (!response.ok) {
      return { status: 'error', processingTime: Date.now() - startTime };
    }

    const data = await response.json();
    return {
      status: data.status,
      progress: data.progress,
      processingTime: Date.now() - startTime,
    };
  } catch {
    return { status: 'error', processingTime: Date.now() - startTime };
  }
}

/**
 * Main load test
 */
async function runLoadTest() {
  console.log('🚀 Starting load test...');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Concurrent uploads: ${CONCURRENT_UPLOADS}`);
  console.log(`   Sample image: ${SAMPLE_IMAGE}`);
  console.log('');

  // Read sample image
  let imageBuffer: Buffer;
  try {
    imageBuffer = readFileSync(SAMPLE_IMAGE);
    console.log(`✓ Loaded sample image (${imageBuffer.length} bytes)`);
  } catch (error) {
    console.error('✗ Failed to load sample image:', error);
    process.exit(1);
  }

  // Upload receipts concurrently
  console.log(`\n📤 Uploading ${CONCURRENT_UPLOADS} receipts...`);
  const startTime = Date.now();

  const uploadPromises = Array.from({ length: CONCURRENT_UPLOADS }, (_, i) =>
    uploadReceipt(imageBuffer, i + 1)
  );

  const uploadResults = await Promise.all(uploadPromises);

  const totalUploadTime = Date.now() - startTime;
  const successfulUploads = uploadResults.filter((r) => r.success);
  const failedUploads = uploadResults.filter((r) => !r.success);

  console.log('\n📊 Upload Results:');
  console.log(`   ✓ Successful: ${successfulUploads.length}`);
  console.log(`   ✗ Failed: ${failedUploads.length}`);
  console.log(`   ⏱  Total time: ${totalUploadTime}ms`);
  console.log(
    `   ⚡ Avg upload time: ${Math.round(uploadResults.reduce((sum, r) => sum + r.uploadTime, 0) / uploadResults.length)}ms`
  );

  if (failedUploads.length > 0) {
    console.log('\n❌ Failed uploads:');
    failedUploads.forEach((result, i) => {
      console.log(`   ${i + 1}. ${result.error}`);
    });
  }

  // Wait for processing to complete
  if (successfulUploads.length > 0) {
    console.log('\n⏳ Waiting for OCR processing to complete...');

    const receiptIds = successfulUploads
      .map((r) => r.receiptId)
      .filter((id): id is string => Boolean(id));

    const checkInterval = 2000; // Check every 2 seconds
    const maxWaitTime = 60000; // Wait max 60 seconds
    const startWaitTime = Date.now();

    let allCompleted = false;
    while (!allCompleted && Date.now() - startWaitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, checkInterval));

      const statusPromises = receiptIds.map((id) => checkStatus(id));
      const statusResults = await Promise.all(statusPromises);

      const completed = statusResults.filter(
        (r) => r.status === 'completed' || r.status === 'failed'
      ).length;
      const processing = statusResults.filter(
        (r) => r.status === 'processing'
      ).length;

      process.stdout.write(
        `\r   Progress: ${completed}/${receiptIds.length} completed, ${processing} processing...`
      );

      allCompleted = completed === receiptIds.length;
    }

    console.log('\n');

    // Get final results
    const finalStatusPromises = receiptIds.map((id) => checkStatus(id));
    const finalResults = await Promise.all(finalStatusPromises);

    const completedCount = finalResults.filter(
      (r) => r.status === 'completed'
    ).length;
    const failedCount = finalResults.filter(
      (r) => r.status === 'failed'
    ).length;

    console.log('\n📊 Processing Results:');
    console.log(`   ✓ Completed: ${completedCount}`);
    console.log(`   ✗ Failed: ${failedCount}`);

    if (completedCount > 0) {
      const processingTimes = finalResults
        .filter((r) => r.status === 'completed')
        .map((r) => r.processingTime);
      const avgProcessingTime =
        processingTimes.reduce((sum, t) => sum + t, 0) / processingTimes.length;
      const maxProcessingTime = Math.max(...processingTimes);

      console.log(
        `   ⏱  Avg processing time: ${Math.round(avgProcessingTime)}ms`
      );
      console.log(`   ⏱  Max processing time: ${maxProcessingTime}ms`);
    }
  }

  // Summary
  console.log('\n✅ Load test complete!');
  const successRate = (successfulUploads.length / CONCURRENT_UPLOADS) * 100;
  console.log(`   Success rate: ${successRate.toFixed(1)}%`);

  if (successRate < 95) {
    console.log('\n⚠️  Warning: Success rate below 95%');
    process.exit(1);
  }
}

// Run the load test
runLoadTest().catch((error) => {
  console.error('\n❌ Load test failed:', error);
  process.exit(1);
});
