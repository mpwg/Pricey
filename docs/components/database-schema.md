# Database Schema & Migrations

## Overview

Pricy uses PostgreSQL 18 with Prisma 6.x as the ORM. The schema supports receipt storage, product normalization, price tracking, and user management with proper indexing for performance.

## Technology Stack

- **Database**: PostgreSQL 18
- **Extensions**:
  - pgvector (semantic search)
  - PostGIS (optional, for location-based features)
  - pg_trgm (fuzzy text search)
- **ORM**: Prisma 5.x
- **Migration Tool**: Prisma Migrate
- **Seeding**: TypeScript seed scripts

## Complete Prisma Schema

```prisma
// filepath: packages/database/prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector, pg_trgm]
}

// ============================================================================
// USER MANAGEMENT & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?   @map("password_hash")  // Null for social login users
  name          String
  image         String?   // Profile picture URL
  role          UserRole  @default(USER)

  // Social login fields
  provider      String?   // google, microsoft, apple, email
  providerId    String?   @map("provider_id")    // Provider's user ID

  // Verification & security
  emailVerified Boolean   @default(false) @map("email_verified")
  lastLogin     DateTime? @map("last_login")

  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  accounts      Account[]
  sessions      Session[]
  receipts      Receipt[]
  shoppingLists ShoppingList[]
  settings      UserSettings?

  @@index([email])
  @@index([provider, providerId])
  @@map("users")
}

enum UserRole {
  USER
  ADMIN
}

// NextAuth.js Account model for OAuth
model Account {
  id                String  @id @default(uuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

// NextAuth.js Session model (for database sessions)
model Session {
  id           String   @id @default(uuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

// NextAuth.js Verification Token model
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model UserSettings {
  id                  String   @id @default(uuid())
  userId              String   @unique @map("user_id")
  currency            String   @default("EUR")
  preferredStores     String[] @map("preferred_stores")
  notificationsEnabled Boolean @default(true) @map("notifications_enabled")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_settings")
}

// ============================================================================
// STORES
// ============================================================================

model Store {
  id        String   @id @default(uuid())
  name      String   @unique
  chainId   String?  @map("chain_id")
  address   String?
  city      String?
  postalCode String? @map("postal_code")
  country   String   @default("DE")
  latitude  Decimal? @db.Decimal(10, 8)
  longitude Decimal? @db.Decimal(11, 8)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  chain        StoreChain?    @relation(fields: [chainId], references: [id])
  receipts     Receipt[]
  priceHistory PriceHistory[]

  @@index([name])
  @@index([chainId])
  @@index([city])
  @@map("stores")
}

model StoreChain {
  id        String   @id @default(uuid())
  name      String   @unique
  logo      String?
  website   String?
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  stores Store[]

  @@map("store_chains")
}

// ============================================================================
// RECEIPTS
// ============================================================================

model Receipt {
  id          String        @id @default(uuid())
  userId      String        @map("user_id")
  storeId     String?       @map("store_id")
  imageUrl    String        @map("image_url")
  totalAmount Decimal?      @map("total_amount") @db.Decimal(10, 2)
  date        DateTime?
  status      ReceiptStatus @default(PENDING)
  rawOcrText  String?       @map("raw_ocr_text") @db.Text
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  store Store? @relation(fields: [storeId], references: [id])
  items ReceiptItem[]

  @@index([userId])
  @@index([storeId])
  @@index([date])
  @@index([status])
  @@map("receipts")
}

enum ReceiptStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model ReceiptItem {
  id             String   @id @default(uuid())
  receiptId      String   @map("receipt_id")
  productId      String?  @map("product_id")
  description    String
  normalizedName String?  @map("normalized_name")
  brand          String?
  quantity       Decimal  @db.Decimal(10, 3)
  unit           String
  price          Decimal  @db.Decimal(10, 2)
  unitPrice      Decimal? @map("unit_price") @db.Decimal(10, 2)
  lineNumber     Int      @map("line_number")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  receipt Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])

  @@index([receiptId])
  @@index([productId])
  @@map("receipt_items")
}

// ============================================================================
// PRODUCTS & CATEGORIES
// ============================================================================

model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  parentId    String?  @map("parent_id")
  icon        String?
  description String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]

  @@index([parentId])
  @@map("categories")
}

model Product {
  id             String                           @id @default(uuid())
  name           String
  normalizedName String                           @map("normalized_name")
  brand          String?
  categoryId     String                           @map("category_id")
  barcode        String?                          @unique
  lastPrice      Decimal?                         @map("last_price") @db.Decimal(10, 2)
  lastPriceDate  DateTime?                        @map("last_price_date")
  embedding      Unsupported("vector(384)")?      // pgvector for semantic search
  imageUrl       String?                          @map("image_url")
  verified       Boolean                          @default(false)
  createdAt      DateTime                         @default(now()) @map("created_at")
  updatedAt      DateTime                         @updatedAt @map("updated_at")

  category     Category       @relation(fields: [categoryId], references: [id])
  receiptItems ReceiptItem[]
  priceHistory PriceHistory[]

  @@index([normalizedName])
  @@index([categoryId])
  @@index([brand])
  @@map("products")
}

// ============================================================================
// PRICE TRACKING
// ============================================================================

model PriceHistory {
  id        String   @id @default(uuid())
  productId String   @map("product_id")
  storeId   String   @map("store_id")
  price     Decimal  @db.Decimal(10, 2)
  unitPrice Decimal  @map("unit_price") @db.Decimal(10, 2)
  unit      String
  date      DateTime
  createdAt DateTime @default(now()) @map("created_at")

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  store   Store   @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@unique([productId, storeId, date])
  @@index([productId, storeId, date(sort: Desc)])
  @@index([storeId, date(sort: Desc)])
  @@index([date(sort: Desc)])
  @@map("price_history")
}

// ============================================================================
// SHOPPING LISTS
// ============================================================================

model ShoppingList {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user  User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  items ShoppingListItem[]

  @@index([userId])
  @@map("shopping_lists")
}

model ShoppingListItem {
  id             String  @id @default(uuid())
  shoppingListId String  @map("shopping_list_id")
  productId      String? @map("product_id")
  description    String
  quantity       Decimal @db.Decimal(10, 3)
  unit           String
  checked        Boolean @default(false)

  shoppingList ShoppingList @relation(fields: [shoppingListId], references: [id], onDelete: Cascade)

  @@index([shoppingListId])
  @@map("shopping_list_items")
}
```

## Performance Indexes

```sql
-- filepath: packages/database/prisma/migrations/01_performance_indexes.sql

-- Composite indexes for common queries
CREATE INDEX idx_receipts_user_date ON receipts(user_id, date DESC);
CREATE INDEX idx_receipts_store_date ON receipts(store_id, date DESC);

-- Price history partitioning by date (for large datasets)
CREATE INDEX idx_price_history_date_product ON price_history(date DESC, product_id);

-- Full-text search on products
CREATE INDEX idx_products_name_fulltext ON products USING gin(to_tsvector('english', name));

-- Geospatial index for stores (if using PostGIS)
-- CREATE INDEX idx_stores_location ON stores USING gist(
--   ll_to_earth(latitude::float, longitude::float)
-- );
```

## Table Partitioning (Optional, for scale)

```sql
-- filepath: packages/database/prisma/migrations/02_partitioning.sql

-- Partition price_history by month for better performance
CREATE TABLE price_history_partitioned (
  LIKE price_history INCLUDING ALL
) PARTITION BY RANGE (date);

-- Create partitions for the last 12 months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  FOR i IN 0..11 LOOP
    start_date := date_trunc('month', current_date - (i || ' months')::interval);
    end_date := start_date + interval '1 month';
    partition_name := 'price_history_y' || to_char(start_date, 'YYYY') ||
                     'm' || to_char(start_date, 'MM');

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I PARTITION OF price_history_partitioned
       FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
  END LOOP;
END $$;
```

## Migration Commands

```json
// filepath: packages/database/package.json
{
  "name": "@pricy/database",
  "version": "1.0.0",
  "scripts": {
    "migrate": "prisma migrate dev",
    "migrate:deploy": "prisma migrate deploy",
    "migrate:reset": "prisma migrate reset --skip-seed",
    "migrate:status": "prisma migrate status",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "db:reset": "prisma migrate reset",
    "generate": "prisma generate",
    "format": "prisma format"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0"
  },
  "devDependencies": {
    "prisma": "^5.7.0",
    "tsx": "^4.7.0",
    "bcryptjs": "^2.4.3",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

## Seed Script

```typescript
// filepath: packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pricy.app' },
    update: {},
    create: {
      email: 'admin@pricy.app',
      passwordHash: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@pricy.app' },
    update: {},
    create: {
      email: 'demo@pricy.app',
      passwordHash: demoPassword,
      name: 'Demo User',
      role: 'USER',
      emailVerified: true,
    },
  });
  console.log('✅ Created demo user:', demo.email);

  // Create store chains
  const chains = [
    { name: 'Walmart', website: 'https://walmart.com' },
    { name: 'ALDI', website: 'https://aldi.com' },
    { name: 'Lidl', website: 'https://lidl.com' },
    { name: 'Tesco', website: 'https://tesco.com' },
    { name: 'Whole Foods', website: 'https://wholefoodsmarket.com' },
  ];

  const createdChains = new Map();
  for (const chain of chains) {
    const created = await prisma.storeChain.upsert({
      where: { name: chain.name },
      update: {},
      create: chain,
    });
    createdChains.set(chain.name, created);
  }
  console.log('✅ Created store chains');

  // Create stores
  const stores = [
    {
      name: 'Walmart Supercenter Downtown',
      chainId: createdChains.get('Walmart').id,
      address: '123 Main St',
      city: 'Springfield',
      postalCode: '12345',
      country: 'US',
      latitude: 37.7749,
      longitude: -122.4194,
    },
    {
      name: 'ALDI Springfield',
      chainId: createdChains.get('ALDI').id,
      address: '456 Oak Ave',
      city: 'Springfield',
      postalCode: '12345',
      country: 'US',
      latitude: 37.7849,
      longitude: -122.4294,
    },
    {
      name: 'Lidl Central',
      chainId: createdChains.get('Lidl').id,
      address: '789 Elm St',
      city: 'Springfield',
      postalCode: '12346',
      country: 'US',
      latitude: 37.7949,
      longitude: -122.4394,
    },
  ];

  for (const store of stores) {
    await prisma.store.upsert({
      where: { name: store.name },
      update: {},
      create: store,
    });
  }
  console.log('✅ Created stores');

  // Create categories
  const categories = [
    { name: 'Fruit', slug: 'fruit', icon: '🍎' },
    { name: 'Vegetables', slug: 'vegetables', icon: '🥕' },
    { name: 'Dairy', slug: 'dairy', icon: '🥛' },
    { name: 'Bakery', slug: 'bakery', icon: '🍞' },
    { name: 'Meat', slug: 'meat', icon: '🥩' },
    { name: 'Beverages', slug: 'beverages', icon: '🥤' },
    { name: 'Snacks', slug: 'snacks', icon: '🍿' },
    { name: 'Frozen Foods', slug: 'frozen-foods', icon: '🧊' },
    { name: 'Other', slug: 'other', icon: '📦' },
  ];

  const createdCategories = new Map();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
    createdCategories.set(category.slug, created);
  }
  console.log('✅ Created categories');

  // Create sample products
  const products = [
    { name: 'Apple', normalized: 'apple', category: 'fruit' },
    { name: 'Banana', normalized: 'banana', category: 'fruit' },
    { name: 'Orange', normalized: 'orange', category: 'fruit' },
    { name: 'Carrot', normalized: 'carrot', category: 'vegetables' },
    { name: 'Potato', normalized: 'potato', category: 'vegetables' },
    {
      name: 'Milk',
      normalized: 'milk',
      category: 'dairy',
      brand: 'Organic Valley',
    },
    { name: 'Bread', normalized: 'bread', category: 'bakery' },
    { name: 'Chicken Breast', normalized: 'chicken breast', category: 'meat' },
  ];

  for (const product of products) {
    const category = createdCategories.get(product.category);
    await prisma.product.upsert({
      where: {
        normalizedName: product.normalized,
      },
      update: {},
      create: {
        name: product.name,
        normalizedName: product.normalized,
        categoryId: category.id,
        brand: product.brand,
      },
    });
  }
  console.log('✅ Created sample products');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## Best Practices

1. **Always use migrations** - Never use `db push` in production
2. **Version migrations** - Use descriptive names for migrations
3. **Test migrations** - Test both up and down migrations
4. **Index strategically** - Monitor query performance and add indexes as needed
5. **Partition large tables** - Use table partitioning for price_history when it grows
6. **Regular backups** - Automate database backups
7. **Connection pooling** - Use Prisma connection pooling in production

## Maintenance Tasks

```bash
# Vacuum database (reclaim storage)
VACUUM ANALYZE;

# Reindex tables
REINDEX TABLE price_history;

# Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

# Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```
