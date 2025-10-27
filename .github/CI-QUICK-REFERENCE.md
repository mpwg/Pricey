# CI Pipeline Quick Reference

## What Changed

Your CI pipeline now runs **40-90% faster** through:

- ✅ Turborepo remote caching (`.turbo` directory)
- ✅ Parallel job execution (lint, typecheck, build, test run simultaneously)
- ✅ Smart dependency caching (install once, reuse everywhere)
- ✅ Build artifact caching (skip rebuilds when possible)

## For Developers

### Normal Workflow (Nothing Changes)

```bash
git add .
git commit -m "feat: add feature"
git push
# CI runs automatically - just faster now!
```

### What You'll Notice

1. **First PR**: ~8 minutes (cold cache)
2. **Subsequent Commits**: ~4 minutes (warm cache)
3. **No Code Changes**: ~1 minute (hot cache - all tasks cached)

### Understanding CI Checks

Your PR needs these 5 checks to pass:

- ✅ **Lint**: ESLint + Prettier formatting
- ✅ **Type Check**: TypeScript compilation
- ✅ **Build**: Package builds (Turborepo)
- ✅ **Test**: Unit tests with coverage
- ✅ **Database**: Migration validation

All checks run in parallel after initial setup.

## For Maintainers

### Optional: Enable Turborepo Remote Caching

> **Note:** Turborepo supports multiple caching options. By default, it uses local caching and can also leverage GitHub Actions cache or self-hosted remote caches. The instructions below describe enabling Vercel Remote Cache, which is one option for sharing cache across your team. For other providers and advanced setups, see the [Turborepo Remote Caching docs](https://turbo.build/repo/docs/core-concepts/remote-caching).

Share cache across team and branches:

1. Get Vercel token: https://vercel.com/account/tokens
2. Add to repository secrets:
   - `TURBO_TOKEN`: Your Vercel token
   - `TURBO_TEAM`: Your team slug (or leave empty for personal)

**Benefit**: Even faster builds when teammates work on same code

### Optional: Enable Codecov

Track test coverage trends:

1. Sign up at https://codecov.io
2. Add repository
3. Add `CODECOV_TOKEN` to repository secrets

**Benefit**: Coverage reports on every PR

### Monitoring Cache Performance

Check cache effectiveness in Actions → CI run:

```
Restore Turborepo cache
  Cache hit: true  ← This means cache worked!
```

### Clear Cache (If Needed)

```bash
# Via GitHub UI
Settings → Actions → Caches → Delete all

# Via CLI
gh cache delete --all
```

### Debugging Failed Builds

If a job fails but works locally:

1. Check if dependencies are up to date: `pnpm outdated -r`
2. Clear Turborepo cache locally: `pnpm clean`
3. Regenerate Prisma client: `pnpm --filter @pricey/database db:generate`
4. Re-run the failed CI job (sometimes transient failures occur)

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Push/PR Trigger                                │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────▼────────┐
        │  Setup Job      │
        │  • Install deps │
        │  • Cache pnpm   │
        │  • Gen Prisma   │
        └────────┬────────┘
                 │
    ┌────────────┼────────────┬─────────────┐
    │            │            │             │
┌───▼───┐   ┌───▼───┐   ┌───▼────┐   ┌────▼────┐
│ Lint  │   │Typeck │   │ Build  │   │  Test   │
│ ~1min │   │ ~1min │   │ ~2min  │   │  ~2min  │
└───┬───┘   └───┬───┘   └───┬────┘   └────┬────┘
    │            │            │             │
    └────────────┼────────────┼─────────────┘
                 │            │
         ┌───────▼────────┐   │
         │   Database     │   │
         │   • Postgres   │   │
         │   • Migrations │   │
         └───────┬────────┘   │
                 │            │
         ┌───────▼────────────▼───┐
         │   CI Success Check     │
         │   (All jobs must pass) │
         └────────────────────────┘
```

## Cache Strategy

### Node Modules Cache

- **Key**: `pnpm-lock.yaml` hash
- **Invalidates**: When dependencies change
- **Saves**: ~3-5 minutes per workflow

### Turborepo Cache

- **Per Task**: Separate cache for each task type
- **Invalidates**: When input files change
- **Saves**: ~2-3 minutes per task on cache hit

### Build Artifacts Cache

- **Key**: Git commit SHA
- **Invalidates**: Every commit
- **Use**: Future deploy jobs can reuse builds

## Common Issues

### "Cache restored but build still slow"

Turborepo cache exists, but input files changed. This is expected - only unchanged tasks skip execution.

### "Install dependencies" taking long

`pnpm-lock.yaml` changed (new dependencies). First run after dependency update will be slow, subsequent runs will be fast.

### "Generate Prisma Client" every time

This is intentional - we don't cache Prisma client to avoid type staleness. It's fast (~10-15 seconds).

### "Tests failing in CI but pass locally"

1. Check environment variables
2. Database might be in different state
3. Timezone differences (use UTC in tests)

## Performance Tips

### For Your PRs

1. **Small commits**: Smaller diffs = better cache reuse
2. **Group changes**: Change related files together
3. **Run locally first**: `pnpm lint && pnpm typecheck && pnpm test`

### For the Project

1. **Keep deps updated**: `pnpm outdated -r` (already in mandate)
2. **Monitor cache size**: Actions → Caches (max 10GB per repo)
3. **Clean old caches**: GitHub auto-deletes after 7 days of no access

## Resources

- Full details: `.github/CI-OPTIMIZATION-SUMMARY.md`
- Turborepo docs: https://turbo.build/repo/docs
- GitHub Actions cache: https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows

## Questions?

Ask in #development channel or check workflow runs for detailed logs.
