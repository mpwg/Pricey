# Domain Update Summary

**Date**: 2025-01-28  
**Change**: Updated all domain references from `mvp.pricey.app` to `pricey.mpwg.eu`

---

## Overview

All domain references throughout the codebase have been updated to reflect the new domain structure:

- **Production**: `pricey.mpwg.eu` (was `mvp.pricey.app`)
- **Staging**: `staging.pricey.mpwg.eu` (was `staging.pricey.app`)
- **Email**: `*@mpwg.eu` (was `*@pricey.app`)
- **Storage**: `storage.pricey.mpwg.eu` (was `storage.pricey.app`)

---

## Files Updated

### Configuration Files

- ✅ `.env.production.template`
  - `CORS_ORIGIN`: Updated to `https://pricey.mpwg.eu`
  - `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: Updated to `pricey.mpwg.eu`

- ✅ `scripts/deploy.sh`
  - `PRODUCTION_URL`: Updated to `https://pricey.mpwg.eu`
  - `STAGING_URL`: Updated to `https://staging.pricey.mpwg.eu`

### Frontend Files

- ✅ `apps/web/public/sitemap.xml`
  - All 4 URLs updated to use `pricey.mpwg.eu`

- ✅ `apps/web/public/robots.txt`
  - Sitemap URL updated to `https://pricey.mpwg.eu/sitemap.xml`

- ✅ `apps/web/app/privacy/page.tsx`
  - Domain reference: `pricey.mpwg.eu`
  - Email contacts:
    - `privacy@mpwg.eu`
    - `dpo@mpwg.eu`

- ✅ `apps/web/app/terms/page.tsx`
  - Email contact: `legal@mpwg.eu`

### Documentation Files

- ✅ `docs/api/README.md`
  - Base URLs updated for production and staging
  - All curl example commands updated
  - Storage URLs: `storage.pricey.mpwg.eu`
  - Support email: `support@mpwg.eu`

- ✅ `docs/FAQ.md`
  - Domain references throughout
  - Support email: `support@mpwg.eu`
  - Removed non-existent status page reference

### Launch Materials

- ✅ `docs/phases/phase-0-mvp/LAUNCH-CHECKLIST.md`
  - Domain configuration steps updated
  - Plausible Analytics domain: `pricey.mpwg.eu`
  - Monitoring URLs updated
  - Support email: `support@mpwg.eu`
  - Privacy contact: `privacy@mpwg.eu`

- ✅ `docs/phases/phase-0-mvp/LAUNCH-ANNOUNCEMENTS.md`
  - Launch URLs: `https://pricey.mpwg.eu`
  - Feedback email: `feedback@mpwg.eu`

- ✅ `docs/phases/phase-0-mvp/M0.4-IMPLEMENTATION-SUMMARY.md`
  - Configuration examples updated
  - Quick links updated
  - Support email: `support@mpwg.eu`

### Database Files

- ✅ `packages/database/prisma/seed.ts`
  - Test user email: `test@mpwg.eu`

---

## Email Addresses Updated

| Old Email             | New Email          | Purpose                 |
| --------------------- | ------------------ | ----------------------- |
| `privacy@pricey.app`  | `privacy@mpwg.eu`  | Privacy inquiries       |
| `dpo@pricey.app`      | `dpo@mpwg.eu`      | Data Protection Officer |
| `legal@pricey.app`    | `legal@mpwg.eu`    | Legal matters           |
| `support@pricey.app`  | `support@mpwg.eu`  | General support         |
| `feedback@pricey.app` | `feedback@mpwg.eu` | User feedback           |
| `test@pricey.app`     | `test@mpwg.eu`     | Test user (dev only)    |

---

## Verification

All domain references have been updated. Verified with:

```bash
grep -rI "pricey\.app" --include="*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,xml,txt,sh}" . \
  | grep -v node_modules | grep -v ".git" | grep -v coverage
```

**Result**: No matches found ✅

---

## Next Steps

### DNS Configuration (Manual)

1. **Add DNS Records**:

   ```
   Type    Name                    Value               TTL
   CNAME   pricey.mpwg.eu          cname.vercel-dns.com   Auto
   CNAME   staging.pricey.mpwg.eu  cname.vercel-dns.com   Auto
   ```

2. **Verify DNS Propagation**:

   ```bash
   nslookup pricey.mpwg.eu
   nslookup staging.pricey.mpwg.eu
   ```

3. **Configure Vercel**:
   - Add custom domains in Vercel dashboard
   - Wait for SSL certificate provisioning
   - Verify HTTPS redirect

### Analytics Configuration (Manual)

1. **Plausible Analytics**:
   - Create account at plausible.io
   - Add website: `pricey.mpwg.eu`
   - Copy tracking script
   - Add to `apps/web/app/layout.tsx`:
     ```tsx
     <Script
       defer
       data-domain="pricey.mpwg.eu"
       src="https://plausible.io/js/script.js"
     />
     ```

2. **Uptime Robot**:
   - Monitor: `https://pricey.mpwg.eu/`
   - Monitor: `https://pricey.mpwg.eu/api/v1/health`

### Email Configuration (Manual)

Set up email forwarding or mailboxes for:

- `privacy@mpwg.eu`
- `dpo@mpwg.eu`
- `legal@mpwg.eu`
- `support@mpwg.eu`
- `feedback@mpwg.eu`

### Environment Variables (Manual)

Update production environment variables in Vercel and Railway:

```bash
# Frontend (Vercel)
NEXT_PUBLIC_API_URL=https://pricey.mpwg.eu/api/v1
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pricey.mpwg.eu

# Backend (Railway)
CORS_ORIGIN=https://pricey.mpwg.eu
```

---

## Checklist

- [x] Update all code references
- [x] Update documentation
- [x] Update launch materials
- [x] Update email addresses
- [x] Verify no old references remain
- [ ] Configure DNS records
- [ ] Add domains to Vercel
- [ ] Update environment variables
- [ ] Configure Plausible Analytics
- [ ] Set up email forwarding
- [ ] Configure Uptime Robot
- [ ] Test production URLs

---

**Status**: Code updates complete ✅  
**Remaining**: Manual infrastructure setup (DNS, hosting, monitoring)

For detailed manual setup instructions, see:

- [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md)
- [M0.4-IMPLEMENTATION-SUMMARY.md](./M0.4-IMPLEMENTATION-SUMMARY.md)
