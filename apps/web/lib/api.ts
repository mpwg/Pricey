/**
 * API client for Pricey web app
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Receipt {
  id: string;
  imageUrl: string;
  storeName?: string;
  purchaseDate?: string;
  totalAmount?: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  ocrConfidence?: number;
  processingTime?: number;
  rawOcrText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  receiptId: string;
}

export interface ReceiptWithItems extends Receipt {
  items: ReceiptItem[];
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(
          error.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async uploadReceipt(file: File): Promise<Receipt> {
    const formData = new FormData();
    formData.append('image', file);

    const url = `${this.baseUrl}/api/v1/receipts/upload`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(
          error.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async getReceipts(): Promise<Receipt[]> {
    return this.request<Receipt[]>('/api/v1/receipts');
  }

  async getReceipt(id: string): Promise<ReceiptWithItems> {
    return this.request<ReceiptWithItems>(`/api/v1/receipts/${id}`);
  }

  async getReceiptStatus(id: string): Promise<{ status: Receipt['status'] }> {
    return this.request<{ status: Receipt['status'] }>(
      `/api/v1/receipts/${id}/status`
    );
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
