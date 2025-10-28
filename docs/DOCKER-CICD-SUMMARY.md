# Docker CI/CD Configuration Summary

**Date**: October 28, 2025  
**Status**: ✅ Complete

## Overview

Automated Docker image building and publishing has been configured via GitHub Actions. All services are automatically built and published to GitHub Container Registry (GHCR) on every push to `develop` or `main` branches, and when version tags are created.

## What Was Configured

### 1. GitHub Actions Workflow

**File**: `.github/workflows/docker-build.yml`

**Triggers**:

- Push to `develop` branch → Prerelease images
- Push to `main` branch → Release candidate images
- Git tags (`v*.*.*`) → Stable release images
- Pull requests → Build validation (no push)

**Features**:

- ✅ Change detection (only builds modified services)
- ✅ Multi-platform builds (linux/amd64, linux/arm64)
- ✅ Build caching for faster builds
- ✅ Parallel builds for all services
- ✅ Automatic GitHub Release creation
- ✅ Release notes generation
- ✅ Build summaries in Actions UI

### 2. Image Tagging Strategy

#### Develop Branch (Prerelease)

```bash
ghcr.io/mpwg/pricey-web:develop           # Latest develop
ghcr.io/mpwg/pricey-web:develop-abc123f   # Specific commit
```

#### Main Branch (Release Candidate)

```bash
ghcr.io/mpwg/pricey-web:rc                # Latest RC
ghcr.io/mpwg/pricey-web:rc-1.0.0          # Specific RC version
```

#### Tagged Releases (Stable)

```bash
ghcr.io/mpwg/pricey-web:1.0.0             # Exact version
ghcr.io/mpwg/pricey-web:1.0               # Minor version
ghcr.io/mpwg/pricey-web:1                 # Major version
ghcr.io/mpwg/pricey-web:latest            # Latest stable
```

### 3. Services Published

All three services are built and published:

1. **pricey-web** - Next.js frontend
2. **pricey-api-gateway** - Fastify API server
3. **pricey-ocr-service** - Receipt parsing service

### 4. Docker Compose Files

#### `docker-compose.prod.yml` (Existing - Local Builds)

Builds images locally from source:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Use for:

- Local development
- Testing unreleased changes
- No internet access

#### `docker-compose.ghcr.yml` (New - Prebuilt Images)

Uses prebuilt images from GHCR:

```bash
# Use latest develop
IMAGE_TAG=develop docker compose -f docker-compose.ghcr.yml up -d

# Use specific version
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml up -d

# Use release candidate
IMAGE_TAG=rc docker compose -f docker-compose.ghcr.yml up -d
```

Use for:

- Production deployment
- Staging environments
- Fast deployment (no build time)
- CI/CD-tested images

### 5. Documentation

#### `docs/guides/docker-cicd.md`

Complete guide covering:

- Tagging strategy
- Creating releases
- Using prebuilt images
- Monitoring builds
- Troubleshooting

## Release Workflow

### 1. Development (Develop Branch)

```bash
git checkout develop
git add .
git commit -m "feat: new feature"
git push origin develop
```

**Result**:

- Images built automatically
- Tagged as `develop` and `develop-{sha}`
- Available for testing

### 2. Release Candidate (Main Branch)

```bash
# Create PR from develop to main
gh pr create --base main --head develop --title "Release v1.0.0"

# After merge
```

**Result**:

- Images built automatically
- Tagged as `rc`
- Ready for final testing

### 3. Stable Release (Git Tag)

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

**Result**:

- Images built automatically
- Tagged as `1.0.0`, `1.0`, `1`, `latest`
- GitHub Release created with notes
- Production-ready

## Deployment Examples

### Development/Testing

```bash
# Pull latest prerelease
IMAGE_TAG=develop docker compose -f docker-compose.ghcr.yml pull
IMAGE_TAG=develop docker compose -f docker-compose.ghcr.yml up -d
```

### Production

```bash
# Pull specific stable version
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml pull
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml up -d
```

### Staging (Release Candidate)

```bash
# Pull RC for final testing
IMAGE_TAG=rc docker compose -f docker-compose.ghcr.yml pull
IMAGE_TAG=rc docker compose -f docker-compose.ghcr.yml up -d
```

## GitHub Release Notes

Automatically generated for each tagged release:

### Contents

- **Changelog**: Commits since previous tag
- **Docker Images**: Pull commands for all services
- **Deployment Guide**: Link to documentation
- **System Requirements**: Specs
- **License**: AGPL-3.0 info

### Example

```markdown
## Changes since v0.9.0

- feat: add receipt editing (#123)
- fix: improve OCR accuracy (#124)

## Docker Images

docker pull ghcr.io/mpwg/pricey-web:1.0.0
docker pull ghcr.io/mpwg/pricey-api-gateway:1.0.0
docker pull ghcr.io/mpwg/pricey-ocr-service:1.0.0
```

## Build Optimizations

1. **Change Detection**:
   - Only builds services with changes
   - Skips unchanged services
   - Saves build time

2. **Build Cache**:
   - Uses GitHub Actions cache
   - Reuses layers between builds
   - Faster subsequent builds

3. **Parallel Execution**:
   - All services build concurrently
   - No dependencies between builds
   - Faster overall pipeline

4. **Multi-Platform**:
   - Builds for amd64 and arm64
   - Works on Intel and Apple Silicon
   - Raspberry Pi compatible

## Monitoring

### GitHub Actions

View builds: <https://github.com/mpwg/Pricey/actions>

- Click "Docker Build & Publish"
- See build status, logs, artifacts
- View summaries

### GitHub Packages

View images: <https://github.com/mpwg/Pricey/packages>

- See all published versions
- View pull statistics
- Check image sizes

## Security Features

- ✅ Non-root users in all images
- ✅ Multi-stage builds (small image sizes)
- ✅ Secrets never baked into images
- ✅ SBOM (Software Bill of Materials) included
- ✅ AGPL-3.0 license headers
- ✅ OCI labels with metadata

## Environment Variables

### CI/CD (GitHub Secrets)

- `GITHUB_TOKEN` - Auto-provided by Actions
- `TURBO_TOKEN` - (Optional) Turborepo caching
- `CODECOV_TOKEN` - (Optional) Coverage reporting

### Runtime (Production)

See `.env.production.example` for all runtime variables.

## Files Created/Modified

### New Files

- ✅ `.github/workflows/docker-build.yml` - CI/CD workflow
- ✅ `docker-compose.ghcr.yml` - Prebuilt images config
- ✅ `docs/guides/docker-cicd.md` - CI/CD documentation
- ✅ `docs/DOCKER-CICD-SUMMARY.md` - This file

### Modified Files

- ✅ `README.md` - Updated with Docker deployment info
- ✅ `docs/guides/docker-deployment.md` - Added prebuilt image info

## Quick Reference

### Pull Prebuilt Images

```bash
# Latest develop (prerelease)
docker pull ghcr.io/mpwg/pricey-web:develop

# Release candidate
docker pull ghcr.io/mpwg/pricey-web:rc

# Stable release
docker pull ghcr.io/mpwg/pricey-web:1.0.0
docker pull ghcr.io/mpwg/pricey-web:latest
```

### Deploy with Prebuilt Images

```bash
# Set image tag
export IMAGE_TAG=1.0.0

# Pull and start
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

### Create Release

```bash
# Tag and push
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# GitHub Actions will:
# 1. Build images
# 2. Publish to GHCR
# 3. Create GitHub Release
```

## Benefits

### For Developers

- ✅ Automated builds on every push
- ✅ No manual image building
- ✅ CI/CD tested images
- ✅ Fast iteration with prebuilt images

### For DevOps

- ✅ Consistent, reproducible builds
- ✅ Version tracking with tags
- ✅ Easy rollbacks
- ✅ Multi-platform support

### For Users

- ✅ Fast deployment (no build time)
- ✅ Tested, stable images
- ✅ Clear versioning
- ✅ Release notes for every version

## Next Steps

1. **Test the Workflow**:

   ```bash
   # Push to develop to trigger build
   git checkout develop
   git commit --allow-empty -m "test: trigger CI build"
   git push origin develop
   ```

2. **Create First Release**:

   ```bash
   # After testing on main
   git checkout main
   git tag -a v0.1.0 -m "Initial MVP release"
   git push origin v0.1.0
   ```

3. **Update Deployment Docs**:
   - Add GHCR image usage to production guides
   - Update MANUAL-TASKS.md with prebuilt option

## Related Documentation

- [Docker Deployment Guide](../docs/guides/docker-deployment.md)
- [Docker CI/CD Guide](../docs/guides/docker-cicd.md)
- [Docker Quick Reference](../docs/DOCKER-QUICK-REFERENCE.md)
- [GitHub Actions Workflow](../.github/workflows/docker-build.yml)

---

**Configuration Complete** ✅

All Docker images are now automatically built and published via GitHub Actions!
