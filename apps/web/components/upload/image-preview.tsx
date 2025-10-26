/**
 * Image preview component for uploaded receipts
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

import Image from 'next/image';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  url: string;
  onClear: () => void;
}

export function ImagePreview({ url, onClear }: ImagePreviewProps) {
  return (
    <div className="relative">
      <div className="relative aspect-[3/4] w-full max-w-sm mx-auto overflow-hidden rounded-lg">
        <Image
          src={url}
          alt="Receipt preview"
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <Button
        type="button"
        variant="destructive"
        size="icon"
        className="absolute right-2 top-2"
        onClick={onClear}
        aria-label="Remove image"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
