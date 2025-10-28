#!/usr/bin/env bash
###############################################################################
# Deployment Helper Script
# Copyright (C) 2025 Matthias Wallner-Géhri
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERCEL_PROJECT="pricey-web"
RAILWAY_PROJECT="pricey-api"
PRODUCTION_URL="https://pricey.mpwg.eu"
STAGING_URL="https://staging.pricey.mpwg.eu"

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

###############################################################################
# Pre-deployment Checks
###############################################################################

pre_deployment_checks() {
  log_info "Running pre-deployment checks..."

  # Check for uncommitted changes
  if [[ -n $(git status -s) ]]; then
    log_warning "You have uncommitted changes. Commit or stash them before deploying."
    git status -s
    return 1
  fi

  # Run tests
  log_info "Running tests..."
  if ! pnpm test; then
    log_error "Tests failed! Fix them before deploying."
    return 1
  fi

  # Run linter
  log_info "Running linter..."
  if ! pnpm lint; then
    log_error "Linting failed! Fix errors before deploying."
    return 1
  fi

  # Type check
  log_info "Type checking..."
  if ! pnpm typecheck; then
    log_error "Type checking failed! Fix errors before deploying."
    return 1
  fi

  # Check for outdated dependencies
  log_info "Checking for outdated dependencies..."
  if pnpm outdated -r | grep -q .; then
    log_warning "You have outdated dependencies. Consider updating them:"
    pnpm outdated -r
  fi

  log_success "All pre-deployment checks passed!"
  return 0
}

###############################################################################
# Deploy to Staging
###############################################################################

deploy_staging() {
  log_info "Deploying to staging environment..."

  # Deploy frontend to Vercel (staging)
  log_info "Deploying frontend to Vercel staging..."
  if ! vercel deploy --target staging --yes; then
    log_error "Frontend deployment to staging failed!"
    return 1
  fi

  # Deploy backend to Railway (staging)
  log_info "Deploying backend to Railway staging..."
  if ! railway up --service api-gateway --environment staging; then
    log_error "Backend deployment to staging failed!"
    return 1
  fi

  log_success "Deployed to staging: ${STAGING_URL}"
  log_info "Please test the staging environment before deploying to production."
}

###############################################################################
# Deploy to Production
###############################################################################

deploy_production() {
  log_info "Deploying to production environment..."

  # Confirm deployment
  echo ""
  log_warning "You are about to deploy to PRODUCTION!"
  read -p "Are you sure you want to continue? (yes/no): " confirm
  if [[ "$confirm" != "yes" ]]; then
    log_info "Deployment cancelled."
    return 0
  fi

  # Tag the release
  log_info "Creating git tag..."
  version=$(node -p "require('./package.json').version")
  git tag -a "v${version}" -m "Release v${version}"
  git push origin "v${version}"

  # Deploy frontend to Vercel (production)
  log_info "Deploying frontend to Vercel production..."
  if ! vercel deploy --prod --yes; then
    log_error "Frontend deployment to production failed!"
    return 1
  fi

  # Deploy backend to Railway (production)
  log_info "Deploying backend to Railway production..."
  if ! railway up --service api-gateway --environment production; then
    log_error "Backend deployment to production failed!"
    return 1
  fi

  log_success "Deployed to production: ${PRODUCTION_URL}"
  log_info "Monitor the deployment at:"
  log_info "  - Vercel: https://vercel.com/${VERCEL_PROJECT}"
  log_info "  - Railway: https://railway.app/${RAILWAY_PROJECT}"
  log_info "  - Sentry: https://sentry.io/pricey"
}

###############################################################################
# Smoke Tests
###############################################################################

run_smoke_tests() {
  local url=$1
  log_info "Running smoke tests on ${url}..."

  # Test frontend
  log_info "Testing frontend (/)..."
  if ! curl -f -s -o /dev/null "${url}/"; then
    log_error "Frontend is not accessible!"
    return 1
  fi

  # Test API health
  log_info "Testing API health (/api/v1/health)..."
  if ! curl -f -s "${url}/api/v1/health" | grep -q '"status":"ok"'; then
    log_error "API health check failed!"
    return 1
  fi

  # Test receipt list
  log_info "Testing receipt list (/api/v1/receipts)..."
  if ! curl -f -s -o /dev/null "${url}/api/v1/receipts"; then
    log_error "Receipt list endpoint failed!"
    return 1
  fi

  log_success "All smoke tests passed!"
}

###############################################################################
# Rollback
###############################################################################

rollback() {
  local environment=$1
  log_warning "Rolling back ${environment} deployment..."

  if [[ "$environment" == "production" ]]; then
    vercel rollback --yes
    railway rollback --service api-gateway --environment production
  else
    vercel rollback --target staging --yes
    railway rollback --service api-gateway --environment staging
  fi

  log_success "Rollback completed."
}

###############################################################################
# Main Menu
###############################################################################

show_menu() {
  echo ""
  echo "╔════════════════════════════════════════╗"
  echo "║    Pricey Deployment Helper Script    ║"
  echo "╚════════════════════════════════════════╝"
  echo ""
  echo "1) Run pre-deployment checks"
  echo "2) Deploy to staging"
  echo "3) Deploy to production"
  echo "4) Run smoke tests (staging)"
  echo "5) Run smoke tests (production)"
  echo "6) Rollback staging"
  echo "7) Rollback production"
  echo "8) Exit"
  echo ""
}

main() {
  while true; do
    show_menu
    read -p "Select an option: " choice

    case $choice in
      1)
        pre_deployment_checks
        ;;
      2)
        pre_deployment_checks && deploy_staging
        ;;
      3)
        pre_deployment_checks && deploy_production
        ;;
      4)
        run_smoke_tests "${STAGING_URL}"
        ;;
      5)
        run_smoke_tests "${PRODUCTION_URL}"
        ;;
      6)
        rollback "staging"
        ;;
      7)
        rollback "production"
        ;;
      8)
        log_info "Goodbye!"
        exit 0
        ;;
      *)
        log_error "Invalid option. Please try again."
        ;;
    esac

    echo ""
    read -p "Press Enter to continue..."
  done
}

# Run main menu
main
