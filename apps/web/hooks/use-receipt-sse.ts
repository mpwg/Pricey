/**
 * Hook for Server-Sent Events receipt status updates
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

import { useEffect, useState, useCallback, useRef } from 'react';
import { type Receipt } from '@/lib/api';
import { ReceiptStatus } from '@pricey/types';

interface UseReceiptSSEResult {
  status: Receipt['status'] | null;
  connected: boolean;
  error: string | null;
  data: {
    storeName?: string | null;
    purchaseDate?: string | null;
    totalAmount?: number | null;
    itemCount?: number;
    ocrConfidence?: number | null;
    processingTime?: number | null;
  } | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Hook that uses Server-Sent Events for real-time receipt status updates
 * @param receiptId - The ID of the receipt to monitor
 * @param initialStatus - The initial status of the receipt
 */
export function useReceiptSSE(
  receiptId: string,
  initialStatus?: Receipt['status']
): UseReceiptSSEResult {
  const [status, setStatus] = useState<Receipt['status'] | null>(
    initialStatus || null
  );
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<UseReceiptSSEResult['data']>(null);

  // Track if we've received a completion message
  const completedRef = useRef(false);

  // Determine if we should connect to SSE
  // Only connect if status is explicitly PROCESSING or PENDING
  const shouldConnect =
    initialStatus === ReceiptStatus.PROCESSING ||
    initialStatus === ReceiptStatus.PENDING;

  console.log('[useReceiptSSE] Hook called:', {
    receiptId,
    initialStatus,
    shouldConnect,
  });

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log('[useReceiptSSE] Received message:', message);

      switch (message.type) {
        case 'connected':
          setConnected(true);
          setError(null);
          break;

        case 'status':
          setStatus(message.status);
          break;

        case 'complete':
          completedRef.current = true;
          setStatus(message.status);
          setData(message.data);
          break;

        case 'error':
          setError(message.message);
          setConnected(false);
          break;
      }
    } catch (err) {
      console.error('Failed to parse SSE message:', err);
    }
  }, []);

  useEffect(() => {
    // Only connect if status is PROCESSING or PENDING
    if (!shouldConnect) {
      // Receipt is already completed or failed, no need to connect
      console.log(
        '[useReceiptSSE] Skipping SSE connection - receipt not processing'
      );
      return;
    }

    console.log('[useReceiptSSE] Establishing SSE connection...');
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/v1/receipts/${receiptId}/events`
    );

    eventSource.onmessage = handleMessage;

    eventSource.onerror = (err) => {
      // Only log error if we haven't received a complete message
      if (!completedRef.current) {
        console.error('[useReceiptSSE] SSE connection error:', err);
        setError('Connection lost');
      } else {
        console.log(
          '[useReceiptSSE] SSE connection closed (receipt completed)'
        );
      }
      setConnected(false);
      eventSource.close();
    };

    eventSource.onopen = () => {
      console.log('[useReceiptSSE] SSE connection opened');
      setConnected(true);
      setError(null);
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, [receiptId, shouldConnect, handleMessage]);

  return { status, connected, error, data };
}
