# Dependabot Configuration Guide

## What is Dependabot?

Dependabot is GitHub's automated dependency update tool that:

- Checks for outdated dependencies
- Creates pull requests with updates
- Includes changelogs and release notes
- Runs your CI tests automatically

## Configuration

The project is configured to check for updates in:

1. **npm packages** - Weekly on Mondays
2. **Docker images** - Weekly on Mondays
3. **GitHub Actions** - Weekly on Mondays

## Update Strategy

### npm Dependencies

**Production Dependencies:**

- Grouped updates for minor and patch versions
- Separate PRs for major versions
- Major updates ignored for core frameworks (Next.js, React)

**Development Dependencies:**

- Grouped updates for minor and patch versions
- Separate PRs for major versions

### Docker Images

- Updates for base images (Node, PostgreSQL, Redis)
- Weekly checks for security updates

### GitHub Actions

- Updates for action versions
- Ensures CI/CD pipeline uses latest secure versions

## Pull Request Management

**Limits:**

- npm: Max 10 open PRs
- Docker: Max 5 open PRs
- GitHub Actions: Max 5 open PRs

**Auto-assigned to:** mpwg (update in `.github/dependabot.yml`)

**Labels added:**

- `dependencies` - All dependency updates
- `automated` - npm updates
- `docker` - Docker updates
- `ci` - GitHub Actions updates

## Review Process

1. **Dependabot creates PR** with:

   - Version bump details
   - Changelog/release notes
   - Compatibility score

2. **CI runs automatically**:

   - Linting
   - Type checking
   - Build validation
   - Tests

3. **Review checklist**:

   - ✅ CI passes
   - ✅ Review breaking changes
   - ✅ Check changelog
   - ✅ Test locally if major update

4. **Merge when ready**

## Customization

### Change schedule

Edit `.github/dependabot.yml`:

```yaml
schedule:
  interval: "daily" # or "weekly", "monthly"
  day: "monday"
  time: "09:00"
```

### Add more reviewers

```yaml
reviewers:
  - "mpwg"
  - "teammate1"
  - "teammate2"
```

### Ignore specific packages

```yaml
ignore:
  - dependency-name: "package-name"
    update-types: ["version-update:semver-major"]
```

## Security Updates

Dependabot also creates **security alerts** for:

- Vulnerable dependencies
- CVE (Common Vulnerabilities and Exposures)

These are **created immediately** regardless of schedule.

### Viewing Security Alerts

1. Go to **Security** tab in GitHub
2. Click **Dependabot alerts**
3. Review and merge security PRs ASAP

## Commands

You can interact with Dependabot PRs via comments:

```
@dependabot rebase        - Rebase the PR
@dependabot recreate      - Recreate the PR
@dependabot merge         - Merge when CI passes
@dependabot squash        - Squash and merge
@dependabot cancel merge  - Cancel auto-merge
@dependabot close         - Close the PR
@dependabot ignore        - Ignore this dependency
@dependabot ignore major  - Ignore major updates only
```

## Best Practices

### ✅ Do:

- Review grouped PRs together
- Merge security updates immediately
- Test major updates locally
- Keep dependencies reasonably up-to-date
- Use semantic versioning in package.json

### ❌ Don't:

- Auto-merge without CI validation
- Ignore all PRs (defeats the purpose)
- Mix dependency updates with feature work
- Update too aggressively in production

## Grouped Updates Example

Instead of 10 individual PRs for patch updates, you'll get:

**Production Dependencies PR:**

- next: 14.2.15 → 14.2.16
- prisma: 5.20.0 → 5.20.1
- bullmq: 5.13.2 → 5.13.3

**Development Dependencies PR:**

- typescript: 5.6.3 → 5.6.4
- eslint: 8.57.1 → 8.57.2

## Monitoring

### Dashboard

Go to **Insights → Dependency graph → Dependabot** to see:

- Update frequency
- Response time
- Merged PRs
- Open PRs

### Notifications

Configure in **Settings → Notifications**:

- Email alerts for security updates
- GitHub notifications for all PRs
- Slack integration (optional)

## Disable Dependabot

If you need to disable temporarily:

1. **For specific ecosystem:**

   ```yaml
   # Comment out or remove from dependabot.yml
   # - package-ecosystem: "npm"
   ```

2. **Completely:**
   Delete or rename `.github/dependabot.yml`

3. **Per repository:**
   Settings → Security & analysis → Dependabot alerts/updates

## Troubleshooting

### PR not created

- Check `.github/dependabot.yml` syntax
- Ensure package ecosystem is correct
- Check open PR limit not reached

### CI failing on Dependabot PR

- Review breaking changes in update
- Check if tests need updating
- May need to update code for new API

### Too many PRs

- Reduce `open-pull-requests-limit`
- Change to monthly schedule
- Add more packages to `ignore` list

## Example Workflow

**Monday 9 AM:**

1. Dependabot checks for updates
2. Creates grouped PRs

**Your Review:**

1. Check CI status on all PRs
2. Review security PRs first → merge
3. Review grouped production PRs → merge if CI green
4. Review grouped dev PRs → merge if CI green
5. Review major version PRs → test locally → merge when ready

**Result:**
Dependencies stay current with minimal effort!

## Additional Resources

- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Configuration Options](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file)
- [About Dependabot Security Updates](https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates)
