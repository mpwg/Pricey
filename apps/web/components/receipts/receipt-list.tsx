/**
 * Receipt list component
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

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiClient, type Receipt } from '@/lib/api';
import { ReceiptCard } from './receipt-card';
import { EmptyState } from './empty-state';
import { ReceiptListSkeleton } from './receipt-list-skeleton';

export function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceipts() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getReceipts();
        setReceipts(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load receipts';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadReceipts();
  }, []);

  if (loading) {
    return <ReceiptListSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (receipts.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {receipts.map((receipt) => (
        <ReceiptCard key={receipt.id} receipt={receipt} />
      ))}
    </div>
  );
}
