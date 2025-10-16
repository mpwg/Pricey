# Getting Started with Pricey Development

Welcome to the Pricey project! This guide will help you get up and running quickly.

## What You Just Created

A complete Next.js 14 + TypeScript scaffolding with:

✅ **Next.js 14** with App Router  
✅ **TypeScript** configured  
✅ **Tailwind CSS** for styling  
✅ **Prisma ORM** for database  
✅ **PostgreSQL** database setup  
✅ **Redis** for caching  
✅ **BullMQ** for job queues  
✅ **PWA support** with next-pwa  
✅ **Docker** configuration  
✅ **ESLint** and type checking

## 🚀 Quick Start (Choose One Method)

### Method 1: Automated Setup (Recommended)

```bash
# Make setup script executable (if not already)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

### Method 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.example .env

# 3. Start Docker services
docker-compose up -d

# 4. Wait for services to be ready (about 5 seconds)
sleep 5

# 5. Generate Prisma Client
npm run prisma:generate

# 6. Run database migrations
npm run prisma:migrate

# 7. Start development server
npm run dev
```

## 📁 Project Structure Overview

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   │   └── health/        # Health check endpoint
│   ├── layout.tsx         # Root layout with PWA meta tags
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Shared utilities
│   ├── prisma.ts          # Prisma client instance
│   ├── redis.ts           # Redis client instance
│   ├── queue.ts           # BullMQ queue setup
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript type definitions
    └── index.ts           # Shared types
```

## 🗄️ Database Models

The Prisma schema includes:

- **User** - User accounts
- **Product** - Tracked products
- **Price** - Price history from retailers
- **PriceAlert** - User price alerts
- **SavedProduct** - User favorites

## 🛠️ Development Workflow

### Daily Development

```bash
# Start the dev server (with hot reload)
npm run dev

# In another terminal, view database
npm run prisma:studio
```

### Making Database Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create and apply migration
npm run prisma:migrate

# 3. Generate new Prisma Client
npm run prisma:generate
```

### Type Checking

```bash
# Check TypeScript types
npm run type-check

# Run linter
npm run lint
```

## 🐳 Docker Commands

```bash
# Start services
npm run docker:dev

# Stop services
npm run docker:down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Check service status
docker ps
```

## 🔧 Environment Variables

Your `.env` file should contain:

```env
DATABASE_URL="postgresql://pricey:pricey_password@localhost:5432/pricey_db?schema=public"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

## 📱 PWA Features

The app includes PWA configuration:

- Service worker for offline support
- Installable on mobile/desktop
- App manifest at `/public/manifest.json`
- Icons (you'll need to add your own)

### Adding PWA Icons

1. Create icons (192x192 and 512x512)
2. Place in `/public/` directory
3. Update `public/manifest.json` if needed

## 🧪 Testing Your Setup

### 1. Check Services

```bash
# Test database connection
npm run prisma:studio

# Test Redis connection
docker exec -it pricey-redis redis-cli ping
# Should return: PONG
```

### 2. Test API

Open your browser to:

- Main app: http://localhost:3000
- Health check: http://localhost:3000/api/health

### 3. Check Environment

```bash
node scripts/check-env.js
```

## 🚧 Next Steps

Now that your scaffolding is ready, you can:

1. **Add Authentication**

   - Implement NextAuth.js
   - Add login/signup pages

2. **Build Product Features**

   - Create product listing page
   - Add product detail page
   - Implement search functionality

3. **Implement Price Scraping**

   - Set up Playwright scrapers
   - Create background jobs with BullMQ
   - Store price data

4. **Build Price Alerts**

   - Create alert subscription UI
   - Implement notification system
   - Add email/push notifications

5. **Add Charts & Visualizations**
   - Price history graphs
   - Price comparison charts

## 📚 Key Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [BullMQ](https://docs.bullmq.io/)
- [Playwright](https://playwright.dev/)

## ⚠️ Common Issues

### Dependencies not installing

```bash
# Clear npm cache
rm -rf node_modules package-lock.json
npm install
```

### Docker services won't start

```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Stop other services using these ports or change ports in docker-compose.yml
```

### Type errors after Prisma changes

```bash
# Regenerate Prisma Client
npm run prisma:generate

# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P -> "TypeScript: Restart TS Server"
```

### PWA not working in development

PWA features are disabled in development mode by default. To test:

```bash
# Build and run production mode
npm run build
npm run start
```

## 💡 Pro Tips

1. **Use TypeScript strictly** - The config is set to strict mode for better type safety
2. **Database first** - Always update Prisma schema before writing TypeScript types
3. **API Routes** - Keep them in `src/app/api/` for automatic routing
4. **Environment vars** - Use `NEXT_PUBLIC_` prefix for client-side variables
5. **Caching** - Use Redis for frequently accessed data to improve performance

## 🤝 Need Help?

- Check the [README.md](README.md) for full documentation
- See [QUICKSTART.md](QUICKSTART.md) for quick commands
- Review [ARCHITECTURE_RECOMMENDATIONS.md](ARCHITECTURE_RECOMMENDATIONS.md) for design decisions

---

Happy coding! 🎉
