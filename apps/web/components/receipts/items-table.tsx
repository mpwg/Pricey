/**
 * Items table component
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

import { formatCurrency } from '@/lib/format';
import type { ReceiptItem } from '@/lib/api';

interface ItemsTableProps {
  items: ReceiptItem[];
}

export function ItemsTable({ items }: ItemsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-2 text-sm font-medium text-muted-foreground">
              Item
            </th>
            <th className="text-center p-2 text-sm font-medium text-muted-foreground">
              Qty
            </th>
            <th className="text-right p-2 text-sm font-medium text-muted-foreground">
              Price
            </th>
            <th className="text-right p-2 text-sm font-medium text-muted-foreground">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="p-2 font-medium">{item.name}</td>
              <td className="text-center p-2">{item.quantity}</td>
              <td className="text-right p-2">{formatCurrency(item.price)}</td>
              <td className="text-right p-2 font-semibold">
                {formatCurrency(item.price * item.quantity)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
