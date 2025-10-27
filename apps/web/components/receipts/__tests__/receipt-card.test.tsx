/**
 * Tests for ReceiptCard component
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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReceiptCard } from '../receipt-card';
import type { Receipt } from '@/lib/api';
import { ReceiptStatus } from '@pricey/types';

describe('ReceiptCard', () => {
  const mockReceipt: Receipt = {
    id: 'receipt-123',
    imageUrl: 'https://example.com/receipt.jpg',
    status: ReceiptStatus.COMPLETED,
    storeName: 'Walmart',
    purchaseDate: '2025-10-25T10:00:00Z',
    totalAmount: 50.99,
    ocrConfidence: 0.95,
    rawOcrText: 'Receipt text...',
    processingTime: 1500,
    createdAt: '2025-10-25T10:00:00Z',
    updatedAt: '2025-10-25T10:01:00Z',
  };

  it('renders receipt information correctly', () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    expect(screen.getByText('Walmart')).toBeInTheDocument();
    expect(screen.getByText('$50.99')).toBeInTheDocument();
    expect(screen.getByText(/Oct 25, 2025/i)).toBeInTheDocument();
  });

  it('renders processing state correctly', () => {
    const processingReceipt: Receipt = {
      ...mockReceipt,
      status: ReceiptStatus.PROCESSING,
      storeName: undefined,
      purchaseDate: undefined,
      totalAmount: undefined,
    };

    render(<ReceiptCard receipt={processingReceipt} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Date pending...')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders failed state correctly', () => {
    const failedReceipt: Receipt = {
      ...mockReceipt,
      status: ReceiptStatus.FAILED,
    };

    render(<ReceiptCard receipt={failedReceipt} />);

    // Check for failed status badge
    const statusBadge = screen.getByText(/failed/i);
    expect(statusBadge).toBeInTheDocument();
  });

  it('renders as a link to receipt detail page', () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/receipts/receipt-123');
  });

  it('displays receipt image with correct attributes', () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    const image = screen.getByAltText('Walmart');
    expect(image).toBeInTheDocument();
  });

  it('renders status badge', () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('handles missing store name', () => {
    const receiptWithoutStore: Receipt = {
      ...mockReceipt,
      storeName: undefined,
    };

    render(<ReceiptCard receipt={receiptWithoutStore} />);

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('handles missing purchase date', () => {
    const receiptWithoutDate: Receipt = {
      ...mockReceipt,
      purchaseDate: undefined,
    };

    render(<ReceiptCard receipt={receiptWithoutDate} />);

    expect(screen.getByText('Date pending...')).toBeInTheDocument();
  });

  it('handles missing total amount', () => {
    const receiptWithoutTotal: Receipt = {
      ...mockReceipt,
      totalAmount: undefined,
    };

    render(<ReceiptCard receipt={receiptWithoutTotal} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats currency correctly', () => {
    const receiptWithDecimal: Receipt = {
      ...mockReceipt,
      totalAmount: 123.45,
    };

    render(<ReceiptCard receipt={receiptWithDecimal} />);

    expect(screen.getByText('$123.45')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    const receiptWithDate: Receipt = {
      ...mockReceipt,
      purchaseDate: '2025-12-31T23:59:59Z',
    };

    render(<ReceiptCard receipt={receiptWithDate} />);

    // Check for either Dec 31, 2025 or Jan 1, 2026 depending on timezone
    const dateText = screen.getByText(/Dec 31, 2025|Jan 1, 2026/i);
    expect(dateText).toBeInTheDocument();
  });
});
