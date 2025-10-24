# Self-Hosting Pricy

This guide provides comprehensive instructions for self-hosting Pricy using Docker on your own infrastructure.

## 📋 Table of Contents

1. [Overview](#overview)
2. [License Requirements](#license-requirements)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Production Deployment](#production-deployment)
6. [Configuration](#configuration)
7. [Database Setup](#database-setup)
8. [Storage Configuration](#storage-configuration)
9. [SSL/TLS Setup](#ssltls-setup)
10. [Reverse Proxy Configuration](#reverse-proxy-configuration)
11. [Backup and Restore](#backup-and-restore)
12. [Updates and Maintenance](#updates-and-maintenance)
13. [Monitoring](#monitoring)
14. [Security Hardening](#security-hardening)
15. [Troubleshooting](#troubleshooting)

---

## Overview

Pricy is designed to be easily self-hosted using Docker and Docker Compose. You can deploy it on:

- **Personal Servers**: Home server, Raspberry Pi
- **VPS**: DigitalOcean, Linode, Vultr, Hetzner
- **Cloud Providers**: AWS EC2, Google Cloud, Azure
- **Kubernetes**: Production-grade orchestration (advanced)

### Architecture

```
┌─────────────────┐
│   Reverse Proxy │ (Nginx/Caddy)
│   (SSL/TLS)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────┐
│  Web  │ │   API   │
│ (Next)│ │Gateway  │
└───────┘ └──┬──────┘
             │
    ┌────────┼────────┐
    │        │        │
┌───▼───┐ ┌─▼──┐ ┌───▼────┐
│  OCR  │ │Redis│ │MinIO/S3│
│Service│ │     │ │        │
└───────┘ └────┘ └────────┘
             │
        ┌────▼─────┐
        │PostgreSQL│
        └──────────┘
```

---

## License Requirements

Pricy is licensed under **AGPL-3.0** (GNU Affero General Public License v3.0).

### What This Means for Self-Hosting

✅ **You Can:**

- Host Pricy for personal use
- Host Pricy for your organization
- Modify the source code
- Run multiple instances
- Use it commercially

⚠️ **You Must:**

- Provide access to the source code (including modifications) to users
- Display a prominent notice with link to source code
- Keep the AGPL-3.0 license intact
- Share any modifications under AGPL-3.0

📖 **Key Requirement:**
If you run a modified version of Pricy as a network service (accessible over the internet), you **must** make the modified source code available to your users.

### Compliance Options

1. **Use Unmodified Version**: Deploy as-is, link to official repository
2. **Open-Source Modifications**: Fork and publish your changes
3. **Display Source Link**: Add link to your fork in the UI footer

**Example Footer Notice:**

```
Powered by Pricy (AGPL-3.0) | Source Code: https://github.com/yourusername/pricy
```

For full license text, see [LICENSE](../../LICENSE) or visit:
https://www.gnu.org/licenses/agpl-3.0.en.html

---

## Prerequisites

### Hardware Requirements

**Minimum:**

- 2 CPU cores
- 4 GB RAM
- 20 GB disk space
- 100 Mbps network

**Recommended:**

- 4 CPU cores
- 8 GB RAM
- 50 GB SSD
- 1 Gbps network

### Software Requirements

- **Docker**: v20.10 or later
- **Docker Compose**: v2.0 or later
- **Linux**: Ubuntu 22.04 LTS, Debian 11, or similar
- **Domain Name**: For SSL/TLS (optional but recommended)

### Installation

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo apt-get install docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## Quick Start

For local testing and development:

```bash
# Clone the repository
git clone https://github.com/yourusername/pricy.git
cd pricy

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Access the application
open http://localhost:3000
```

The app will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **MinIO Console**: http://localhost:9001

---

## Production Deployment

For production, use the dedicated production compose file:

```bash
# Clone the repository
git clone https://github.com/yourusername/pricy.git
cd pricy

# Copy production environment template
cp .env.production.example .env.production

# Edit production configuration
nano .env.production

# Start with production configuration
docker compose -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec api-gateway pnpm db:migrate

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## Configuration

### Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
APP_URL=https://pricy.yourdomain.com

# Database (PostgreSQL)
DATABASE_URL=postgresql://pricy:STRONG_PASSWORD@postgres:5432/pricy
POSTGRES_USER=pricy
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE
POSTGRES_DB=pricy

# Redis
REDIS_URL=redis://redis:6379

# Storage (S3/MinIO)
S3_ENDPOINT=https://s3.yourdomain.com
S3_BUCKET=pricy-receipts
S3_ACCESS_KEY=YOUR_ACCESS_KEY
S3_SECRET_KEY=YOUR_SECRET_KEY
S3_REGION=us-east-1

# API Configuration
API_PORT=3001
API_HOST=0.0.0.0
JWT_SECRET=GENERATE_RANDOM_SECRET_HERE
API_RATE_LIMIT=100

# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://pricy.yourdomain.com

# OCR Service
OCR_PROVIDER=tesseract
OCR_TIMEOUT=30000

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### Generate Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate S3 credentials
openssl rand -hex 20
```

---

## Database Setup

### Using Docker PostgreSQL

The default `docker-compose.prod.yml` includes PostgreSQL:

```yaml
postgres:
  image: postgres:15-alpine
  restart: always
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    POSTGRES_DB: ${POSTGRES_DB}
  volumes:
    - postgres_data:/var/lib/postgresql/data
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
    interval: 10s
    timeout: 5s
    retries: 5
```

### Using External Database

To use an external PostgreSQL instance (recommended for production):

1. Remove the `postgres` service from `docker-compose.prod.yml`
2. Update `DATABASE_URL` to point to your external database:

```bash
DATABASE_URL=postgresql://user:password@your-db-host:5432/pricy
```

### Running Migrations

```bash
# Initial migration
docker compose -f docker-compose.prod.yml exec api-gateway pnpm db:migrate

# Seed initial data (stores, etc.)
docker compose -f docker-compose.prod.yml exec api-gateway pnpm db:seed
```

### Database Backups

Automated daily backups:

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="pricy-postgres-1"

mkdir -p $BACKUP_DIR
docker exec $CONTAINER_NAME pg_dump -U pricy pricy | gzip > "$BACKUP_DIR/pricy_$DATE.sql.gz"

# Keep only last 7 days
find $BACKUP_DIR -name "pricy_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup-db.sh

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /path/to/backup-db.sh" | crontab -
```

---

## Storage Configuration

### Using MinIO (Default)

MinIO is included in the Docker Compose setup:

```yaml
minio:
  image: minio/minio
  command: server /data --console-address ":9001"
  environment:
    MINIO_ROOT_USER: ${S3_ACCESS_KEY}
    MINIO_ROOT_PASSWORD: ${S3_SECRET_KEY}
  volumes:
    - minio_data:/data
  ports:
    - "9000:9000"
    - "9001:9001"
```

Access MinIO console at `http://your-server:9001` to create buckets.

### Using AWS S3

To use AWS S3 instead:

1. Remove the `minio` service from `docker-compose.prod.yml`
2. Update environment variables:

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=your-aws-access-key
S3_SECRET_KEY=your-aws-secret-key
S3_REGION=us-east-1
```

### Using Cloudflare R2

```bash
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
S3_BUCKET=pricy-receipts
S3_ACCESS_KEY=your-r2-access-key
S3_SECRET_KEY=your-r2-secret-key
S3_REGION=auto
```

---

## SSL/TLS Setup

### Option 1: Caddy (Recommended - Automatic SSL)

Caddy automatically obtains and renews Let's Encrypt certificates.

**Caddyfile:**

```
pricy.yourdomain.com {
    reverse_proxy web:3000
}

api.yourdomain.com {
    reverse_proxy api-gateway:3001
}
```

**docker-compose.prod.yml addition:**

```yaml
caddy:
  image: caddy:2-alpine
  restart: always
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./Caddyfile:/etc/caddy/Caddyfile
    - caddy_data:/data
    - caddy_config:/config
```

### Option 2: Nginx with Certbot

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name pricy.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name pricy.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pricy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pricy.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://web:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pricy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pricy.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://api-gateway:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Obtain certificate:**

```bash
sudo certbot certonly --standalone -d pricy.yourdomain.com -d api.yourdomain.com
```

---

## Reverse Proxy Configuration

### Nginx Configuration

Complete example at `/etc/nginx/sites-available/pricy`:

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=5r/s;

# Frontend
server {
    listen 443 ssl http2;
    server_name pricy.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pricy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pricy.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/pricy.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pricy.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    client_max_body_size 10M;

    location /api/v1/receipts/upload {
        limit_req zone=upload_limit burst=10 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Backup and Restore

### Complete Backup Script

```bash
#!/bin/bash
# backup-all.sh

set -e

BACKUP_DIR="/backups/pricy"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR/$DATE"

echo "Starting Pricy backup..."

# 1. Backup PostgreSQL database
echo "Backing up database..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pricy pricy | \
    gzip > "$BACKUP_DIR/$DATE/database.sql.gz"

# 2. Backup MinIO data (if using)
echo "Backing up storage..."
docker compose -f docker-compose.prod.yml exec -T minio \
    mc mirror /data "$BACKUP_DIR/$DATE/minio"

# 3. Backup environment configuration
echo "Backing up configuration..."
cp .env.production "$BACKUP_DIR/$DATE/.env.production"

# 4. Create backup metadata
cat > "$BACKUP_DIR/$DATE/metadata.json" << EOF
{
  "timestamp": "$(date -Iseconds)",
  "version": "$(git describe --tags --always)",
  "commit": "$(git rev-parse HEAD)"
}
EOF

# 5. Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/pricy_backup_$DATE.tar.gz" -C "$BACKUP_DIR" "$DATE"
rm -rf "$BACKUP_DIR/$DATE"

# 6. Keep only last 30 days
find "$BACKUP_DIR" -name "pricy_backup_*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/pricy_backup_$DATE.tar.gz"
```

### Restore from Backup

```bash
#!/bin/bash
# restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: ./restore.sh <backup-file.tar.gz>"
    exit 1
fi

# Extract backup
tar -xzf "$BACKUP_FILE" -C /tmp

# Restore database
docker compose -f docker-compose.prod.yml exec -T postgres \
    psql -U pricy -d pricy < /tmp/backup/database.sql

# Restore storage
docker compose -f docker-compose.prod.yml exec -T minio \
    mc mirror /tmp/backup/minio /data

echo "Restore completed!"
```

---

## Updates and Maintenance

### Updating to New Version

```bash
# 1. Backup current installation
./backup-all.sh

# 2. Pull latest changes
git fetch origin
git checkout main
git pull origin main

# 3. Pull new Docker images
docker compose -f docker-compose.prod.yml pull

# 4. Stop services
docker compose -f docker-compose.prod.yml down

# 5. Run database migrations
docker compose -f docker-compose.prod.yml up -d postgres redis
docker compose -f docker-compose.prod.yml run --rm api-gateway pnpm db:migrate

# 6. Start all services
docker compose -f docker-compose.prod.yml up -d

# 7. Verify everything works
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

### Rollback Procedure

```bash
# 1. Stop services
docker compose -f docker-compose.prod.yml down

# 2. Checkout previous version
git checkout <previous-tag>

# 3. Restore from backup
./restore.sh /backups/pricy/pricy_backup_YYYYMMDD_HHMMSS.tar.gz

# 4. Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## Monitoring

### Health Checks

Check service health:

```bash
# API health
curl https://api.yourdomain.com/health

# Database health
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U pricy

# Redis health
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

### Logs

```bash
# View all logs
docker compose -f docker-compose.prod.yml logs -f

# View specific service
docker compose -f docker-compose.prod.yml logs -f api-gateway

# View last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 api-gateway
```

### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Cleanup unused images
docker system prune -a
```

### Monitoring Stack (Optional)

Add Prometheus + Grafana for advanced monitoring:

```yaml
# Add to docker-compose.prod.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
    - prometheus_data:/prometheus
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  volumes:
    - grafana_data:/var/lib/grafana
  ports:
    - "3030:3000"
  environment:
    - GF_SECURITY_ADMIN_PASSWORD=admin
```

---

## Security Hardening

### Checklist

- [ ] Use strong passwords for all services
- [ ] Keep Docker and system packages updated
- [ ] Use SSL/TLS for all connections
- [ ] Enable firewall (ufw/firewalld)
- [ ] Restrict database access to localhost
- [ ] Use secrets management for sensitive data
- [ ] Enable fail2ban for SSH protection
- [ ] Regular security audits
- [ ] Monitor logs for suspicious activity
- [ ] Keep backups encrypted and offsite

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Docker Security

```yaml
# Add security options to services
services:
  api-gateway:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check if ports are already in use
sudo netstat -tulpn | grep -E ':(80|443|3000|3001|5432|6379)'

# Restart services
docker compose -f docker-compose.prod.yml restart
```

#### Database Connection Errors

```bash
# Check database is running
docker compose -f docker-compose.prod.yml ps postgres

# Check database logs
docker compose -f docker-compose.prod.yml logs postgres

# Test connection
docker compose -f docker-compose.prod.yml exec postgres psql -U pricy -d pricy
```

#### OCR Processing Fails

```bash
# Check OCR service logs
docker compose -f docker-compose.prod.yml logs ocr-service

# Check Redis connection
docker compose -f docker-compose.prod.yml exec redis redis-cli ping

# Restart OCR service
docker compose -f docker-compose.prod.yml restart ocr-service
```

#### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker
docker system prune -a --volumes

# Check large files
du -sh /var/lib/docker/*
```

### Getting Help

- **GitHub Issues**: https://github.com/yourusername/pricy/issues
- **Discussions**: https://github.com/yourusername/pricy/discussions
- **Documentation**: https://github.com/yourusername/pricy/tree/main/docs

### Reporting Bugs

When reporting issues, include:

1. Docker version: `docker --version`
2. Docker Compose version: `docker compose version`
3. Operating system: `uname -a`
4. Error logs: `docker compose logs`
5. Configuration (sanitized): `.env.production`

---

## Additional Resources

- [Pricy Documentation](../../README.md)
- [Architecture Overview](../architecture.md)
- [API Documentation](../api/README.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [AGPL-3.0 License](../../LICENSE)

---

**Last Updated**: October 24, 2025  
**Maintainer**: Pricy Team  
**License**: AGPL-3.0

For questions about self-hosting, open a [GitHub Discussion](https://github.com/yourusername/pricy/discussions).
