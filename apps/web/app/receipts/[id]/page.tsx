/**
 * Receipt detail page for Pricy web app
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

import { Suspense } from 'react';
import { ReceiptDetail } from '@/components/receipts/receipt-detail';
import { ReceiptDetailSkeleton } from '@/components/receipts/receipt-detail-skeleton';

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ReceiptPageProps) {
  const { id } = await params;
  return {
    title: `Receipt ${id} - Pricy`,
    description: 'View receipt details',
  };
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;

  return (
    <div className="container py-8">
      <Suspense fallback={<ReceiptDetailSkeleton />}>
        <ReceiptDetail id={id} />
      </Suspense>
    </div>
  );
}
