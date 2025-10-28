# MVP Launch - Manual Tasks Guide

**Project**: Pricey  
**Phase**: Phase 0 (MVP)  
**Date**: October 28, 2025  
**Target Launch**: November 2025

This document contains all manual setup tasks required to deploy and launch Pricey MVP. Follow these steps in order for successful production deployment.

---

## Table of Contents

1. [Infrastructure Setup](#1-infrastructure-setup)
2. [Hosting & Deployment](#2-hosting--deployment)
3. [Database Setup](#3-database-setup)
4. [Storage Configuration](#4-storage-configuration)
5. [Domain & DNS](#5-domain--dns)
6. [Monitoring & Analytics](#6-monitoring--analytics)
7. [Security Configuration](#7-security-configuration)
8. [Email Setup](#8-email-setup)
9. [Content Creation](#9-content-creation)
10. [Pre-Launch Testing](#10-pre-launch-testing)
11. [Launch Day Checklist](#11-launch-day-checklist)
12. [Post-Launch Monitoring](#12-post-launch-monitoring)

---

## 1. Infrastructure Setup

### 1.1 Accounts to Create

Create accounts on the following platforms:

- **Vercel** (Frontend hosting): https://vercel.com/signup
- **Railway** (Backend hosting): https://railway.app/login
- **Upstash** (Redis cache): https://upstash.com/
- **Sentry** (Error tracking): https://sentry.io/signup/
- **Plausible** (Analytics): https://plausible.io/register
- **Uptime Robot** (Monitoring): https://uptimerobot.com/signUp

### 1.2 GitHub Repository Setup

Ensure your repository is properly configured:

```bash
# Verify repository structure
cd /path/to/Pricey
git status

# Ensure all code is committed
git add .
git commit -m "feat: prepare for MVP launch"
git push origin feature/MVP-Launch-Preparation
```

---

## 2. Hosting & Deployment

### 2.1 Vercel (Frontend)

#### Setup Steps:

1. **Connect GitHub**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select `mpwg/Pricey`
   - Authorize Vercel to access the repository

2. **Create Staging Project**:
   - Project Name: `pricey-staging`
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm build --filter=@pricey/web`
   - Output Directory: `.next`

3. **Configure Staging Environment Variables**:

   ```bash
   NEXT_PUBLIC_API_URL=https://staging-api.pricey.mpwg.eu/api/v1
   NEXT_PUBLIC_SENTRY_DSN=<staging-sentry-dsn>
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=staging.pricey.mpwg.eu
   ```

4. **Create Production Project**:
   - Project Name: `pricey-production`
   - Same settings as staging
   - Use production environment variables

5. **Configure Production Environment Variables**:

   ```bash
   NEXT_PUBLIC_API_URL=https://pricey.mpwg.eu/api/v1
   NEXT_PUBLIC_SENTRY_DSN=<production-sentry-dsn>
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=pricey.mpwg.eu
   ```

6. **Add Custom Domains** (after DNS setup):
   - Staging: `staging.pricey.mpwg.eu`
   - Production: `pricey.mpwg.eu`

### 2.2 Railway (Backend)

#### Setup Steps:

1. **Connect GitHub**:
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select `mpwg/Pricey`

2. **Create Staging Environment**:
   - Service Name: `pricey-api-staging`
   - Root Directory: `apps/api-gateway`
   - Use `railway.json` configuration

3. **Add PostgreSQL Plugin** (Staging):
   - Click "+ New Service"
   - Select "PostgreSQL"
   - Version: 18.x
   - Note the `DATABASE_URL` connection string

4. **Configure Staging Environment Variables**:

   Use `.env.production.template` as reference. Set these in Railway dashboard:

   ```bash
   # Node Environment
   NODE_ENV=production
   PORT=3001

   # Database (from Railway PostgreSQL plugin)
   DATABASE_URL=<railway-postgres-url>

   # Redis (from Upstash - see section 4)
   REDIS_URL=<upstash-redis-url>

   # Storage (S3/R2 - see section 4)
   STORAGE_ENDPOINT=<s3-endpoint>
   STORAGE_REGION=<region>
   STORAGE_BUCKET=<bucket-name>
   STORAGE_ACCESS_KEY_ID=<access-key>
   STORAGE_SECRET_ACCESS_KEY=<secret-key>
   STORAGE_PUBLIC_URL=https://storage.pricey.mpwg.eu

   # LLM Configuration
   LLM_PROVIDER=github
   GITHUB_TOKEN=<your-github-token>

   # Or for Ollama:
   # LLM_PROVIDER=ollama
   # OLLAMA_HOST=http://localhost:11434

   # Security
   CORS_ORIGIN=https://staging.pricey.mpwg.eu
   SESSION_SECRET=<generate-with-openssl-rand-hex-32>

   # Error Tracking
   SENTRY_DSN=<backend-sentry-dsn>
   SENTRY_ENVIRONMENT=staging

   # Rate Limiting
   RATE_LIMIT_MAX=100
   RATE_LIMIT_WINDOW=60000
   ```

5. **Create Production Environment**:
   - Repeat steps 2-4 with production values
   - Service Name: `pricey-api-production`
   - Use stronger rate limits for production

6. **Configure Health Check**:
   - Railway automatically uses `/health` endpoint
   - Verify it works: `curl https://your-railway-url.up.railway.app/api/v1/health`

---

## 3. Database Setup

### 3.1 Database Provisioning

**Option A: Railway PostgreSQL** (Recommended for MVP)

Already created in Railway setup above. Note the connection string.

**Option B: Supabase** (Alternative)

1. Go to https://supabase.com/dashboard
2. Create new project: `pricey-mvp`
3. Region: Choose closest to your users
4. Database password: Generate strong password (save in password manager)
5. Get connection string from Settings > Database

### 3.2 Run Migrations

Once database is provisioned:

```bash
# Set database URL
export DATABASE_URL="<your-database-url>"

# Run migrations
cd /path/to/Pricey
pnpm db:migrate

# Seed stores data
pnpm db:seed
```

### 3.3 Configure Backups

**Railway Backups**:

- Automatic daily backups are included
- Retention: 7 days on Pro plan
- Manual backup: Railway Dashboard > Database > Backups

**Manual Backup Script** (recommended weekly):

```bash
# Create backup
pg_dump $DATABASE_URL > backups/pricey-$(date +%Y%m%d).sql

# Test restore (staging only)
psql $STAGING_DATABASE_URL < backups/pricey-20251028.sql
```

### 3.4 Connection Pooling (Optional, for high traffic)

Consider using PgBouncer if you exceed 50+ concurrent users:

```bash
# Add to Railway environment variables
DATABASE_URL=<pooler-url>
DATABASE_DIRECT_URL=<direct-url>
```

---

## 4. Storage Configuration

### 4.1 Choose Storage Provider

**Option A: Cloudflare R2** (Recommended, cheaper than S3)

1. Go to https://dash.cloudflare.com/
2. Navigate to R2 Object Storage
3. Create bucket: `pricey-receipts`
4. Enable public access for receipts
5. Create API token with R2 permissions
6. Get credentials:
   - Account ID: `<account-id>`
   - Access Key ID: `<access-key>`
   - Secret Access Key: `<secret-key>`
   - Endpoint: `https://<account-id>.r2.cloudflarestorage.com`

**Option B: AWS S3**

1. Create S3 bucket: `pricey-receipts`
2. Enable versioning (optional)
3. Configure CORS policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://pricey.mpwg.eu",
      "https://staging.pricey.mpwg.eu"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Create IAM user with S3 permissions
5. Generate access credentials

### 4.2 Configure Environment Variables

Add to Railway (both staging and production):

```bash
STORAGE_ENDPOINT=<endpoint-url>
STORAGE_REGION=auto  # or specific region
STORAGE_BUCKET=pricey-receipts
STORAGE_ACCESS_KEY_ID=<access-key>
STORAGE_SECRET_ACCESS_KEY=<secret-key>
STORAGE_PUBLIC_URL=https://storage.pricey.mpwg.eu
```

### 4.3 Test Upload

```bash
# Test storage from API
curl -X POST https://your-api-url/api/v1/receipts \
  -F "file=@sample-receipt.jpg"
```

---

## 5. Domain & DNS

### 5.1 DNS Records Configuration

Add these CNAME records to your DNS provider (e.g., Cloudflare, AWS Route53):

```
Type    Name                    Value                   TTL
CNAME   pricey                  cname.vercel-dns.com    Auto
CNAME   staging.pricey          cname.vercel-dns.com    Auto
CNAME   storage.pricey          <r2-or-s3-url>          Auto
```

Full domains:

- `pricey.mpwg.eu` → Vercel (production frontend)
- `staging.pricey.mpwg.eu` → Vercel (staging frontend)
- `storage.pricey.mpwg.eu` → R2/S3 (receipt images)

### 5.2 Verify DNS Propagation

```bash
# Check DNS records
nslookup pricey.mpwg.eu
nslookup staging.pricey.mpwg.eu

# Or use dig
dig pricey.mpwg.eu +short

# Check from multiple locations
https://www.whatsmydns.net/#CNAME/pricey.mpwg.eu
```

Wait 5-60 minutes for full propagation.

### 5.3 Configure Custom Domains in Vercel

1. **Staging**:
   - Go to Vercel Dashboard > pricey-staging > Settings > Domains
   - Add Domain: `staging.pricey.mpwg.eu`
   - Vercel will automatically provision SSL certificate
   - Wait for "Active" status

2. **Production**:
   - Go to Vercel Dashboard > pricey-production > Settings > Domains
   - Add Domain: `pricey.mpwg.eu`
   - Enable "Redirect www to root" (optional)
   - Wait for SSL certificate

### 5.4 Verify SSL Certificates

```bash
# Test HTTPS
curl -I https://pricey.mpwg.eu

# Check SSL rating
# Go to: https://www.ssllabs.com/ssltest/
# Enter: pricey.mpwg.eu
# Target: A+ rating
```

---

## 6. Monitoring & Analytics

### 6.1 Sentry (Error Tracking)

#### Frontend Setup:

1. Create Sentry account at https://sentry.io/signup/
2. Create organization: `Pricey`
3. Create frontend project:
   - Platform: Next.js
   - Name: `pricey-web-production`
   - Copy DSN: `https://...@o...ingest.sentry.io/...`

4. Install Sentry:

   ```bash
   cd apps/web
   pnpm add @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```

5. Add DSN to Vercel environment variables:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=<frontend-dsn>
   ```

#### Backend Setup:

1. Create backend project in Sentry:
   - Platform: Node.js
   - Name: `pricey-api-production`
   - Copy DSN

2. Install Sentry:

   ```bash
   cd apps/api-gateway
   pnpm add @sentry/node
   ```

3. Add to Railway environment variables:

   ```bash
   SENTRY_DSN=<backend-dsn>
   SENTRY_ENVIRONMENT=production
   ```

4. Configure in `apps/api-gateway/src/app.ts`:

   ```typescript
   import * as Sentry from '@sentry/node';

   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.SENTRY_ENVIRONMENT,
     tracesSampleRate: 0.1,
   });
   ```

#### Configure Alerts:

1. Go to Sentry > Settings > Alerts
2. Create alert rule:
   - Name: "Critical Errors"
   - Conditions: Error count > 5 in 5 minutes
   - Actions: Send to Slack + Email
3. Create alert for 5% error rate threshold

### 6.2 Plausible Analytics

1. **Create Account**:
   - Go to https://plausible.io/register
   - Choose plan (free trial available)

2. **Add Website**:
   - Domain: `pricey.mpwg.eu`
   - Timezone: Your timezone
   - Get tracking script

3. **Install Script**:

   Add to `apps/web/app/layout.tsx`:

   ```tsx
   import Script from 'next/script';

   export default function RootLayout({ children }) {
     return (
       <html>
         <head>
           <Script
             defer
             data-domain="pricey.mpwg.eu"
             src="https://plausible.io/js/script.js"
           />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

4. **Verify Installation**:
   - Visit your site
   - Check Plausible dashboard for real-time visitor
   - Should see visit within 1 minute

5. **Configure Custom Events**:
   - Events are already defined in `apps/web/lib/analytics.ts`
   - No additional setup needed

6. **Set Up Reporting**:
   - Settings > Email Reports
   - Enable weekly summary
   - Add team email addresses

### 6.3 Uptime Robot (Availability Monitoring)

1. **Create Account**:
   - Go to https://uptimerobot.com/signUp
   - Verify email

2. **Add Monitors**:

   **Monitor 1: Frontend**
   - Monitor Type: HTTP(s)
   - Friendly Name: `Pricey Frontend - Production`
   - URL: `https://pricey.mpwg.eu/`
   - Monitoring Interval: 5 minutes
   - Monitor Timeout: 30 seconds

   **Monitor 2: API Health Check**
   - Monitor Type: HTTP(s)
   - Friendly Name: `Pricey API - Health Check`
   - URL: `https://pricey.mpwg.eu/api/v1/health`
   - Monitoring Interval: 5 minutes
   - Expected Status Code: 200

3. **Configure Alerts**:
   - Alert Contacts: Add email and/or Slack webhook
   - Alert When: Down for 2 minutes
   - Notification frequency: Every check (during downtime)

4. **Create Status Page** (Optional):
   - Public Status Pages > Add New
   - Custom Domain: `status.pricey.mpwg.eu` (requires DNS config)
   - Add monitors to page

### 6.4 Vercel Analytics (Web Vitals)

1. Go to Vercel Dashboard > pricey-production > Analytics
2. Enable Web Vitals tracking (free tier available)
3. Monitor Core Web Vitals:
   - LCP (Largest Contentful Paint) < 2.5s
   - FID (First Input Delay) < 100ms
   - CLS (Cumulative Layout Shift) < 0.1

---

## 7. Security Configuration

### 7.1 Generate Secrets

```bash
# Generate session secret (32 bytes)
openssl rand -hex 32

# Add to Railway environment variables:
SESSION_SECRET=<generated-secret>
```

### 7.2 Configure CORS

Already set in `.env.production.template`, verify:

```bash
# Railway environment variables
CORS_ORIGIN=https://pricey.mpwg.eu
```

For multiple origins (staging + production):

```bash
CORS_ORIGIN=https://pricey.mpwg.eu,https://staging.pricey.mpwg.eu
```

### 7.3 Rate Limiting

Configure in Railway:

```bash
# Production (stricter)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000  # 1 minute

# Staging (more lenient for testing)
RATE_LIMIT_MAX=500
RATE_LIMIT_WINDOW=60000
```

### 7.4 Security Headers

Vercel automatically adds security headers. Verify they're present:

```bash
curl -I https://pricey.mpwg.eu

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
```

### 7.5 Security Audit

#### Run OWASP ZAP Scan:

1. Download OWASP ZAP: https://www.zaproxy.org/download/
2. Run automated scan:
   ```bash
   zap-cli quick-scan --self-contained \
     https://pricey.mpwg.eu
   ```
3. Review and fix any High/Medium vulnerabilities

#### SSL Labs Test:

1. Go to https://www.ssllabs.com/ssltest/
2. Enter: `pricey.mpwg.eu`
3. Wait for scan (2-3 minutes)
4. Target: **A+ rating**

---

## 8. Email Setup

### 8.1 Email Addresses Required

Set up forwarding or mailboxes for:

- `privacy@mpwg.eu` - Privacy inquiries, GDPR requests
- `dpo@mpwg.eu` - Data Protection Officer
- `legal@mpwg.eu` - Legal matters, Terms of Service
- `support@mpwg.eu` - General user support
- `feedback@mpwg.eu` - User feedback and feature requests

### 8.2 Email Forwarding Setup

**Option A: Cloudflare Email Routing** (Free, Recommended)

1. Go to Cloudflare Dashboard > Email > Email Routing
2. Enable Email Routing for `mpwg.eu`
3. Add destination email address
4. Create routing rules:
   - `privacy@mpwg.eu` → `your-email+privacy@gmail.com`
   - `dpo@mpwg.eu` → `your-email+dpo@gmail.com`
   - `legal@mpwg.eu` → `your-email+legal@gmail.com`
   - `support@mpwg.eu` → `your-email+support@gmail.com`
   - `feedback@mpwg.eu` → `your-email+feedback@gmail.com`
5. Verify each email address

**Option B: Google Workspace / FastMail**

Create actual mailboxes for professional setup.

### 8.3 Email Templates (Optional)

Create auto-responder templates for common inquiries:

```
Subject: Thanks for contacting Pricey Support

Hi there,

Thanks for reaching out! We've received your message and will get back to you within 24 hours.

In the meantime, you might find these resources helpful:
- FAQ: https://pricey.mpwg.eu/faq
- Documentation: https://github.com/mpwg/Pricey/tree/main/docs
- GitHub Issues: https://github.com/mpwg/Pricey/issues

Best regards,
The Pricey Team
```

---

## 9. Content Creation

### 9.1 Demo Video

**Requirements**:

- Length: 60-90 seconds
- Format: MP4, 1080p
- Quality: High-quality screen recording

**Script**:

1. Show landing page (5s)
2. Upload receipt (10s)
3. Processing animation (5s)
4. View extracted data (15s)
5. Browse receipt list (10s)
6. View detail page (10s)
7. End with CTA (5s)

**Tools**:

- Screen recording: QuickTime (Mac), OBS Studio (cross-platform)
- Editing: iMovie, DaVinci Resolve (free)
- Captions: Rev.com, YouTube auto-captions

**Steps**:

1. **Record**:

   ```bash
   # Prepare clean demo environment
   # Clear browser data
   # Use high-quality sample receipt
   ```

2. **Edit**:
   - Add background music (royalty-free)
   - Add captions for key features
   - Compress video (target <10MB)

3. **Upload**:
   - YouTube (unlisted): Better streaming
   - Or self-host in `/apps/web/public/demo-video.mp4`

4. **Update Component**:
   ```tsx
   // apps/web/components/landing/demo.tsx
   <iframe
     src="https://www.youtube.com/embed/YOUR-VIDEO-ID"
     title="Pricey Demo"
   />
   ```

### 9.2 Screenshots

**Required Screenshots**:

1. **Upload Interface** (mobile + desktop)
   - Before upload state
   - Drag-and-drop hover state
2. **Processing Status**
   - Loading spinner with status message

3. **Receipt List View**
   - At least 5-10 receipts
   - Various stores and amounts
   - Different statuses

4. **Receipt Detail View**
   - Full receipt breakdown
   - Line items table
   - Receipt image

**Tools**:

- Screenshot: macOS Screenshot (Cmd+Shift+4)
- Mobile device: Simulator or real device
- Editing: Preview, Figma, Photoshop

**Steps**:

1. **Capture Screenshots**:

   ```bash
   # Desktop: 1920x1080 or 1440x900
   # Mobile: iPhone 14 Pro (393x852)
   ```

2. **Optimize Images**:

   ```bash
   # Install imagemagick
   brew install imagemagick

   # Optimize
   magick convert screenshot.png -quality 85 -resize 1200x screenshot.jpg
   ```

3. **Add to Project**:

   ```bash
   mv screenshots/*.jpg /path/to/Pricey/apps/web/public/screenshots/
   ```

4. **Update Component**:
   ```tsx
   // apps/web/components/landing/demo.tsx
   const screenshots = [
     '/screenshots/upload.jpg',
     '/screenshots/processing.jpg',
     '/screenshots/list.jpg',
     '/screenshots/detail.jpg',
   ];
   ```

### 9.3 Social Media Assets

**Open Graph Image** (1200x630px):

Create image with:

- Pricey logo
- Tagline: "Smart Receipt Scanning & Price Tracking"
- Key features: "85-99% Accuracy • Open Source • Privacy First"
- Background: Brand colors or gradient

Save as: `/apps/web/public/og-image.png`

**Twitter Card Image** (Same as OG):

Use same image for consistency.

**Update Metadata**:

```tsx
// apps/web/app/page.tsx
export const metadata: Metadata = {
  openGraph: {
    images: ['/og-image.png'],
  },
  twitter: {
    images: ['/og-image.png'],
  },
};
```

---

## 10. Pre-Launch Testing

### 10.1 Staging Environment Tests

Complete these tests on `staging.pricey.mpwg.eu`:

#### Functional Tests:

- [ ] Landing page loads correctly
- [ ] Can navigate to /receipts
- [ ] Can upload a receipt image
- [ ] Receipt processes successfully
- [ ] Can view receipt in list
- [ ] Can open receipt detail page
- [ ] Can view raw OCR text
- [ ] Receipt items display correctly
- [ ] Total amount is accurate
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

#### Browser Compatibility:

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### Device Tests:

- [ ] Desktop (1920x1080)
- [ ] Laptop (1440x900)
- [ ] Tablet (iPad)
- [ ] Mobile (iPhone 14 Pro)
- [ ] Mobile (Samsung Galaxy S23)

#### Performance Tests:

```bash
# Lighthouse audit
npx lighthouse https://staging.pricey.mpwg.eu --view

# Target scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >95
# SEO: >95
```

### 10.2 Load Testing

Test with 50 concurrent users:

```bash
cd apps/api-gateway
pnpm tsx scripts/load-test.ts

# Monitor:
# - Response times < 2000ms
# - Error rate < 1%
# - No memory leaks
```

### 10.3 Security Testing

```bash
# SQL Injection test
curl -X POST https://staging-api/api/v1/receipts \
  -F "file='; DROP TABLE receipts; --"

# XSS test
# Upload receipt with malicious store name

# File upload test
# Try uploading .exe, .php, oversized files
```

### 10.4 Error Monitoring Test

1. Cause intentional error on staging
2. Check Sentry dashboard for error report
3. Verify Slack/email notification received
4. Confirm error details are complete

### 10.5 Analytics Test

1. Visit staging site
2. Perform key actions (upload, view receipt)
3. Check Plausible dashboard for events
4. Verify custom events are tracked

---

## 11. Launch Day Checklist

### Pre-Launch (Morning - 09:00)

- [ ] Coffee ☕
- [ ] Open all monitoring dashboards
  - [ ] Sentry (both frontend + backend)
  - [ ] Plausible Analytics
  - [ ] Uptime Robot
  - [ ] Vercel Analytics
  - [ ] Railway Logs

- [ ] Run final smoke tests on production:

  ```bash
  curl https://pricey.mpwg.eu
  curl https://pricey.mpwg.eu/api/v1/health
  ```

- [ ] Verify team availability:
  - [ ] Developer(s) on standby
  - [ ] Have phone numbers handy
  - [ ] Emergency rollback plan ready

### Soft Launch (09:30)

- [ ] Post in private beta group (friends/family):

  ```
  🎉 Pricey is now live! We'd love your feedback.

  Try it out: https://pricey.mpwg.eu
  Report issues: https://github.com/mpwg/Pricey/issues

  Looking for: bugs, UX feedback, feature ideas
  ```

- [ ] Monitor for 30 minutes:
  - [ ] Check error rate (should be <1%)
  - [ ] Check processing success rate
  - [ ] Respond to any immediate feedback

### Public Launch (12:00)

If soft launch goes well:

#### 1. Update GitHub README

```bash
git checkout main
# Update README.md with:
# - Live demo link: https://pricey.mpwg.eu
# - Updated status badge
# - Clear installation instructions
git commit -m "docs: update README for public launch"
git push origin main
```

#### 2. Social Media Posts

**Twitter/X**:

```
🎉 Launching Pricey - Smart Receipt Scanning & Price Tracking!

📸 Scan receipts instantly
🤖 85-99% AI accuracy
🔒 Privacy-first, open-source
🐳 Self-hostable

Try it: https://pricey.mpwg.eu
Code: https://github.com/mpwg/Pricey

#opensource #AI #selfhosted
```

**LinkedIn**:

```
Excited to launch Pricey, an open-source receipt scanning and price tracking app!

Built with Next.js, Fastify, and vision LLMs (Ollama + GitHub Models), Pricey makes receipt management simple and privacy-focused.

Key features:
✅ 85-99% OCR accuracy
✅ AGPL-3.0 licensed
✅ Self-hostable
✅ No tracking or ads

Try the live demo: https://pricey.mpwg.eu
```

**Reddit Posts**:

Post to relevant subreddits (one per day to avoid spam):

- r/selfhosted

  ```
  [Project] Pricey - Self-hostable Receipt Scanning & Price Tracking

  I built an open-source receipt scanner with AI-powered OCR (85-99% accuracy).

  Features:
  - Docker deployment
  - Vision LLMs (Ollama or GitHub Models)
  - PostgreSQL + Redis
  - Next.js frontend
  - AGPL-3.0 license

  Live demo: https://pricey.mpwg.eu
  GitHub: https://github.com/mpwg/Pricey
  ```

- r/opensource
- r/webdev

#### 3. Product Hunt (Optional)

If you want more visibility:

1. Create Product Hunt account
2. Submit product with demo link
3. Include screenshots and demo video
4. Respond to all comments

### Throughout Launch Day

- [ ] **10:00-18:00**: Monitor every hour
  - Error rate
  - Active users
  - Processing times
  - User feedback

- [ ] **Respond quickly**:
  - Social media comments (within 1 hour)
  - GitHub issues (within 2 hours)
  - Email support (within 4 hours)

- [ ] **Log all issues**:
  ```bash
  # Keep a launch day log
  echo "12:30 - User reported slow processing on mobile Safari" >> launch-log.txt
  ```

### End of Day (18:00)

- [ ] Review metrics:
  - Total visitors: \_\_\_
  - Receipts uploaded: \_\_\_
  - Error rate: \_\_\_%
  - Uptime: \_\_\_%
- [ ] Create end-of-day report
- [ ] Celebrate! 🎉

---

## 12. Post-Launch Monitoring

### First 48 Hours

**Monitor Closely**:

- [ ] Check Sentry every 2 hours
- [ ] Review Plausible Analytics every 4 hours
- [ ] Read all user feedback
- [ ] Fix critical bugs immediately

**Communication**:

- [ ] Thank early users publicly
- [ ] Share interesting metrics (if good)
- [ ] Acknowledge any issues transparently

### Week 1

- [ ] Daily metrics review:

  ```bash
  # Key metrics to track:
  - Daily active users
  - Total receipts uploaded
  - Average processing time
  - Error rate (target: <5%)
  - User retention (day 2, day 7)
  ```

- [ ] Send thank you email to early users:

  ```
  Subject: Thanks for trying Pricey! 🙏

  Hi,

  Thank you for being one of our first users!

  We'd love your feedback:
  - What do you like most?
  - What should we improve?
  - What features do you want next?

  Reply to this email or create a GitHub issue.

  Thanks,
  [Your Name]
  ```

- [ ] Create weekly report:

  ```markdown
  # Pricey - Week 1 Report

  ## Metrics

  - Users: 50
  - Receipts: 200
  - Error rate: 3%
  - Uptime: 99.5%

  ## Feedback

  - Top request: Manual correction UI
  - Top complaint: Slow processing on large images

  ## Next Steps

  - Optimize image preprocessing
  - Plan Phase 1 features
  ```

### Week 2

- [ ] User survey (NPS):

  ```
  On a scale of 0-10, how likely are you to recommend Pricey?

  What's the main reason for your score?

  What would make Pricey more valuable to you?
  ```

- [ ] Analyze feedback themes
- [ ] Update roadmap based on user needs
- [ ] Plan Phase 1 features

### Success Criteria (2 Weeks)

Target metrics:

- [ ] **Users**: 50+ early adopters
- [ ] **Receipts**: 200+ uploaded
- [ ] **Retention**: 30%+ week 2 retention
- [ ] **NPS**: Score >30
- [ ] **Uptime**: >99%
- [ ] **Error Rate**: <5%
- [ ] **Reviews**: 10+ positive testimonials

---

## Emergency Procedures

### If Critical Issue Occurs

1. **Assess Severity**:
   - Critical: Data loss, security breach, total downtime
   - High: Feature broken, high error rate
   - Medium: Slow performance, minor bugs

2. **For Critical Issues**:

   ```bash
   # Stop new deployments
   # Post status update
   # Roll back if needed

   # Vercel rollback
   vercel rollback

   # Railway rollback
   railway rollback <deployment-id>
   ```

3. **Communicate**:
   - Post on status page
   - Update social media
   - Email affected users

4. **Fix & Deploy**:
   - Fix issue in branch
   - Test thoroughly on staging
   - Deploy fix
   - Verify resolution

### Rollback Procedures

**Frontend (Vercel)**:

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback
```

**Backend (Railway)**:

```bash
# View deployments
railway logs --deployment

# Rollback
railway rollback <deployment-id>
```

**Database**:

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup.sql
```

---

## Support Contacts

### Hosting Providers

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/help
- **Upstash Support**: https://upstash.com/docs

### Monitoring Services

- **Sentry Support**: https://sentry.io/support
- **Plausible Support**: https://plausible.io/contact

### Community

- **GitHub Discussions**: https://github.com/mpwg/Pricey/discussions
- **GitHub Issues**: https://github.com/mpwg/Pricey/issues

---

## Final Notes

### Before You Start

- [ ] Read this document fully
- [ ] Save all credentials in password manager
- [ ] Set up 2FA on all accounts
- [ ] Have backup contact method (phone)
- [ ] Plan for 4-6 hours of setup time

### During Setup

- [ ] Document any deviations from this guide
- [ ] Take screenshots of configurations
- [ ] Test each step before moving to next
- [ ] Keep a setup log

### Launch Day

- [ ] Stay calm
- [ ] Monitor closely
- [ ] Respond quickly to issues
- [ ] Celebrate small wins
- [ ] Document everything

### After Launch

- [ ] Update this document with learnings
- [ ] Share metrics with team
- [ ] Thank your supporters
- [ ] Plan next phase

---

**Good luck with your launch!** 🚀

If you have questions or run into issues:

- Check [LAUNCH-CHECKLIST.md](./LAUNCH-CHECKLIST.md)
- Review [M0.4-IMPLEMENTATION-SUMMARY.md](./M0.4-IMPLEMENTATION-SUMMARY.md)
- Ask in [GitHub Discussions](https://github.com/mpwg/Pricey/discussions)
