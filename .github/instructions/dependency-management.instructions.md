---
applyTo: '**/package.json'
---

# Dependency Management Guidelines

**Status**: ⚠️ **MANDATORY - Always Use Latest Versions**  
**Effective Date**: October 25, 2025

## Core Principle

**ALWAYS use the latest stable versions of dependencies.** Outdated dependencies pose security risks, miss performance improvements, and accumulate technical debt.

---

## Mandatory Requirements

### 1. Latest Versions Only

✅ **Always use the latest stable version** when:

- Adding a new dependency
- Updating existing dependencies
- Reviewing pull requests
- Creating new packages

❌ **Never pin to old versions** unless there's a documented breaking change that requires migration work.

### 2. Regular Updates

**Check for outdated dependencies weekly:**

```bash
# Check all workspaces for outdated dependencies
pnpm outdated -r

# Expected output: No outdated packages
# If any are shown, update them immediately
```

### 3. Update Process

When outdated dependencies are found:

```bash
# Update all dependencies to latest versions (RECOMMENDED)
pnpm up --latest -r

# Or update specific package
pnpm up --latest <package-name>

# Run tests to verify
pnpm test

# Check for breaking changes
pnpm build
pnpm typecheck
```

**Note**: `pnpm up` is the preferred command (alias for `pnpm update`) and automatically installs after updating.

### 4. Version Range Policy

**Use caret (`^`) ranges for all dependencies:**

```json
{
  "dependencies": {
    "fastify": "^5.2.1", // ✅ Correct - allows minor/patch updates
    "zod": "^4.1.12" // ✅ Correct
  },
  "devDependencies": {
    "vitest": "^4.0.3", // ✅ Correct
    "typescript": "^5.9.3" // ✅ Correct
  }
}
```

❌ **Avoid:**

```json
{
  "dependencies": {
    "fastify": "5.2.1", // ❌ No range - won't update
    "zod": "~4.1.12", // ❌ Tilde - only patch updates
    "express": "4.x" // ❌ x-range - imprecise
  }
}
```

### 5. Exception: Workspace Dependencies

Workspace dependencies MUST use `workspace:*`:

```json
{
  "dependencies": {
    "@pricy/database": "workspace:*", // ✅ Correct
    "@pricy/types": "workspace:*" // ✅ Correct
  }
}
```

---

## Pre-Commit Checklist

Before committing changes to `package.json`:

- [ ] Run `pnpm outdated -r` - should show NO outdated packages
- [ ] All dependencies use latest stable versions
- [ ] All dependencies use caret (`^`) ranges
- [ ] Workspace dependencies use `workspace:*`
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
- [ ] Type checking passes: `pnpm typecheck`

---

## Pull Request Requirements

### For Authors

When submitting a PR that adds/updates dependencies:

- [ ] Use latest stable versions
- [ ] Run `pnpm outdated -r` and confirm no outdated packages
- [ ] Document any breaking changes in PR description
- [ ] Include migration notes if API changes affect codebase
- [ ] Verify all tests pass with new versions

### For Reviewers

Before approving a PR with dependency changes:

- [ ] Verify latest versions are used
- [ ] Check `pnpm outdated -r` output (should be clean)
- [ ] Review changelog/release notes for breaking changes
- [ ] Confirm tests pass in CI/CD
- [ ] Verify no security vulnerabilities (`pnpm audit`)

---

## Dependency Categories

### Production Dependencies

**Never compromise on security or stability:**

- ✅ Always use latest stable versions
- ✅ Review breaking changes before updating major versions
- ✅ Test thoroughly after updates
- ✅ Monitor for security advisories

**Example:**

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.917.0", // Latest AWS SDK
    "@fastify/cors": "^11.1.0", // Latest Fastify plugin
    "@fastify/helmet": "^13.0.2", // Latest security headers
    "fastify": "^5.2.1", // Latest Fastify
    "bullmq": "^5.61.2", // Latest BullMQ
    "zod": "^4.1.12" // Latest validation
  }
}
```

### Development Dependencies

**Update aggressively:**

- ✅ Update immediately when new versions available
- ✅ Breaking changes in dev tools are acceptable
- ✅ Prioritize new features and improvements

**Example:**

```json
{
  "devDependencies": {
    "@vitest/coverage-v8": "^4.0.3", // Latest Vitest
    "@vitest/ui": "^4.0.3", // Latest Vitest UI
    "vitest": "^4.0.3", // Latest test runner
    "typescript": "^5.9.3", // Latest TypeScript
    "eslint": "^9.38.0", // Latest linter
    "prettier": "^3.6.2" // Latest formatter
  }
}
```

---

## Automated Checks

### GitHub Actions Workflow

Add to `.github/workflows/dependencies.yml`:

```yaml
name: Dependency Check

on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM
  pull_request:
    paths:
      - '**/package.json'
      - 'pnpm-lock.yaml'

jobs:
  check-outdated:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Check for outdated dependencies
        run: |
          OUTDATED=$(pnpm outdated -r)
          if [ ! -z "$OUTDATED" ]; then
            echo "❌ Outdated dependencies found:"
            echo "$OUTDATED"
            exit 1
          fi
          echo "✅ All dependencies are up to date"

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 10.19.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 24.x
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run security audit
        run: pnpm audit --audit-level moderate
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check if package.json was modified
if git diff --cached --name-only | grep -q "package.json"; then
  echo "📦 Checking for outdated dependencies..."

  OUTDATED=$(pnpm outdated -r 2>&1)

  if echo "$OUTDATED" | grep -q "Package"; then
    echo "❌ ERROR: Outdated dependencies found!"
    echo "$OUTDATED"
    echo ""
    echo "Run 'pnpm update -r --latest' to update all dependencies"
    exit 1
  fi

  echo "✅ All dependencies are up to date"
fi
```

---

## Breaking Changes Handling

### When Major Version Updates Occur

1. **Review the changelog:**

   ```bash
   # Example: Vitest 2.x → 4.x
   # Visit: https://github.com/vitest-dev/vitest/releases
   ```

2. **Check migration guides:**
   - Look for `MIGRATION.md` or `CHANGELOG.md`
   - Search for breaking changes
   - Review API changes

3. **Update code if needed:**

   ```typescript
   // Example: Vitest 2.x → 4.x config changes
   // Before (v2):
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       coverage: {
         provider: 'c8', // Old provider
       },
     },
   });

   // After (v4):
   import { defineConfig } from 'vitest/config';

   export default defineConfig({
     test: {
       coverage: {
         provider: 'v8', // New default provider
       },
     },
   });
   ```

4. **Test thoroughly:**

   ```bash
   pnpm test
   pnpm build
   pnpm typecheck
   pnpm lint
   ```

5. **Document the change:**
   - Update migration notes
   - Add to PR description
   - Update relevant documentation

---

## Security Advisories

### Regular Security Audits

```bash
# Check for security vulnerabilities
pnpm audit

# Fix vulnerabilities automatically (if possible)
pnpm audit --fix

# Generate detailed security report
pnpm audit --json > security-report.json
```

### Handling Vulnerabilities

**Priority Levels:**

| Severity | Action Required            | Timeline   |
| -------- | -------------------------- | ---------- |
| Critical | Update immediately         | < 24 hours |
| High     | Update within current week | < 7 days   |
| Moderate | Update in next sprint      | < 30 days  |
| Low      | Update when convenient     | < 90 days  |

**Process:**

1. **Identify:** Run `pnpm audit`
2. **Update:** Run `pnpm update <package> --latest`
3. **Test:** Run full test suite
4. **Verify:** Confirm vulnerability is resolved
5. **Deploy:** Push to production

---

## Dependency Selection Criteria

When choosing a new dependency, verify:

### 1. Maintenance Status

✅ **Good signs:**

- Active development (commits within last month)
- Responsive maintainers
- Regular releases
- Large community

❌ **Red flags:**

- No updates in > 6 months
- Unresolved critical issues
- Abandoned by maintainers
- Small/inactive community

### 2. Security Posture

✅ **Good signs:**

- Security policy (`SECURITY.md`)
- Regular security audits
- Quick response to vulnerabilities
- No known critical CVEs

❌ **Red flags:**

- Multiple unpatched vulnerabilities
- History of security issues
- No security policy
- Slow vulnerability response

### 3. Quality Metrics

✅ **Good signs:**

- High test coverage (>80%)
- Comprehensive documentation
- TypeScript types included
- Active issue tracking

❌ **Red flags:**

- Poor documentation
- No tests
- No TypeScript support
- Ignored issues/PRs

### 4. Compatibility

✅ **Verify:**

- Node.js version compatibility
- TypeScript version compatibility
- ESM/CommonJS support
- Peer dependency requirements

---

## Common Update Commands

### Update All Dependencies

```bash
# Update all to latest (RECOMMENDED - breaks semver ranges)
pnpm up --latest -r

# Update all to latest (respecting semver ranges)
pnpm up -r

# Interactive update with choices
pnpm up -r --interactive
```

### Update Specific Package

```bash
# Update specific package across all workspaces
pnpm up --latest -r fastify

# Update in specific workspace
pnpm --filter @pricy/api-gateway up --latest fastify
```

### Update Dev Dependencies Only

```bash
# Update all dev dependencies
pnpm up --latest -r -D

# Update specific dev dependency
pnpm up --latest -r -D vitest
```

### Update Production Dependencies Only

```bash
# Update all production dependencies
pnpm up --latest -r -P
```

---

## Version Pinning Exceptions

**Only pin versions when:**

1. **Known breaking change** requires migration work:

   ```json
   {
     "dependencies": {
       "legacy-lib": "2.5.0" // Pinned: v3.x has breaking API changes
     }
   }
   ```

   **Requirements:**
   - Document reason in `package.json` comment (if possible) or `README.md`
   - Create GitHub issue to track migration
   - Set deadline for migration (max 3 months)

2. **Peer dependency conflict:**

   ```json
   {
     "dependencies": {
       "plugin-a": "^1.2.0" // Requires peer: core@^5.0.0
       "core": "^5.0.0"     // Can't upgrade to v6 until plugin updates
     }
   }
   ```

3. **Security advisory recommends specific version:**
   ```json
   {
     "dependencies": {
       "vulnerable-lib": "2.3.5" // Security: Fixed version per CVE-2024-12345
     }
   }
   ```

**MUST document in code comments or README:**

```json
{
  "dependencies": {
    // PINNED: v3.x has breaking changes requiring refactor
    // Issue: #123
    // Target migration: Sprint 12
    "legacy-lib": "2.5.0"
  }
}
```

---

## Monitoring & Alerts

### Setup Renovate Bot (Recommended)

Create `.github/renovate.json`:

```json
{
  "extends": ["config:base"],
  "schedule": ["before 9am on Monday"],
  "automerge": true,
  "automergeType": "pr",
  "ignoreTests": false,
  "packageRules": [
    {
      "matchUpdateTypes": ["minor", "patch"],
      "automerge": true
    },
    {
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "labels": ["breaking-change"]
    }
  ]
}
```

### Setup Dependabot

Already configured in `.github/dependabot.yml` - ensure it's up to date.

---

## Best Practices Summary

### DO ✅

- Use latest stable versions always
- Run `pnpm outdated -r` before every commit
- Update dependencies weekly
- Use caret (`^`) ranges
- Test after every update
- Review changelogs for breaking changes
- Document version pins with reasons
- Monitor security advisories

### DON'T ❌

- Pin to old versions without reason
- Ignore outdated dependency warnings
- Skip testing after updates
- Use exact versions (no range)
- Delay security updates
- Update without reading changelogs
- Ignore breaking changes
- Use unmaintained packages

---

## Troubleshooting

### Issue: `pnpm install` fails after update

**Solution:**

```bash
# Clear lock file and node_modules
rm -rf pnpm-lock.yaml node_modules

# Reinstall
pnpm install
```

### Issue: Breaking changes after update

**Solution:**

1. Check package changelog
2. Review migration guide
3. Update code to match new API
4. Run tests: `pnpm test`

### Issue: Peer dependency conflicts

**Solution:**

```bash
# Check peer dependency requirements
pnpm why <package-name>

# Update peer dependencies to compatible versions
pnpm up --latest -r <peer-dependency>
```

### Issue: Outdated dependencies after update

**Solution:**

```bash
# Use --latest flag to break semver ranges (RECOMMENDED)
pnpm up --latest -r

# Or update specific package
pnpm up --latest <package-name>
```

---

## Enforcement

### CI/CD Checks

All PRs must pass:

- ✅ `pnpm outdated -r` (no outdated packages)
- ✅ `pnpm audit` (no high/critical vulnerabilities)
- ✅ `pnpm test` (all tests pass with new versions)
- ✅ `pnpm build` (builds successfully)
- ✅ `pnpm typecheck` (no type errors)

### Pre-commit Hooks

Automatically enforced:

- Check for outdated dependencies when `package.json` changes
- Block commits with outdated dependencies
- Require `pnpm update` before commit

---

## Resources

### Official Documentation

- [pnpm outdated](https://pnpm.io/cli/outdated)
- [pnpm update](https://pnpm.io/cli/update)
- [pnpm audit](https://pnpm.io/cli/audit)

### Tools

- [npm-check-updates](https://github.com/raineorshine/npm-check-updates) - Check for updates
- [Renovate](https://renovatebot.com/) - Automated dependency updates
- [Dependabot](https://github.com/dependabot) - GitHub dependency updates
- [Snyk](https://snyk.io/) - Security vulnerability scanning

### Internal

- [Contributing Guide](../../CONTRIBUTING.md)
- [Testing Strategy](../../docs/guides/testing-strategy.md)
- [CI/CD Documentation](../../docs/guides/deployment.md)

---

**Last Updated**: October 25, 2025  
**Next Review**: November 2025  
**Document Owner**: Engineering Team

**Remember**: Outdated dependencies = Security risks + Technical debt + Missing improvements 🚨
