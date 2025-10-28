#!/usr/bin/env bash

# Pricey - Docker Production Deployment Script
# Copyright (C) 2025 Matthias Wallner-Géhri
# Licensed under AGPL-3.0

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Pricey - Docker Production Deployment           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Change to project root
cd "$PROJECT_ROOT"

# Check if docker and docker-compose are available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Error: Docker Compose v2 is not available${NC}"
    echo "Please update Docker to get Compose v2"
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Warning: .env.production not found${NC}"
    echo "Creating from .env.production.example..."
    
    if [ -f .env.production.example ]; then
        cp .env.production.example .env.production
        echo -e "${GREEN}✓ Created .env.production${NC}"
        echo -e "${YELLOW}⚠️  Please edit .env.production with your production values before continuing${NC}"
        echo ""
        read -p "Press Enter to continue after editing .env.production, or Ctrl+C to exit..."
    else
        echo -e "${RED}Error: .env.production.example not found${NC}"
        exit 1
    fi
fi

# Validate required environment variables
echo -e "${BLUE}→ Validating environment configuration...${NC}"
required_vars=(
    "POSTGRES_PASSWORD"
    "REDIS_PASSWORD"
    "MINIO_ROOT_USER"
    "MINIO_ROOT_PASSWORD"
    "SESSION_SECRET"
)

source .env.production 2>/dev/null || true

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ] || [[ "${!var:-}" == *"CHANGE_ME"* ]]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo -e "${RED}Error: The following required variables are missing or use default values:${NC}"
    for var in "${missing_vars[@]}"; do
        echo -e "  ${RED}✗${NC} $var"
    done
    echo ""
    echo "Please update .env.production with proper values"
    exit 1
fi

echo -e "${GREEN}✓ Environment configuration is valid${NC}"
echo ""

# Ask for deployment action
echo "Select deployment action:"
echo "  1) Deploy (build and start all services)"
echo "  2) Update (rebuild and restart services)"
echo "  3) Stop all services"
echo "  4) View logs"
echo "  5) Database operations"
echo "  6) Backup data"
echo "  7) Health check"
echo "  8) Exit"
echo ""
read -p "Enter choice [1-8]: " choice

case $choice in
    1)
        # Full deployment
        echo -e "${BLUE}→ Building Docker images...${NC}"
        docker compose -f docker-compose.prod.yml build
        
        echo -e "${BLUE}→ Starting services...${NC}"
        docker compose -f docker-compose.prod.yml up -d
        
        echo -e "${BLUE}→ Waiting for services to be healthy...${NC}"
        sleep 10
        
        echo -e "${BLUE}→ Running database migrations...${NC}"
        docker compose -f docker-compose.prod.yml exec -T api-gateway sh -c "cd /app && pnpm db:migrate"
        
        echo -e "${BLUE}→ Seeding initial data...${NC}"
        docker compose -f docker-compose.prod.yml exec -T api-gateway sh -c "cd /app && pnpm db:seed"
        
        echo ""
        echo -e "${GREEN}✓ Deployment complete!${NC}"
        echo ""
        echo "Services are available at:"
        echo "  • Web Frontend: http://localhost:${WEB_PORT:-3000}"
        echo "  • API Gateway:  http://localhost:${API_PORT:-3001}"
        echo "  • OCR Service:  http://localhost:${OCR_PORT:-3002}"
        echo "  • MinIO Console: http://localhost:${MINIO_CONSOLE_PORT:-9001}"
        echo ""
        echo "View logs: docker compose -f docker-compose.prod.yml logs -f"
        ;;
        
    2)
        # Update deployment
        echo -e "${BLUE}→ Pulling latest code...${NC}"
        git pull origin main || true
        
        echo -e "${BLUE}→ Rebuilding images...${NC}"
        docker compose -f docker-compose.prod.yml build
        
        echo -e "${BLUE}→ Restarting services with zero-downtime...${NC}"
        docker compose -f docker-compose.prod.yml up -d --no-deps --build web
        docker compose -f docker-compose.prod.yml up -d --no-deps --build api-gateway
        docker compose -f docker-compose.prod.yml up -d --no-deps --build ocr-service
        
        echo -e "${BLUE}→ Running database migrations...${NC}"
        docker compose -f docker-compose.prod.yml exec -T api-gateway sh -c "cd /app && pnpm db:migrate" || true
        
        echo ""
        echo -e "${GREEN}✓ Update complete!${NC}"
        ;;
        
    3)
        # Stop services
        echo -e "${YELLOW}→ Stopping all services...${NC}"
        docker compose -f docker-compose.prod.yml stop
        
        echo ""
        echo -e "${GREEN}✓ All services stopped${NC}"
        echo "To start again: docker compose -f docker-compose.prod.yml start"
        ;;
        
    4)
        # View logs
        echo "Select service to view logs:"
        echo "  1) All services"
        echo "  2) Web frontend"
        echo "  3) API Gateway"
        echo "  4) OCR Service"
        echo "  5) PostgreSQL"
        echo "  6) Redis"
        echo ""
        read -p "Enter choice [1-6]: " log_choice
        
        case $log_choice in
            1) docker compose -f docker-compose.prod.yml logs -f ;;
            2) docker compose -f docker-compose.prod.yml logs -f web ;;
            3) docker compose -f docker-compose.prod.yml logs -f api-gateway ;;
            4) docker compose -f docker-compose.prod.yml logs -f ocr-service ;;
            5) docker compose -f docker-compose.prod.yml logs -f postgres ;;
            6) docker compose -f docker-compose.prod.yml logs -f redis ;;
            *) echo "Invalid choice" ;;
        esac
        ;;
        
    5)
        # Database operations
        echo "Database operations:"
        echo "  1) Run migrations"
        echo "  2) Seed data"
        echo "  3) Open Prisma Studio"
        echo "  4) Backup database"
        echo "  5) Restore database"
        echo ""
        read -p "Enter choice [1-5]: " db_choice
        
        case $db_choice in
            1)
                docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:migrate"
                ;;
            2)
                docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:seed"
                ;;
            3)
                echo -e "${BLUE}→ Starting Prisma Studio...${NC}"
                docker compose -f docker-compose.prod.yml exec api-gateway sh -c "cd /app && pnpm db:studio"
                ;;
            4)
                backup_file="backups/pricey-$(date +%Y%m%d-%H%M%S).sql"
                mkdir -p backups
                echo -e "${BLUE}→ Creating database backup: $backup_file${NC}"
                docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U pricey pricey > "$backup_file"
                echo -e "${GREEN}✓ Backup created: $backup_file${NC}"
                ;;
            5)
                ls -1 backups/*.sql 2>/dev/null || { echo "No backups found"; exit 1; }
                echo ""
                read -p "Enter backup filename to restore: " backup_file
                if [ -f "$backup_file" ]; then
                    echo -e "${YELLOW}⚠️  This will overwrite the current database!${NC}"
                    read -p "Are you sure? (yes/no): " confirm
                    if [ "$confirm" = "yes" ]; then
                        docker compose -f docker-compose.prod.yml exec -T postgres psql -U pricey pricey < "$backup_file"
                        echo -e "${GREEN}✓ Database restored${NC}"
                    fi
                else
                    echo -e "${RED}Error: Backup file not found${NC}"
                fi
                ;;
            *)
                echo "Invalid choice"
                ;;
        esac
        ;;
        
    6)
        # Backup volumes
        backup_dir="backups/volumes-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"
        
        echo -e "${BLUE}→ Stopping services for consistent backup...${NC}"
        docker compose -f docker-compose.prod.yml stop
        
        echo -e "${BLUE}→ Backing up PostgreSQL volume...${NC}"
        docker run --rm -v pricey_postgres_data:/data -v "$(pwd)/$backup_dir:/backup" alpine \
            tar czf /backup/postgres.tar.gz -C /data .
        
        echo -e "${BLUE}→ Backing up MinIO volume...${NC}"
        docker run --rm -v pricey_minio_data:/data -v "$(pwd)/$backup_dir:/backup" alpine \
            tar czf /backup/minio.tar.gz -C /data .
        
        echo -e "${BLUE}→ Restarting services...${NC}"
        docker compose -f docker-compose.prod.yml start
        
        echo ""
        echo -e "${GREEN}✓ Backups created in: $backup_dir${NC}"
        ;;
        
    7)
        # Health check
        echo -e "${BLUE}→ Checking service health...${NC}"
        echo ""
        
        services=("web:3000" "api-gateway:3001/health" "ocr-service:3002/health")
        
        for service in "${services[@]}"; do
            IFS=':' read -r name endpoint <<< "$service"
            if curl -sf "http://localhost:$endpoint" > /dev/null 2>&1; then
                echo -e "  ${GREEN}✓${NC} $name is healthy"
            else
                echo -e "  ${RED}✗${NC} $name is not responding"
            fi
        done
        
        echo ""
        echo -e "${BLUE}→ Container status:${NC}"
        docker compose -f docker-compose.prod.yml ps
        ;;
        
    8)
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
