# Product Service Component

## Overview

The Product Service handles product normalization, categorization, and price tracking. It uses machine learning and fuzzy matching to map receipt items to generic products, enabling accurate price comparisons across stores.

## Technology Stack

- **Framework**: Fastify 4.x
- **Language**: TypeScript 5+
- **NLP/ML**:
  - Transformers.js (BERT embeddings, runs in Node.js)
  - natural (tokenization, stemming)
  - fuzzball (Levenshtein distance)
- **Vector Search**: pgvector (PostgreSQL extension)
- **Queue**: BullMQ 5.x (Redis-based)
- **Validation**: Zod 3.x
- **ORM**: Prisma 5.x

## Project Structure

```
services/product/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── routes/
│   │   ├── products.routes.ts
│   │   └── categories.routes.ts
│   ├── controllers/
│   │   ├── products.controller.ts
│   │   └── categories.controller.ts
│   ├── services/
│   │   ├── normalization/
│   │   │   ├── normalizer.ts
│   │   │   ├── embeddings.ts
│   │   │   ├── fuzzy-matcher.ts
│   │   │   └── brand-extractor.ts
│   │   ├── categorization/
│   │   │   ├── categorizer.ts
│   │   │   └── category-tree.ts
│   │   ├── price-tracking/
│   │   │   ├── price-tracker.ts
│   │   │   └── price-analyzer.ts
│   │   └── queue/
│   │       └── processor.ts
│   ├── ml/
│   │   ├── models/
│   │   │   └── product-classifier.ts
│   │   └── training/
│   │       └── train.ts
│   ├── utils/
│   │   ├── text.ts
│   │   ├── logger.ts
│   │   └── cache.ts
│   └── types/
│       └── index.ts
├── data/
│   ├── categories.json
│   ├── brands.json
│   └── training-data.json
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Core Implementation

### Product Normalizer

```typescript
// filepath: services/product/src/services/normalization/normalizer.ts
import { pipeline, Pipeline } from "@xenova/transformers";
import { FuzzyMatcher } from "./fuzzy-matcher";
import { BrandExtractor } from "./brand-extractor";
import { prisma } from "@pricy/database";
import { logger } from "../../utils/logger";
import { Redis } from "ioredis";

interface NormalizationResult {
  genericProduct: string;
  productId: string;
  confidence: number;
  brand?: string;
  category: string;
}

export class ProductNormalizer {
  private embeddingModel: Pipeline | null = null;
  private fuzzyMatcher: FuzzyMatcher;
  private brandExtractor: BrandExtractor;
  private redis: Redis;
  private productEmbeddings: Map<string, number[]> = new Map();

  constructor() {
    this.fuzzyMatcher = new FuzzyMatcher();
    this.brandExtractor = new BrandExtractor();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    });
  }

  async initialize() {
    logger.info("Loading embedding model...");

    // Use multilingual MiniLM for semantic similarity
    this.embeddingModel = await pipeline(
      "feature-extraction",
      "Xenova/multilingual-e5-small"
    );

    // Load product embeddings from database
    await this.loadProductEmbeddings();

    logger.info("Product normalizer initialized");
  }

  async normalize(description: string): Promise<NormalizationResult> {
    // Check cache first
    const cacheKey = `norm:${description.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Clean and tokenize description
    const cleaned = this.cleanDescription(description);

    // Extract brand
    const brand = await this.brandExtractor.extract(cleaned);

    // Remove brand from description for better matching
    const withoutBrand = brand ? cleaned.replace(brand, "").trim() : cleaned;

    // Try semantic similarity first (most accurate)
    let result = await this.semanticMatch(withoutBrand);

    // Fallback to fuzzy matching if confidence is low
    if (!result || result.confidence < 0.7) {
      result = await this.fuzzyMatcher.match(withoutBrand);
    }

    // Fallback to keyword matching
    if (!result || result.confidence < 0.5) {
      result = await this.keywordMatch(withoutBrand);
    }

    // If still no match, create new product
    if (!result || result.confidence < 0.3) {
      result = await this.createNewProduct(cleaned);
    }

    const finalResult: NormalizationResult = {
      ...result,
      brand: brand || undefined,
    };

    // Cache result for 24 hours
    await this.redis.setex(cacheKey, 86400, JSON.stringify(finalResult));

    return finalResult;
  }

  private async semanticMatch(
    description: string
  ): Promise<NormalizationResult | null> {
    if (!this.embeddingModel) {
      return null;
    }

    try {
      // Generate embedding for input description
      const output = await this.embeddingModel(description, {
        pooling: "mean",
        normalize: true,
      });

      const queryEmbedding = Array.from(output.data);

      // Use pgvector for similarity search
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          p.id,
          p.name,
          p.normalized_name,
          p.category_id,
          c.name as category_name,
          1 - (p.embedding <=> ${queryEmbedding}::vector) as similarity
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.embedding IS NOT NULL
        ORDER BY p.embedding <=> ${queryEmbedding}::vector
        LIMIT 1
      `;

      if (result.length === 0 || result[0].similarity < 0.7) {
        return null;
      }

      return {
        genericProduct: result[0].normalized_name,
        productId: result[0].id,
        confidence: result[0].similarity,
        category: result[0].category_name,
      };
    } catch (error) {
      logger.error({ error }, "Semantic matching failed");
      return null;
    }
  }

  private async keywordMatch(
    description: string
  ): Promise<NormalizationResult | null> {
    // Simple keyword-based matching
    const keywords = description.toLowerCase().split(" ");

    const products = await prisma.product.findMany({
      where: {
        OR: keywords.map((kw) => ({
          normalized_name: {
            contains: kw,
            mode: "insensitive",
          },
        })),
      },
      include: {
        category: true,
      },
      take: 1,
    });

    if (products.length === 0) {
      return null;
    }

    return {
      genericProduct: products[0].normalized_name,
      productId: products[0].id,
      confidence: 0.5,
      category: products[0].category.name,
    };
  }

  private async createNewProduct(
    description: string
  ): Promise<NormalizationResult> {
    // Auto-categorize new product
    const category = await this.autoCategorizePrisma(description);

    const product = await prisma.product.create({
      data: {
        name: description,
        normalized_name: description.toLowerCase(),
        categoryId: category.id,
      },
      include: {
        category: true,
      },
    });

    // Generate and store embedding for future matches
    if (this.embeddingModel) {
      const output = await this.embeddingModel(description, {
        pooling: "mean",
        normalize: true,
      });
      const embedding = Array.from(output.data);

      await prisma.$executeRaw`
        UPDATE products
        SET embedding = ${embedding}::vector
        WHERE id = ${product.id}
      `;
    }

    return {
      genericProduct: product.normalized_name,
      productId: product.id,
      confidence: 1.0,
      category: product.category.name,
    };
  }

  private async autoCategorizePrisma(description: string) {
    // Simple keyword-based categorization
    // In production, use ML classifier
    const keywords = {
      Fruit: ["apple", "banana", "orange", "grape", "fruit"],
      Vegetables: ["carrot", "potato", "tomato", "lettuce", "vegetable"],
      Dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
      Bakery: ["bread", "roll", "bun", "cake", "pastry"],
      Meat: ["beef", "chicken", "pork", "meat", "steak"],
    };

    const lowerDesc = description.toLowerCase();

    for (const [categoryName, words] of Object.entries(keywords)) {
      if (words.some((word) => lowerDesc.includes(word))) {
        return await prisma.category.upsert({
          where: { name: categoryName },
          create: { name: categoryName },
          update: {},
        });
      }
    }

    // Default category
    return await prisma.category.upsert({
      where: { name: "Other" },
      create: { name: "Other" },
      update: {},
    });
  }

  private cleanDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private async loadProductEmbeddings() {
    const products = await prisma.$queryRaw<any[]>`
      SELECT id, name, embedding
      FROM products
      WHERE embedding IS NOT NULL
    `;

    products.forEach((p) => {
      if (p.embedding) {
        this.productEmbeddings.set(p.id, p.embedding);
      }
    });

    logger.info({ count: products.length }, "Loaded product embeddings");
  }
}
```

### Fuzzy Matcher

```typescript
// filepath: services/product/src/services/normalization/fuzzy-matcher.ts
import fuzz from "fuzzball";
import { prisma } from "@pricy/database";

export class FuzzyMatcher {
  private productNames: Map<string, { id: string; category: string }> =
    new Map();

  async initialize() {
    const products = await prisma.product.findMany({
      include: { category: true },
    });

    products.forEach((p) => {
      this.productNames.set(p.normalized_name, {
        id: p.id,
        category: p.category.name,
      });
    });
  }

  async match(description: string) {
    const choices = Array.from(this.productNames.keys());

    // Use token set ratio for better partial matching
    const results = fuzz.extract(description, choices, {
      scorer: fuzz.token_set_ratio,
      limit: 1,
      cutoff: 60,
    });

    if (results.length === 0) {
      return null;
    }

    const [bestMatch, score] = results[0];
    const product = this.productNames.get(bestMatch);

    if (!product) {
      return null;
    }

    return {
      genericProduct: bestMatch,
      productId: product.id,
      confidence: score / 100,
      category: product.category,
    };
  }
}
```

### Brand Extractor

```typescript
// filepath: services/product/src/services/normalization/brand-extractor.ts
import { prisma } from "@pricy/database";

export class BrandExtractor {
  private brands: Set<string> = new Set();

  async initialize() {
    // Load known brands from database
    const products = await prisma.product.findMany({
      where: { brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
    });

    products.forEach((p) => {
      if (p.brand) {
        this.brands.add(p.brand.toLowerCase());
      }
    });

    // Add common brands
    const commonBrands = [
      "gala",
      "granny smith",
      "honeycrisp",
      "organic",
      "bio",
      "fresh",
      "coca cola",
      "pepsi",
      "nestlé",
    ];

    commonBrands.forEach((b) => this.brands.add(b.toLowerCase()));
  }

  extract(description: string): string | null {
    const words = description.toLowerCase().split(" ");

    // Check for multi-word brands first
    for (let i = 0; i < words.length - 1; i++) {
      const twoWord = `${words[i]} ${words[i + 1]}`;
      if (this.brands.has(twoWord)) {
        return twoWord;
      }
    }

    // Check single words
    for (const word of words) {
      if (this.brands.has(word)) {
        return word;
      }
    }

    return null;
  }
}
```

### Price Tracker

```typescript
// filepath: services/product/src/services/price-tracking/price-tracker.ts
import { prisma } from "@pricy/database";
import { logger } from "../../utils/logger";

export class PriceTracker {
  async trackPrice(data: {
    productId: string;
    storeId: string;
    price: number;
    unitPrice: number;
    unit: string;
    date: Date;
  }) {
    try {
      // Insert price history
      await prisma.priceHistory.create({
        data: {
          productId: data.productId,
          storeId: data.storeId,
          price: data.price,
          unitPrice: data.unitPrice,
          unit: data.unit,
          date: data.date,
        },
      });

      // Update product's latest price
      await prisma.product.update({
        where: { id: data.productId },
        data: {
          lastPrice: data.unitPrice,
          lastPriceDate: data.date,
        },
      });

      logger.info(
        { productId: data.productId, price: data.unitPrice },
        "Price tracked"
      );
    } catch (error) {
      logger.error({ error, data }, "Failed to track price");
      throw error;
    }
  }

  async getPriceHistory(productId: string, storeId?: string) {
    return await prisma.priceHistory.findMany({
      where: {
        productId,
        ...(storeId && { storeId }),
      },
      orderBy: { date: "desc" },
      take: 30,
    });
  }

  async comparePrices(productId: string) {
    const prices = await prisma.priceHistory.groupBy({
      by: ["storeId"],
      where: {
        productId,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      _avg: {
        unitPrice: true,
      },
      _min: {
        unitPrice: true,
      },
    });

    const storeIds = prices.map((p) => p.storeId);
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
    });

    return prices
      .map((p) => {
        const store = stores.find((s) => s.id === p.storeId);
        return {
          store: store?.name || "Unknown",
          storeId: p.storeId,
          averagePrice: p._avg.unitPrice,
          lowestPrice: p._min.unitPrice,
        };
      })
      .sort((a, b) => (a.lowestPrice || 0) - (b.lowestPrice || 0));
  }
}
```

### Queue Processor

```typescript
// filepath: services/product/src/services/queue/processor.ts
import { Queue, Worker } from "bullmq";
import { prisma } from "@pricy/database";
import { ProductNormalizer } from "../normalization/normalizer";
import { PriceTracker } from "../price-tracking/price-tracker";
import { logger } from "../../utils/logger";

interface NormalizationJob {
  receiptId: string;
}

export class ProductProcessor {
  private queue: Queue<NormalizationJob>;
  private worker: Worker<NormalizationJob>;
  private normalizer: ProductNormalizer;
  private priceTracker: PriceTracker;

  constructor() {
    this.normalizer = new ProductNormalizer();
    this.priceTracker = new PriceTracker();

    this.queue = new Queue("product-normalization", {
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    });

    this.worker = new Worker<NormalizationJob>(
      "product-normalization",
      async (job) => {
        return this.processJob(job.data);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || "localhost",
          port: parseInt(process.env.REDIS_PORT || "6379"),
        },
        concurrency: 10,
      }
    );

    this.worker.on("completed", (job) => {
      logger.info({ jobId: job.id }, "Normalization completed");
    });

    this.worker.on("failed", (job, err) => {
      logger.error({ jobId: job?.id, error: err }, "Normalization failed");
    });
  }

  async initialize() {
    await this.normalizer.initialize();
  }

  async addJob(data: NormalizationJob) {
    await this.queue.add("normalize-receipt", data, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 3000,
      },
    });
  }

  private async processJob(data: NormalizationJob) {
    const { receiptId } = data;

    // Get receipt items
    const items = await prisma.receiptItem.findMany({
      where: { receiptId },
      include: { receipt: true },
    });

    for (const item of items) {
      // Normalize product
      const normalized = await this.normalizer.normalize(item.description);

      // Update receipt item with normalized product
      await prisma.receiptItem.update({
        where: { id: item.id },
        data: {
          productId: normalized.productId,
          normalizedName: normalized.genericProduct,
          brand: normalized.brand,
          unitPrice: item.price / item.quantity,
        },
      });

      // Track price
      if (item.receipt.storeId) {
        await this.priceTracker.trackPrice({
          productId: normalized.productId,
          storeId: item.receipt.storeId,
          price: item.price,
          unitPrice: item.price / item.quantity,
          unit: item.unit,
          date: item.receipt.date || new Date(),
        });
      }
    }

    logger.info({ receiptId, count: items.length }, "Receipt items normalized");
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}
```

## API Endpoints

```typescript
// filepath: services/product/src/routes/products.routes.ts
import { FastifyInstance } from "fastify";
import { Type } from "@sinclair/typebox";
import * as productsController from "../controllers/products.controller";

export default async function productsRoutes(app: FastifyInstance) {
  // Normalize product description
  app.post(
    "/normalize",
    {
      schema: {
        body: Type.Object({
          description: Type.String({ minLength: 1 }),
        }),
        response: {
          200: Type.Object({
            genericProduct: Type.String(),
            productId: Type.String({ format: "uuid" }),
            confidence: Type.Number(),
            brand: Type.Optional(Type.String()),
            category: Type.String(),
          }),
        },
      },
    },
    productsController.normalize
  );

  // Get product price history
  app.get(
    "/products/:id/prices",
    {
      schema: {
        params: Type.Object({
          id: Type.String({ format: "uuid" }),
        }),
        querystring: Type.Object({
          storeId: Type.Optional(Type.String({ format: "uuid" })),
        }),
      },
    },
    productsController.getPriceHistory
  );

  // Compare prices across stores
  app.get(
    "/products/:id/compare",
    {
      schema: {
        params: Type.Object({
          id: Type.String({ format: "uuid" }),
        }),
      },
    },
    productsController.comparePrices
  );

  // Search products
  app.get(
    "/products/search",
    {
      schema: {
        querystring: Type.Object({
          q: Type.String({ minLength: 1 }),
          limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
      },
    },
    productsController.search
  );
}
```

## Database Schema (Prisma)

```prisma
// filepath: packages/database/prisma/schema.prisma
// ...existing code...

model Product {
  id              String   @id @default(uuid())
  name            String
  normalizedName  String   @map("normalized_name")
  brand           String?
  categoryId      String   @map("category_id")
  barcode         String?  @unique
  lastPrice       Decimal? @map("last_price") @db.Decimal(10, 2)
  lastPriceDate   DateTime? @map("last_price_date")
  embedding       Unsupported("vector(384)")? // pgvector
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  category        Category @relation(fields: [categoryId], references: [id])
  receiptItems    ReceiptItem[]
  priceHistory    PriceHistory[]

  @@index([normalizedName])
  @@map("products")
}

model PriceHistory {
  id         String   @id @default(uuid())
  productId  String   @map("product_id")
  storeId    String   @map("store_id")
  price      Decimal  @db.Decimal(10, 2)
  unitPrice  Decimal  @map("unit_price") @db.Decimal(10, 2)
  unit       String
  date       DateTime
  createdAt  DateTime @default(now()) @map("created_at")

  product    Product @relation(fields: [productId], references: [id])
  store      Store   @relation(fields: [storeId], references: [id])

  @@index([productId, storeId, date])
  @@map("price_history")
}
```

## PostgreSQL Extensions

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create vector index for similarity search
CREATE INDEX products_embedding_idx ON products
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

## Environment Variables

```bash
# filepath: services/product/.env.example
PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://pricy:pricy@localhost:5432/pricy

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# ML Models (cached locally)
TRANSFORMERS_CACHE=/tmp/transformers-cache
```

## Performance Optimization

1. **Vector Search**: pgvector for fast semantic similarity
2. **Caching**: Redis cache for normalized products (24h TTL)
3. **Batch Processing**: Queue-based async normalization
4. **Model Optimization**: Use quantized models for faster inference
5. **Index Strategy**: Composite indexes on price_history

## Best Practices

1. Use semantic embeddings for accurate matching
2. Cache normalization results aggressively
3. Update embeddings when products are created
4. Monitor normalization confidence scores
5. Retrain models with user feedback
6. Use fuzzy matching as fallback
7. Track price history efficiently with partitioning

```

```
