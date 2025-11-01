/**
 * Script to check recent receipt IDs in the database
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { db } from '../src/index.js';

async function checkReceipts() {
  try {
    // Check specific receipt
    const targetId = '603f280c-2518-4530-9952-8fd41c21258a';
    const targetReceipt = await db.receipt.findUnique({
      where: { id: targetId },
      include: { items: true },
    });

    if (targetReceipt) {
      // eslint-disable-next-line no-console
      console.log('\n🎯 TARGET RECEIPT FOUND:');
      // eslint-disable-next-line no-console
      console.log(`   ID: ${targetReceipt.id}`);
      // eslint-disable-next-line no-console
      console.log(`   Store: ${targetReceipt.storeName || 'null'}`);
      // eslint-disable-next-line no-console
      console.log(`   Status: ${targetReceipt.status}`);
      // eslint-disable-next-line no-console
      console.log(`   Items: ${targetReceipt.items.length}`);
      // eslint-disable-next-line no-console
      console.log(`   Created: ${targetReceipt.createdAt.toISOString()}`);
    } else {
      // eslint-disable-next-line no-console
      console.log(`\n❌ Receipt ${targetId} NOT FOUND in database`);
    }

    const receipts = await db.receipt.findMany({
      select: {
        id: true,
        storeName: true,
        status: true,
        createdAt: true,
        items: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // eslint-disable-next-line no-console
    console.log('\nRecent Receipts:');
    // eslint-disable-next-line no-console
    console.log('================');
    receipts.forEach((receipt, index) => {
      // eslint-disable-next-line no-console
      console.log(`\n${index + 1}. ID: ${receipt.id}`);
      // eslint-disable-next-line no-console
      console.log(`   Store: ${receipt.storeName || 'null'}`);
      // eslint-disable-next-line no-console
      console.log(`   Status: ${receipt.status}`);
      // eslint-disable-next-line no-console
      console.log(`   Items: ${receipt.items.length}`);
      // eslint-disable-next-line no-console
      console.log(`   Created: ${receipt.createdAt.toISOString()}`);
    });

    // eslint-disable-next-line no-console
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.$disconnect();
  }
}

checkReceipts();
