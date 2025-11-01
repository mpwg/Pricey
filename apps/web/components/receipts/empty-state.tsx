/**
 * Empty state component for receipt list
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

import Link from 'next/link';
import { Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EmptyState() {
  return (
    <Card className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-primary/10 p-6 mb-6">
        <Receipt className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">No receipts yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by uploading your first receipt. We&apos;ll automatically
        extract items and prices.
      </p>
      <Button asChild size="lg">
        <Link href="/">Upload Receipt</Link>
      </Button>
    </Card>
  );
}
