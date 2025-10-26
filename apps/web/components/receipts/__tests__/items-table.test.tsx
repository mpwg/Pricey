/**
 * Tests for ItemsTable component
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
import { ItemsTable } from '../items-table';
import type { ReceiptItem } from '@/lib/api';

describe('ItemsTable', () => {
  const mockItems: ReceiptItem[] = [
    {
      id: 'item-1',
      receiptId: 'receipt-123',
      name: 'Milk',
      quantity: 2,
      price: 3.99,
    },
    {
      id: 'item-2',
      receiptId: 'receipt-123',
      name: 'Bread',
      quantity: 1,
      price: 2.49,
    },
    {
      id: 'item-3',
      receiptId: 'receipt-123',
      name: 'Eggs (dozen)',
      quantity: 3,
      price: 4.5,
    },
  ];

  it('renders table with headers', () => {
    render(<ItemsTable items={mockItems} />);

    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Qty')).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('renders all items correctly', () => {
    render(<ItemsTable items={mockItems} />);

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.getByText('Bread')).toBeInTheDocument();
    expect(screen.getByText('Eggs (dozen)')).toBeInTheDocument();
  });

  it('displays quantities correctly', () => {
    render(<ItemsTable items={mockItems} />);

    const quantities = screen.getAllByText(/^[123]$/);
    expect(quantities).toHaveLength(3);
  });

  it('formats prices correctly', () => {
    render(<ItemsTable items={mockItems} />);

    // Check for unique prices
    expect(screen.getByText('$3.99')).toBeInTheDocument();
    expect(screen.getByText('$4.50')).toBeInTheDocument();

    // $2.49 appears both as price and total for Bread
    expect(screen.getAllByText('$2.49')).toHaveLength(2);
  });

  it('calculates and displays totals correctly', () => {
    render(<ItemsTable items={mockItems} />);

    // 2 * $3.99 = $7.98
    expect(screen.getByText('$7.98')).toBeInTheDocument();

    // 1 * $2.49 = $2.49
    expect(screen.getAllByText('$2.49')).toHaveLength(2); // Price and total

    // 3 * $4.50 = $13.50
    expect(screen.getByText('$13.50')).toBeInTheDocument();
  });

  it('renders empty table when no items provided', () => {
    render(<ItemsTable items={[]} />);

    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(
      screen.queryByRole('row', { name: /milk/i })
    ).not.toBeInTheDocument();
  });

  it('handles single item correctly', () => {
    const singleItem: ReceiptItem[] = [mockItems[0]];
    render(<ItemsTable items={singleItem} />);

    expect(screen.getByText('Milk')).toBeInTheDocument();
    expect(screen.queryByText('Bread')).not.toBeInTheDocument();
  });

  it('handles decimal quantities', () => {
    const itemWithDecimal: ReceiptItem[] = [
      {
        id: 'item-4',
        receiptId: 'receipt-123',
        name: 'Cheese (0.5 lb)',
        quantity: 0.5,
        price: 6.0,
      },
    ];

    render(<ItemsTable items={itemWithDecimal} />);

    expect(screen.getByText('0.5')).toBeInTheDocument();
    expect(screen.getByText('$3.00')).toBeInTheDocument(); // 0.5 * 6.00 = 3.00
  });

  it('formats large amounts correctly', () => {
    const expensiveItem: ReceiptItem[] = [
      {
        id: 'item-5',
        receiptId: 'receipt-123',
        name: 'Electronics',
        quantity: 1,
        price: 1234.56,
      },
    ];

    render(<ItemsTable items={expensiveItem} />);

    // Both price and total should show $1,234.56
    expect(screen.getAllByText('$1,234.56')).toHaveLength(2);
  });

  it('handles zero price items', () => {
    const freeItem: ReceiptItem[] = [
      {
        id: 'item-6',
        receiptId: 'receipt-123',
        name: 'Free Sample',
        quantity: 1,
        price: 0,
      },
    ];

    render(<ItemsTable items={freeItem} />);

    expect(screen.getAllByText('$0.00')).toHaveLength(2); // Price and total
  });

  it('applies correct CSS classes for alignment', () => {
    const { container } = render(<ItemsTable items={mockItems} />);

    const table = container.querySelector('table');
    expect(table).toHaveClass('w-full');

    // Check that quantity columns have text-center
    const qtyHeaders = screen.getByText('Qty');
    expect(qtyHeaders).toHaveClass('text-center');

    // Check that price columns have text-right
    const priceHeaders = screen.getByText('Price');
    expect(priceHeaders).toHaveClass('text-right');
  });
});
