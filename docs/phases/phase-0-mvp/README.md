# Phase 0: MVP (Minimum Viable Product)

**Goal**: Validate core concept with minimal features  
**Duration**: 4 weeks  
**Target Date**: November 25, 2025  
**User Target**: 50 early adopters

## Overview

Phase 0 focuses on building the foundational infrastructure and core receipt scanning functionality to validate the product concept with early adopters.

## Milestones

### [M0.1: Infrastructure Setup](./M0.1-infrastructure-setup.md)

**Week 1** - Set up monorepo, database, API gateway, and CI/CD pipeline

### [M0.2: Receipt Upload & OCR](./M0.2-receipt-upload-ocr.md)

**Week 2** - Implement receipt upload and OCR processing with Tesseract.js

### [M0.3: Basic Receipt List UI](./M0.3-basic-receipt-ui.md)

**Week 2-3** - Build mobile-first frontend for viewing receipts

### [M0.4: MVP Launch Preparation](./M0.4-mvp-launch.md)

**Week 4** - Deploy to production with monitoring and analytics

## Success Metrics

| Metric              | Target        | Measurement              |
| ------------------- | ------------- | ------------------------ |
| **User Signups**    | 50 users      | Analytics dashboard      |
| **Receipt Uploads** | 200 receipts  | Database count           |
| **OCR Accuracy**    | 70%+          | Manual validation sample |
| **App Performance** | <3s load time | Lighthouse CI            |
| **Error Rate**      | <5%           | Sentry dashboard         |
| **User Retention**  | 30% (week 2)  | Return visits            |

## Exit Criteria

✅ **Proceed to Beta if:**

- 50+ users signed up
- 70%+ OCR accuracy achieved
- <5% error rate
- Positive user feedback (NPS >30)

❌ **Pivot/Reconsider if:**

- <20 users after 2 weeks
- OCR accuracy <50%
- Negative user feedback

## Known Technical Debt

Items to address in later phases:

1. **No Authentication** - All receipts are public (Phase 1)
2. **Single OCR Provider** - Only Tesseract.js (Phase 1)
3. **No Pagination** - Limited receipt list (Phase 1)
4. **Limited Store Templates** - Only ~20 stores (Phase 1)
5. **No Manual Correction UI** - Can't edit OCR results (Phase 1)
6. **Basic Error Handling** - Minimal user feedback (Phase 1)
