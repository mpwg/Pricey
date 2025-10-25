/**
 * File validation utilities for receipt uploads
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

import type { MultipartFile } from '@fastify/multipart';
import sharp from 'sharp';

export class ValidationError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_WIDTH = 500;
const MIN_HEIGHT = 500;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/**
 * Validate uploaded image file
 * @param file - Multipart file to validate
 * @throws ValidationError if validation fails
 */
export async function validateImage(file: MultipartFile): Promise<void> {
  // Check file size
  if (file.file.bytesRead > MAX_FILE_SIZE) {
    throw new ValidationError(
      `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      'FILE_TOO_LARGE'
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      'INVALID_FILE_TYPE'
    );
  }

  // Check file extension
  const extension = file.filename.match(/\.[^.]+$/)?.[0]?.toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new ValidationError(
      `Invalid file extension. Allowed extensions: ${ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_FILE_TYPE'
    );
  }

  // Validate actual image data
  try {
    const buffer = await file.toBuffer();
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new ValidationError(
        'Could not determine image dimensions',
        'INVALID_IMAGE'
      );
    }

    if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
      throw new ValidationError(
        `Image dimensions too small. Minimum: ${MIN_WIDTH}x${MIN_HEIGHT}px`,
        'INVALID_IMAGE'
      );
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(
      'Invalid or corrupted image file',
      'INVALID_IMAGE'
    );
  }
}
