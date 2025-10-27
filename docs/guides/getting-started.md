# Getting Started with Pricey

> **Complete guide to setting up the Pricey development environment**

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
git clone https://github.com/yourorg/pricey.git
cd pricey
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

Copy the example environment file to create your local configuration:

```bash
cp .env.example .env.local
```

All services in the monorepo will load environment variables from the root `.env.local` file. This ensures consistency across all services and eliminates duplication.

Edit `.env.local` and configure as needed. The example file has sensible defaults for local development:

```bash
# Database (default values work with docker-compose.yml)
DATABASE_URL="postgresql://pricey:pricey_dev_password@localhost:5432/pricey"

# Redis (optional for MVP, but recommended)
REDIS_URL="redis://localhost:6379"

# Storage (MinIO for local development)
S3_ENDPOINT="localhost"
S3_PORT="9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_USE_SSL="false"
S3_BUCKET="pricey-receipts"

# LLM Configuration
# Option 1: Use GitHub Models (cloud-based, fastest setup)
# LLM_PROVIDER="github"
# GITHUB_TOKEN="ghp_your_token_here"
# GITHUB_MODEL="gpt-5-mini"

# Option 2: Use Docker Ollama (local, slower, optional)
# Enable with: pnpm docker:dev:ollama
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:11434"
LLM_MODEL="llava"

# Option 3: Use Mac's local Ollama with GPU acceleration (10-20x faster!)
# brew install ollama && ollama serve --host 0.0.0.0:10000
# LLM_BASE_URL="http://localhost:10000"
```

**Note:** The defaults in `.env.example` work out-of-the-box with the included `docker-compose.yml`.
JWT_REFRESH_SECRET="your-refresh-secret-key-here"

# API URLs

API_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3000"

````

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

**Optional: Enable Docker Ollama**

If you want to use Docker Ollama (not recommended for Mac users due to slow CPU-only processing):

```bash
pnpm docker:dev:ollama
```

> ⚡ **Mac Users**: Instead of Docker Ollama, use the local Ollama installation for 10-20x faster processing with GPU acceleration. See [Mac Ollama Acceleration Guide](mac-ollama-acceleration.md).

Verify services are running:

```bash
docker-compose ps
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

- Demo admin user (admin@pricey.app / admin123)
- Demo regular user (demo@pricey.app / demo123)
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
pnpm --filter @pricey/database db:studio
```

This opens Prisma Studio at http://localhost:5555

### Verify MinIO Storage

Navigate to MinIO Console:

- URL: http://localhost:9001
- Username: minioadmin
- Password: minioadmin

**Note**: In development mode, the API Gateway automatically sets the `pricey-receipts` bucket to allow public read access (anonymous downloads). This enables the web app to display receipt images directly. In production, you should use signed URLs or a proper CDN instead.

## Development Workflow

### Running Specific Services

Run only the frontend:

```bash
pnpm --filter @pricey/web dev
```

Run API with all its dependencies:

```bash
pnpm --filter @pricey/api... dev
```

### Building Projects

Build all projects:

```bash
pnpm build
```

Build specific workspace:

```bash
pnpm --filter @pricey/web build
```

### Running Tests

Run all tests:

```bash
pnpm test
```

Run tests for specific package:

```bash
pnpm --filter @pricey/types test
```

Run tests in watch mode:

```bash
pnpm --filter @pricey/web test:watch
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
pnpm --filter @pricey/web add react-hook-form
```

Add dev dependency to root:

```bash
pnpm add -Dw prettier
```

### Creating a New Migration

Make changes to `packages/database/prisma/schema.prisma`, then:

```bash
pnpm --filter @pricey/database migrate dev --name your_migration_name
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

Now that you have Pricey running locally, you can:

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
````
