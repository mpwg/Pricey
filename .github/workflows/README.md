# GitHub Actions CI/CD Documentation

This directory contains GitHub Actions workflows for the Pricey project.

## Workflows

### 1. CI/CD Pipeline (`ci.yml`)

**Triggers:** Push and PRs to `main` and `develop` branches

**Jobs:**

- **Lint & Type Check**: Runs ESLint and TypeScript compiler
- **Build**: Builds the Next.js application
- **Prisma Check**: Validates database schema and migrations

**Usage:** Automatically runs on every push/PR

---

### 2. Docker Build & Push (`docker.yml`)

**Triggers:**

- Push to `main` branch
- Version tags (`v*.*.*`)
- Manual workflow dispatch

**What it does:**

- Builds Docker image using Buildx
- Pushes to GitHub Container Registry (GHCR)
- Supports multi-platform builds (amd64, arm64)
- Uses layer caching for faster builds

**Image naming:**

- Branch: `ghcr.io/owner/pricey:main`
- Tag: `ghcr.io/owner/pricey:v1.0.0`
- SHA: `ghcr.io/owner/pricey:main-abc123`

---

### 3. Deploy to Production (`deploy.yml`)

**Triggers:**

- Version tags (`v*.*.*`)
- Manual workflow dispatch

**What it does:**

- SSH into production server
- Pulls latest code
- Updates Docker containers
- Runs database migrations

**Required Secrets:**

- `PRODUCTION_HOST`: Server IP/hostname
- `PRODUCTION_USER`: SSH username
- `PRODUCTION_SSH_KEY`: SSH private key
- `PRODUCTION_PORT`: SSH port (optional, defaults to 22)
- `SLACK_WEBHOOK`: Slack webhook URL (optional)

---

### 4. Dependency Review (`dependency-review.yml`)

**Triggers:** Pull requests

**What it does:**

- Scans for vulnerable dependencies
- Fails if high-severity vulnerabilities found
- Provides security recommendations

---

### 5. CodeQL Security Analysis (`codeql.yml`)

**Triggers:**

- Push to `main` and `develop`
- Pull requests
- Weekly schedule (Mondays)

**What it does:**

- Static code analysis for security issues
- Scans JavaScript and TypeScript
- Reports to GitHub Security tab

---

## Setup Instructions

### 1. Enable GitHub Actions

Workflows are automatically enabled when you push to GitHub.

### 2. Configure Secrets

Go to **Settings → Secrets and variables → Actions** and add:

#### For Docker Registry (GHCR)

No additional secrets needed - uses `GITHUB_TOKEN` automatically.

#### For Production Deployment

```
PRODUCTION_HOST=your-server.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<paste your SSH private key>
PRODUCTION_PORT=22
SLACK_WEBHOOK=https://hooks.slack.com/... (optional)
```

### 3. Configure Environments

Go to **Settings → Environments** and create:

- `production` environment
- Add protection rules (optional):
  - Required reviewers
  - Wait timer
  - Deployment branches (only `main`)

### 4. Enable Container Registry

1. Go to **Settings → Packages**
2. Make package visibility public or private
3. Grant workflow write permissions

---

## Local Testing

### Test Docker build locally:

```bash
docker build -t pricey:test .
docker run -p 3000:3000 pricey:test
```

### Validate workflow syntax:

```bash
# Install act (GitHub Actions local runner)
brew install act

# Run CI workflow
act -j lint-and-typecheck
```

---

## Workflow Status Badges

Add to your README.md:

```markdown
![CI](https://github.com/username/pricey/workflows/CI%2FCD%20Pipeline/badge.svg)
![Docker](https://github.com/username/pricey/workflows/Docker%20Build%20%26%20Push/badge.svg)
![Security](https://github.com/username/pricey/workflows/CodeQL%20Security%20Analysis/badge.svg)
```

---

## Customization

### Change Node.js version:

Edit `NODE_VERSION` in `ci.yml`:

```yaml
env:
  NODE_VERSION: "20" # Change this
```

### Add more checks:

Add steps to `ci.yml`:

```yaml
- name: Run tests
  run: npm test

- name: Check test coverage
  run: npm run test:coverage
```

### Deploy to different platforms:

- **Vercel**: Use `vercel-action`
- **AWS**: Use `aws-actions/configure-aws-credentials`
- **Railway**: Use Railway CLI
- **Fly.io**: Use `flyctl`

---

## Troubleshooting

### Build fails with "Module not found"

- Ensure `npm ci` is used (not `npm install`)
- Check that `prisma:generate` runs before build

### Docker push fails

- Check GHCR permissions in repo settings
- Verify `packages: write` permission in workflow

### Deployment fails

- Verify SSH key is correct (no passphrase)
- Check firewall allows SSH from GitHub IPs
- Ensure Docker is installed on production server

### Prisma migration fails

- Check DATABASE_URL is set correctly
- Verify PostgreSQL is running
- Ensure migration files are committed

---

## Best Practices

1. **Always test locally first** before pushing
2. **Use environments** for staging/production
3. **Enable branch protection** on `main`
4. **Review dependency updates** before merging
5. **Monitor workflow runs** for failures
6. **Use caching** to speed up builds
7. **Set up notifications** for failures

---

## Dependabot Integration

Dependabot is configured to automatically:

- Update npm dependencies weekly
- Update Docker images weekly
- Update GitHub Actions weekly

See `docs/DEPENDABOT.md` for details.

**Dependabot + CI Pipeline:**

1. Dependabot creates PR with dependency update
2. CI pipeline runs automatically
3. If tests pass, safe to merge
4. Security updates are prioritized

---

## Security Notes

- Secrets are encrypted and not exposed in logs
- Use `GITHUB_TOKEN` when possible (auto-generated)
- Rotate SSH keys regularly
- Enable 2FA on GitHub account
- Review CodeQL findings regularly
- Keep actions up to date (`@v4`, not `@v3`)
- Review and merge Dependabot security updates promptly

---

## Next Steps

1. Push code to GitHub
2. Workflows will run automatically
3. Check **Actions** tab for results
4. Configure production secrets for deployment
5. Add status badges to README
