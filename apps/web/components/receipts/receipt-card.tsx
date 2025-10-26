/**
 * Receipt card component
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

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from './status-badge';
import { formatDate, formatCurrency } from '@/lib/format';
import type { Receipt } from '@/lib/api';

interface ReceiptCardProps {
  receipt: Receipt;
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  return (
    <Link href={`/receipts/${receipt.id}`}>
      <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <Image
            src={receipt.imageUrl}
            alt={receipt.storeName || 'Receipt'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute right-2 top-2">
            <StatusBadge status={receipt.status} />
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <div className="font-semibold truncate">
            {receipt.storeName || 'Processing...'}
          </div>
          <div className="text-sm text-muted-foreground">
            {receipt.purchaseDate
              ? formatDate(receipt.purchaseDate)
              : 'Date pending...'}
          </div>
          <div className="text-lg font-bold">
            {receipt.totalAmount != null
              ? formatCurrency(receipt.totalAmount)
              : '—'}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
