# Docker Deployment Guide

**Pricey - Complete Containerized Deployment**

This guide covers deploying the entire Pricey application stack using Docker and Docker Compose.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Prerequisites](#prerequisites)
4. [Configuration](#configuration)
5. [Deployment](#deployment)
6. [Post-Deployment](#post-deployment)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/mpwg/Pricey.git
cd Pricey

# 2. Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values

# 3. Build and start all services
docker compose -f docker-compose.prod.yml up -d

# 4. Run database migrations
docker compose -f docker-compose.prod.yml exec api-gateway pnpm db:migrate

# 5. Seed initial data
docker compose -f docker-compose.prod.yml exec api-gateway pnpm db:seed

# 6. Verify all services are running
docker compose -f docker-compose.prod.yml ps
```

Your application should now be accessible at:

- **Web Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **OCR Service**: http://localhost:3002
- **MinIO Console**: http://localhost:9001

---

## Architecture Overview

The Docker setup includes the following services:

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Network                        │
│                      (pricey-network)                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐     ┌─────────────┐     ┌──────────────┐  │
│  │   Web       │────▶│ API Gateway │────▶│ OCR Service  │  │
│  │  (Next.js)  │     │  (Fastify)  │     │  (Node.js)   │  │
│  │  Port 3000  │     │  Port 3001  │     │  Port 3002   │  │
│  └─────────────┘     └─────────────┘     └──────────────┘  │
│         │                   │                     │          │
│         │                   ▼                     ▼          │
│         │            ┌─────────────┐      ┌─────────────┐  │
│         │            │  PostgreSQL │      │    Redis    │  │
│         │            │   Port 5432 │      │  Port 6379  │  │
│         │            └─────────────┘      └─────────────┘  │
│         │                   │                     │          │
│         └───────────────────┴─────────────────────┘          │
│                             │                                │
│                             ▼                                │
│                      ┌─────────────┐                        │
│                      │    MinIO    │                        │
│                      │  Port 9000  │                        │
│                      └─────────────┘                        │
│                                                               │
│  Optional (Uncomment in docker-compose.prod.yml):           │
│                      ┌─────────────┐                        │
│                      │   Ollama    │                        │
│                      │  Port 11434 │                        │
│                      └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Services:

1. **web** - Next.js frontend (React 19, TypeScript)
2. **api-gateway** - Main API server (Fastify, handles receipts, users)
3. **ocr-service** - Receipt parsing service (Vision LLMs)
4. **postgres** - PostgreSQL 18 database
5. **redis** - Redis 8 cache
6. **minio** - S3-compatible object storage
7. **ollama** - Optional self-hosted LLM (for vision parsing)

---

## Prerequisites

### System Requirements

**Minimum**:

- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB
- OS: Linux, macOS, or Windows with WSL2

**Recommended**:

- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB SSD
- OS: Linux (Ubuntu 22.04+, Debian 12+, or similar)

**With Ollama** (self-hosted LLM):

- CPU: 8+ cores
- RAM: 16GB+ (32GB recommended)
- GPU: NVIDIA GPU with 8GB+ VRAM (optional but highly recommended)
- Storage: 100GB+ SSD

### Software Requirements

- **Docker**: 24.0.0+
- **Docker Compose**: 2.20.0+

Install Docker:

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# macOS
brew install --cask docker

# Or download Docker Desktop from:
# https://www.docker.com/products/docker-desktop/
```

Verify installation:

```bash
docker --version
docker compose version
```

---

## Configuration

### 1. Environment Variables

Create `.env.production` from the example:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your production values:

```bash
nano .env.production
```

#### Required Settings:

**Database Credentials**:

```bash
POSTGRES_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_redis_password_here
```

**Storage Credentials**:

```bash
MINIO_ROOT_USER=your_minio_admin_user
MINIO_ROOT_PASSWORD=your_minio_admin_password
```

**Session Secret** (generate with `openssl rand -hex 32`):

```bash
SESSION_SECRET=your_32_byte_hex_secret_here
```

**LLM Provider**:

Option A - GitHub Models (Recommended):

```bash
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_your_github_token_here
```

Option B - Self-hosted Ollama:

```bash
LLM_PROVIDER=ollama
OLLAMA_HOST=http://ollama:11434
# Also uncomment the ollama service in docker-compose.prod.yml
```

**CORS Origin**:

```bash
CORS_ORIGIN=https://yourdomain.com
```

**Frontend API URL**:

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
```

### 2. Storage Configuration

#### Option A: Use Bundled MinIO (Recommended for self-hosting)

No additional configuration needed. MinIO is included in the Docker Compose stack.

#### Option B: Use External S3/R2

Update `.env.production`:

```bash
# For AWS S3
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_REGION=us-east-1
STORAGE_BUCKET=your-bucket-name
STORAGE_ACCESS_KEY_ID=your-aws-access-key
STORAGE_SECRET_ACCESS_KEY=your-aws-secret-key

# For Cloudflare R2
STORAGE_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_BUCKET=pricey-receipts
STORAGE_ACCESS_KEY_ID=your-r2-access-key
STORAGE_SECRET_ACCESS_KEY=your-r2-secret-key
```

If using external storage, you can comment out the MinIO service in `docker-compose.prod.yml`.

### 3. Optional: Enable Ollama

To use self-hosted Ollama for LLM inference:

1. Uncomment the `ollama` service in `docker-compose.prod.yml`
2. Uncomment the `ollama_data` volume
3. Set in `.env.production`:
   ```bash
   LLM_PROVIDER=ollama
   OLLAMA_HOST=http://ollama:11434
   ```

---

## Deployment

### 1. Build Images

```bash
# Build all images
docker compose -f docker-compose.prod.yml build

# Or build specific services
docker compose -f docker-compose.prod.yml build web
docker compose -f docker-compose.prod.yml build api-gateway
docker compose -f docker-compose.prod.yml build ocr-service
```

Build time: ~5-10 minutes (depending on your system)

### 2. Start Services

```bash
# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# Or start services one by one (for debugging)
docker compose -f docker-compose.prod.yml up -d postgres redis minio
docker compose -f docker-compose.prod.yml up -d api-gateway ocr-service
docker compose -f docker-compose.prod.yml up -d web
```

### 3. Verify Services

Check that all services are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Expected output:

```
NAME                        STATUS          PORTS
pricey-api-gateway-prod     Up (healthy)    0.0.0.0:3001->3001/tcp
pricey-minio-prod           Up (healthy)    0.0.0.0:9000-9001->9000-9001/tcp
pricey-ocr-service-prod     Up (healthy)    0.0.0.0:3002->3002/tcp
pricey-postgres-prod        Up (healthy)    0.0.0.0:5432->5432/tcp
pricey-redis-prod           Up (healthy)    0.0.0.0:6379->6379/tcp
pricey-web-prod             Up (healthy)    0.0.0.0:3000->3000/tcp
```

Check logs:

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f api-gateway
```

---

## Post-Deployment

### 1. Database Setup

Run migrations:

```bash
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:migrate"
```

Seed initial data (stores, etc.):

```bash
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:seed"
```

### 2. MinIO Setup

If using bundled MinIO, create the receipts bucket:

```bash
# Access MinIO console at http://localhost:9001
# Login with MINIO_ROOT_USER and MINIO_ROOT_PASSWORD
# Create bucket: pricey-receipts
# Set bucket policy to public-read (or use signed URLs)

# Or use the setup script
docker compose -f docker-compose.prod.yml exec -T minio sh -c "
  mc alias set local http://localhost:9000 \$MINIO_ROOT_USER \$MINIO_ROOT_PASSWORD
  mc mb local/pricey-receipts
  mc anonymous set download local/pricey-receipts
"
```

### 3. Ollama Setup (if enabled)

Pull vision models:

```bash
docker compose -f docker-compose.prod.yml exec ollama ollama pull llava
docker compose -f docker-compose.prod.yml exec ollama ollama pull llama3.2-vision:11b
```

### 4. Health Checks

Test all endpoints:

```bash
# Web frontend
curl http://localhost:3000

# API Gateway health
curl http://localhost:3001/health

# OCR Service health
curl http://localhost:3002/health

# PostgreSQL
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U pricey

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli --pass YOUR_REDIS_PASSWORD ping

# MinIO
curl http://localhost:9000/minio/health/live
```

---

## Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service (last 100 lines)
docker compose -f docker-compose.prod.yml logs --tail=100 api-gateway

# Search logs
docker compose -f docker-compose.prod.yml logs | grep ERROR
```

### Update Application

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild images
docker compose -f docker-compose.prod.yml build

# 3. Restart services (zero-downtime)
docker compose -f docker-compose.prod.yml up -d --no-deps --build web
docker compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway
docker compose -f docker-compose.prod.yml up -d --no-deps --build ocr-service

# 4. Run new migrations (if any)
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:migrate"
```

### Backup Database

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pricey pricey > backup-$(date +%Y%m%d).sql

# Restore backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U pricey pricey < backup-20251028.sql
```

### Backup Volumes

```bash
# Stop services (to ensure data consistency)
docker compose -f docker-compose.prod.yml stop

# Backup all volumes
docker run --rm -v pricey_postgres_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/postgres-$(date +%Y%m%d).tar.gz -C /data .
docker run --rm -v pricey_minio_data:/data -v $(pwd)/backups:/backup alpine tar czf /backup/minio-$(date +%Y%m%d).tar.gz -C /data .

# Restart services
docker compose -f docker-compose.prod.yml start
```

### Monitor Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Service-specific usage
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "ps aux && free -h"
```

### Cleanup

```bash
# Remove stopped containers
docker compose -f docker-compose.prod.yml down

# Remove images
docker compose -f docker-compose.prod.yml down --rmi all

# Remove volumes (⚠️ DESTRUCTIVE - deletes all data)
docker compose -f docker-compose.prod.yml down -v

# Prune unused Docker resources
docker system prune -a
```

---

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs service-name

# Check health status
docker inspect pricey-api-gateway-prod | grep -A 10 Health

# Restart single service
docker compose -f docker-compose.prod.yml restart api-gateway
```

### Database Connection Issues

```bash
# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "node -e \"
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  prisma.\$connect().then(() => console.log('Connected!')).catch(console.error);
\""

# Check PostgreSQL logs
docker compose -f docker-compose.prod.yml logs postgres
```

### Out of Memory

```bash
# Check memory usage
docker stats --no-stream

# Increase memory limits in docker-compose.prod.yml
# Under each service's deploy.resources.limits.memory

# Restart with new limits
docker compose -f docker-compose.prod.yml up -d
```

### Slow Performance

```bash
# Check if services are healthy
docker compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats

# Check network latency
docker compose -f docker-compose.prod.yml exec web ping -c 5 api-gateway

# Optimize:
# 1. Enable Redis caching
# 2. Increase memory limits
# 3. Use SSD for volumes
# 4. Add more CPU cores
```

### Cannot Access from Browser

```bash
# Check if ports are exposed
docker compose -f docker-compose.prod.yml ps

# Check firewall
sudo ufw status
sudo ufw allow 3000/tcp

# Check if service is listening
docker compose -f docker-compose.prod.yml exec web netstat -tuln | grep 3000

# Check CORS settings
# Verify CORS_ORIGIN in .env.production matches your domain
```

### LLM Parsing Fails

```bash
# For GitHub Models:
# 1. Verify GITHUB_TOKEN is valid
echo $GITHUB_TOKEN

# 2. Check API quota
curl -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/rate_limit

# For Ollama:
# 1. Check if Ollama is running
docker compose -f docker-compose.prod.yml ps ollama

# 2. Verify model is downloaded
docker compose -f docker-compose.prod.yml exec ollama ollama list

# 3. Pull model if missing
docker compose -f docker-compose.prod.yml exec ollama ollama pull llava
```

---

## Production Best Practices

### 1. Use Reverse Proxy

Set up Nginx or Traefik in front of your services:

```nginx
# nginx.conf example
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. Enable HTTPS

Use Let's Encrypt with Certbot or Traefik automatic SSL:

```bash
# Certbot
sudo certbot --nginx -d yourdomain.com
```

### 3. Set Up Monitoring

- **Uptime Robot**: Monitor service availability
- **Sentry**: Error tracking (already configured)
- **Prometheus + Grafana**: Metrics dashboard

### 4. Regular Backups

Set up automated daily backups:

```bash
# Add to crontab
0 2 * * * /path/to/Pricey/scripts/backup.sh
```

### 5. Security Hardening

```bash
# Disable unnecessary ports
# Run services as non-root users (already configured in Dockerfiles)
# Keep Docker and images updated
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

---

## Additional Resources

- **Main Documentation**: `/docs/README.md`
- **Architecture**: `/docs/ARCHITECTURE-CURRENT.md`
- **API Documentation**: `/docs/api/README.md`
- **Self-Hosting Guide**: `/docs/guides/self-hosting.md`
- **GitHub**: https://github.com/mpwg/Pricey

---

**Need Help?**

- GitHub Issues: https://github.com/mpwg/Pricey/issues
- Discussions: https://github.com/mpwg/Pricey/discussions
- Email: privacy@mpwg.eu
