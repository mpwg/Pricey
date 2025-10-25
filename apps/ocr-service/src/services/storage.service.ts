/**
 * Storage service for downloading receipt images
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

import * as Minio from 'minio';
import { env } from '../config/env.js';

export class StorageService {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;

    this.client = new Minio.Client({
      endPoint: env.S3_ENDPOINT,
      port: env.S3_PORT,
      useSSL: env.S3_USE_SSL,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
    });
  }

  /**
   * Download file from S3/MinIO
   * @param key - S3 key
   * @returns Buffer
   */
  async downloadFile(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * Extract S3 key from URL
   * @param url - Full URL
   * @returns S3 key
   */
  getKeyFromUrl(url: string): string {
    try {
      const { pathname } = new URL(url);
      // Remove leading slash and bucket name if present
      const pathParts = pathname.split('/').filter(Boolean);
      // If path has bucket name as first segment, skip it
      if (pathParts.length < 2) {
        return pathname.startsWith('/') ? pathname.slice(1) : pathname;
      }
      // Assume first segment is bucket, rest is key
      return pathParts.slice(1).join('/');
    } catch {
      // Fallback: return original string if URL parsing fails
      return url;
    }
  }
}

export const storageService = new StorageService();
