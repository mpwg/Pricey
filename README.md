# Pricey

**Smart receipt scanning and price comparison to help you save money on every purchase.**

<!-- Badges -->
<div align="center">

<!-- Project Status & License -->

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-663399.svg?logo=gnu&logoColor=white)](https://github.com/mpwg/Pricey/blob/main/LICENSE.md)
[![CI Status](https://github.com/mpwg/Pricey/workflows/CI/badge.svg)](https://github.com/mpwg/Pricey/actions/workflows/ci.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C.svg?logo=dependabot&logoColor=white)](https://github.com/mpwg/Pricey/network/updates)

<!-- Development Tools -->

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D10%2B-F69220.svg?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Monorepo: Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444.svg?logo=turborepo&logoColor=white)](https://turbo.build/)

<!-- Backend Stack -->

[![Fastify](https://img.shields.io/badge/Fastify-5%2B-202020.svg?logo=fastify&logoColor=white)](https://fastify.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6%2B-2D3748.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Ollama](https://img.shields.io/badge/Ollama-LLM-000000.svg)](https://ollama.ai/)

<!-- Infrastructure -->

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18%2B-336791.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-8%2B-DC382D.svg?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-compose-2496ED.svg?logo=docker&logoColor=white)](https://www.docker.com/)

<!-- Code Quality & Contribution -->

[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-F7B93E.svg?logo=prettier&logoColor=white)](https://prettier.io/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1%2B-FE5196.svg?logo=conventionalcommits&logoColor=white)](https://conventionalcommits.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00C851.svg?logo=github&logoColor=white)](https://github.com/mpwg/Pricey/blob/main/CONTRIBUTING.md)

</div>

---

Pricey is a Progressive Web Application (PWA) that digitizes your shopping receipts using OCR, tracks prices across stores, and helps you find the best deals. Currently in **Phase 0 (MVP)** with working receipt upload and OCR processing.

---

## Current Status (M0.2 - January 2025)

**✅ Implemented Features:**

- 📸 Receipt image upload via REST API
- 🔍 **Vision-based LLM parsing** - Directly analyzes receipt images
- 🤖 **Multi-provider LLM support** - Ollama (local) or GitHub Models (cloud)
- 🎯 **State-of-the-art models** - GPT-5 mini, Claude Sonnet 4.5, LLaVA
- 📊 Automatic extraction of store, date, items, and prices with 85-99% accuracy
- 💾 PostgreSQL storage with Prisma ORM
- 🔄 Asynchronous processing with BullMQ
- 🖼️ Image storage with MinIO (S3-compatible)
- 📈 Queue monitoring with Bull Board dashboard
- ✅ 376+ passing tests (100% success rate)

**⏳ Planned for Phase 1 (Q1 2025):**

- Frontend PWA with Next.js 16
- User authentication (OAuth 2.0)
- Manual OCR correction UI
- Price tracking across stores

---

## Architecture

Pricey uses a microservices architecture with asynchronous job processing:

```mermaid
graph TB
    subgraph "Client Layer"
        Client[API Client / cURL<br/>Frontend Coming in Phase 1]
    end

    subgraph "API Gateway :3001"
        API[Fastify REST API]
        Upload[POST /api/v1/receipts]
        Get[GET /api/v1/receipts/:id]
        List[GET /api/v1/receipts]
        Dashboard[Bull Board<br/>/admin/queues]
    end

    subgraph "Background Processing"
        Queue[BullMQ Queue<br/>receipt-processing]
        Worker[OCR Worker<br/>5 concurrent jobs]
        Parser[Vision LLM Parser<br/>Multi-Provider]
        Sharp[Sharp<br/>Image Preprocessing]
    end

    subgraph "LLM Providers"
        Ollama[Ollama Local<br/>LLaVA, Llama Vision]
        GitHub[GitHub Models<br/>GPT-5, Claude 4.5]
    end

    subgraph "Storage Layer"
        DB[(PostgreSQL<br/>Receipts + Items)]
        Cache[(Redis<br/>Job Queue)]
        S3[MinIO/S3<br/>Receipt Images]
    end

    Client -->|HTTP/REST| API
    API --> Upload
    API --> Get
    API --> List
    API --> Dashboard

    Upload -->|Store Image| S3
    Upload -->|Create Record| DB
    Upload -->|Enqueue Job| Queue

    Queue -->|Dequeue| Worker
    Worker -->|Download| S3
    Worker -->|Preprocess| Sharp
    Sharp -->|Optimized Image| Parser
    Parser -->|Vision Analysis| Ollama
    Parser -->|Vision Analysis| GitHub
    Parser -->|Structured JSON| Worker
    Worker -->|Update| DB

    Get -->|Query| DB
    List -->|Query| DB
    Dashboard -->|Monitor| Queue

    Queue -.->|Backed by| Cache

    style Client fill:#f9f,stroke:#333,stroke-width:2px
    style API fill:#bbf,stroke:#333,stroke-width:2px
    style Worker fill:#bfb,stroke:#333,stroke-width:2px
    style DB fill:#fbb,stroke:#333,stroke-width:2px
```

**Technology Stack (Currently Implemented):**

| Layer        | Technology    | Version | Purpose                      |
| ------------ | ------------- | ------- | ---------------------------- |
| **API**      | Fastify       | 5+      | REST endpoints               |
| **LLM**      | Ollama/GitHub | Latest  | Vision-based receipt parsing |
| **Models**   | GPT-5 mini    | Latest  | Cloud vision model (GitHub)  |
|              | Claude 4.5    | Latest  | Cloud vision model (GitHub)  |
|              | LLaVA         | Latest  | Local vision model (Ollama)  |
| **Database** | PostgreSQL    | 18+     | Data persistence             |
| **ORM**      | Prisma        | 6+      | Database access              |
| **Queue**    | BullMQ        | 5+      | Job processing               |
| **Cache**    | Redis         | 8+      | Queue backing                |
| **Storage**  | MinIO         | 8+      | S3-compatible storage        |
| **Images**   | Sharp         | 0+      | Preprocessing                |
| **Parsing**  | chrono-node   | 2+      | Date extraction              |

---

## Quick Start

### Prerequisites

- **Node.js** 24+ or higher
- **pnpm** 10+ or higher
- **Docker** and **Docker Compose**

### Installation

```bash
# Clone the repository
git clone https://github.com/mpwg/Pricey.git
cd Pricey

# Install dependencies (uses workspace protocol)
pnpm install

# Copy environment variables
cp .env.example .env.local

# (Optional) Configure LLM provider in .env.local
# For GitHub Models (recommended - fastest setup, no local installation):
# LLM_PROVIDER="github"
# GITHUB_TOKEN="ghp_YOUR_TOKEN"  # Get from https://github.com/settings/tokens
# GITHUB_MODEL="gpt-5-mini"      # or claude-sonnet-4.5, gemini-2.5-pro

# For Ollama (local - privacy-first):
# LLM_PROVIDER="ollama"
# LLM_BASE_URL=http://localhost:11434  # Docker Ollama (or localhost:10000 for Mac with GPU)
# LLM_MODEL=llava                      # or llama3.2-vision, moondream

# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# (Optional) Start Docker Ollama if you don't have it installed locally
# Note: This is slower and uses more memory. For Mac users, see the Mac Ollama Acceleration Guide.
# pnpm docker:dev:ollama

# Run database migrations
pnpm db:migrate

# Seed database with stores
pnpm db:seed

# Start all services
pnpm dev
```

**Services will be available at:**

- **API Gateway**: <http://localhost:3001>
- **Bull Board Dashboard**: <http://localhost:3001/admin/queues>
- **MinIO Console**: <http://localhost:9001> (user: minioadmin, pass: minioadmin)
- **Ollama LLM**: <http://localhost:11434> (only if enabled with `docker:dev:ollama`)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

> 📖 **New to LLM-based parsing?** Check out the [LLM Quick Start Guide](docs/guides/LLM-QUICKSTART.md) for setup instructions and model selection tips.

> ⚡ **Mac Users**: For **10-20x faster** receipt processing with GPU acceleration, see [Mac Ollama Acceleration Guide](docs/guides/mac-ollama-acceleration.md) - **highly recommended over Docker Ollama**

---

## How It Works

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Gateway
    participant S3 as MinIO
    participant DB as PostgreSQL
    participant Q as BullMQ Queue
    participant W as OCR Worker
    participant OCR as Ollama LLM

    C->>API: POST /api/v1/receipts<br/>(upload image)
    API->>API: Validate (type, size, dimensions)
    API->>S3: Upload image
    S3-->>API: imageUrl
    API->>DB: Create receipt (status: PENDING)
    DB-->>API: receipt.id
    API->>Q: Enqueue OCR job
    API-->>C: 201 Created {id, status, imageUrl}

    Note over Q,W: Asynchronous Processing

    Q->>W: Dequeue job
    W->>DB: Update status: PROCESSING
    W->>S3: Download image
    S3-->>W: Image buffer
    W->>W: Preprocess (Sharp)<br/>optimize for LLM vision
    W->>OCR: Extract structured data
    OCR-->>W: JSON {store, date, items, total}
    W->>W: Validate and parse JSON
    W->>DB: Update receipt + create items
    W->>DB: Update status: COMPLETED

    C->>API: GET /api/v1/receipts/:id
    API->>DB: Query receipt + items
    DB-->>API: Full receipt data
    API-->>C: 200 OK {receipt, items, store}
```

**Processing Steps:**

1. **Upload** - Image validated and stored in MinIO/S3
2. **Queue** - Job enqueued in Redis with BullMQ
3. **Preprocess** - Sharp optimizes image for LLM vision processing
4. **OCR** - Ollama LLM (Llama 3.2 Vision / LLaVA) extracts structured data
5. **Parse** - JSON response validated and parsed:
   - Store name identified from receipt header/logo
   - Purchase date extracted in ISO format
   - Line items with names, quantities, and prices
   - Total amount extracted and validated against item sum
6. **Store** - Results saved to PostgreSQL with status tracking

**Average Processing Time**: 1.2-2.5 seconds per receipt

---

## API Usage

### Upload a Receipt

```bash
curl -X POST http://localhost:3001/api/v1/receipts \
  -F "image=@receipt.jpg"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "imageUrl": "http://localhost:9000/Pricey-receipts/receipts/2025-01-15/550e8400.jpg",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Get Receipt Details

```bash
curl http://localhost:3001/api/v1/receipts/550e8400-e29b-41d4-a716-446655440000
```

**Response (when processing complete):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "storeName": "Billa",
  "purchaseDate": "2025-01-14T00:00:00.000Z",
  "totalAmount": "45.67",
  "currency": "EUR",
  "ocrConfidence": 87.5,
  "processingTime": 1234,
  "items": [
    {
      "name": "Milk 2%",
      "price": "3.99",
      "quantity": 1,
      "confidence": 92.5
    }
  ],
  "store": {
    "name": "Billa",
    "logoUrl": null
  }
}
```

### List All Receipts

```bash
curl "http://localhost:3001/api/v1/receipts?page=1&limit=10"
```

See [API documentation](docs/components/api-gateway.md) for complete endpoint details.

---

## Development

### Project Structure

```
Pricey/
├── apps/
│   ├── api-gateway/      # ✅ Fastify REST API (Port 3001)
│   ├── ocr-service/      # ✅ BullMQ OCR worker
│   └── web/              # ⏳ Next.js PWA (Phase 1)
├── packages/
│   ├── database/         # ✅ Prisma schema + migrations
│   ├── types/            # ✅ Shared TypeScript types
│   └── config/           # ✅ ESLint/TypeScript config
└── docs/                 # 📚 Documentation
```

### Available Commands

```bash
# Development
pnpm dev                   # Start all services (Turborepo)
pnpm dev:api              # Start API gateway only
pnpm dev:ocr              # Start OCR worker only
pnpm build                # Build all packages

# Testing
pnpm test                 # Run all tests (376 tests)
pnpm test:coverage        # Generate coverage report
pnpm lint                 # ESLint with flat config
pnpm format               # Prettier formatting
pnpm typecheck            # TypeScript validation

# Database
pnpm db:migrate           # Run Prisma migrations
pnpm db:seed              # Seed stores data
pnpm db:reset             # Reset database
pnpm db:studio            # Open Prisma Studio (localhost:5555)

# Docker
pnpm docker:dev           # Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:down          # Stop all containers
pnpm docker:clean         # Remove volumes
pnpm minio:setup          # Configure MinIO bucket policy (if needed)

# Monorepo
pnpm --filter @Pricey/api-gateway dev
pnpm --filter @Pricey/ocr-service test
```

### Adding Dependencies

```bash
# To specific workspace
pnpm --filter @Pricey/api-gateway add fastify-plugin

# Workspace dependencies (use workspace:* protocol)
# In package.json: "@Pricey/database": "workspace:*"

# Development tools (root)
pnpm add -Dw vitest
```

---

## Testing

Comprehensive test suite with 100% pass rate:

```bash
# Run all tests
pnpm test

# Component breakdown:
# @Pricey/api-gateway:     132 tests (upload, validation, routes)
# @Pricey/ocr-service:     232 tests (OCR, parsers, worker)
# @Pricey/database:         12 tests (schema, migrations)
# Total:                  376 tests

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

**Test Types:**

- **Unit Tests**: Parsers, validators, utility functions
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Full OCR pipeline with real receipt images
- **Load Tests**: 100 concurrent uploads

---

## Configuration

### Environment Variables

```bash
# API Gateway (.env.local)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://Pricey:Pricey_dev_password@localhost:5432/Pricey
REDIS_URL=redis://localhost:6379

# Storage (MinIO/S3)
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=Pricey-receipts
S3_USE_SSL=false

# Security
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# OCR Service
OCR_CONCURRENCY=5
LOG_LEVEL=info
```

### Supported Receipt Formats

- **Image Types**: JPG, PNG
- **Max Size**: 10MB
- **Min Dimensions**: 100x100 pixels
- **Supported Stores**: 20+ Austrian/international retailers (Billa, Spar, Hofer, Lidl, dm, Müller, etc.)

---

## Documentation

Comprehensive documentation available in [`docs/`](docs/):

### Architecture & Design

- **[Current Architecture](docs/ARCHITECTURE-CURRENT.md)** - M0.2 implementation ✅
- [Full Architecture](docs/architecture.md) - Complete system design (future)
- [Monorepo Structure](docs/monorepo-structure.md) - Code organization
- [Product Roadmap](docs/ROADMAP.md) - Development phases

### Component Guides

- **[API Gateway](docs/components/api-gateway.md)** - REST endpoints ✅
- **[OCR Service](docs/components/ocr-service.md)** - Receipt processing ✅
- **[Database Schema](docs/components/database-schema.md)** - Data model ✅
- [Frontend PWA](docs/components/frontend-pwa.md) - Next.js app ⏳
- [Product Service](docs/components/product-service.md) - Normalization ⏳
- [Analytics Service](docs/components/analytics-service.md) - Insights ⏳

### Guides

- [Getting Started](docs/guides/getting-started.md) - Setup instructions
- [Testing Strategy](docs/guides/testing-strategy.md) - Test approach
- [Security](docs/guides/security.md) - Best practices
- [Deployment](docs/guides/deployment.md) - Production setup

---

## Roadmap

### ✅ Phase 0: MVP (January 2025) - **CURRENT**

- Receipt upload API
- OCR processing with Tesseract.js
- Basic data extraction (store, date, items, total)
- PostgreSQL storage
- Background job processing
- **Status**: Complete (M0.2)
- **Target**: 50 early adopters
- **Exit Criteria**: 70% OCR accuracy, <5% error rate

### 🟢 Phase 1: Beta (Q1 2025) - **IN PROGRESS**

- Next.js 16 PWA frontend
- User authentication (OAuth 2.0 + JWT)
- Manual OCR correction UI
- Receipt search and filtering
- Enhanced OCR accuracy (85%+)
- PWA offline support
- **Target**: 500 beta users

### 🟡 Phase 2: Production (Q2 2025)

- Multi-store price comparison
- Product normalization service
- Price tracking and trends
- Analytics dashboard
- Shopping recommendations
- **Target**: 5,000 users

### ⚪ Phase 3: Enhanced Features (Q3 2025)

- AI-powered recommendations
- Budget management
- Family sharing
- Tax preparation export
- Native mobile apps (React Native)
- **Target**: 20,000 users

See [complete roadmap](docs/ROADMAP.md) for detailed milestones.

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Write** tests for new functionality
4. **Commit** using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. **Push** to your branch (`git push origin feature/amazing-feature`)
6. **Open** a Pull Request

### Development Guidelines

- ✅ Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- ✅ Write tests for all new code (minimum 75% coverage)
- ✅ Update documentation for API changes
- ✅ Follow TypeScript strict mode
- ✅ Run `pnpm lint && pnpm format` before committing
- ✅ Ensure all tests pass (`pnpm test`)

---

## Deployment

### 🐳 Docker Deployment (Recommended)

**Quick Start:**

```bash
# 1. Copy environment template
cp .env.production.example .env.production

# 2. Edit with your production values
nano .env.production

# 3. Deploy using interactive script
./scripts/docker-deploy.sh

# Or manually:
docker compose -f docker-compose.prod.yml up -d
```

**What's Included:**

- ✅ Next.js Web Frontend (Port 3000)
- ✅ Fastify API Gateway (Port 3001)
- ✅ OCR Service (Port 3002)
- ✅ PostgreSQL 18 Database
- ✅ Redis 8 Cache
- ✅ MinIO S3-Compatible Storage
- ✅ Optional: Ollama (Self-hosted LLM)

**System Requirements:**

- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB SSD
- **With Ollama**: 8+ cores, 16GB+ RAM, 100GB SSD

📚 **Documentation:**

- [Docker Deployment Guide](docs/guides/docker-deployment.md) - Complete setup instructions
- [Docker Quick Reference](docs/DOCKER-QUICK-REFERENCE.md) - Common commands
- [Self-Hosting Guide](docs/guides/self-hosting.md) - Advanced configuration

### Cloud Deployment Options

**Option A: Vercel + Railway** (Easiest)

- Frontend: Vercel (Next.js)
- Backend: Railway (Fastify + PostgreSQL + Redis)
- Storage: Cloudflare R2 or AWS S3
- LLM: GitHub Models (no hosting needed)

**Option B: Full Docker on VPS**

- Provider: DigitalOcean, Hetzner, AWS EC2, or Linode
- Use docker-compose.prod.yml for complete stack
- Add Nginx reverse proxy for HTTPS
- See [deployment guide](docs/guides/deployment.md)

**Option C: Kubernetes** (For scale)

- Helm charts coming in Phase 1
- Supports auto-scaling and high availability

---

## Security

Security best practices currently implemented:

- ✅ Input validation (file type, size, dimensions)
- ✅ Rate limiting (100 requests/minute)
- ✅ Security headers via Helmet
- ✅ CORS configuration
- ✅ SQL injection protection (Prisma ORM)
- ✅ Request ID tracking
- ✅ Structured logging (no sensitive data)

**Coming in Phase 1:**

- OAuth 2.0 authentication
- JWT tokens with refresh
- API key management
- User data isolation

Found a security issue? Report privately to [security contact].

---

## Privacy

Your data belongs to you:

- **Self-Hosting Available** - Run your own instance
- **No Data Selling** - We never sell your data
- **GDPR Ready** - Export and delete functionality
- **Encrypted Storage** - Images encrypted at rest (Phase 1)
- **Minimal Collection** - Only what's necessary

See [privacy policy](docs/guides/security.md) for details.

---

## License

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

**What this means:**

- ✅ Free to use, modify, and distribute
- ✅ Self-hosting without restrictions
- ✅ Commercial use allowed
- ⚠️ Modified versions must remain open source
- ⚠️ Network use requires source code availability

See [LICENSE.md](LICENSE.md) for full terms.

**For commercial licensing:** Contact us if AGPL-3.0 doesn't fit your needs.

---

## Troubleshooting

Common issues:

**Port conflicts:**

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Database connection fails:**

```bash
# Restart Docker containers
pnpm docker:down && pnpm docker:dev
```

**Build errors:**

```bash
# Clean and rebuild
pnpm clean && pnpm install && pnpm build
```

**Tests failing:**

```bash
# Reset database and run tests
pnpm db:reset && pnpm test
```

See [troubleshooting guide](docs/guides/getting-started.md#troubleshooting) for more.

---

## Acknowledgments

Built with amazing open source projects:

- [Fastify](https://fastify.dev/) - High-performance web framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) - JavaScript OCR
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [BullMQ](https://docs.bullmq.io/) - Redis-based queue
- [Sharp](https://sharp.pixelplumbing.com/) - Image processing
- [PostgreSQL](https://www.postgresql.org/) - Relational database
- [Redis](https://redis.io/) - In-memory data store
- [Turborepo](https://turbo.build/) - Monorepo tooling
- [MinIO](https://min.io/) - S3-compatible storage

Special thanks to all contributors and the open source community.

---

## Support

Need help?

- 📚 **Documentation**: Check [docs/](docs/) first
- 💬 **Discussions**: GitHub Discussions (coming soon)
- 🐛 **Bug Reports**: [Open an issue](https://github.com/mpwg/Pricey/issues)
- 💡 **Feature Requests**: [Open an issue](https://github.com/mpwg/Pricey/issues)
- 📧 **Email**: [Contact maintainers]

---

## Project Status

> **Current Version**: 0.2+ (M0.2 - MVP Complete)  
> **Phase**: Phase 0 → Phase 1 Transition  
> **Last Updated**: January 2025  
> **Next Milestone**: Frontend PWA (February 2025)

Follow our progress in the [roadmap](docs/ROADMAP.md) and [project board](https://github.com/mpwg/Pricey/projects).

---

**Made with ❤️ by the Pricey team**

_Save money, one receipt at a time._
