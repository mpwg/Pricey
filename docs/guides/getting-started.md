# Getting Started with Pricy

> **Complete guide to setting up the Pricy development environment**

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js** 20.x LTS or higher

  ```bash
  node --version  # Should be v24.10.0 or higher
  ```

- **pnpm** 8.10.0 or higher

  ```bash
  npm install -g pnpm@8.10.0
  pnpm --version
  ```

- **Docker** & **Docker Compose** (for local services)

  ```bash
  docker --version
  docker-compose --version
  ```

- **Git**
  ```bash
  git --version
  ```

### Optional Tools

- **PostgreSQL Client** (for database inspection)

  ```bash
  brew install postgresql  # macOS
  ```

- **Redis CLI** (for cache inspection)
  ```bash
  brew install redis  # macOS
  ```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourorg/pricy.git
cd pricy
```

### 2. Install Dependencies

Install all workspace dependencies at once:

```bash
pnpm install
```

This will:

- Install dependencies for all packages, apps, and services
- Create symlinks between workspace packages
- Generate Prisma client
- Set up git hooks (if configured)

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://pricy:pricy@localhost:5432/pricy"

# Redis
REDIS_URL="redis://localhost:6379"

# Storage (MinIO for local development)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY_ID="minioadmin"
S3_SECRET_ACCESS_KEY="minioadmin"
S3_BUCKET="pricy-receipts"

# OCR Provider (use tesseract for local dev)
OCR_PROVIDER="tesseract"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# API URLs
API_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Start Infrastructure Services

Start PostgreSQL, Redis, and MinIO using Docker Compose:

```bash
pnpm docker:dev
```

This will start:

- PostgreSQL on port 5432
- Redis on port 6379
- MinIO on port 9000
- MinIO Console on port 9001

Verify services are running:

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml ps
```

### 5. Run Database Migrations

Initialize the database schema:

```bash
pnpm db:migrate
```

### 6. Seed the Database (Optional)

Populate the database with sample data:

```bash
pnpm db:seed
```

This creates:

- Demo admin user (admin@pricy.app / admin123)
- Demo regular user (demo@pricy.app / demo123)
- Sample stores and chains
- Sample product categories
- Sample products

### 7. Start Development Servers

Start all services in development mode:

```bash
pnpm dev
```

This starts:

- **Web App (Next.js)** - http://localhost:3001
- **API Gateway** - http://localhost:3000
- **OCR Service** - http://localhost:3002
- **Product Service** - http://localhost:3003
- **Analytics Service** - http://localhost:3004

## Verify Installation

### Check Web App

Open your browser and navigate to:

- **Frontend**: http://localhost:3001
- **API Docs**: http://localhost:3000/docs

### Test API Endpoint

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2024-10-24T12:00:00.000Z",
  "uptime": 123.456
}
```

### Check Database Connection

```bash
pnpm --filter @pricy/database db:studio
```

This opens Prisma Studio at http://localhost:5555

### Verify MinIO Storage

Navigate to MinIO Console:

- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

## Development Workflow

### Running Specific Services

Run only the frontend:

```bash
pnpm --filter @pricy/web dev
```

Run API with all its dependencies:

```bash
pnpm --filter @pricy/api... dev
```

### Building Projects

Build all projects:

```bash
pnpm build
```

Build specific workspace:

```bash
pnpm --filter @pricy/web build
```

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests for specific package:

```bash
pnpm --filter @pricy/types test
```

Run tests in watch mode:

```bash
pnpm --filter @pricy/web test:watch
```

### Linting and Formatting

Lint all code:

```bash
pnpm lint
```

Format all code:

```bash
pnpm format
```

## Common Tasks

### Adding a New Dependency

Add to specific workspace:

```bash
pnpm --filter @pricy/web add react-hook-form
```

Add dev dependency to root:

```bash
pnpm add -Dw prettier
```

### Creating a New Migration

Make changes to `packages/database/prisma/schema.prisma`, then:

```bash
pnpm --filter @pricy/database migrate dev --name your_migration_name
```

### Resetting Database

⚠️ **Warning**: This will delete all data!

```bash
pnpm db:reset
```

### Viewing Logs

View logs for all services:

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f
```

View logs for specific service:

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml logs -f postgres
```

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)
```

### Cache Issues

Clear all caches and rebuild:

```bash
pnpm clean
rm -rf node_modules .turbo
pnpm install
pnpm build
```

### Database Connection Issues

1. Check if PostgreSQL is running:

   ```bash
   docker-compose -f infrastructure/docker/docker-compose.dev.yml ps
   ```

2. Check PostgreSQL logs:

   ```bash
   docker-compose -f infrastructure/docker/docker-compose.dev.yml logs postgres
   ```

3. Verify connection string in `.env`

4. Reset database:
   ```bash
   pnpm db:reset
   ```

### pnpm Install Fails

1. Clear pnpm store:

   ```bash
   pnpm store prune
   ```

2. Remove lock file and try again:
   ```bash
   rm pnpm-lock.yaml
   pnpm install
   ```

### Docker Issues

Reset Docker environment:

```bash
docker-compose -f infrastructure/docker/docker-compose.dev.yml down -v
docker-compose -f infrastructure/docker/docker-compose.dev.yml up -d
```

## Next Steps

Now that you have Pricy running locally, you can:

1. **Explore the API** - Visit http://localhost:3000/docs for interactive API documentation
2. **Upload a receipt** - Use the web app to test receipt scanning
3. **Review the architecture** - Read `/docs/architecture.md`
4. **Understand the components** - Explore `/docs/components/`
5. **Make your first change** - Follow the contribution guidelines

## Additional Resources

- [Architecture Overview](/docs/architecture.md)
- [API Gateway Documentation](/docs/components/api-gateway.md)
- [Frontend PWA Guide](/docs/components/frontend-pwa.md)
- [Database Schema](/docs/components/database-schema.md)
- [Contributing Guidelines](/CONTRIBUTING.md)

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Join our Discord community
4. Create a new GitHub issue with:
   - Your environment details (`node --version`, `pnpm --version`, `docker --version`)
   - Steps to reproduce the problem
   - Error messages and logs
   - What you've already tried

Happy coding! 🚀
