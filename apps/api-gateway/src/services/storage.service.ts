/**
 * Storage service for managing file uploads to S3/MinIO
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
import { randomUUID } from 'node:crypto';
import type { MultipartFile } from '@fastify/multipart';
import { env } from '../config/env.js';

export class StorageService {
  private client: Minio.Client;
  private bucket: string;

  constructor() {
    this.bucket = env.S3_BUCKET;

    // Initialize MinIO/S3 client
    this.client = new Minio.Client({
      endPoint: env.S3_ENDPOINT,
      port: env.S3_PORT,
      useSSL: env.S3_USE_SSL,
      accessKey: env.S3_ACCESS_KEY,
      secretKey: env.S3_SECRET_KEY,
    });

    this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, 'us-east-1');
      }

      // Set public read policy for development (allows anonymous downloads)
      if (env.NODE_ENV === 'development') {
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucket}/*`],
            },
          ],
        };
        await this.client.setBucketPolicy(
          this.bucket,
          JSON.stringify(policy),
        );
      }
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
    }
  }

  /**
   * Upload a file to S3/MinIO
   * @param file - The multipart file to upload
   * @returns The URL of the uploaded file
   */
  async uploadReceipt(file: MultipartFile): Promise<string> {
    const buffer = await file.toBuffer();
    const extension = this.getFileExtension(file.filename);
    const key = this.generateKey(extension);

    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': file.mimetype,
    });

    return this.getFileUrl(key);
  }

  /**
   * Download a file from S3/MinIO
   * @param key - The S3 key of the file
   * @returns Buffer containing file data
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
   * Delete a file from S3/MinIO
   * @param key - The S3 key of the file
   */
  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  /**
   * Generate a unique key for file storage
   * @param extension - File extension
   * @returns S3 key
   */
  private generateKey(extension: string): string {
    const uuid = randomUUID();
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `receipts/${timestamp}/${uuid}${extension}`;
  }

  /**
   * Extract file extension from filename
   * @param filename - Original filename
   * @returns File extension with dot (e.g., ".jpg")
   */
  private getFileExtension(filename: string): string {
    const match = filename.match(/\.[^.]+$/);
    return match ? match[0].toLowerCase() : '';
  }

  /**
   * Get the public URL for a file
   * @param key - S3 key
   * @returns Public URL
   */
  private getFileUrl(key: string): string {
    const protocol = env.S3_USE_SSL ? 'https' : 'http';
    const endpoint = env.S3_ENDPOINT || 'localhost';
    const port = env.S3_PORT || 9000;
    return `${protocol}://${endpoint}:${port}/${this.bucket}/${key}`;
  }

  /**
   * Extract the S3 key from a full URL
   * @param url - Full S3 URL
   * @returns S3 key
   */
  getKeyFromUrl(url: string): string {
    try {
      const u = new URL(url);
      // Pathname is /bucket/key or just /key depending on setup
      const pathParts = u.pathname.split('/').filter(Boolean);
      // If path has bucket name as first segment, skip it
      if (pathParts.length < 2) return url;
      // Assume first segment is bucket, rest is key
      return pathParts.slice(1).join('/');
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  }
}

export const storageService = new StorageService();
