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

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
