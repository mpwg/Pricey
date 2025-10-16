#!/bin/bash

# Pricey Setup Script
# This script helps you set up the Pricey development environment

set -e

echo "🏷️  Setting up Pricey - Price Comparison PWA"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker is not installed. You'll need Docker to run PostgreSQL and Redis."
    echo "   You can install it from: https://www.docker.com/get-started"
else
    echo "✅ Docker version: $(docker -v)"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "📝 Setting up environment variables..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
    echo "   Please update it with your configuration if needed."
else
    echo "⚠️  .env file already exists. Skipping..."
fi

echo ""
echo "🐳 Starting Docker services (PostgreSQL & Redis)..."
if command -v docker &> /dev/null; then
    docker-compose up -d
    echo "✅ Docker services started"
    
    echo ""
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo ""
    echo "🗄️  Setting up database..."
    npx prisma generate
    npx prisma migrate dev --name init
    echo "✅ Database setup complete"
else
    echo "⚠️  Skipping Docker setup (Docker not installed)"
fi

echo ""
echo "=============================================="
echo "✨ Setup complete! You can now run:"
echo ""
echo "   npm run dev          - Start development server"
echo "   npm run prisma:studio - Open Prisma Studio"
echo "   npm run docker:down   - Stop Docker services"
echo ""
echo "🌐 The app will be available at http://localhost:3000"
echo "=============================================="
