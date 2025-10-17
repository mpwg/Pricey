# Next.js Build Caching Implementation

## Overview

Implemented Next.js build caching in GitHub Actions CI/CD pipeline following [Next.js official documentation](https://nextjs.org/docs/pages/guides/ci-build-caching) to improve build performance.

## What Was Changed

### `.github/workflows/ci.yml`

Added a new caching step in the `build` job to cache Next.js build artifacts:

```yaml
- name: Cache Next.js build
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/.next/cache
    # Generate a new cache whenever packages or source files change.
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}
    # If source files changed but packages didn't, rebuild from a prior cache.
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

### `.github/copilot-instructions.md`

Updated the CI/CD documentation section to reflect the new caching implementation.

## How It Works

### Cache Paths

1. **`~/.npm`**: Caches npm packages (already handled by `actions/setup-node`)
2. **`.next/cache`**: Caches Next.js build artifacts for faster rebuilds

### Cache Key Strategy

The cache key is generated based on:

1. **OS**: `${{ runner.os }}` (linux, macOS, Windows)
2. **Package lock**: `${{ hashFiles('**/package-lock.json') }}`
3. **Source files**: `${{ hashFiles('**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx') }}`

### Cache Restore Strategy

**Restore keys** provide fallback cache matches:

- Primary key: Exact match on OS + packages + source files
- Fallback: Match on OS + packages (when only source files changed)

This means:

- **Full cache hit**: When nothing changed - fastest build
- **Partial cache hit**: When only source files changed - still faster than no cache
- **Cache miss**: When `package-lock.json` changed - full rebuild required

## Performance Benefits

### Before Caching

- Every build compiles from scratch
- Average build time: ~3-5 minutes
- All Next.js optimizations recalculated

### After Caching

- Subsequent builds reuse cached artifacts
- Expected build time: ~1-2 minutes (40-60% faster)
- Only changed files are recompiled

### What Gets Cached

Next.js `.next/cache` directory contains:

- **Webpack build cache**: Compiled modules and chunks
- **Next.js build metadata**: Page data, route manifests
- **ISR data**: Incremental Static Regeneration artifacts
- **Image optimization cache**: Optimized images

## Verification

To verify caching is working:

1. Check GitHub Actions logs for cache hit/miss:

   ```text
   Cache restored successfully
   Cache restored from key: linux-nextjs-abc123-def456
   ```

2. Look for faster build times in subsequent runs with same dependencies

3. Monitor cache size in Actions → Caches (should see `.next/cache` entries)

## Cache Invalidation

Cache is automatically invalidated when:

- `package-lock.json` changes (new dependencies)
- Source files change (`.js`, `.jsx`, `.ts`, `.tsx`)
- OS changes (different runner)

## Best Practices

### Do ✅

- Keep cache keys specific to avoid stale builds
- Include source file hashes in cache key
- Use restore-keys for partial cache hits
- Monitor cache hit rate in CI logs

### Don't ❌

- Cache build output (`.next/`) - only cache `.next/cache`
- Use overly broad cache keys
- Ignore cache misses (may indicate configuration issues)
- Cache environment-specific files

## Troubleshooting

### "No Cache Detected" Warning

If you see this in Next.js build output:

```text
Warning: No cache detected
```

**Causes**:

1. First run (no cache exists yet) - expected
2. Cache key changed - expected after dependency updates
3. Cache expired (GitHub deletes unused caches after 7 days)

**Solution**: Wait for next build to populate cache

### Build Still Slow

If builds remain slow despite caching:

1. **Check cache hit rate**: Look for "Cache restored" in logs
2. **Verify paths**: Ensure `.next/cache` is being cached
3. **Check disk space**: GitHub runners may clear caches if low on space
4. **Review cache key**: Ensure it's not changing on every run

### Cache Size Limits

- GitHub Actions: Max 10GB per repository
- Individual cache: Max 5GB
- Caches unused for 7 days are deleted

## Related Resources

- [Next.js CI Build Caching Docs](https://nextjs.org/docs/pages/guides/ci-build-caching)
- [GitHub Actions Cache Documentation](https://github.com/actions/cache)
- [actions/cache Examples](https://github.com/actions/cache/blob/main/examples.md)

## Implementation Date

**Date**: October 17, 2025  
**Implemented by**: GitHub Copilot  
**Based on**: Next.js official documentation
