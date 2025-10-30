# Docker CI/CD Build Process

This document explains how Docker images are automatically built and published via GitHub Actions.

## Overview

Docker images are automatically built and published to GitHub Container Registry (GHCR) on every push to `develop` or `main` branches, and when version tags are created.

## Image Naming Convention

All images are published to: `ghcr.io/mpwg/pricey-{service}`

### Services

- `pricey-web` - Next.js frontend
- `pricey-api-gateway` - Fastify API server
- `pricey-ocr-service` - Receipt parsing service

## Tagging Strategy

### Develop Branch (Prerelease)

**Triggers**: Push to `develop` branch

**Tags**:

- `develop` - Always points to latest develop build
- `develop-{sha}` - Specific commit (e.g., `develop-abc123f`)

**Example**:

```bash
docker pull ghcr.io/mpwg/pricey-web:develop
docker pull ghcr.io/mpwg/pricey-web:develop-abc123f
```

**Usage**: Unstable prerelease builds for testing only.

### Main Branch (Release Candidate)

**Triggers**: Push to `main` branch

**Tags**:

- `rc` - Always points to latest release candidate
- `rc-{version}` - Specific RC version (if tagged)

**Example**:

```bash
docker pull ghcr.io/mpwg/pricey-web:rc
```

**Usage**: Release candidates ready for final testing before stable release.

### Tagged Releases (Stable)

**Triggers**: Git tags matching `v*.*.*` (e.g., `v1.0.0`)

**Tags**:

- `{version}` - Specific version (e.g., `1.0.0`)
- `{major}.{minor}` - Minor version (e.g., `1.0`)
- `{major}` - Major version (e.g., `1`)
- `latest` - **Always points to the current released version** (updated with each new tag)

**Example**:

```bash
docker pull ghcr.io/mpwg/pricey-web:1.0.0
docker pull ghcr.io/mpwg/pricey-web:1.0
docker pull ghcr.io/mpwg/pricey-web:1
docker pull ghcr.io/mpwg/pricey-web:latest  # Same as the newest version tag
```

**Usage**: Production-ready stable releases. The `latest` tag is only created for tagged releases, never for develop or main branches.

## Creating a Release

### 1. Test on Develop

Push changes to `develop` branch:

```bash
git checkout develop
git add .
git commit -m "feat: add new feature"
git push origin develop
```

Images will be built automatically with `develop` tag.

### 2. Merge to Main (Release Candidate)

Create a pull request from `develop` to `main`:

```bash
gh pr create --base main --head develop --title "Release v1.0.0"
```

After merge, images will be built with `rc` tag.

### 3. Create Stable Release

Tag the commit on `main`:

```bash
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

This will:

1. Build and publish images with version tags
2. Create a GitHub Release with auto-generated notes
3. Include Docker pull commands in release notes

## GitHub Actions Workflow

### Workflow File

`.github/workflows/docker-build.yml`

### Jobs

1. **detect-changes** - Determines which services changed to optimize builds
2. **build-web** - Builds and pushes web frontend image
3. **build-api-gateway** - Builds and pushes API gateway image
4. **build-ocr-service** - Builds and pushes OCR service image
5. **create-release** - Creates GitHub Release (for tags only)
6. **announce-prerelease** - Posts summary for develop builds
7. **announce-rc** - Posts summary for RC builds

### Build Optimizations

- **Change Detection**: Only builds services that changed
- **Build Cache**: Uses GitHub Actions cache for faster builds
- **Multi-Platform**: Builds for `linux/amd64` and `linux/arm64`
- **Parallel Builds**: All services build concurrently

## Using Prebuilt Images

### Development with Latest Develop Build

```bash
# Pull latest prerelease images
IMAGE_TAG=develop docker compose -f docker-compose.ghcr.yml pull

# Start services
IMAGE_TAG=develop docker compose -f docker-compose.ghcr.yml up -d
```

### Production with Stable Release

```bash
# Pull specific version
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml pull

# Or pull latest stable
IMAGE_TAG=latest docker compose -f docker-compose.ghcr.yml pull

# Start services
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml up -d
```

### Release Candidate Testing

```bash
# Pull RC images
IMAGE_TAG=rc docker compose -f docker-compose.ghcr.yml pull

# Start services
IMAGE_TAG=rc docker compose -f docker-compose.ghcr.yml up -d
```

## Image Registry Authentication

Images are public and don't require authentication to pull. However, to push images (which happens automatically via CI), you need:

```bash
# Login (only needed for manual pushes)
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

The GitHub Actions workflow uses `GITHUB_TOKEN` automatically.

## Local vs Prebuilt Images

### When to Use Local Builds

Use `docker-compose.prod.yml` (local builds) when:

- Developing new features
- Testing unreleased changes
- No internet access to pull images
- Need to modify Dockerfiles

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### When to Use Prebuilt Images

Use `docker-compose.ghcr.yml` (prebuilt images) when:

- Deploying to production
- Setting up staging environment
- Want faster deployment (no build time)
- Using CI/CD-tested images

```bash
IMAGE_TAG=1.0.0 docker compose -f docker-compose.ghcr.yml up -d
```

## Monitoring Builds

### GitHub Actions

View build status:

- Go to: https://github.com/mpwg/Pricey/actions
- Select "Docker Build & Publish" workflow
- Click on latest run to see logs

### GitHub Packages

View published images:

- Go to: https://github.com/mpwg/Pricey/pkgs/container/pricey-web
- See all tags and their sizes
- View pull statistics

## Release Notes

Release notes are automatically generated and include:

- **Changelog**: All commits since previous tag
- **Docker Images**: Pull commands for all services
- **Deployment Guide**: Link to documentation
- **System Requirements**: Minimum and recommended specs
- **License**: AGPL-3.0 information

Example release notes:

````markdown
## Changes since v0.9.0

- feat: add receipt editing (#123)
- fix: improve OCR accuracy (#124)
- docs: update deployment guide (#125)

## Docker Images

All images are available on GitHub Container Registry:

```bash
# Web Frontend (Next.js)
docker pull ghcr.io/mpwg/pricey-web:1.0.0

# API Gateway (Fastify)
docker pull ghcr.io/mpwg/pricey-api-gateway:1.0.0

# OCR Service (Vision LLMs)
docker pull ghcr.io/mpwg/pricey-ocr-service:1.0.0
```
````

## Security

- All images are scanned for vulnerabilities
- Images run as non-root users
- Secrets are never baked into images
- AGPL-3.0 license compliance

## Troubleshooting

### Image Pull Fails

```bash
# Check if image exists
docker manifest inspect ghcr.io/mpwg/pricey-web:1.0.0

# Try with explicit platform
docker pull --platform linux/amd64 ghcr.io/mpwg/pricey-web:1.0.0
```

### Build Fails in CI

- Check GitHub Actions logs
- Verify all required secrets are set
- Check if Dockerfile syntax is valid
- Ensure package.json versions are correct

### Wrong Image Version

```bash
# Check current image version
docker inspect ghcr.io/mpwg/pricey-web:latest | grep -i version

# Force pull latest
docker pull --no-cache ghcr.io/mpwg/pricey-web:latest
```

## Environment Variables

### CI/CD Secrets

Required secrets in GitHub repository settings:

- `GITHUB_TOKEN` - Automatically provided by GitHub Actions
- `TURBO_TOKEN` - (Optional) For Turborepo remote caching
- `CODECOV_TOKEN` - (Optional) For code coverage reporting

### Runtime Environment

See `.env.production.example` for all required runtime environment variables.

## Related Documentation

- [Docker Deployment Guide](./docker-deployment.md)
- [Docker Quick Reference](../DOCKER-QUICK-REFERENCE.md)
- [Self-Hosting Guide](./self-hosting.md)
- [GitHub Actions CI](./.github/workflows/docker-build.yml)

```

```
