# Pricey

**Smart receipt scanning and price comparison to help you save money on every purchase.**

Pricey is a Progressive Web Application (PWA) that digitizes your shopping receipts, tracks prices across stores, and helps you find the best deals. Scan receipts with your phone's camera, compare prices automatically, and never overpay again.

---

## Features

- **📸 Receipt Scanning** - Capture receipts with your phone's camera and extract data automatically using OCR
- **💰 Price Tracking** - Monitor price changes for products you buy regularly across multiple stores
- **🔍 Price Comparison** - Find which store offers the best price for your favorite products
- **📊 Shopping Insights** - Visualize your spending patterns and discover savings opportunities
- **📝 Shopping Lists** - Create smart shopping lists with price estimates based on historical data
- **🌐 Works Offline** - Progressive Web App works without internet connection
- **🔐 Privacy First** - Your data stays private with optional self-hosting
- **📱 Mobile Optimized** - Designed for mobile use with "Add to Home Screen" support

---

## Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **pnpm** 8.10.0 or higher
- **Docker** and **Docker Compose** (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/mpwg/Pricey.git
cd Pricey

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start infrastructure services (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Run database migrations
pnpm db:migrate

# (Optional) Seed database with sample data
pnpm db:seed

# Start development servers
pnpm dev
```

The application will be available at:

- **Web App**: http://localhost:3001
- **API**: http://localhost:3000

---

## How It Works

1. **Snap a Receipt** - Use your phone's camera to capture a receipt photo
2. **Automatic Processing** - OCR technology extracts store name, items, and prices
3. **Product Matching** - AI matches receipt items to generic products for comparison
4. **Price Tracking** - Historical data builds up over time to show price trends
5. **Get Recommendations** - Find the best store to shop based on your shopping list

---

## Architecture

Pricey uses a modern microservices architecture:

```
Frontend (Next.js PWA)
         ↓
    API Gateway
         ↓
   ┌─────┴─────┬──────────┐
   ↓           ↓          ↓
OCR Service  Product   Analytics
             Service    Service
         ↓
   PostgreSQL + Redis + S3
```

**Technology Stack:**

- **Frontend**: Next.js 13+, React 18, TypeScript, TailwindCSS
- **Backend**: Node.js, Fastify, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Storage**: MinIO (local) / S3 (cloud)
- **OCR**: Tesseract.js (local) / Google Cloud Vision (cloud)
- **Infrastructure**: Docker, Kubernetes (optional)

---

## Development

### Project Structure

```
Pricey/
├── apps/
│   ├── web/              # Next.js PWA frontend
│   └── api/              # Main API gateway
├── services/
│   ├── ocr/              # OCR processing service
│   ├── product/          # Product normalization service
│   └── analytics/        # Analytics & recommendations
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── database/         # Prisma schema & migrations
│   ├── utils/            # Shared utilities
│   └── validation/       # Shared Zod schemas
└── docs/                 # Documentation
```

### Available Commands

```bash
# Development
pnpm dev                   # Start all services
pnpm dev:web              # Start only frontend
pnpm build                # Build all packages

# Testing
pnpm test                 # Run all tests
pnpm lint                 # Lint all code
pnpm format               # Format all code

# Database
pnpm db:migrate           # Run migrations
pnpm db:seed              # Seed database
pnpm db:reset             # Reset database
pnpm db:studio            # Open Prisma Studio

# Docker
pnpm docker:dev           # Start dev infrastructure
pnpm docker:prod          # Start production stack
```

### Working on Specific Services

```bash
# Run specific workspace
pnpm --filter @pricy/web dev
pnpm --filter @pricy/api dev
pnpm --filter @pricy/service-ocr dev

# Add dependencies
pnpm --filter @pricy/web add react-hook-form
```

---

## Deployment

### Local / Self-Hosted

For personal use or small teams:

```bash
# Using Docker Compose
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Access at https://localhost
```

**Requirements:**

- 2 CPU cores
- 4GB RAM
- 20GB storage

### Cloud Deployment

Recommended cloud setup:

- **Frontend**: Vercel or Netlify
- **Backend**: AWS ECS, Google Cloud Run, or Railway
- **Database**: AWS RDS, Google Cloud SQL, or Neon
- **Storage**: AWS S3 or Google Cloud Storage
- **OCR**: Google Cloud Vision API or AWS Textract

See [deployment guide](docs/guides/deployment.md) for detailed instructions.

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) folder:

### Getting Started

- [Getting Started Guide](docs/guides/getting-started.md) - Setup and first steps
- [Architecture Overview](docs/architecture.md) - System design and components
- [Monorepo Structure](docs/monorepo-structure.md) - Code organization

### Component Guides

- [Frontend PWA](docs/components/frontend-pwa.md) - Next.js application
- [API Gateway](docs/components/api-gateway.md) - REST API endpoints
- [OCR Service](docs/components/ocr-service.md) - Receipt text extraction
- [Product Service](docs/components/product-service.md) - Product normalization
- [Analytics Service](docs/components/analytics-service.md) - Price comparison
- [Database Schema](docs/components/database-schema.md) - Data modeling

### Operational Guides

- [Authentication](docs/guides/authentication.md) - User auth & OAuth
- [Deployment](docs/guides/deployment.md) - Production deployment
- [Testing Strategy](docs/guides/testing-strategy.md) - Testing approach
- [Security](docs/guides/security.md) - Security best practices
- [Monitoring](docs/guides/monitoring.md) - Observability

### Planning

- [Product Roadmap](docs/ROADMAP.md) - Development phases and milestones

---

## Roadmap

Pricey is under active development with a phased approach:

### ✅ Phase 0: MVP (November 2025)

- Basic receipt scanning and OCR
- Simple receipt list interface
- Core infrastructure setup
- **Target**: 50 early adopters

### 🟢 Phase 1: Beta (December 2025)

- User authentication (Google, Microsoft, Apple)
- Receipt management and search
- Enhanced OCR accuracy (85%+)
- Basic price tracking
- PWA implementation
- **Target**: 500 beta users

### 🟡 Phase 2: Release 1.0 (February 2026)

- Multi-store price comparison
- Smart shopping lists
- Analytics dashboard
- Mobile optimization
- Security audit
- **Target**: 5,000 users

### ⚪ Phase 3: Enhanced Features (Q1 2026)

- AI-powered recommendations
- Social features (family sharing)
- Budget management
- Tax preparation support
- **Target**: 20,000 users

### ⚪ Phase 4: Scale (Q2 2026)

- International expansion
- Native mobile apps (iOS, Android)
- Enterprise features
- Advanced integrations
- **Target**: 100,000 users

See the [complete roadmap](docs/ROADMAP.md) for detailed milestones and timelines.

---

## Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** following our coding standards
4. **Write tests** for new functionality
5. **Commit your changes** (`git commit -m 'feat: add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

Please read our contributing guidelines before submitting PRs.

### Development Guidelines

- Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
- Write tests for new features
- Update documentation when needed
- Follow TypeScript best practices
- Ensure all tests pass (`pnpm test`)
- Run linter and formatter (`pnpm lint && pnpm format`)

---

## Security

Security is a top priority for Pricey. We implement industry best practices:

- **OAuth 2.0 with PKCE** for secure authentication
- **Short-lived JWT tokens** (15 minutes)
- **Encrypted data at rest** (AES-256)
- **HTTPS only** for all connections
- **Rate limiting** to prevent abuse
- **Regular security audits**
- **GDPR compliant** with data export and deletion

Found a security vulnerability? Please report it privately to our security team rather than opening a public issue.

---

## Privacy

Your privacy matters:

- **Data Ownership** - Your receipt data belongs to you
- **Minimal Collection** - We only collect what's necessary
- **No Selling** - We never sell your data to third parties
- **Self-Hosting** - Option to host your own instance
- **GDPR Compliant** - Right to access, export, and delete your data
- **Encrypted Storage** - All receipts and personal data encrypted

See our [privacy policy](docs/guides/security.md) for full details.

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:

- ✅ You can use this software for free
- ✅ You can modify and distribute it
- ✅ You can use it commercially
- ⚠️ If you run a modified version on a server, you must make the source code available
- ⚠️ Any derivative work must also be open source under AGPL-3.0

See the [LICENSE.md](LICENSE.md) file for full license text.

### Why AGPL-3.0?

We chose AGPL-3.0 to ensure that improvements to Pricey remain open source and benefit the community, even when running as a hosted service. This prevents proprietary cloud services from building on our work without contributing back.

**For Self-Hosting**: You can run your own instance without any restrictions.

**For Commercial Use**: Contact us for alternative licensing options if AGPL-3.0 doesn't fit your needs.

---

## Support

### Getting Help

- 📚 **Documentation**: Check the [docs](docs/) folder first
- 💬 **Discussions**: Join our community discussions
- 🐛 **Bug Reports**: Open an issue with details
- 💡 **Feature Requests**: Open an issue with your idea
- 📧 **Email**: Contact the maintainers

### Troubleshooting

Common issues and solutions:

- **Port already in use**: `lsof -ti:3000 | xargs kill -9`
- **Database connection fails**: Check if Docker containers are running
- **Build errors**: Try `pnpm clean && pnpm install && pnpm build`
- **OCR not working**: Verify OCR provider credentials in `.env`

See the [troubleshooting guide](docs/guides/getting-started.md#troubleshooting) for more help.

---

## Acknowledgments

Pricey is built with amazing open source technologies:

- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Fastify](https://fastify.dev/) - Web framework
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Cache
- [Turborepo](https://turbo.build/) - Monorepo tooling
- [shadcn/ui](https://ui.shadcn.com/) - UI components

Special thanks to all contributors and the open source community.

---

## Status

> **Current Status**: 🟢 Active Development - Phase 0 (MVP)  
> **Last Updated**: October 24, 2025  
> **Version**: 0.1.0 (Pre-release)

The project is in active development with the MVP launching November 2025. Follow progress in our [roadmap](docs/ROADMAP.md).

---

**Made with ❤️ by the Pricey team**

_Save money, one receipt at a time._
