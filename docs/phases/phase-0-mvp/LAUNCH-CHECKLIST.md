# MVP Launch Checklist

**Target Launch Date**: November 2025  
**Target Users**: 50 early adopters

---

## Pre-Launch (Week 1-3)

### Development

- [x] M0.1: Infrastructure Setup
- [x] M0.2: Receipt Upload & OCR
- [x] M0.3: Basic Receipt List UI
- [ ] M0.4: MVP Launch Preparation

### Documentation

- [ ] README.md updated with latest features
- [ ] API documentation complete
- [ ] Self-hosting guide updated
- [ ] FAQ created
- [ ] Privacy Policy written
- [ ] Terms of Service written

### Design & UX

- [ ] Landing page designed and implemented
- [ ] Logo and branding finalized
- [ ] Screenshots taken (mobile + desktop)
- [ ] Demo video recorded (60-90s)
- [ ] Social media images created (1200x630px)

---

## Week 4: Final Preparations

### Testing

- [ ] All features tested on staging
- [ ] Mobile testing (iOS Safari, Android Chrome)
- [ ] Desktop testing (Chrome, Firefox, Safari, Edge)
- [ ] Load testing completed (50 concurrent users)
- [ ] Security scan completed (OWASP ZAP)
- [ ] Accessibility audit (Lighthouse score >90)
- [ ] Zero critical bugs

### Infrastructure

#### Staging Environment

- [ ] Vercel project created for frontend
- [ ] Railway services configured for backend
- [ ] PostgreSQL database provisioned
- [ ] Redis cache configured (Upstash)
- [ ] S3/R2 storage configured
- [ ] Domain configured (`staging.pricey.mpwg.eu`)
- [ ] SSL certificate valid
- [ ] Complete end-to-end test

#### Production Environment

- [ ] Vercel project created for frontend
- [ ] Railway services configured for backend
- [ ] Production PostgreSQL database with backups
- [ ] Production Redis cache
- [ ] Production S3/R2 storage
- [ ] Domain configured (`pricey.mpwg.eu`)
- [ ] SSL certificate valid (A+ rating on SSL Labs)
- [ ] CORS configured correctly
- [ ] Rate limiting configured

### Monitoring & Analytics

- [ ] Sentry error tracking configured
  - [ ] Frontend project created
  - [ ] Backend project created
  - [ ] Source maps uploaded
  - [ ] Slack alerts configured
  - [ ] Email notifications configured

#### Plausible Analytics

- [ ] Create Plausible account at plausible.io
- [ ] Add website: `pricey.mpwg.eu`
- [ ] Get tracking script
- [ ] Add to `apps/web/app/layout.tsx`:
  ```tsx
  <Script
    defer
    data-domain="pricey.mpwg.eu"
    src="https://plausible.io/js/script.js"
  />
  ```

#### Uptime Monitoring

- [ ] Create Uptime Robot account
- [ ] Monitor frontend: `https://pricey.mpwg.eu/`
- [ ] Monitor API: `https://pricey.mpwg.eu/api/v1/health`
- [ ] Configure alerts (Slack, email)
- [ ] Set check interval (5 minutes)
- [ ] Performance monitoring enabled
  - [ ] Vercel Analytics (Web Vitals)
  - [ ] API response time tracking

### Security

- [ ] Security headers configured
  - [ ] HSTS enabled
  - [ ] X-Frame-Options set
  - [ ] Content-Security-Policy configured
  - [ ] X-Content-Type-Options set
- [ ] Rate limiting enabled
- [ ] File upload validation working
- [ ] SQL injection prevention tested
- [ ] XSS prevention tested

### Legal & Compliance

- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Legal links in footer
- [ ] GDPR basics implemented (data retention policy)
- [ ] Contact email configured ([privacy@mpwg.eu](mailto:privacy@mpwg.eu))

---

## Launch Day (T-0)

### Pre-Launch Checks (Morning)

- [ ] Final smoke tests on production
  - [ ] Landing page loads
  - [ ] Can upload receipt
  - [ ] OCR processing works
  - [ ] Can view receipt list
  - [ ] Can view receipt details
- [ ] All monitoring dashboards open
- [ ] Team available for support
- [ ] Rollback plan ready

### Launch Sequence

#### 09:00 - Soft Launch

- [ ] Post announcement in private beta group (friends & family)
- [ ] Monitor error rates
- [ ] Test key flows

#### 12:00 - Public Launch

- [ ] Update GitHub README
- [ ] Publish launch blog post (optional)
- [ ] Post on Twitter/X
- [ ] Post on LinkedIn
- [ ] Post on Reddit (r/selfhosted, r/opensource)
- [ ] Send email to mailing list (if any)
- [ ] Submit to Product Hunt (optional)

#### Throughout the Day

- [ ] Monitor error dashboards
- [ ] Respond to feedback on social media
- [ ] Track analytics (conversions, signups)
- [ ] Address critical bugs immediately
- [ ] Update team on progress

### Afternoon Check-in (15:00)

- [ ] Review error rate (<5%)
- [ ] Review uptime (>99%)
- [ ] Review user feedback
- [ ] Celebrate early wins! 🎉

---

## Post-Launch (Week 1-2)

### Day 1-3

- [ ] Monitor error rates hourly
- [ ] Respond to all user feedback within 24h
- [ ] Fix critical bugs immediately
- [ ] Track key metrics:
  - [ ] Total receipts uploaded
  - [ ] Unique users
  - [ ] Error rate
  - [ ] Average processing time
  - [ ] Conversion rate (landing → upload)

### Week 1

- [ ] Send follow-up email to early users
- [ ] Collect user feedback (survey)
- [ ] Analyze analytics data
- [ ] Create weekly report (metrics, feedback, issues)
- [ ] Plan quick fixes and improvements
- [ ] Blog post: "Week 1 in Review" (optional)

### Week 2

- [ ] NPS survey to users
- [ ] Analyze most common errors
- [ ] Identify top feature requests
- [ ] Update roadmap based on feedback
- [ ] Plan Phase 1 features

---

## Success Criteria (2 Weeks Post-Launch)

### User Metrics

- [ ] 50+ early adopters
- [ ] 200+ receipts uploaded
- [ ] 30%+ week 2 retention
- [ ] NPS score >30

### Technical Metrics

- [ ] Uptime >99%
- [ ] Error rate <5%
- [ ] Average processing time <30s
- [ ] Zero critical security issues

### Feedback Metrics

- [ ] 10+ positive reviews/testimonials
- [ ] <5 critical bug reports
- [ ] > 20 feature requests collected

---

## Key Contacts

### Development Team

- **Lead Developer**: [Your Name] ([email@example.com](mailto:email@example.com))
- **On-Call**: [Phone Number]

### Services

- **Domain Registrar**: [Provider]
- **Hosting**: Vercel, Railway
- **Email**: [Gmail/Fastmail/etc]
- **Support Email**: [support@mpwg.eu](mailto:support@mpwg.eu)

### Monitoring

- **Sentry**: [sentry.io/pricey](https://sentry.io/pricey)
- **Plausible**: [plausible.io/pricey.mpwg.eu](https://plausible.io/pricey.mpwg.eu)
- **Uptime Robot**: [uptimerobot.com](https://uptimerobot.com)

---

## Rollback Plan

If critical issues occur:

1. **Stop**: Pause new user signups
2. **Assess**: Identify the root cause
3. **Fix**: Deploy hotfix or rollback
4. **Communicate**: Update users on status page
5. **Resume**: Re-enable signups once stable

### Rollback Commands

```bash
# Revert Vercel deployment
vercel rollback

# Revert Railway deployment
railway rollback [deployment-id]

# Restore database backup
pg_restore -d pricey backup.sql
```

---

## Emergency Contacts

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Railway Support**: [railway.app/help](https://railway.app/help)
- **Sentry Support**: [sentry.io/support](https://sentry.io/support)

---

## Notes

- Keep this checklist updated as you complete tasks
- Document any deviations from the plan
- Save all launch day metrics for future reference
- Celebrate the launch! 🎉
