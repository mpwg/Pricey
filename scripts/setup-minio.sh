#!/usr/bin/env bash
# Setup MinIO bucket policy for development
# Copyright (C) 2025 Matthias Wallner-Géhri
# Licensed under AGPL-3.0

set -e

echo "🔧 Setting up MinIO bucket policy..."

# Wait for MinIO to be ready
echo "⏳ Waiting for MinIO to be ready..."
until docker exec pricey-minio mc alias set local http://localhost:9000 minioadmin minioadmin 2>/dev/null; do
  echo "   MinIO not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "✓ MinIO is ready"

# Set public read policy for the bucket
echo "🔐 Setting public read policy for pricey-receipts bucket..."
docker exec pricey-minio mc anonymous set download local/pricey-receipts

# Verify the policy
POLICY=$(docker exec pricey-minio mc anonymous get local/pricey-receipts)
echo "✓ Current policy: $POLICY"

echo "✅ MinIO bucket setup complete!"
echo "   Images are now accessible at: http://localhost:9000/pricey-receipts/receipts/"
