# Pricey 🏷️

A Progressive Web App (PWA) for smart price comparison across multiple shopping sites. Built with Next.js 15, TypeScript, and modern web technologies.

## Features

- 📊 **Price Comparison**: Track prices across multiple retailers
- 🔔 **Price Alerts**: Get notified when prices drop
- 💰 **Smart Recommendations**: AI-powered shopping suggestions
- 📱 **PWA Support**: Install on mobile and desktop
- 🎨 **Responsive Design**: Optimized for all screen sizes
- ⚡ **Fast Performance**: Server-side rendering and caching

## Tech Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PWA**: next-pwa plugin
- **State Management**: React Query

### Backend

- **Runtime**: Node.js 20
- **API**: Next.js API Routes
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Cache**: Redis 7
- **Queue**: BullMQ

### Scraping

- **Browser Automation**: Playwright
- **HTML Parsing**: Cheerio

### CI/CD

- **GitHub Actions**: Automated testing and deployment
- **Docker Registry**: GHCR (GitHub Container Registry)
- **Security**: CodeQL and dependency scanning

## Project Structure

```
pricey/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   ├── lib/                # Utilities and configs
│   │   ├── prisma.ts       # Prisma client
│   │   ├── redis.ts        # Redis client
│   │   ├── queue.ts        # BullMQ setup
│   │   └── utils.ts        # Helper functions
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
├── public/
│   └── manifest.json       # PWA manifest
├── docker-compose.yml      # Docker services
├── Dockerfile              # App container
├── package.json            # Dependencies
└── .github/
    └── workflows/          # GitHub Actions CI/CD
        ├── ci.yml          # Main pipeline
        ├── docker.yml      # Container builds
        └── deploy.yml      # Deployments

```

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose (for databases)
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/pricey.git
cd pricey
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="postgresql://pricey:pricey_password@localhost:5432/pricey_db?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Start databases with Docker**

```bash
npm run docker:dev
```

This starts PostgreSQL and Redis containers.

5. **Set up the database**

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

6. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

### Available Scripts

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript compiler check

# Database
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio

# Docker
npm run docker:dev       # Start Docker services
npm run docker:down      # Stop Docker services
```

### Database Schema

The app uses the following main models:

- **User**: User accounts
- **Product**: Products being tracked
- **Price**: Historical price data from retailers
- **PriceAlert**: User price alert subscriptions
- **SavedProduct**: User's saved/favorite products

See `prisma/schema.prisma` for the complete schema.

### Adding New Features

1. **Create API routes**: Add files to `src/app/api/`
2. **Add components**: Create reusable components in `src/components/`
3. **Database changes**: Update `prisma/schema.prisma` and run migrations
4. **Background jobs**: Add workers to `src/lib/queue.ts`

## CI/CD with GitHub Actions

The project includes 5 automated workflows:

### 1. **CI Pipeline** (`.github/workflows/ci.yml`)

Runs on every push and PR:

- Linting and type checking
- Build validation
- Prisma schema validation

### 2. **Docker Build** (`.github/workflows/docker.yml`)

Builds and pushes images to GHCR:

- Multi-platform support (amd64, arm64)
- Automatic tagging (branch, version, SHA)
- Layer caching for faster builds

### 3. **Production Deploy** (`.github/workflows/deploy.yml`)

Deploys to production server via SSH:

- Pulls latest code
- Updates containers
- Runs migrations

### 4. **Dependency Review** (`.github/workflows/dependency-review.yml`)

Scans dependencies for vulnerabilities

### 5. **Security Analysis** (`.github/workflows/codeql.yml`)

CodeQL static analysis for security issues

See `.github/workflows/README.md` for detailed setup instructions.

## Docker Deployment

### Build the application

```bash
docker build -t pricey:latest .
```

### Run with Docker Compose

Create a production `docker-compose.yml` or use the existing one:

```bash
docker-compose up -d
```

### Environment Variables

Make sure to set production environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXT_PUBLIC_APP_URL`: Your production URL
- `NODE_ENV=production`

## PWA Configuration

The app is configured as a PWA using `next-pwa`. Features include:

- Offline support with service workers
- App installation on mobile/desktop
- Push notifications (to be implemented)
- Background sync (to be implemented)

### Generating PWA Icons

1. Create your app icon (512x512px recommended)
2. Use a tool like [PWA Builder](https://www.pwabuilder.com/imageGenerator) to generate all sizes
3. Place icons in the `public/` directory
4. Update `public/manifest.json` with icon paths

## API Documentation

### Health Check

```
GET /api/health
```

Returns API status and version.

### Future Endpoints

- `GET /api/products` - List products
- `POST /api/products` - Add a product to track
- `GET /api/prices/:productId` - Get prices for a product
- `POST /api/alerts` - Create a price alert
- `GET /api/alerts` - List user's alerts

## Roadmap

- [ ] User authentication (NextAuth.js)
- [ ] Product search and import
- [ ] Automatic price scraping with Playwright
- [ ] Price history charts
- [ ] Email/push notifications for price alerts
- [ ] Product recommendations engine
- [ ] Browser extension for easy product import
- [ ] Mobile app optimization
- [ ] Multi-currency support
- [ ] Share deals with friends

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Important: License Headers

**All source code files MUST include the AGPL3 license header.** This is a mandatory requirement for all contributions.

To automatically add license headers to your files, run:

```bash
npm run add-license
```

For more details, see [docs/LICENSE_HEADERS.md](docs/LICENSE_HEADERS.md).

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE.md](LICENSE.md) file for full details.

All source code files include the AGPL3 license header as required by the license terms.

## Support

If you encounter any issues or have questions:

- Open an issue on GitHub
- Contact: your.email@example.com

---

Built with ❤️ using Next.js and TypeScript
