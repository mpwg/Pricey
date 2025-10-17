# Pricey Development Guide for AI Coding Agents

## Project Overview

**Pricey** is a Progressive Web App (PWA) for price comparison built with Next.js 15 App Router, TypeScript, PostgreSQL (Prisma), Redis, and BullMQ. It tracks product prices across retailers, provides price alerts, and uses background workers for web scraping.

**License**: AGPL-3.0 - ALL new source files MUST include the license header (use `npm run add-license` to automate).

## Architecture & Key Patterns

### Tech Stack Decision

This is a **Next.js full-stack monolith** with background job processing:

- Frontend: Next.js 15 App Router + React 19 + Tailwind CSS
- Backend: Next.js API Routes (not a microservices architecture)
- Database: PostgreSQL 16 with Prisma ORM
- Cache: Redis 7 (for rate limiting and caching)
- Queue: BullMQ (for async scraping jobs)
- Scraping: Playwright + Cheerio

Refer to `ARCHITECTURE_RECOMMENDATIONS.md` for the architectural rationale - this project chose Option 1 (monolith) over microservices.

### Critical Developer Setup

**Environment**: Requires Docker for PostgreSQL + Redis. Database runs in containers, not locally installed.

```bash
# Start infrastructure (REQUIRED before running app)
npm run docker:dev          # Starts PostgreSQL + Redis containers

# Database setup (after docker:dev)
npm run prisma:generate     # Generate Prisma Client
npm run prisma:migrate      # Run migrations

# Development
npm run dev                 # Start Next.js dev server (port 3000)

# Production build (strict mode - zero warnings/errors allowed)
npm run build               # Runs lint:strict + type-check:strict + build
npm run build:unsafe        # Skip linting/type-checking (for debugging only)
```

**Docker services** (see `docker-compose.yml`):

- PostgreSQL: `localhost:5432` (user: `pricey`, db: `pricey_db`)
- Redis: `localhost:6379`

### Build System: Zero-Tolerance Policy

The project enforces **strict compilation** - all warnings are treated as errors:

- **ESLint**: `--max-warnings 0` flag (see `eslint.config.mjs`)
  - `no-console` allowed ONLY for `console.error` (logging errors)
  - `@typescript-eslint/no-explicit-any` is an error
  - All TypeScript warnings are errors
- **TypeScript**: Strict mode + extra checks (see `tsconfig.json`):
  - `noUnusedLocals`, `noUnusedParameters`: true
  - `noImplicitReturns`, `noFallthroughCasesInSwitch`: true
  - `noUncheckedIndexedAccess`: true (array access requires bounds checking)

**When editing code**: Ensure `npm run check:all` (lint:strict + type-check:strict) passes before committing.

### Database Schema & Patterns

**Prisma Schema** (`prisma/schema.prisma`):

- **Core models**: User, Product, Price, PriceAlert, SavedProduct, InvoiceItem
- **Cascade deletes**: Relations use `onDelete: Cascade` (e.g., deleting a Product removes all its Prices)
- **Invoice Items**: Track historical price data with `storeDescription`, `unit`, `date` fields

**Prisma Client** (`src/lib/prisma.ts`):

- Singleton pattern with global caching in development (prevents hot reload connection leaks)
- Enable query logging in development: `log: ["query", "error", "warn"]`

**Migration workflow**:

```bash
# Edit schema.prisma, then:
npm run prisma:migrate      # Creates migration + applies it
npm run prisma:studio       # Visual database browser (port 5555)
```

### API Route Conventions

**File structure**: `src/app/api/[endpoint]/route.ts` (Next.js App Router convention)

**Standard response pattern** (see `src/types/index.ts`):

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Example**: `src/app/api/products/[productId]/invoice-items/route.ts`

- Async params: `{ params }: { params: Promise<{ productId: string }> }` (await params!)
- Validation: Check required fields, return 400 for bad input
- Error handling: Always wrap in try/catch, return 500 with error message
- Product existence: Verify FK relations exist before creating child records

**Middleware utilities** (`src/lib/`):

- **Rate limiting** (`rate-limit.ts`): Redis-based token bucket, default 60 req/min
  - Usage: `await rateLimitMiddleware(req)` returns NextResponse or null
  - Fails open if Redis is down (allow request)
- **CORS** (`cors.ts`): Configurable origins from `ALLOWED_ORIGINS` env var
  - Use `corsHeaders(origin)` for manual header injection
  - Use `withCors(response, origin)` to wrap responses
- **Validation** (`validation.ts`): Zod schemas for input sanitization
  - `sanitizeHtml()`, `sanitizeUrl()`: XSS prevention
  - Pre-defined schemas: `emailSchema`, `searchQuerySchema`, `priceSchema`, `paginationSchema`

### Background Jobs & Queue System

**BullMQ setup** (`src/lib/queue.ts`):

- Queue: `scrapeQueue` with Redis connection
- Job type: `ScrapeJobData` (productId, url, retailer)
- Retry policy: 3 attempts with exponential backoff
- Retention: Keep completed jobs 24h, failed jobs 7 days

**Adding jobs**:

```typescript
await addScrapeJob({ productId: "abc", url: "...", retailer: "Amazon" });
```

**Worker pattern** (TODO: implement in separate file):

- Use `createScrapeWorker()` as template
- Scraping logic should use Playwright for dynamic content, Cheerio for static HTML

### Redis & Caching

**Redis client** (`src/lib/redis.ts`):

- ioredis instance with singleton pattern
- Used for: rate limiting, caching, BullMQ connection
- Connection string: `REDIS_URL` env var (default: `redis://localhost:6379`)

**Cache helper** (`src/lib/cache.ts`):

- Provides `getCache<T>()`, `setCache()`, `deleteCache()` wrappers
- TTL defaults: customize per use case

### Component Patterns

**UI Components** (`src/components/ui/`):

- Shared primitives: Button, Input, Card
- Tailwind + clsx for conditional styling (see `src/lib/utils.ts` `cn()` helper)
- Use `tailwind-merge` to dedupe conflicting classes

**Performance optimizations** (`src/components/`):

- `OptimizedImage.tsx`: Custom image component with lazy loading
- `VirtualScroll.tsx`: Infinite scroll for large lists
- `InvoiceItems.tsx`: React Query integration example

**State Management**:

- React Query (@tanstack/react-query) for server state
- No global state library - prefer server components and URL state

### License Headers (CRITICAL)

**Every new TypeScript/JavaScript/CSS file** must include the AGPL-3.0 header:

```typescript
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
```

**Automated tool**: Run `npm run add-license` after creating new files (see `docs/LICENSE_HEADERS.md` for details).

### Import Path Aliases

Configured in `tsconfig.json`:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/lib/*` → `./src/lib/*`
- `@/types/*` → `./src/types/*`
- `@/app/*` → `./src/app/*`

**Always use aliases** instead of relative paths for imports within `src/`.

### Environment Variables

**Required variables** (see `.env.example`):

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXT_PUBLIC_APP_URL`: Frontend URL for PWA manifest

**Validation**: Run `npm run check-env` to verify all required vars are set (uses `scripts/check-env.js`).

### PWA Configuration

**Manifest**: `public/manifest.json` defines app metadata for installation
**Service Worker**: `public/sw.js` (generated by next-pwa)
**Workbox**: `public/workbox-*.js` (precaching runtime)

Refer to `docs/PUSH_NOTIFICATIONS.md` for push notification implementation (future feature).

### Testing & CI/CD

**GitHub Actions** workflows (`.github/workflows/`):

- `ci.yml`: Main pipeline (lint, type-check, build, test)
  - Next.js build caching enabled via `actions/cache@v4` for `.next/cache`
  - Cache key based on `package-lock.json` + source file hashes
  - Restore keys allow partial cache hits when only source changes
- `docker.yml`: Build and push Docker images to GHCR
  - Docker layer caching with `cache-from: type=gha`
- `deploy.yml`: Deployment automation
- `codeql.yml`: Security scanning
- `dependency-review.yml`: Dependency vulnerability checks

**Local validation**: `npm run check:all` (must pass before pushing)

### Documentation Files

- `QUICKSTART.md`: One-page reference for common commands
- `GETTING_STARTED.md`: Detailed setup walkthrough
- `docs/AUTHENTICATION.md`: NextAuth.js integration guide (not implemented yet)
- `docs/INVOICE_ITEMS.md`: Invoice item feature documentation
- `docs/SECURITY_AND_PERFORMANCE.md`: Best practices

### Common Workflows

**Adding a new API endpoint**:

1. Create `src/app/api/[route]/route.ts`
2. Add license header
3. Define Zod schema in `src/lib/validation.ts`
4. Use `ApiResponse<T>` return type
5. Add rate limiting + CORS if needed
6. Update types in `src/types/index.ts`

**Adding a new database model**:

1. Edit `prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration)
3. Update TypeScript types in `src/types/index.ts`
4. Add API routes for CRUD operations

**Creating a new component**:

1. Add to `src/components/` or `src/components/ui/`
2. Include license header
3. Use `cn()` utility for className merging
4. Export as named export (not default)

### Anti-Patterns to Avoid

- **Don't** use `console.log` (use `console.error` for logging, remove debug logs)
- **Don't** use `any` type (strict TypeScript enforced)
- **Don't** use array indexing without bounds checks (`noUncheckedIndexedAccess` is enabled)
- **Don't** create relative import paths from deep directories (use `@/` aliases)
- **Don't** commit without running `npm run check:all`
- **Don't** forget license headers on new files
