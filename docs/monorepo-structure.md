# Pricey Monorepo Structure

> **Complete Guide to the Pricey Monorepo Architecture**  
> Last Updated: October 2025

## Overview

Pricey uses a **monorepo structure** to manage all services, packages, and documentation in a single repository. This architecture provides significant advantages for a microservices-based application:

### Key Benefits

- **Shared code and type definitions** - Single source of truth for TypeScript types
- **Consistent tooling and CI/CD** - Unified build, test, and deployment processes
- **Simplified dependency management** - Coordinated updates across all packages
- **Atomic cross-service changes** - Make breaking changes safely across multiple services
- **Improved developer experience** - Single clone, single install, single command to run everything
- **Code reuse** - DRY principle across frontend, backend, and services
- **Streamlined refactoring** - IDE-powered refactoring across package boundaries

## Repository Structure

```
pricey/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── deploy-staging.yml
│   │   └── deploy-production.yml
│   └── ISSUE_TEMPLATE/
├── apps/
│   ├── web/                          # Next.js PWA Frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tsconfig.json
│   ├── api/                          # Main API Gateway
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── docs/                         # Documentation site (optional)
│       └── package.json
├── services/
│   ├── ocr/                          # OCR Processing Service
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── product/                      # Product Normalization Service
│   │   ├── src/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── analytics/                    # Analytics & Recommendations Service
│       ├── src/
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── types/                        # Shared TypeScript types
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── database/                     # Prisma schema & migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── validation/                   # Shared Zod schemas
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui/                          # Shared UI components (optional)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.dev.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/
│   └── terraform/
│       ├── modules/
│       └── environments/
├── docs/
│   ├── architecture.md
│   ├── monorepo-structure.md
│   ├── components/
│   └── guides/
├── scripts/
│   ├── setup.sh
│   ├── seed-db.sh
│   └── deploy.sh
├── .gitignore
├── .npmrc
├── package.json                      # Root package.json (workspace config)
├── turbo.json                        # Turborepo configuration
├── tsconfig.json                     # Base TypeScript config
└── README.md
```

## Workspace Configuration

### Root package.json

```json
{
  "name": "pricey-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "services/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:migrate": "pnpm --filter @pricey/database migrate",
    "db:seed": "pnpm --filter @pricey/database seed",
    "docker:dev": "docker-compose -f infrastructure/docker/docker-compose.dev.yml up",
    "docker:prod": "docker-compose -f infrastructure/docker/docker-compose.prod.yml up"
  },
  "devDependencies": {
    "@turbo/gen": "^1.11.0",
    "turbo": "^1.11.0",
    "prettier": "^3.1.0",
    "typescript": "^5.9.3"
  },
  "packageManager": "pnpm@8.10.0"
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false,
      "dependsOn": ["db:migrate"]
    }
  }
}
```

## Package Manager: pnpm

We use **pnpm** for its efficiency and workspace support.

### .npmrc

```ini
# Use pnpm workspaces
link-workspace-packages=true
shared-workspace-lockfile=true

# Strict peer dependencies
strict-peer-dependencies=false

# Hoist common dependencies
shamefully-hoist=false
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
```

## Naming Conventions

### Package Names

- **Apps**: `@pricey/web`, `@pricey/api`
- **Services**: `@pricey/service-ocr`, `@pricey/service-product`, `@pricey/service-analytics`
- **Packages**: `@pricey/types`, `@pricey/database`, `@pricey/utils`, `@pricey/validation`

### Directory Structure

- Use kebab-case for directories: `receipt-processing/`
- Use camelCase for TypeScript files: `receiptProcessor.ts`
- Use PascalCase for React components: `ReceiptUpload.tsx`

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourorg/pricey.git
cd pricey

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env

# Start local infrastructure
pnpm docker:dev

# Run database migrations
pnpm db:migrate

# Seed database (optional)
pnpm db:seed

# Start all services in development mode
pnpm dev
```

### Working on a Specific Service

```bash
# Run only the web app
pnpm --filter @pricey/web dev

# Run API gateway with dependencies
pnpm --filter @pricey/api... dev

# Build specific service
pnpm --filter @pricey/service-ocr build

# Test specific package
pnpm --filter @pricey/types test
```

### Adding Dependencies

```bash
# Add to specific workspace
pnpm --filter @pricey/web add react-hook-form

# Add to root (dev dependencies)
pnpm add -Dw eslint

# Add shared dependency to multiple workspaces
pnpm --filter @pricey/types --filter @pricey/validation add zod
```

## Shared Packages

### @pricey/types

Shared TypeScript type definitions used across all services.

```typescript
export interface Receipt {
  id: string;
  userId: string;
  storeId: string;
  imageUrl: string;
  totalAmount: number;
  date: Date;
  items: ReceiptItem[];
}

export interface ReceiptItem {
  id: string;
  productId: string;
  quantity: number;
  unit: string;
  price: number;
  unitPrice: number;
}
```

### @pricey/database

Prisma schema and database utilities.

```typescript
export { prisma } from './client';
export * from '@prisma/client';
export * from './migrations';
```

### @pricey/validation

Zod schemas for request/response validation.

```typescript
import { z } from 'zod';

export const receiptUploadSchema = z.object({
  image: z.string().url(),
  storeId: z.string().uuid().optional(),
  date: z.string().datetime().optional(),
});
```

### @pricey/utils

Common utility functions.

```typescript
export { logger } from './logger';
export { cache } from './cache';
export { storage } from './storage';
export * from './formatters';
export * from './validators';
```

## Build & Deployment

### Build Order

Turborepo automatically handles build order based on dependencies:

1. `@pricey/types` (no dependencies)
2. `@pricey/database` (depends on types)
3. `@pricey/validation` (depends on types)
4. `@pricey/utils` (depends on types)
5. Services (depend on packages)
6. Apps (depend on services & packages)

### Docker Builds

Each service has its own Dockerfile with multi-stage builds:

```dockerfile
# Example: services/ocr/Dockerfile
FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY services/ocr/package.json ./services/ocr/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @pricey/service-ocr build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/ocr/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3002
CMD ["node", "dist/index.js"]
```

## Version Management

### Changesets

We use Changesets for version management and changelog generation.

```bash
# Create a changeset
pnpm changeset

# Version packages
pnpm changeset version

# Publish (CI only)
pnpm changeset publish
```

## Testing Strategy

### Unit Tests

Each package/service has its own test suite:

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @pricey/types test

# Run tests in watch mode
pnpm --filter @pricey/web test:watch
```

### Integration Tests

Located in `tests/integration/` at the root level.

### E2E Tests

Located in `apps/web/e2e/` using Playwright.

## Environment Variables

### .env.example

```bash
# Database
DATABASE_URL="postgresql://pricey:pricey@localhost:5432/pricey"
DATABASE_URL_UNPOOLED="postgresql://pricey:pricey@localhost:5432/pricey"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage
S3_BUCKET="pricey-receipts"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""

# OCR
OCR_PROVIDER="tesseract" # or "google" or "aws"
GOOGLE_CLOUD_PROJECT_ID=""
GOOGLE_APPLICATION_CREDENTIALS=""

# Authentication
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# Services
API_URL="http://localhost:3000"
OCR_SERVICE_URL="http://localhost:3001"
PRODUCT_SERVICE_URL="http://localhost:3002"
ANALYTICS_SERVICE_URL="http://localhost:3003"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 24.10.0
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build
```

## Documentation

All documentation is stored in `/docs`:

- **architecture.md**: System architecture overview
- **monorepo-structure.md**: This document
- **components/**: Detailed component documentation
- **guides/**: Development guides and tutorials
- **api/**: API documentation

## Best Practices

### Development Workflow

1. **Always run from root**: Use `pnpm --filter` to run commands in specific workspaces
2. **Shared code**: Extract common logic into packages (utils, types, validation)
3. **Type safety**: Export types from `@pricey/types` - enforce strict TypeScript
4. **Environment variables**: Never commit `.env` files - use `.env.example` templates
5. **Testing**: Write tests alongside your code - aim for 80%+ coverage
6. **Documentation**: Update docs when changing architecture or APIs
7. **Commits**: Use conventional commits for changelog generation (`feat:`, `fix:`, `docs:`, etc.)

### Code Organization

- **Keep packages focused**: Each package should have a single responsibility
- **Avoid circular dependencies**: Use dependency graph visualization tools
- **Version coordination**: Update all dependent packages when making breaking changes
- **Consistent naming**: Follow the established naming conventions
- **API consistency**: Use similar patterns across all services

### Performance

- **Build caching**: Leverage Turborepo's caching effectively
- **Parallel execution**: Run independent tasks in parallel
- **Smart filtering**: Use `--filter` with `...` to include dependencies
- **Incremental builds**: Only rebuild what changed

### Security

- **Dependency audits**: Run `pnpm audit` regularly
- **Secret management**: Use environment variables, never hardcode secrets
- **Access control**: Implement proper authentication/authorization
- **Input validation**: Validate all inputs at API boundaries

### Deployment

- **Stage before production**: Always test in staging environment
- **Database migrations**: Run migrations before deploying new code
- **Rollback strategy**: Keep previous versions deployable
- **Health checks**: Implement proper health check endpoints
- **Monitoring**: Set up logging, metrics, and alerting

## Troubleshooting

### Cache Issues

```bash
# Clear Turbo cache
pnpm clean
rm -rf .turbo

# Clear node_modules
pnpm clean
pnpm install
```

### Build Issues

```bash
# Rebuild from scratch
pnpm clean
pnpm install
pnpm build
```

### Database Issues

```bash
# Reset database
pnpm db:reset
pnpm db:migrate
pnpm db:seed
```
