/**
 * Pricey - Find the best price
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import NextImage from "next/image";
import { cn } from "@/lib/utils";

/**
 * Optimized Image component with lazy loading
 * Uses Next.js Image component with automatic optimization
 */

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number | undefined;
  height?: number | undefined;
  className?: string | undefined;
  priority?: boolean;
  fill?: boolean;
  sizes?: string | undefined;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 75,
}: OptimizedImageProps) {
  return (
    <NextImage
      src={src}
      alt={alt}
      {...(width !== undefined && { width })}
      {...(height !== undefined && { height })}
      fill={fill}
      sizes={sizes || "100vw"}
      quality={quality}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      className={cn("object-cover", className ?? undefined)}
    />
  );
}

/**
 * Product Image with fallback
 */
interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  const fallbackSrc = "/images/product-placeholder.png";

  return (
    <OptimizedImage
      src={src || fallbackSrc}
      alt={alt}
      fill
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={className ?? undefined}
    />
  );
}
