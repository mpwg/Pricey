/**
 * Hook for auto-polling receipt status
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
import { apiClient, type Receipt } from '@/lib/api';

interface UseReceiptPollingResult {
  status: Receipt['status'] | null;
  polling: boolean;
}

/**
 * Default polling interval in milliseconds
 */
const DEFAULT_POLLING_INTERVAL_MS = 3000;

/**
 * Hook that polls receipt status for processing receipts
 * @param receiptId - The ID of the receipt to poll
 * @param initialStatus - The initial status of the receipt
 * @param pollingIntervalMs - How often to poll in milliseconds (default: 3000)
 */
export function useReceiptPolling(
  receiptId: string,
  initialStatus?: Receipt['status'],
  pollingIntervalMs: number = DEFAULT_POLLING_INTERVAL_MS
): UseReceiptPollingResult {
  const [status, setStatus] = useState<Receipt['status'] | null>(
    initialStatus || null
  );
  const [polling, setPolling] = useState(
    initialStatus === 'PROCESSING' || initialStatus === 'PENDING'
  );

  useEffect(() => {
    if (!polling) return;

    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getReceiptStatus(receiptId);
        setStatus(data.status);

        // Stop polling if status is no longer processing
        if (data.status !== 'PROCESSING' && data.status !== 'PENDING') {
          setPolling(false);
        }
      } catch (error) {
        console.error('Failed to fetch receipt status:', error);
        // Continue polling even if there's an error
      }
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [receiptId, polling, pollingIntervalMs]);

  return { status, polling };
}
