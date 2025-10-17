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

// Product type
export interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  brand?: string;
  createdAt: Date;
  updatedAt: Date;
  invoiceItems?: InvoiceItem[];
}

// Price type
export interface Price {
  id: string;
  productId: string;
  retailer: string;
  price: number;
  currency: string;
  url: string;
  inStock: boolean;
  scrapedAt: Date;
}

// Price Alert type
export interface PriceAlert {
  id: string;
  userId: string;
  productId: string;
  targetPrice: number;
  active: boolean;
  notified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Invoice Item type (Rechnungsposten)
export interface InvoiceItem {
  id: string;
  productId: string;
  date: Date;
  storeDescription: string; // Bezeichnung lt. Geschäft
  price: number;
  unit: string; // Einheit
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
