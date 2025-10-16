# Quick Start Guide

## First Time Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Copy Environment Variables

```bash
cp .env.example .env
```

### 3. Start Docker Services

```bash
docker-compose up -d
```

### 4. Setup Database

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Quick Commands

```bash
# Development
npm run dev                # Start dev server
npm run build             # Build for production
npm run start             # Start production server

# Database
npm run prisma:studio     # Open database GUI
npm run prisma:migrate    # Run migrations

# Docker
npm run docker:dev        # Start services
npm run docker:down       # Stop services
```

## Automated Setup

Run the setup script for automated configuration:

```bash
chmod +x setup.sh
./setup.sh
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run dev
```

### Database Connection Issues

1. Ensure Docker is running: `docker ps`
2. Check logs: `docker-compose logs postgres`
3. Restart services: `npm run docker:down && npm run docker:dev`

### Redis Connection Issues

1. Check Redis is running: `docker-compose logs redis`
2. Test connection: `redis-cli ping`

## Next Steps

1. Read the main [README.md](README.md) for detailed documentation
2. Explore the [Architecture Recommendations](ARCHITECTURE_RECOMMENDATIONS.md)
3. Check out the Prisma schema in `prisma/schema.prisma`
4. Start building features in `src/app/`
