# Deployment Guide

> **Complete guide to deploying Pricy in various environments**

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Local/Self-Hosted Deployment](#localself-hosted-deployment)
3. [Cloud Deployment (AWS)](#cloud-deployment-aws)
4. [Cloud Deployment (Google Cloud)](#cloud-deployment-google-cloud)
5. [Docker Deployment](#docker-deployment)
6. [Kubernetes Deployment](#kubernetes-deployment)
7. [Environment Variables](#environment-variables)
8. [Database Migrations](#database-migrations)
9. [Monitoring & Logging](#monitoring--logging)
10. [Rollback Strategy](#rollback-strategy)

## Deployment Options

### Option 1: Local/Self-Hosted

- **Best for**: Small deployments, personal use, on-premises
- **Infrastructure**: Single server or Docker Compose
- **Cost**: Hardware/VPS only
- **Complexity**: Low

### Option 2: Cloud (Managed Services)

- **Best for**: Production deployments, scalability
- **Infrastructure**: AWS, Google Cloud, Azure
- **Cost**: Pay-as-you-go
- **Complexity**: Medium

### Option 3: Kubernetes

- **Best for**: Large-scale deployments, high availability
- **Infrastructure**: K8s cluster (EKS, GKE, self-hosted)
- **Cost**: Variable
- **Complexity**: High

## Local/Self-Hosted Deployment

### Prerequisites

- Docker & Docker Compose
- Domain name (optional, for HTTPS)
- Minimum 2GB RAM, 20GB disk space

### Step 1: Clone Repository

```bash
git clone https://github.com/yourorg/pricy.git
cd pricy
```

### Step 2: Configure Environment

```bash
cp .env.example .env.production
```

Edit `.env.production`:

```bash
# Production settings
NODE_ENV=production

# Database
DATABASE_URL="postgresql://pricy:SECURE_PASSWORD@postgres:5432/pricy"

# Redis
REDIS_URL="redis://redis:6379"

# Storage (MinIO)
S3_ENDPOINT="http://minio:9000"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET="pricy-receipts"

# OCR (use Tesseract for self-hosted)
OCR_PROVIDER="tesseract"

# JWT Secrets (CHANGE THESE!)
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# URLs
API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

### Step 3: Build Docker Images

```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml build
```

### Step 4: Start Services

```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

### Step 5: Run Migrations

```bash
docker-compose -f infrastructure/docker/docker-compose.prod.yml exec api pnpm db:migrate
```

### Step 6: Set Up Reverse Proxy (Nginx)

Create `/etc/nginx/sites-available/pricy`:

```nginx
# API Gateway
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name pricy.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/pricy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 7: Enable HTTPS (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pricy.yourdomain.com -d api.yourdomain.com
```

## Cloud Deployment (AWS)

### Architecture

```
┌─────────────────────────────────────────────────┐
│                 CloudFront CDN                  │
│            (Static Assets + SSL)                │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
┌──────────────┐           ┌──────────────────┐
│   S3 Bucket  │           │  ALB (Load       │
│  (Frontend)  │           │   Balancer)      │
└──────────────┘           └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
              ┌─────────┐    ┌─────────┐    ┌─────────┐
              │ ECS/    │    │ ECS/    │    │ ECS/    │
              │ Fargate │    │ Fargate │    │ Fargate │
              │ (API)   │    │ (OCR)   │    │ (Other) │
              └─────────┘    └─────────┘    └─────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │      RDS (PostgreSQL)        │
                    │   ElastiCache (Redis)        │
                    │         S3 (Storage)         │
                    └──────────────────────────────┘
```

### Prerequisites

- AWS Account
- AWS CLI configured
- Terraform installed (optional)

### Option A: Manual Setup

#### 1. Create RDS Database

```bash
aws rds create-db-instance \
  --db-instance-identifier pricy-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username pricy \
  --master-user-password YOUR_PASSWORD \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx
```

#### 2. Create ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id pricy-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### 3. Create S3 Bucket

```bash
aws s3 mb s3://pricy-receipts
aws s3api put-bucket-versioning \
  --bucket pricy-receipts \
  --versioning-configuration Status=Enabled
```

#### 4. Create ECR Repositories

```bash
aws ecr create-repository --repository-name pricy/api
aws ecr create-repository --repository-name pricy/ocr
aws ecr create-repository --repository-name pricy/product
aws ecr create-repository --repository-name pricy/analytics
```

#### 5. Build and Push Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t pricy/api -f apps/api/Dockerfile .
docker tag pricy/api:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricy/api:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricy/api:latest

# Repeat for other services...
```

#### 6. Create ECS Cluster

```bash
aws ecs create-cluster --cluster-name pricy-cluster
```

#### 7. Create Task Definitions and Services

Create `task-definition.json`:

```json
{
  "family": "pricy-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/pricy/api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://..."
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/pricy-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

Create service:

```bash
aws ecs create-service \
  --cluster pricy-cluster \
  --service-name pricy-api \
  --task-definition pricy-api \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}"
```

### Option B: Infrastructure as Code (Terraform)

See `infrastructure/terraform/` directory for complete Terraform configuration.

```bash
cd infrastructure/terraform/environments/production
terraform init
terraform plan
terraform apply
```

## Cloud Deployment (Google Cloud)

### Architecture

- **Frontend**: Firebase Hosting or Cloud Storage + Cloud CDN
- **Backend**: Cloud Run (serverless containers)
- **Database**: Cloud SQL (PostgreSQL)
- **Cache**: Memorystore (Redis)
- **Storage**: Cloud Storage
- **OCR**: Cloud Vision API

### Deployment Steps

#### 1. Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sql-component.googleapis.com \
  redis.googleapis.com \
  vision.googleapis.com \
  storage-api.googleapis.com
```

#### 2. Create Cloud SQL Instance

```bash
gcloud sql instances create pricy-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1
```

#### 3. Create Redis Instance

```bash
gcloud redis instances create pricy-cache \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

#### 4. Create Storage Bucket

```bash
gsutil mb -l us-central1 gs://pricy-receipts
gsutil uniformbucketlevelaccess set on gs://pricy-receipts
```

#### 5. Build and Deploy to Cloud Run

```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/pricy-api apps/api

# Deploy to Cloud Run
gcloud run deploy pricy-api \
  --image gcr.io/PROJECT_ID/pricy-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=postgresql://... \
  --add-cloudsql-instances PROJECT_ID:us-central1:pricy-db
```

## Docker Deployment

### Production Docker Compose

```yaml
# infrastructure/docker/docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: pricy
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: pricy
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:8-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    restart: always

  api:
    build:
      context: ../..
      dockerfile: apps/api/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pricy:${POSTGRES_PASSWORD}@postgres:5432/pricy
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
    depends_on:
      - postgres
      - redis
      - minio
    restart: always

  ocr:
    build:
      context: ../..
      dockerfile: services/ocr/Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pricy:${POSTGRES_PASSWORD}@postgres:5432/pricy
      REDIS_HOST: redis
    depends_on:
      - postgres
      - redis
    restart: always

  web:
    build:
      context: ../..
      dockerfile: apps/web/Dockerfile
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${API_URL}
    depends_on:
      - api
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
      - web
    restart: always

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (EKS, GKE, or self-hosted)
- kubectl configured
- Helm installed

### Deploy with Helm

```bash
cd infrastructure/kubernetes
helm install pricy ./helm-chart \
  --namespace pricy \
  --create-namespace \
  --values values.production.yaml
```

### Manual Deployment

```bash
kubectl apply -f infrastructure/kubernetes/base/
kubectl apply -f infrastructure/kubernetes/overlays/production/
```

## Environment Variables

### Production Environment Variables

```bash
# App
NODE_ENV=production
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:pass@host:5432/pricy
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL=redis://host:6379
REDIS_PASSWORD=secure-password

# Storage
S3_BUCKET=pricy-receipts
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=AKIA...
S3_SECRET_ACCESS_KEY=...

# OCR
OCR_PROVIDER=google  # or aws
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Authentication
JWT_SECRET=very-secure-secret
JWT_REFRESH_SECRET=another-secure-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# URLs
API_URL=https://api.pricy.app
NEXT_PUBLIC_API_URL=https://api.pricy.app
ALLOWED_ORIGINS=https://pricy.app,https://www.pricy.app

# Monitoring
SENTRY_DSN=https://...@sentry.io/...
NEW_RELIC_LICENSE_KEY=...
```

## Database Migrations

### Running Migrations in Production

**Important**: Always backup your database before running migrations!

```bash
# Backup database
pg_dump -h localhost -U pricy pricy > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
pnpm --filter @pricy/database migrate deploy

# Or in Docker
docker-compose exec api pnpm db:migrate
```

### Migration Rollback

Prisma doesn't support automatic rollbacks. To rollback:

1. Restore from backup
2. Deploy previous application version
3. Fix migration and redeploy

## Monitoring & Logging

### Application Monitoring

- **Error Tracking**: Sentry
- **APM**: New Relic or Datadog
- **Uptime**: UptimeRobot or Pingdom

### Infrastructure Monitoring

- **Metrics**: Prometheus + Grafana
- **Logs**: ELK Stack or CloudWatch
- **Alerts**: PagerDuty or OpsGenie

### Health Checks

All services expose health check endpoints:

```bash
# API Gateway
curl https://api.pricy.app/health

# Individual services
curl http://ocr-service:3002/health
```

## Rollback Strategy

### Automated Rollback

Use blue-green deployment or canary releases:

1. Deploy new version alongside old version
2. Route small percentage of traffic to new version
3. Monitor error rates and metrics
4. Gradually increase traffic or rollback if issues

### Manual Rollback

```bash
# Docker
docker-compose -f docker-compose.prod.yml down
git checkout previous-release-tag
docker-compose -f docker-compose.prod.yml up -d

# Kubernetes
kubectl rollout undo deployment/pricy-api -n pricy

# Cloud Run
gcloud run services update-traffic pricy-api \
  --to-revisions=pricy-api-00002-abc=100
```

## Post-Deployment Checklist

- [ ] All services are healthy
- [ ] Database migrations completed successfully
- [ ] Static assets are being served from CDN
- [ ] SSL certificates are valid
- [ ] Environment variables are set correctly
- [ ] Logs are being collected
- [ ] Monitoring alerts are configured
- [ ] Backups are running
- [ ] Performance is within acceptable range
- [ ] Error rates are normal
- [ ] Security headers are set
- [ ] Rate limiting is working
- [ ] CORS is configured correctly

## Troubleshooting

### Service Won't Start

1. Check logs: `docker-compose logs service-name`
2. Verify environment variables
3. Check network connectivity
4. Ensure dependencies are running

### Database Connection Issues

1. Verify connection string
2. Check firewall rules
3. Ensure database is running
4. Test connection manually:
   ```bash
   psql $DATABASE_URL
   ```

### High Memory Usage

1. Check for memory leaks
2. Adjust Node.js memory limits:
   ```bash
   NODE_OPTIONS="--max-old-space-size=2048"
   ```
3. Scale horizontally

## Support

For deployment issues:

- Check documentation in `/docs`
- Search GitHub issues
- Contact DevOps team
- Create support ticket

---

**Last Updated**: October 2025  
**Maintained by**: Pricy DevOps Team
