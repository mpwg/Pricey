/**
 * Receipts list page for Pricy web app
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
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptList } from '@/components/receipts/receipt-list';
import { ReceiptListSkeleton } from '@/components/receipts/receipt-list-skeleton';

export const metadata = {
  title: 'Receipts - Pricy',
  description: 'View all your uploaded receipts',
};

export default function ReceiptsPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receipts</h1>
          <p className="text-muted-foreground">
            View and manage your uploaded receipts
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Plus className="mr-2 h-4 w-4" />
            Upload New
          </Link>
        </Button>
      </div>

      <Suspense fallback={<ReceiptListSkeleton />}>
        <ReceiptList />
      </Suspense>
    </div>
  );
}
