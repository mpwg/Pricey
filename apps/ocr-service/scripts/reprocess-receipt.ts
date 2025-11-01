/**
 * Script to reprocess a receipt with updated parsers
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { db } from '@pricey/database';
import { queueService } from '../src/services/queue.service.js';

const receiptId = process.argv[2];

if (!receiptId) {
  console.error('Usage: tsx reprocess-receipt.ts <receiptId>');
  process.exit(1);
}

async function main() {
  console.log(`Reprocessing receipt ${receiptId}...`);

  // Get the receipt
  const receipt = await db.receipt.findUnique({
    where: { id: receiptId },
  });

  if (!receipt) {
    console.error('Receipt not found');
    process.exit(1);
  }

  console.log(`Found receipt with image: ${receipt.imageUrl}`);

  // Reset status to trigger reprocessing
  await db.receipt.update({
    where: { id: receiptId },
    data: {
      status: 'PENDING',
      rawOcrText: null,
      ocrConfidence: null,
      processingTime: null,
    },
  });

  // Delete existing items
  await db.receiptItem.deleteMany({
    where: { receiptId },
  });

  console.log('Reset receipt status and deleted items');

  // Queue for reprocessing
  await queueService.queueOCRJob(receiptId, receipt.imageUrl);

  console.log('Queued for reprocessing');
  console.log('✅ Done! Check the OCR service logs for processing details.');

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
