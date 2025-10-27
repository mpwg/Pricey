# Copilot Instructions for Pricey

> Smart receipt scanning and price comparison PWA - AGPL-3.0 Licensed

## Project Context

**Pricey** is a microservices-based PWA that scans receipts, extracts product data via OCR, and enables price tracking across stores. Currently in **Phase 0 (MVP)** targeting November 2025 launch with 50 early adopters.

### Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5.9, TailwindCSS (planned for Phase 1)
- **Backend**: Fastify 5, Node.js 24.10.0+, TypeScript
- **Database**: PostgreSQL 18 + Prisma 6
- **Cache**: Redis 8
- **Storage**: MinIO (local) / S3 (cloud)
- **Monorepo**: Turborepo + pnpm 10.19+
- **OCR**: Tesseract.js (MVP), Google Cloud Vision API (future)

## Architecture Overview

```
pnpm-workspace monorepo structure:
├── apps/
│   ├── api-gateway/     # Fastify REST API (port 3001)
│   └── web/             # Next.js PWA (planned Phase 1)
├── services/            # Microservices (planned)
│   ├── ocr/
│   ├── product/
│   └── analytics/
└── packages/
    ├── database/        # Prisma schema + migrations
    ├── types/           # Shared TypeScript types
    ├── config/          # Shared ESLint config
    └── ui/              # Shared UI components
```

**Service Communication**: API Gateway → Microservices (future) → PostgreSQL/Redis

**Data Flow**: Image Upload → OCR → Text Parsing → Product Normalization → Database → Price Analysis

## Development Commands

```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Run all dev servers
pnpm dev

# Run specific workspace
pnpm --filter @pricey/api-gateway dev

# Database operations
pnpm db:migrate          # Run migrations
pnpm db:seed             # Seed sample data
pnpm db:studio           # Open Prisma Studio (localhost:5555)

# Build & test
pnpm build               # Build all packages
pnpm lint                # Lint with ESLint flat config
pnpm format              # Format with Prettier
pnpm typecheck           # TypeScript type checking
```

**Port Allocation**:

- API Gateway: 3001
- PostgreSQL: 5432
- Redis: 6379
- MinIO: 9000 (API), 9001 (Console)

## Code Conventions

### Dependency Management

- **Latest Versions**: ⚠️ **MANDATORY** - Always use the latest stable versions of all dependencies (see `.github/instructions/dependency-management.instructions.md`)
  - Run `pnpm outdated -r` before every commit - MUST show no outdated packages
  - Use caret (`^`) ranges for all dependencies (e.g., `^5.2.1`)
  - Update immediately when new versions are available
  - Workspace dependencies use `workspace:*`
  - Check changelogs for breaking changes
  - Test thoroughly after updates

### TypeScript Patterns

```typescript
// Environment validation with Zod (see apps/api-gateway/src/config/env.ts)
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
});
export const env = envSchema.parse(process.env);

// Fastify app setup (see apps/api-gateway/src/app.ts)
// - helmet for security headers
// - cors with configurable origins
// - rate-limit plugin
// - pino logger with pino-pretty in dev
// - request ID tracking via x-request-id header

// Prisma usage (see packages/database/prisma/schema.prisma)
// - UUID primary keys
// - Decimal type for prices: @db.Decimal(10, 2)
// - Enum for status: ReceiptStatus (PENDING, PROCESSING, COMPLETED, FAILED)
// - Indexes on userId, status, purchaseDate, storeId
```

### File Organization

- **TypeScript Config**: Extends `tsconfig.base.json` (CommonJS, ES2022, strict mode)
- **ESLint**: Flat config format (`eslint.config.js`) with typescript-eslint + prettier
- **Naming**:
  - Packages: `@pricey/api-gateway`, `@pricey/database`
  - Directories: kebab-case (`receipt-processing/`)
  - Files: camelCase (`receiptProcessor.ts`), PascalCase for React (`ReceiptUpload.tsx`)
  - Unused variables: Prefix with `_` to avoid lint errors

### AGPL-3.0 License Headers

**ALL source files must include**:

```typescript
/**
 * [File description]
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
```

## Database Schema Patterns

```prisma
// Receipt processing flow (see packages/database/prisma/schema.prisma)
model Receipt {
  status         ReceiptStatus @default(PROCESSING)
  ocrProvider    String        @default("tesseract")
  ocrConfidence  Float?
  rawOcrText     String?       @db.Text
  processingTime Int?          // milliseconds
  items          ReceiptItem[]
  // Always use proper indexes for query optimization
  @@index([userId, status, purchaseDate])
}

// Product normalization (Phase 2+)
model Product {
  name         String   // Normalized product name
  category     String?  // Product category
  barcode      String?  @unique
  receiptItems ReceiptItem[]
  prices       ProductPrice[]
}
```

**Migration workflow**: Edit `schema.prisma` → `pnpm db:migrate --name description` → Generates migration in `packages/database/prisma/migrations/`

## Critical Workflows

### Documentation-First Development (MANDATORY)

**⚠️ CRITICAL RULE: Always fetch library documentation BEFORE implementing features**

Before writing any code that uses external libraries or frameworks:

1. **Identify** all libraries/frameworks involved in the feature
2. **Resolve** library IDs using `mcp_context7_resolve-library-id` or `mcp_upstash_conte_resolve-library-id`
3. **Fetch** current documentation using `mcp_context7_get-library-docs` or `mcp_upstash_conte_get-library-docs`
4. **Review** the documentation for:
   - Latest API patterns and best practices
   - Recommended configurations
   - Official examples and code snippets
   - Deprecated features to avoid
5. **Implement** the feature following official guidance

**Examples of when this applies:**

- Setting up Fastify routes, plugins, and middleware
- Configuring Tesseract.js for OCR processing
- Implementing BullMQ job queues and workers
- Using Sharp for image preprocessing
- Working with MinIO/S3 clients
- Configuring Prisma schema and queries
- Setting up Redis clients
- ANY third-party library integration

**Why this matters:**

- ✅ Ensures use of latest, non-deprecated APIs
- ✅ Avoids common pitfalls and anti-patterns
- ✅ Leverages official best practices
- ✅ Reduces bugs from incorrect usage
- ✅ Saves time by not guessing API signatures

### Receipt Processing Pipeline

1. **Upload** → Image stored in MinIO/S3
2. **OCR** → Tesseract.js extracts text
3. **Parse** → Extract store, date, items, prices
4. **Normalize** → Map items to generic products (Phase 2+)
5. **Save** → Store in PostgreSQL with status tracking

### Adding a New API Endpoint

1. Create route in `apps/api-gateway/src/routes/`
2. Register in `apps/api-gateway/src/routes/index.ts`
3. Add validation schema with Zod
4. Use Prisma client from `@pricey/database`
5. Return consistent error responses via error-handler plugin

### Adding Dependencies

```bash
# To workspace package
pnpm --filter @pricey/api-gateway add fastify-plugin

# To root (dev tools)
pnpm add -Dw vitest

# Workspace dependencies
# Use "workspace:*" in package.json for internal packages
```

## Testing & Quality

- **Tests**: ⚠️ **MANDATORY** - All new code MUST have comprehensive unit tests (see `.github/instructions/testing-mandate.instructions.md`)
  - Framework: Vitest (fast, ESM-native, Jest-compatible API)
  - Coverage: Minimum 75% overall, 80%+ for new code
  - Co-locate tests: `*.test.ts` or `*.spec.ts` next to source files
  - Test all: pure functions, validation schemas, API routes, parsers, error cases, edge cases
- **Type Safety**: Strict TypeScript mode enabled (`noUncheckedIndexedAccess: true`)
- **Linting**: ESLint with `@typescript-eslint` - warn on `any`, error on unused vars
- **Formatting**: Prettier for `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, `.md`, `.yaml`
- **Commits**: Conventional commits required (`feat:`, `fix:`, `docs:`, `refactor:`)

## Phase 0 Constraints

**Current Limitations** (intentional MVP scope):

- ❌ No authentication (all receipts public)
- ❌ No frontend yet (API-only)
- ❌ No manual OCR correction UI
- ❌ No pagination on receipt lists
- ❌ Single OCR provider (Tesseract.js only)
- ✅ Focus on API stability and OCR accuracy

**Exit Criteria**: 50 users, 70% OCR accuracy, <5% error rate

## Common Pitfalls

1. **Environment Variables**: Always validate with Zod in `config/env.ts` - don't access `process.env` directly
2. **Prisma Client**: Import from `@pricey/database`, not `@prisma/client` directly
3. **Port Conflicts**: API Gateway uses 3001 (not 3000) to avoid Next.js conflicts
4. **Turborepo Cache**: Run `pnpm clean` if builds seem stale
5. **Database Changes**: Always create migrations, never edit existing migration files
6. **Workspace Dependencies**: Use `workspace:*` protocol in package.json for internal packages

## Key Documentation

- **Architecture**: `/docs/architecture.md` - system design, security, scaling
- **Monorepo Guide**: `/docs/monorepo-structure.md` - workspace management
- **Getting Started**: `/docs/guides/getting-started.md` - setup instructions
- **Database Schema**: `/packages/database/prisma/schema.prisma` - data model
- **Roadmap**: `/docs/ROADMAP.md` - phases and milestones

## Useful References

- **Fastify App Setup**: `apps/api-gateway/src/app.ts` - plugin registration pattern
- **Environment Config**: `apps/api-gateway/src/config/env.ts` - Zod validation pattern
- **Prisma Schema**: `packages/database/prisma/schema.prisma` - data modeling patterns
- **ESLint Config**: `eslint.config.js` - flat config with TypeScript
- **Turborepo Config**: `turbo.json` - build pipeline and caching

---

**Authentication Strategy (Phase 1)**: NextAuth.js with Google OAuth 2.0, JWT tokens (15min access + 7day refresh), HTTP-only cookies

**API Versioning (Future)**: URL path versioning (`/api/v1/`, `/api/v2/`), 6-month deprecation policy, backward compatibility middleware
