# Docker Quick Reference

Quick reference for common Docker operations with Pricey.

## Starting Services

```bash
# Development (infrastructure only)
pnpm docker:dev

# Production (full stack)
docker compose -f docker-compose.prod.yml up -d

# Or use the deployment script
./scripts/docker-deploy.sh
```

## Stopping Services

```bash
# Development
pnpm docker:dev:down

# Production
docker compose -f docker-compose.prod.yml down

# Stop without removing containers
docker compose -f docker-compose.prod.yml stop
```

## Viewing Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f api-gateway
docker compose -f docker-compose.prod.yml logs -f web
docker compose -f docker-compose.prod.yml logs -f ocr-service

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api-gateway
```

## Service Status

```bash
# Check running containers
docker compose -f docker-compose.prod.yml ps

# Container resource usage
docker stats

# Health check
curl http://localhost:3001/health
```

## Database Operations

```bash
# Run migrations
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:migrate"

# Seed data
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:seed"

# Open Prisma Studio
docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:studio"

# Backup database
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pricey pricey > backup.sql

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres psql -U pricey pricey < backup.sql
```

## Updating Services

```bash
# Pull latest code
git pull origin main

# Rebuild specific service
docker compose -f docker-compose.prod.yml build api-gateway

# Restart with zero-downtime
docker compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway

# Or update all services
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Debugging

```bash
# Shell into container
docker compose -f docker-compose.prod.yml exec api-gateway sh
docker compose -f docker-compose.prod.yml exec web sh

# Run commands in container
docker compose -f docker-compose.prod.yml exec api-gateway node -v
docker compose -f docker-compose.prod.yml exec web npm ls

# Inspect container
docker inspect pricey-api-gateway-prod

# View environment variables
docker compose -f docker-compose.prod.yml exec api-gateway env
```

## Cleanup

```bash
# Remove stopped containers
docker compose -f docker-compose.prod.yml down

# Remove images
docker compose -f docker-compose.prod.yml down --rmi all

# Remove volumes (⚠️ DESTRUCTIVE)
docker compose -f docker-compose.prod.yml down -v

# Clean unused Docker resources
docker system prune -a
```

## Backup & Restore

```bash
# Backup all volumes
./scripts/docker-deploy.sh  # Choose option 6

# Manual volume backup
docker run --rm -v pricey_postgres_data:/data -v $(pwd)/backups:/backup alpine \
  tar czf /backup/postgres-$(date +%Y%m%d).tar.gz -C /data .

# Restore volume
docker run --rm -v pricey_postgres_data:/data -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/postgres-20251028.tar.gz -C /data
```

## Monitoring

```bash
# Container stats
docker stats

# Service health
docker compose -f docker-compose.prod.yml ps

# Check specific health endpoint
curl http://localhost:3001/health
curl http://localhost:3002/health

# View resource limits
docker compose -f docker-compose.prod.yml config | grep -A 5 resources
```

## Network

```bash
# List networks
docker network ls

# Inspect network
docker network inspect pricey_pricey-network

# Test connectivity between containers
docker compose -f docker-compose.prod.yml exec web ping -c 3 api-gateway
```

## Ports

| Service     | Port  | Description           |
| ----------- | ----- | --------------------- |
| Web         | 3000  | Next.js frontend      |
| API Gateway | 3001  | Fastify API           |
| OCR Service | 3002  | Receipt parsing       |
| PostgreSQL  | 5432  | Database              |
| Redis       | 6379  | Cache                 |
| MinIO API   | 9000  | S3-compatible storage |
| MinIO UI    | 9001  | Web console           |
| Ollama      | 11434 | LLM API (optional)    |

## Environment Files

- `.env.local` - Development (not committed)
- `.env.production` - Production (not committed)
- `.env.production.example` - Template

## Common Issues

**Port already in use:**

```bash
# Find process using port
lsof -i :3000
# or
netstat -tuln | grep 3000

# Change port in .env.production
WEB_PORT=3005
```

**Out of disk space:**

```bash
# Check Docker disk usage
docker system df

# Clean up
docker system prune -a
docker volume prune
```

**Service won't start:**

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs service-name

# Restart service
docker compose -f docker-compose.prod.yml restart service-name

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --no-deps --build service-name
```

## Useful Scripts

```bash
# Deployment script (interactive)
./scripts/docker-deploy.sh

# Development infrastructure only
pnpm docker:dev

# Full production stack
docker compose -f docker-compose.prod.yml up -d
```

## More Information

- [Docker Deployment Guide](./guides/docker-deployment.md)
- [Self-Hosting Guide](./guides/self-hosting.md)
- [Architecture](./ARCHITECTURE-CURRENT.md)
