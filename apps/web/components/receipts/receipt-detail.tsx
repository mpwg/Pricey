/**
 * Receipt detail component
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
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Store, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiClient, type ReceiptWithItems } from '@/lib/api';
import { StatusBadge } from './status-badge';
import { ItemsTable } from './items-table';
import { RawOcrText } from './raw-ocr-text';
import { useReceiptSSE } from '@/hooks/use-receipt-sse';
import { formatDate, formatCurrency } from '@/lib/format';

interface ReceiptDetailProps {
  id: string;
}

export function ReceiptDetail({ id }: ReceiptDetailProps) {
  const [receipt, setReceipt] = useState<ReceiptWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use SSE for real-time updates
  const {
    status: sseStatus,
    connected,
    error: sseError,
    data: sseData,
  } = useReceiptSSE(id, receipt?.status);

  useEffect(() => {
    async function loadReceipt() {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getReceipt(id);
        console.log('[ReceiptDetail] Loaded receipt:', {
          id: data.id,
          status: data.status,
          itemCount: data.items?.length,
        });
        setReceipt(data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load receipt';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }

    loadReceipt();
  }, [id]);

  // Reload receipt when status changes from SSE
  useEffect(() => {
    if (sseStatus && receipt && sseStatus !== receipt.status) {
      // Status changed, reload full receipt data
      apiClient
        .getReceipt(id)
        .then((data) => {
          setReceipt(data);
          // Show success toast when processing completes
          if (sseStatus === 'COMPLETED' && receipt.status !== 'COMPLETED') {
            toast.success('Receipt processed successfully!');
          } else if (sseStatus === 'FAILED') {
            toast.error('Receipt processing failed');
          }
        })
        .catch((err) => {
          console.error('Failed to reload receipt:', err);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sseStatus, id]);

  // Show SSE errors
  useEffect(() => {
    if (sseError) {
      toast.error(`Connection error: ${sseError}`);
    }
  }, [sseError]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
        <p className="text-destructive mb-4">{error || 'Receipt not found'}</p>
        <Button asChild variant="outline">
          <Link href="/receipts">Back to Receipts</Link>
        </Button>
      </div>
    );
  }

  // Show processing state - use SSE status if available, otherwise use receipt status
  const currentStatus = sseStatus || receipt.status;
  const isProcessing =
    currentStatus === 'PROCESSING' || currentStatus === 'PENDING';

  return (
    <div className="space-y-6">
      {/* Processing Banner */}
      {isProcessing && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="font-medium text-primary">Processing receipt...</p>
              <p className="text-sm text-muted-foreground">
                {connected
                  ? 'Extracting data from your receipt. This usually takes 10-30 seconds.'
                  : 'Your receipt is being processed.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Receipts
          </Link>
        </Button>
        <StatusBadge status={currentStatus} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Receipt Image */}
        <Card>
          <CardContent className="p-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-muted">
              <Image
                src={receipt.imageUrl}
                alt={receipt.storeName || 'Receipt'}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
                unoptimized={process.env.NODE_ENV === 'development'}
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Details */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {receipt.storeName && (
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Store</p>
                    <p className="font-semibold">{receipt.storeName}</p>
                  </div>
                </div>
              )}
              {receipt.purchaseDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Purchase Date
                    </p>
                    <p className="font-semibold">
                      {formatDate(receipt.purchaseDate)}
                    </p>
                  </div>
                </div>
              )}
              {receipt.totalAmount != null && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(receipt.totalAmount)}
                  </p>
                </div>
              )}
              {receipt.ocrConfidence != null && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    OCR Confidence
                  </p>
                  <p className="font-semibold">
                    {(receipt.ocrConfidence * 100).toFixed(1)}%
                  </p>
                </div>
              )}
              {receipt.processingTime != null && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Processing Time
                    </p>
                    <p className="font-semibold">
                      {(receipt.processingTime / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          {receipt.items && receipt.items.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  Items ({sseData?.itemCount ?? receipt.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ItemsTable items={receipt.items} />
              </CardContent>
            </Card>
          ) : isProcessing ? (
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center py-8 text-muted-foreground">
                <div className="text-center space-y-2">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <p>Extracting items from receipt...</p>
                  {connected && (
                    <p className="text-xs text-primary">● Connected</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : currentStatus === 'COMPLETED' ? (
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No items were extracted from this receipt.</p>
              </CardContent>
            </Card>
          ) : null}

          {/* Raw OCR Text */}
          {receipt.rawOcrText && <RawOcrText text={receipt.rawOcrText} />}
        </div>
      </div>
    </div>
  );
}
