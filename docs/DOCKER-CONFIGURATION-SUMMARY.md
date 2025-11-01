# Docker Configuration Summary

**Date**: October 28, 2025
**Status**: ✅ Complete

## Overview

The entire Pricey application has been configured for containerized deployment using Docker and Docker Compose. All services can now be deployed as a complete stack with a single command.

## What Was Configured

### 1. Docker Images Created

#### **Web Frontend** (`docker/Dockerfile.web`)

- Base: Node.js 24 Alpine
- Multi-stage build for optimization
- Standalone Next.js output
- Non-root user (nextjs:nodejs)
- Port: 3000

#### **API Gateway** (`docker/Dockerfile.api-gateway`)

- Base: Node.js 24 Alpine
- Includes Prisma client generation
- Non-root user (fastify:nodejs)
- Port: 3001

#### **OCR Service** (`docker/Dockerfile.ocr-service`)

- Base: Node.js 24 Alpine
- Vision LLM integration ready
- Non-root user (ocruser:nodejs)
- Port: 3002

### 2. Docker Compose Configurations

#### **Development** (`docker-compose.yml`)

- Infrastructure only (PostgreSQL, Redis, MinIO)
- Optional Ollama with profile flag
- Auto-downloads vision models
- Development-friendly settings

#### **Production** (`docker-compose.prod.yml`)

- Complete application stack:
  - Web Frontend
  - API Gateway
  - OCR Service
  - PostgreSQL 18
  - Redis 8
  - MinIO (S3-compatible)
  - Ollama (optional, commented out)
- Health checks for all services
- Resource limits configured
- Restart policies enabled
- Environment-based configuration

### 3. Configuration Files

#### **.env.production.example**

Complete template with:

- Database credentials
- Redis configuration
- Storage settings (MinIO/S3/R2)
- LLM provider config (Ollama/GitHub Models)
- Security settings
- CORS configuration
- Monitoring integration (Sentry, Plausible)

### 4. Deployment Tools

#### **Interactive Deployment Script** (`scripts/docker-deploy.sh`)

Features:

- ✅ Environment validation
- ✅ Full deployment workflow
- ✅ Update/restart services
- ✅ Database operations
- ✅ Backup & restore
- ✅ Health checks
- ✅ Log viewing

#### **Quick Reference** (`docs/DOCKER-QUICK-REFERENCE.md`)

Cheat sheet for:

- Starting/stopping services
- Viewing logs
- Database operations
- Debugging
- Backup/restore
- Monitoring

### 5. Documentation

#### **Complete Deployment Guide** (`docs/guides/docker-deployment.md`)

Covers:

- Architecture overview
- System requirements
- Configuration steps
- Deployment procedures
- Post-deployment setup
- Maintenance tasks
- Troubleshooting
- Production best practices

### 6. Updated Files

- ✅ `README.md` - Added Docker deployment section
- ✅ `docs/phases/phase-0-mvp/MANUAL-TASKS.md` - Updated Vercel build command
- ✅ Next.js config already has `output: 'standalone'` enabled

## Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                   (pricey-network)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐      │
│  │   Web    │──▶│ API Gateway  │──▶│ OCR Service  │      │
│  │  :3000   │   │    :3001     │   │    :3002     │      │
│  └──────────┘   └──────────────┘   └──────────────┘      │
│                         │                    │              │
│                         ▼                    ▼              │
│                  ┌──────────┐       ┌─────────────┐       │
│                  │PostgreSQL│       │    Redis    │       │
│                  │   :5432  │       │    :6379    │       │
│                  └──────────┘       └─────────────┘       │
│                         │                    │              │
│                         └────────┬───────────┘              │
│                                  ▼                          │
│                           ┌──────────┐                     │
│                           │  MinIO   │                     │
│                           │ :9000-1  │                     │
│                           └──────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Options

### Option 1: Quick Deployment

```bash
./scripts/docker-deploy.sh
```

Interactive menu guides through the process.

### Option 2: Manual Deployment

```bash
# Configure environment
cp .env.production.example .env.production
nano .env.production

# Deploy
docker compose -f docker-compose.prod.yml up -d

# Migrations
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:migrate"
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:seed"
```

### Option 3: Development Only

```bash
# Start infrastructure (PostgreSQL, Redis, MinIO)
pnpm docker:dev

# Run services locally
pnpm dev
```

## Resource Requirements

### Minimum (Testing)

- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- Cost: ~$5-10/month (VPS)

### Recommended (Production)

- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- Cost: ~$20-40/month (VPS)

### With Ollama (Self-hosted LLM)

- CPU: 8+ cores
- RAM: 16GB+ (32GB recommended)
- Storage: 100GB+ SSD
- GPU: NVIDIA 8GB+ VRAM (optional but recommended)
- Cost: ~$100-200/month (GPU VPS)

## Environment Variables

### Required (Must Change)

```bash
POSTGRES_PASSWORD=       # Strong password
REDIS_PASSWORD=          # Strong password
MINIO_ROOT_USER=         # Admin username
MINIO_ROOT_PASSWORD=     # Strong password
SESSION_SECRET=          # 32 byte hex (openssl rand -hex 32)
```

### LLM Configuration

**Option A: GitHub Models** (Recommended)

```bash
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_your_token_here
```

**Option B: Self-hosted Ollama**

```bash
LLM_PROVIDER=ollama
OLLAMA_HOST=http://ollama:11434
```

### Storage Configuration

**Option A: Bundled MinIO**

```bash
STORAGE_ENDPOINT=http://minio:9000
STORAGE_BUCKET=pricey-receipts
# Uses MINIO_ROOT_USER/PASSWORD
```

**Option B: AWS S3**

```bash
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_REGION=us-east-1
STORAGE_BUCKET=your-bucket
STORAGE_ACCESS_KEY_ID=your-key
STORAGE_SECRET_ACCESS_KEY=your-secret
```

**Option C: Cloudflare R2**

```bash
STORAGE_ENDPOINT=https://account-id.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=pricey-receipts
STORAGE_ACCESS_KEY_ID=your-r2-key
STORAGE_SECRET_ACCESS_KEY=your-r2-secret
```

## Health Checks

All services have health check endpoints:

```bash
curl http://localhost:3000/           # Web (200)
curl http://localhost:3001/health     # API (200)
curl http://localhost:3002/health     # OCR (200)
```

Docker Compose monitors health automatically and restarts unhealthy containers.

## Security Features

- ✅ Non-root users in all containers
- ✅ Resource limits configured
- ✅ Health checks enabled
- ✅ Restart policies set
- ✅ Secrets via environment variables
- ✅ Network isolation
- ✅ AGPL-3.0 license headers in all images

## Production Checklist

Before deploying to production:

- [ ] Update all passwords in `.env.production`
- [ ] Generate SESSION_SECRET with `openssl rand -hex 32`
- [ ] Configure proper CORS_ORIGIN
- [ ] Set up external storage (S3/R2) or secure MinIO
- [ ] Enable HTTPS (Nginx/Traefik reverse proxy)
- [ ] Configure monitoring (Sentry, Uptime Robot)
- [ ] Set up automated backups
- [ ] Test disaster recovery process
- [ ] Review resource limits
- [ ] Enable rate limiting in production
- [ ] Set up log aggregation

## Common Commands

```bash
# Deploy
./scripts/docker-deploy.sh

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Restart service
docker compose -f docker-compose.prod.yml restart api-gateway

# Update service
docker compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway

# Backup database
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pricey pricey > backup.sql

# Health check
curl http://localhost:3001/health
```

## Testing the Deployment

After deployment, verify:

1. **Web Frontend**: Open http://localhost:3000
2. **API Health**: `curl http://localhost:3001/health`
3. **Upload Receipt**: Test via web UI
4. **View Receipts**: Check receipt list page
5. **Check Logs**: `docker compose -f docker-compose.prod.yml logs -f`
6. **MinIO Console**: http://localhost:9001 (check bucket exists)

## Next Steps

1. **Production Setup**:
   - Deploy to VPS (DigitalOcean, Hetzner, etc.)
   - Set up domain and HTTPS
   - Configure backup automation
   - Enable monitoring

2. **Alternative Deployment**:
   - Vercel (Web) + Railway (Backend) for managed hosting
   - See updated MANUAL-TASKS.md for cloud deployment

## Documentation Links

- [Docker Deployment Guide](../docs/guides/docker-deployment.md)
- [Docker Quick Reference](../docs/DOCKER-QUICK-REFERENCE.md)
- [Self-Hosting Guide](../docs/guides/self-hosting.md)
- [Manual Tasks for Cloud](../docs/phases/phase-0-mvp/MANUAL-TASKS.md)

## Support

- GitHub Issues: https://github.com/mpwg/Pricey/issues
- Discussions: https://github.com/mpwg/Pricey/discussions
- Email: privacy@mpwg.eu

---

**Configuration Complete** ✅

The application is now fully containerized and ready for production deployment!
