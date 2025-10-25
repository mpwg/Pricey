# Analytics Service Component

## Overview

The Analytics Service provides price comparison, shopping recommendations, and trend analysis. It uses graph algorithms and optimization techniques to find the best stores and optimal shopping routes.

## Technology Stack

- **Framework**: Fastify 4.x
- **Language**: TypeScript 5+
- **Optimization**:
  - @google-cloud/optimization (route optimization)
  - Linear programming libraries
- **Graph**: Neo4j (optional, for complex route planning)
- **Cache**: Redis 8.x + Redis Streams
- **Validation**: Zod 3.x
- **ORM**: Prisma 5.x

## Project Structure

```
services/analytics/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── analytics.routes.ts
│   │   └── recommendations.routes.ts
│   ├── controllers/
│   │   ├── analytics.controller.ts
│   │   └── recommendations.controller.ts
│   ├── services/
│   │   ├── price-comparison/
│   │   │   ├── comparator.ts
│   │   │   └── trend-analyzer.ts
│   │   ├── recommendations/
│   │   │   ├── single-store-optimizer.ts
│   │   │   ├── multi-store-optimizer.ts
│   │   │   └── route-planner.ts
│   │   └── insights/
│   │       ├── savings-calculator.ts
│   │       └── shopping-patterns.ts
│   ├── algorithms/
│   │   ├── knapsack.ts
│   │   ├── tsp.ts
│   │   └── clustering.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── cache.ts
│   │   └── distance.ts
│   └── types/
│       └── index.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Core Implementation

### Price Comparator

```typescript
// filepath: services/analytics/src/services/price-comparison/comparator.ts
import { prisma } from '@pricy/database';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

interface PriceComparison {
  product: {
    id: string;
    name: string;
    category: string;
  };
  prices: Array<{
    store: string;
    storeId: string;
    currentPrice: number;
    unit: string;
    lastSeen: Date;
    trend: 'up' | 'down' | 'stable';
    savingsVsAverage: number;
  }>;
  cheapestStore: string;
  mostExpensiveStore: string;
  averagePrice: number;
}

export class PriceComparator {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });
  }

  async compareProduct(productId: string): Promise<PriceComparison> {
    // Check cache
    const cacheKey = `price_comparison:${productId}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get product info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get recent prices grouped by store (last 30 days)
    const recentPrices = await prisma.priceHistory.findMany({
      where: {
        productId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: { store: true },
      orderBy: { date: 'desc' },
    });

    // Group by store and get latest price
    const storeMap = new Map<string, any>();

    for (const price of recentPrices) {
      if (!storeMap.has(price.storeId)) {
        storeMap.set(price.storeId, {
          store: price.store.name,
          storeId: price.storeId,
          currentPrice: price.unitPrice,
          unit: price.unit,
          lastSeen: price.date,
          prices: [price],
        });
      } else {
        storeMap.get(price.storeId)!.prices.push(price);
      }
    }

    // Calculate trends and averages
    const prices = Array.from(storeMap.values()).map((entry) => {
      const trend = this.calculateTrend(entry.prices);
      const avgPrice = this.calculateAverage(
        recentPrices.map((p) => Number(p.unitPrice))
      );

      return {
        store: entry.store,
        storeId: entry.storeId,
        currentPrice: Number(entry.currentPrice),
        unit: entry.unit,
        lastSeen: entry.lastSeen,
        trend,
        savingsVsAverage: avgPrice - Number(entry.currentPrice),
      };
    });

    // Sort by price
    prices.sort((a, b) => a.currentPrice - b.currentPrice);

    const result: PriceComparison = {
      product: {
        id: product.id,
        name: product.name,
        category: product.category.name,
      },
      prices,
      cheapestStore: prices[0]?.store || 'N/A',
      mostExpensiveStore: prices[prices.length - 1]?.store || 'N/A',
      averagePrice: this.calculateAverage(prices.map((p) => p.currentPrice)),
    };

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(result));

    return result;
  }

  async compareMultiple(productIds: string[]) {
    const comparisons = await Promise.all(
      productIds.map((id) => this.compareProduct(id))
    );

    return comparisons;
  }

  private calculateTrend(prices: any[]): 'up' | 'down' | 'stable' {
    if (prices.length < 2) return 'stable';

    // Sort by date
    const sorted = prices.sort((a, b) => a.date.getTime() - b.date.getTime());

    const first = Number(sorted[0].unitPrice);
    const last = Number(sorted[sorted.length - 1].unitPrice);
    const diff = ((last - first) / first) * 100;

    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  }

  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}
```

### Shopping Recommendation Engine

```typescript
// filepath: services/analytics/src/services/recommendations/single-store-optimizer.ts
import { prisma } from '@pricy/database';

interface ShoppingItem {
  productId: string;
  quantity: number;
}

interface StoreRecommendation {
  store: {
    id: string;
    name: string;
    address?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  totalCost: number;
  availableItems: number;
  missingItems: number;
  savings: number; // vs average market price
}

export class SingleStoreOptimizer {
  async findBestStore(items: ShoppingItem[]): Promise<StoreRecommendation[]> {
    // Get all recent prices for requested products
    const productIds = items.map((item) => item.productId);

    const recentPrices = await prisma.priceHistory.findMany({
      where: {
        productId: { in: productIds },
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        store: true,
        product: true,
      },
    });

    // Group by store
    const storeMap = new Map<string, Map<string, any>>();

    for (const price of recentPrices) {
      if (!storeMap.has(price.storeId)) {
        storeMap.set(price.storeId, new Map());
      }

      const storeProducts = storeMap.get(price.storeId)!;

      if (
        !storeProducts.has(price.productId) ||
        price.date > storeProducts.get(price.productId).date
      ) {
        storeProducts.set(price.productId, price);
      }
    }

    // Calculate total cost per store
    const recommendations: StoreRecommendation[] = [];

    for (const [storeId, products] of storeMap.entries()) {
      let totalCost = 0;
      let availableItems = 0;
      const storeItems = [];

      for (const item of items) {
        const price = products.get(item.productId);

        if (price) {
          const itemTotal = Number(price.unitPrice) * item.quantity;
          totalCost += itemTotal;
          availableItems++;

          storeItems.push({
            productId: item.productId,
            productName: price.product.name,
            quantity: item.quantity,
            unitPrice: Number(price.unitPrice),
            totalPrice: itemTotal,
          });
        }
      }

      if (availableItems > 0) {
        const firstPrice = Array.from(products.values())[0];

        recommendations.push({
          store: {
            id: storeId,
            name: firstPrice.store.name,
            address: firstPrice.store.address,
          },
          items: storeItems,
          totalCost,
          availableItems,
          missingItems: items.length - availableItems,
          savings: 0, // Will calculate below
        });
      }
    }

    // Calculate average market price
    const avgMarketPrice = this.calculateAverageMarketPrice(
      recentPrices,
      items
    );

    // Calculate savings
    for (const rec of recommendations) {
      rec.savings = avgMarketPrice - rec.totalCost;
    }

    // Sort by total cost (cheapest first)
    recommendations.sort((a, b) => a.totalCost - b.totalCost);

    return recommendations;
  }

  private calculateAverageMarketPrice(
    prices: any[],
    items: ShoppingItem[]
  ): number {
    let total = 0;

    for (const item of items) {
      const itemPrices = prices
        .filter((p) => p.productId === item.productId)
        .map((p) => Number(p.unitPrice));

      if (itemPrices.length > 0) {
        const avg =
          itemPrices.reduce((sum, p) => sum + p, 0) / itemPrices.length;
        total += avg * item.quantity;
      }
    }

    return total;
  }
}
```

### Multi-Store Optimizer

```typescript
// filepath: services/analytics/src/services/recommendations/multi-store-optimizer.ts
import { SingleStoreOptimizer, ShoppingItem } from './single-store-optimizer';

interface MultiStoreRecommendation {
  stores: Array<{
    store: {
      id: string;
      name: string;
      address?: string;
    };
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
    subtotal: number;
  }>;
  totalCost: number;
  totalSavings: number;
  comparedToSingleStore: number;
}

export class MultiStoreOptimizer {
  private singleStoreOptimizer: SingleStoreOptimizer;

  constructor() {
    this.singleStoreOptimizer = new SingleStoreOptimizer();
  }

  async optimizeMultiStore(
    items: ShoppingItem[]
  ): Promise<MultiStoreRecommendation> {
    // Get best single store for comparison
    const singleStoreRecs =
      await this.singleStoreOptimizer.findBestStore(items);
    const bestSingleStore = singleStoreRecs[0];

    // Use greedy algorithm: for each item, pick the store with lowest price
    const allocation = new Map<string, ShoppingItem[]>();
    const storeInfo = new Map<string, any>();

    for (const item of items) {
      // Find cheapest store for this item
      let cheapestStore: any = null;
      let lowestPrice = Infinity;

      for (const rec of singleStoreRecs) {
        const itemInStore = rec.items.find(
          (i) => i.productId === item.productId
        );

        if (itemInStore && itemInStore.unitPrice < lowestPrice) {
          lowestPrice = itemInStore.unitPrice;
          cheapestStore = {
            store: rec.store,
            item: itemInStore,
          };
        }
      }

      if (cheapestStore) {
        if (!allocation.has(cheapestStore.store.id)) {
          allocation.set(cheapestStore.store.id, []);
          storeInfo.set(cheapestStore.store.id, cheapestStore.store);
        }
        allocation.get(cheapestStore.store.id)!.push(item);
      }
    }

    // Build recommendation
    const stores = Array.from(allocation.entries()).map(
      ([storeId, storeItems]) => {
        const store = storeInfo.get(storeId);
        const storeRec = singleStoreRecs.find((r) => r.store.id === storeId)!;

        const items = storeItems.map((item) => {
          const itemData = storeRec.items.find(
            (i) => i.productId === item.productId
          )!;
          return itemData;
        });

        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

        return {
          store,
          items,
          subtotal,
        };
      }
    );

    const totalCost = stores.reduce((sum, s) => sum + s.subtotal, 0);
    const savings = bestSingleStore ? bestSingleStore.totalCost - totalCost : 0;

    return {
      stores,
      totalCost,
      totalSavings: savings,
      comparedToSingleStore: bestSingleStore?.totalCost || 0,
    };
  }
}
```

### Trend Analyzer

```typescript
// filepath: services/analytics/src/services/price-comparison/trend-analyzer.ts
import { prisma } from '@pricy/database';

interface PriceTrend {
  productId: string;
  productName: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  predictedNextPrice: number;
  confidence: number;
}

export class TrendAnalyzer {
  async analyzeTrends(
    productIds: string[],
    days: number = 30
  ): Promise<PriceTrend[]> {
    const trends: PriceTrend[] = [];

    for (const productId of productIds) {
      const prices = await prisma.priceHistory.findMany({
        where: {
          productId,
          date: {
            gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
          },
        },
        include: { product: true },
        orderBy: { date: 'asc' },
      });

      if (prices.length < 2) {
        continue;
      }

      // Simple linear regression for trend
      const { slope, prediction } = this.linearRegression(
        prices.map((p, i) => ({ x: i, y: Number(p.unitPrice) }))
      );

      const first = Number(prices[0].unitPrice);
      const last = Number(prices[prices.length - 1].unitPrice);
      const changePercent = ((last - first) / first) * 100;

      let trend: 'up' | 'down' | 'stable';
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
      else trend = 'stable';

      trends.push({
        productId,
        productName: prices[0].product.name,
        trend,
        changePercent,
        predictedNextPrice: prediction,
        confidence: this.calculateConfidence(
          prices.map((p) => Number(p.unitPrice))
        ),
      });
    }

    return trends;
  }

  private linearRegression(data: Array<{ x: number; y: number }>) {
    const n = data.length;
    const sumX = data.reduce((sum, p) => sum + p.x, 0);
    const sumY = data.reduce((sum, p) => sum + p.y, 0);
    const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = data.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const prediction = slope * n + intercept;

    return { slope, intercept, prediction };
  }

  private calculateConfidence(prices: number[]): number {
    // Calculate coefficient of variation (lower = more consistent = higher confidence)
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean;

    // Convert to confidence (0-1)
    return Math.max(0, 1 - cv);
  }
}
```

## API Endpoints

```typescript
// filepath: services/analytics/src/routes/analytics.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import * as analyticsController from '../controllers/analytics.controller';

export default async function analyticsRoutes(app: FastifyInstance) {
  // Compare product prices
  app.get(
    '/compare/:productId',
    {
      schema: {
        params: Type.Object({
          productId: Type.String({ format: 'uuid' }),
        }),
      },
    },
    analyticsController.compareProduct
  );

  // Get shopping recommendations
  app.post(
    '/recommend',
    {
      schema: {
        body: Type.Object({
          items: Type.Array(
            Type.Object({
              productId: Type.String({ format: 'uuid' }),
              quantity: Type.Number({ minimum: 0.01 }),
            })
          ),
          optimize: Type.Optional(
            Type.Union([Type.Literal('single'), Type.Literal('multi')])
          ),
        }),
      },
    },
    analyticsController.getRecommendations
  );

  // Analyze price trends
  app.post(
    '/trends',
    {
      schema: {
        body: Type.Object({
          productIds: Type.Array(Type.String({ format: 'uuid' })),
          days: Type.Optional(Type.Integer({ minimum: 7, maximum: 365 })),
        }),
      },
    },
    analyticsController.analyzeTrends
  );

  // Get user insights
  app.get(
    '/insights/:userId',
    {
      schema: {
        params: Type.Object({
          userId: Type.String({ format: 'uuid' }),
        }),
      },
    },
    analyticsController.getUserInsights
  );
}
```

## Performance Optimization

1. **Caching**: Redis cache for comparisons (1h TTL)
2. **Aggregation**: Pre-compute common queries
3. **Indexing**: Composite indexes on price_history
4. **Batch Processing**: Process multiple products in parallel
5. **Materialized Views**: For complex analytics queries

## Best Practices

1. Cache expensive calculations
2. Use database aggregations over application logic
3. Implement rate limiting for heavy queries
4. Monitor query performance
5. Use background jobs for complex optimizations
6. Provide real-time updates via WebSockets
7. Track user feedback for recommendation quality
