/**
 * Status badge component
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

import { Check, Loader2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from '@/lib/format';

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = getStatusColor(status);
  const label = getStatusLabel(status);

  const icon = {
    PENDING: <Loader2 className="h-3 w-3 animate-spin" />,
    PROCESSING: <Loader2 className="h-3 w-3 animate-spin" />,
    COMPLETED: <Check className="h-3 w-3" />,
    FAILED: <AlertCircle className="h-3 w-3" />,
  }[status];

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      {icon}
      {label}
    </Badge>
  );
}
