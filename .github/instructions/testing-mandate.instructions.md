---
applyTo: '**/*.{ts,tsx,js,jsx}'
---

# Mandatory Unit Testing Requirements

**Status**: ⚠️ **CRITICAL - MANDATORY FOR ALL NEW CODE**  
**Effective Date**: October 25, 2025  
**Review Date**: November 2025

## Executive Summary

**ALL new implementations MUST include comprehensive unit tests.** This is a non-negotiable requirement for maintaining code quality, enabling safe refactoring, and ensuring production reliability.

---

## Testing Philosophy

### Core Principles

1. **Test-Driven Development (TDD)**: Write tests BEFORE implementation when possible
2. **Comprehensive Coverage**: Aim for 80%+ coverage on all new code
3. **Test Behavior, Not Implementation**: Focus on what code does, not how it does it
4. **Fast Feedback**: Unit tests must run in <1s, full suite in <5min
5. **Living Documentation**: Tests document expected behavior and edge cases

### The Testing Pyramid

```
        ┌─────────────┐
       │    E2E      │  5%  - Critical user flows (Playwright)
       │             │
      └───────────────┘
     ┌─────────────────┐
    │   Integration   │  30% - API, DB, services (Vitest)
    │                 │
   └───────────────────┘
  ┌──────────────────────┐
 │   Unit Tests        │  65% - Pure functions, utils (Vitest)
 │                     │
└──────────────────────┘
```

---

## Mandatory Testing Requirements

### When Tests Are REQUIRED

✅ **ALWAYS test these:**

1. **All pure functions** (utilities, helpers, formatters)
2. **All validation schemas** (Zod schemas, input validators)
3. **All business logic** (calculations, parsers, transformations)
4. **All API endpoints** (routes, controllers)
5. **All database operations** (services, repositories)
6. **All error handling** (error cases, edge cases)
7. **All security-critical code** (authentication, authorization)
8. **All data parsers** (OCR parsers, date parsers, item parsers)

### What to Test

For each function/module, test:

1. ✅ **Happy path** - Normal, expected usage
2. ✅ **Edge cases** - Boundary conditions, empty inputs
3. ✅ **Error cases** - Invalid inputs, exceptions
4. ✅ **Side effects** - Database changes, API calls (mocked)
5. ✅ **Integration points** - How components work together

### Test Coverage Targets

| Package/App         | Minimum Coverage | Target Coverage |
| ------------------- | ---------------- | --------------- |
| `packages/types`    | 100%             | 100%            |
| `packages/database` | 80%              | 90%             |
| `apps/api-gateway`  | 75%              | 85%             |
| `apps/ocr-service`  | 75%              | 85%             |
| `apps/web`          | 70%              | 80%             |
| **Overall**         | **75%**          | **85%**         |

---

## Technology Stack

### Testing Framework: Vitest

**Why Vitest?**

- ⚡ Ultra-fast (Vite-powered, ESM-native)
- 🧪 Jest-compatible API (easy migration)
- 📊 Built-in coverage (c8/v8)
- 🔥 Hot module reload for tests
- 📦 Zero-config TypeScript support

### Additional Tools

- **Mocking**: `vi.mock()`, `vi.spyOn()`
- **Coverage**: c8 (V8 native coverage)
- **API Testing**: Supertest (for Fastify routes)
- **Database Testing**: In-memory PostgreSQL or Docker
- **E2E**: Playwright (for critical flows)

---

## Implementation Guide

### 1. Setup Vitest in a Package

```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "@vitest/coverage-v8": "^2.1.8",
    "@vitest/ui": "^2.1.8",
    "vitest": "^2.1.8"
  }
}
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['src/**/*.{test,spec}.ts'],
  },
});
```

### 2. File Organization

**Co-locate tests with source files:**

```
src/
├── services/
│   ├── receipt.service.ts
│   ├── receipt.service.test.ts       # ✅ Co-located
│   ├── storage.service.ts
│   └── storage.service.test.ts
├── utils/
│   ├── validation.ts
│   ├── validation.test.ts
│   ├── date-parser.ts
│   └── date-parser.test.ts
└── test/
    ├── helpers.ts                     # Shared test utilities
    ├── fixtures.ts                    # Test data generators
    └── setup.ts                       # Global test setup
```

### 3. Naming Conventions

- **Test files**: `*.test.ts` or `*.spec.ts`
- **Test suites**: `describe('ModuleName', () => { ... })`
- **Test cases**: `it('should do something', () => { ... })` or `test('...')`
- **Fixtures**: `fixtures/` or `__fixtures__/`
- **Mocks**: `__mocks__/` or inline with `vi.mock()`

---

## Testing Patterns

### Pattern 1: Pure Function Testing

```typescript
/**
 * Date formatting utilities
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// src/utils/date-formatter.ts
export function formatDate(date: Date, format: 'iso' | 'us'): string {
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }

  if (format === 'iso') {
    return date.toISOString().split('T')[0];
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

// src/utils/date-formatter.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './date-formatter';

describe('formatDate', () => {
  describe('ISO format', () => {
    it('should format date in ISO format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date, 'iso')).toBe('2024-03-15');
    });

    it('should handle start of year', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      expect(formatDate(date, 'iso')).toBe('2024-01-01');
    });

    it('should handle end of year', () => {
      const date = new Date('2024-12-31T23:59:59Z');
      expect(formatDate(date, 'iso')).toBe('2024-12-31');
    });
  });

  describe('US format', () => {
    it('should format date in US format', () => {
      const date = new Date('2024-03-15T10:30:00Z');
      expect(formatDate(date, 'us')).toBe('03/15/2024');
    });

    it('should pad single-digit months and days', () => {
      const date = new Date('2024-01-05T10:30:00Z');
      expect(formatDate(date, 'us')).toBe('01/05/2024');
    });
  });

  describe('Error cases', () => {
    it('should throw error for invalid date', () => {
      const invalidDate = new Date('invalid');
      expect(() => formatDate(invalidDate, 'iso')).toThrow('Invalid date');
    });

    it('should throw error for NaN date', () => {
      const nanDate = new Date(NaN);
      expect(() => formatDate(nanDate, 'us')).toThrow('Invalid date');
    });
  });
});
```

### Pattern 2: Testing with Mocks

```typescript
/**
 * Storage service with S3/MinIO integration
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// src/services/storage.service.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export class StorageService {
  constructor(private s3Client: S3Client) {}

  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string
  ): Promise<string> {
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );

    return `https://s3.example.com/${process.env.S3_BUCKET}/${key}`;
  }
}

// src/services/storage.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { S3Client } from '@aws-sdk/client-s3';
import { StorageService } from './storage.service';

vi.mock('@aws-sdk/client-s3');

describe('StorageService', () => {
  let service: StorageService;
  let mockS3Client: any;

  beforeEach(() => {
    mockS3Client = {
      send: vi.fn(),
    };
    service = new StorageService(mockS3Client);
    process.env.S3_BUCKET = 'test-bucket';
  });

  describe('uploadFile', () => {
    it('should upload file to S3', async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      const buffer = Buffer.from('test content');
      const url = await service.uploadFile('test.jpg', buffer, 'image/jpeg');

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'test-bucket',
            Key: 'test.jpg',
            Body: buffer,
            ContentType: 'image/jpeg',
          }),
        })
      );

      expect(url).toBe('https://s3.example.com/test-bucket/test.jpg');
    });

    it('should handle S3 upload errors', async () => {
      mockS3Client.send.mockRejectedValueOnce(new Error('S3 Error'));

      const buffer = Buffer.from('test');

      await expect(
        service.uploadFile('test.jpg', buffer, 'image/jpeg')
      ).rejects.toThrow('S3 Error');
    });

    it('should handle different content types', async () => {
      mockS3Client.send.mockResolvedValueOnce({});

      const buffer = Buffer.from('pdf content');
      await service.uploadFile('doc.pdf', buffer, 'application/pdf');

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            ContentType: 'application/pdf',
          }),
        })
      );
    });
  });
});
```

### Pattern 3: Testing Zod Schemas

```typescript
/**
 * Receipt validation schemas
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// src/schemas/receipt.schema.ts
import { z } from 'zod';

export const receiptUploadSchema = z.object({
  storeId: z.string().uuid().optional(),
  date: z.coerce.date().max(new Date(), 'Date cannot be in the future'),
  notes: z.string().max(500).optional(),
});

// src/schemas/receipt.schema.test.ts
import { describe, it, expect } from 'vitest';
import { receiptUploadSchema } from './receipt.schema';

describe('receiptUploadSchema', () => {
  describe('valid inputs', () => {
    it('should validate correct receipt data', () => {
      const validData = {
        storeId: '123e4567-e89b-12d3-a456-426614174000',
        date: new Date('2024-01-15'),
        notes: 'Weekly groceries',
      };

      const result = receiptUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it('should accept optional fields', () => {
      const minimalData = {
        date: new Date('2024-01-15'),
      };

      const result = receiptUploadSchema.safeParse(minimalData);
      expect(result.success).toBe(true);
    });

    it('should coerce date strings to Date objects', () => {
      const data = {
        date: '2024-01-15',
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.date).toBeInstanceOf(Date);
      }
    });
  });

  describe('invalid inputs', () => {
    it('should reject invalid UUID', () => {
      const data = {
        storeId: 'not-a-uuid',
        date: new Date(),
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['storeId']);
      }
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const data = {
        date: futureDate,
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          'Date cannot be in the future'
        );
      }
    });

    it('should reject notes longer than 500 characters', () => {
      const data = {
        date: new Date(),
        notes: 'a'.repeat(501),
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toEqual(['notes']);
      }
    });

    it('should reject invalid date strings', () => {
      const data = {
        date: 'not-a-date',
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should accept empty notes', () => {
      const data = {
        date: new Date(),
        notes: '',
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle exactly 500 character notes', () => {
      const data = {
        date: new Date(),
        notes: 'a'.repeat(500),
      };

      const result = receiptUploadSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
```

### Pattern 4: Testing API Routes (Fastify)

```typescript
/**
 * Receipt routes integration tests
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// src/routes/receipts.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../app';
import type { FastifyInstance } from 'fastify';

describe('Receipt Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /receipts', () => {
    it('should create receipt', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/receipts',
        payload: {
          storeId: '123e4567-e89b-12d3-a456-426614174000',
          date: '2024-01-15',
          notes: 'Test receipt',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body).toMatchObject({
        id: expect.any(String),
        storeId: '123e4567-e89b-12d3-a456-426614174000',
        status: 'PENDING',
      });
    });

    it('should validate input', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/receipts',
        payload: {
          storeId: 'invalid-uuid',
          date: 'invalid-date',
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.message).toContain('validation');
    });
  });

  describe('GET /receipts', () => {
    it('should return empty array when no receipts', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/receipts',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    });

    it('should return paginated results', async () => {
      // Create test receipts
      await Promise.all([
        app.inject({
          method: 'POST',
          url: '/receipts',
          payload: { date: '2024-01-01' },
        }),
        app.inject({
          method: 'POST',
          url: '/receipts',
          payload: { date: '2024-01-02' },
        }),
        app.inject({
          method: 'POST',
          url: '/receipts',
          payload: { date: '2024-01-03' },
        }),
      ]);

      const response = await app.inject({
        method: 'GET',
        url: '/receipts?limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.length).toBe(2);
    });
  });

  describe('GET /receipts/:id', () => {
    it('should return receipt by id', async () => {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/receipts',
        payload: { date: '2024-01-15' },
      });

      const { id } = createResponse.json();

      const response = await app.inject({
        method: 'GET',
        url: `/receipts/${id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({ id });
    });

    it('should return 404 for non-existent receipt', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/receipts/123e4567-e89b-12d3-a456-426614174000',
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid UUID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/receipts/invalid-uuid',
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
```

### Pattern 5: Testing OCR Parsers

```typescript
/**
 * Date parser for receipt OCR
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// src/parsers/date-parser.test.ts
import { describe, it, expect } from 'vitest';
import { parseReceiptDate } from './date-parser';

describe('parseReceiptDate', () => {
  describe('valid date formats', () => {
    it('should parse MM/DD/YYYY format', () => {
      expect(parseReceiptDate('01/15/2024')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('12/31/2023')).toEqual(new Date('2023-12-31'));
    });

    it('should parse DD/MM/YYYY format', () => {
      expect(parseReceiptDate('15/01/2024')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('31/12/2023')).toEqual(new Date('2023-12-31'));
    });

    it('should parse YYYY-MM-DD format', () => {
      expect(parseReceiptDate('2024-01-15')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('2023-12-31')).toEqual(new Date('2023-12-31'));
    });

    it('should parse dates with month names', () => {
      expect(parseReceiptDate('January 15, 2024')).toEqual(
        new Date('2024-01-15')
      );
      expect(parseReceiptDate('Jan 15, 2024')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('15 January 2024')).toEqual(
        new Date('2024-01-15')
      );
    });

    it('should parse dates with different separators', () => {
      expect(parseReceiptDate('01-15-2024')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('01.15.2024')).toEqual(new Date('2024-01-15'));
      expect(parseReceiptDate('01 15 2024')).toEqual(new Date('2024-01-15'));
    });
  });

  describe('ambiguous dates', () => {
    it('should handle ambiguous dates with context', () => {
      // If both interpretations are valid, prefer MM/DD/YYYY (US format)
      expect(parseReceiptDate('02/03/2024')).toEqual(new Date('2024-02-03'));
    });

    it('should use DD/MM/YYYY when day > 12', () => {
      expect(parseReceiptDate('15/03/2024')).toEqual(new Date('2024-03-15'));
    });
  });

  describe('invalid inputs', () => {
    it('should return null for invalid date strings', () => {
      expect(parseReceiptDate('not a date')).toBeNull();
      expect(parseReceiptDate('32/01/2024')).toBeNull(); // Invalid day
      expect(parseReceiptDate('01/13/2024')).toBeNull(); // Invalid month
      expect(parseReceiptDate('')).toBeNull();
    });

    it('should return null for future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const dateStr = futureDate.toISOString().split('T')[0];
      expect(parseReceiptDate(dateStr)).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle dates with extra whitespace', () => {
      expect(parseReceiptDate('  01/15/2024  ')).toEqual(
        new Date('2024-01-15')
      );
      expect(parseReceiptDate('01 / 15 / 2024')).toEqual(
        new Date('2024-01-15')
      );
    });

    it('should handle leap years', () => {
      expect(parseReceiptDate('02/29/2024')).toEqual(new Date('2024-02-29'));
      expect(parseReceiptDate('02/29/2023')).toBeNull(); // Not a leap year
    });

    it('should handle year 2000 bug dates', () => {
      expect(parseReceiptDate('01/15/00')).toEqual(new Date('2000-01-15'));
      expect(parseReceiptDate('01/15/99')).toEqual(new Date('1999-01-15'));
    });
  });

  describe('OCR noise handling', () => {
    it('should extract date from noisy OCR text', () => {
      expect(parseReceiptDate('Date: 01/15/2024 Time: 14:30')).toEqual(
        new Date('2024-01-15')
      );
      expect(parseReceiptDate('|||01/15/2024|||')).toEqual(
        new Date('2024-01-15')
      );
      expect(parseReceiptDate('DATE 01-15-2024')).toEqual(
        new Date('2024-01-15')
      );
    });
  });
});
```

---

## Test Data Management

### Fixtures

```typescript
/**
 * Test fixtures for receipt data
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// test/fixtures/receipt.fixtures.ts
import type { Receipt, ReceiptItem } from '@pricey/types';

export function createMockReceipt(overrides?: Partial<Receipt>): Receipt {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-123',
    storeId: 'store-walmart-1',
    storeName: 'Walmart',
    purchaseDate: new Date('2024-01-15'),
    totalAmount: 45.99,
    status: 'COMPLETED',
    ocrProvider: 'tesseract',
    ocrConfidence: 0.95,
    rawOcrText: 'WALMART\nDate: 01/15/2024\nTotal: $45.99',
    imageUrl: 'https://s3.example.com/receipts/123.jpg',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-15T10:05:00Z'),
    ...overrides,
  };
}

export function createMockReceiptItem(
  overrides?: Partial<ReceiptItem>
): ReceiptItem {
  return {
    id: 'item-123',
    receiptId: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Milk',
    quantity: 1,
    unitPrice: 3.99,
    totalPrice: 3.99,
    category: 'Dairy',
    createdAt: new Date(),
    ...overrides,
  };
}

export const MOCK_OCR_TEXT = {
  WALMART: `WALMART SUPERCENTER
123 Main St
Anytown, USA 12345

Date: 01/15/2024
Time: 14:30

ITEMS:
Milk 2% Gallon        $3.99
Bread White          $2.49
Eggs Large Dozen     $4.99
Bananas (3 lbs)      $1.50

Subtotal:           $12.97
Tax:                $0.90
TOTAL:              $13.87

Thank you for shopping!`,

  TARGET: `TARGET
456 Oak Ave
Anytown, USA 12345

01/15/2024  15:45

Shampoo               $8.99
Conditioner           $9.99
Body Wash             $6.49

Subtotal:            $25.47
Tax (7%):            $1.78
Total:               $27.25

REG#: 012
TXN#: 987654321`,
};
```

### Test Helpers

```typescript
/**
 * Test helper utilities
 * Copyright (C) 2025 Matthias Wallner-Géhri
 * AGPL-3.0 License
 */

// test/helpers.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Clean all test data from database
 */
export async function cleanDatabase() {
  await prisma.receiptItem.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Create a test user
 */
export async function createTestUser(data?: { email?: string; name?: string }) {
  return prisma.user.create({
    data: {
      email: data?.email ?? `test-${Date.now()}@example.com`,
      name: data?.name ?? 'Test User',
    },
  });
}

/**
 * Create a test store
 */
export async function createTestStore(data?: { name?: string }) {
  return prisma.store.create({
    data: {
      name: data?.name ?? 'Test Store',
      chain: 'Test Chain',
    },
  });
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Mock console to suppress logs in tests
 */
export function mockConsole() {
  const originalConsole = { ...console };

  beforeEach(() => {
    console.log = vi.fn();
    console.error = vi.fn();
    console.warn = vi.fn();
  });

  afterEach(() => {
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [24.x]

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run type checking
        run: pnpm typecheck

      - name: Run linting
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: true

      - name: Check coverage thresholds
        run: |
          pnpm vitest run --coverage --reporter=json > coverage-summary.json
          node scripts/check-coverage.js

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: pricey_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:8
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run database migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/pricey_test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/pricey_test
          REDIS_URL: redis://localhost:6379

  coverage-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - name: Download coverage reports
        uses: actions/download-artifact@v3
        with:
          name: coverage-reports

      - name: Generate combined coverage report
        run: |
          npm install -g lcov-result-merger
          lcov-result-merger '**/*.info' combined-coverage.info

      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./combined-coverage.info
```

---

## Code Review Checklist

### For Reviewers

Before approving a PR, verify:

- [ ] ✅ All new functions have unit tests
- [ ] ✅ All edge cases are tested
- [ ] ✅ All error cases are tested
- [ ] ✅ Tests follow naming conventions
- [ ] ✅ Tests are co-located with source files
- [ ] ✅ Coverage meets minimum thresholds (75%+)
- [ ] ✅ Tests are fast (<1s for unit tests)
- [ ] ✅ Tests are isolated (no shared state)
- [ ] ✅ Tests use descriptive names
- [ ] ✅ Mocks are used appropriately
- [ ] ✅ Integration tests exist for API changes
- [ ] ✅ CI/CD passes all tests

### For Authors

Before submitting a PR:

- [ ] ✅ Run `pnpm test` locally
- [ ] ✅ Run `pnpm test:coverage` and verify thresholds
- [ ] ✅ Add tests for all new code
- [ ] ✅ Add tests for bug fixes
- [ ] ✅ Update existing tests if behavior changed
- [ ] ✅ Verify tests pass in isolation
- [ ] ✅ Verify tests are deterministic (no flaky tests)
- [ ] ✅ Add test documentation if complex logic

---

## Enforcement

### Pre-commit Hooks (Husky)

```json
// package.json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.0.0",
    "lint-staged": "^15.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "vitest related --run"]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

pnpm lint-staged
pnpm test --changed
```

### Coverage Gates

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
        // Per-file thresholds
        perFile: true,
        // Fail build if under threshold
        autoUpdate: false,
        watermarks: {
          lines: [80, 95],
          functions: [80, 95],
          branches: [75, 90],
          statements: [80, 95],
        },
      },
    },
  },
});
```

### PR Comments

GitHub Actions bot will comment on PRs:

```
📊 Coverage Report

| Package          | Coverage | Change  | Status |
|-----------------|----------|---------|--------|
| api-gateway     | 78%      | +2%     | ⚠️ Below target (80%) |
| ocr-service     | 85%      | +5%     | ✅ Pass |
| database        | 92%      | 0%      | ✅ Pass |

❌ Coverage decreased in api-gateway by 2%
✅ All coverage thresholds met
```

---

## Common Pitfalls to Avoid

### ❌ Don't Do This

```typescript
// ❌ Testing implementation details
test('should call fetchUser with correct params', () => {
  const spy = vi.spyOn(service, 'fetchUser');
  service.getUserProfile('123');
  expect(spy).toHaveBeenCalledWith('123');
});

// ❌ Brittle tests with exact string matching
test('should display error message', () => {
  render(<Component />);
  expect(screen.getByText('Error: User not found')).toBeInTheDocument();
});

// ❌ Not testing edge cases
test('should add two numbers', () => {
  expect(add(1, 2)).toBe(3);
});

// ❌ Shared test state
let user: User;

beforeAll(() => {
  user = createUser(); // Used across all tests
});

test('test 1', () => {
  user.name = 'Changed'; // Affects other tests
});
```

### ✅ Do This Instead

```typescript
// ✅ Testing behavior
test('should return user profile', async () => {
  const profile = await service.getUserProfile('123');
  expect(profile).toMatchObject({
    id: '123',
    name: expect.any(String),
  });
});

// ✅ Flexible matching
test('should display error message', () => {
  render(<Component />);
  expect(screen.getByRole('alert')).toContainText('not found');
});

// ✅ Test all cases
describe('add', () => {
  it('should add positive numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it('should add negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });

  it('should add zero', () => {
    expect(add(0, 5)).toBe(5);
  });

  it('should handle large numbers', () => {
    expect(add(Number.MAX_SAFE_INTEGER, 0)).toBe(Number.MAX_SAFE_INTEGER);
  });
});

// ✅ Isolated test state
describe('UserService', () => {
  let user: User;

  beforeEach(() => {
    user = createUser(); // Fresh for each test
  });

  test('test 1', () => {
    user.name = 'Changed'; // Only affects this test
  });
});
```

---

## Migration Plan

### Phase 1: Infrastructure (Week 1)

- [ ] Install Vitest in all packages
- [ ] Create vitest.config.ts templates
- [ ] Set up GitHub Actions workflow
- [ ] Configure coverage thresholds

### Phase 2: Critical Path Testing (Week 2-3)

- [ ] Test all OCR parsers (date, item, total, store)
- [ ] Test all Zod validation schemas
- [ ] Test all Fastify routes
- [ ] Test storage service

### Phase 3: Comprehensive Coverage (Week 4-5)

- [ ] Test all utility functions
- [ ] Test all database services
- [ ] Test error handling
- [ ] Test edge cases

### Phase 4: Integration & E2E (Week 6)

- [ ] Set up Playwright
- [ ] Create E2E tests for critical flows
- [ ] Set up Percy for visual testing

---

## Resources

### Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)

### Tools

- [Vitest UI](https://vitest.dev/guide/ui.html) - Visual test runner
- [Codecov](https://codecov.io/) - Coverage tracking
- [Percy](https://percy.io/) - Visual testing

### Internal

- [Testing Strategy Guide](/docs/guides/testing-strategy.md)
- [CI/CD Documentation](/docs/guides/deployment.md)
- [Code Review Guidelines](/docs/CONTRIBUTING.md)

---

## Questions & Support

- **Slack**: #pricey-testing
- **Email**: [email protected]
- **Office Hours**: Tuesdays 2-3pm EST

---

**Last Updated**: October 25, 2025  
**Next Review**: November 2025  
**Document Owner**: Engineering Team
