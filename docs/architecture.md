# Pricy - Receipt Scanner & Price Comparison Platform

## Architecture Document

## 1. Executive Summary

Pricy is a web-based Progressive Web Application (PWA) that enables users to scan shopping receipts, automatically extract product information, and compare prices across different stores. The system uses OCR and NLP technologies to understand receipt data and provides intelligent shopping recommendations.

### Key Features

- Receipt scanning and OCR processing
- Product normalization and categorization
- Price tracking across multiple stores
- Shopping recommendations based on user's shopping list
- Full PWA support with "Add to Home Screen" capability
- Works offline with service worker caching
- Local and cloud deployment options

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (PWA)                      │
│  React/Next.js + TypeScript + TailwindCSS + Zustand/Redux   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                            │
│                 (REST API / GraphQL)                        │
└─────────────────────────────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────────┐
        ▼                      ▼                          ▼
┌───────────────┐   ┌───────────────────┐   ┌───────────────────┐
│  OCR Service  │   │ Product Service   │   │ Analytics Service │
│  (Tesseract/  │   │ (Normalization &  │   │ (Price Comparison │
│  Cloud Vision)│   │  Categorization)  │   │ & Recommendations)│
└───────────────┘   └───────────────────┘   └───────────────────┘
        │                      │                          │
        └──────────────────────┼──────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│         PostgreSQL (Primary) + Redis (Cache)                │
│              S3/MinIO (Receipt Images)                      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Deployment Architecture

#### Cloud Deployment

- **Frontend**: Vercel/Netlify (auto-SSL, CDN, PWA support) or AWS CloudFront + S3
- **Backend**: AWS ECS/Fargate or Google Cloud Run
- **Database**: AWS RDS/Aurora or Google Cloud SQL
- **Storage**: AWS S3 or Google Cloud Storage
- **OCR**: AWS Textract or Google Cloud Vision API

#### Local Deployment

- **All Services**: Docker Compose
- **OCR**: Tesseract OCR (open-source)
- **Storage**: MinIO (S3-compatible local storage)
- **Database**: PostgreSQL in Docker
- **Frontend**: Served via nginx or Node.js with HTTPS (required for PWA)

## 3. Technology Stack

### 3.1 Frontend

- **Framework**: Next.js (latest stable, App Router support; recommend >=13)
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS (v3+) + shadcn/ui
- **State Management**: Zustand or Redux Toolkit
- **PWA**: next-pwa + Workbox (service worker, offline support, install prompts)
- **Camera Integration**: react-webcam or native File API
- **Image Processing**: browser-image-compression
- **Offline Storage**: IndexedDB (via Dexie.js or localforage) for offline receipt queue

### 3.2 Backend

- **Framework**: Node.js (20 LTS recommended) with Express or Fastify
- **Language**: TypeScript
- **API**: REST with OpenAPI/Swagger or GraphQL
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod or Joi
- **ORM**: Prisma (v5+) or TypeORM

### 3.3 OCR & NLP Pipeline

- **Local OCR**: Tesseract.js
- **Cloud OCR**: Google Cloud Vision API / AWS Textract
- **NLP Processing**:
  - spaCy or NLTK for entity extraction
  - Custom regex patterns for price/unit detection
  - Fuzzy matching (Levenshtein distance) for product normalization

### 3.4 Data Storage

- **Primary Database**: PostgreSQL (v16+ recommended)
- **Cache**: Redis (v7+)
- **Object Storage**: MinIO (local) / S3 (cloud)
- **Search**: PostgreSQL full-text search or Elasticsearch

## 4. Core Components

### 4.1 Receipt Processing Pipeline

```typescript
// Pipeline stages
interface ReceiptPipeline {
  1. ImageUpload → Compression & Storage
  2. OCRExtraction → Text extraction from image
  3. TextParsing → Structure raw text into sections
  4. EntityExtraction → Extract store, date, items, prices
  5. ProductNormalization → Map to generic products
  6. DataPersistence → Save to database
  7. PriceAnalysis → Update price history
}
```

### 4.2 Product Normalization Engine

```yaml
Input: "Gala Apple Red 1,5kg €1,5"
Process:
  - Brand Detection: "Gala"
  - Product Category: "Apple" → "Fruit/Apple"
  - Quantity Extraction: "1,5kg"
  - Unit Detection: "kg"
  - Price Extraction: "€1,5"
  - Unit Price Calculation: "€1,00/kg"
Output:
  generic_product: "Apple"
  category: "Fruit"
  brand: "Gala"
  quantity: 1.5
  unit: "kg"
  total_price: 1.5
  unit_price: 1.0
```

### 4.3 Database Schema

```sql
-- Core Tables
stores (id, name, address, chain_id, location_point)
receipts (id, user_id, store_id, image_url, total_amount, date, raw_ocr_text)
products (id, name, category_id, normalized_name, barcode)
receipt_items (id, receipt_id, product_id, quantity, unit, price, unit_price)
price_history (id, product_id, store_id, price, unit_price, date)
shopping_lists (id, user_id, name, items[])

-- Indexes for performance
CREATE INDEX idx_price_history_product_store ON price_history(product_id, store_id);
CREATE INDEX idx_receipt_items_product ON receipt_items(product_id);
```

## 5. Key Features Implementation

### 5.1 Receipt Upload & Processing

1. User captures/uploads receipt image
2. Image compressed and uploaded to storage
3. OCR service extracts text
4. Parser identifies:
   - Store name and location
   - Purchase date
   - Individual items with prices
   - Total amount
5. Items normalized to generic products
6. Data saved to database

### 5.2 Price Comparison Query

```sql
-- "Which shop has the cheapest apples?"
SELECT
  s.name as store_name,
  MIN(ph.unit_price) as lowest_price,
  ph.unit,
  MAX(ph.date) as last_seen
FROM price_history ph
JOIN products p ON ph.product_id = p.id
JOIN stores s ON ph.store_id = s.id
WHERE p.normalized_name = 'apple'
  AND ph.date > NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name, ph.unit
ORDER BY lowest_price ASC;
```

### 5.3 Shopping Recommendation Engine

```typescript
interface ShoppingRecommendation {
  analyzeShoppingList(items: string[]): {
    bestSingleStore: Store & { totalPrice: number };
    optimalRoute: Array<{
      store: Store;
      items: Product[];
      subtotal: number;
    }>;
    savings: number;
  };
}
```

## 6. Security Considerations

### 6.1 Authentication & Authorization

#### Authentication Strategy

Pricy implements a multi-provider authentication system supporting:

**Social Login Providers:**

- **Google OAuth 2.0** - Primary provider
- **Microsoft Account (Live ID)** - Enterprise users
- **Apple Sign In** - iOS users (required for App Store)
- **Email/Password** - Traditional fallback

**Authentication Flow:**

```typescript
// User authentication options
interface AuthProvider {
  google: 'OAuth 2.0';
  microsoft: 'OAuth 2.0 / Azure AD';
  apple: 'Sign in with Apple';
  email: 'Email/Password with verification';
}

// JWT token structure
interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  picture?: string; // Profile picture URL
  provider: 'google' | 'microsoft' | 'apple' | 'email';
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}
```

**Implementation:**

- **NextAuth.js** (v5 / Auth.js) for unified authentication
- JWT with refresh tokens (access: 15min, refresh: 7 days)
- Secure HTTP-only cookies for web
- OAuth 2.0 PKCE flow for mobile apps
- Role-based access control (RBAC)
- API rate limiting per user
- CORS configuration

#### API Versioning Strategy

Pricy uses a comprehensive API versioning strategy to ensure backward compatibility and smooth migrations:

**Versioning Approach:**

- **URL Path Versioning** - Primary method for major versions
  - Format: `/api/v1/receipts`, `/api/v2/receipts`
  - Clear and explicit for external consumers
  - Easy to route and cache
- **Header-Based Versioning** - Optional for minor versions
  - Header: `Accept-Version: 1.0`
  - Allows granular control without URL changes

**Version Lifecycle:**

```
Development → Beta → Stable → Deprecated → Sunset
    |            |        |          |          |
    └────────────┴────────┴──────────┴──────────┘
         3 months    6 months   12 months   18 months
```

**Implementation:**

```typescript
// API version routing
interface APIVersion {
  version: 'v1' | 'v2';
  status: 'beta' | 'stable' | 'deprecated';
  deprecationDate?: Date;
  sunsetDate?: Date;
  migrationGuide?: string;
}

// Version-specific endpoints
const routes = {
  v1: {
    receipts: '/api/v1/receipts',
    products: '/api/v1/products',
    status: 'stable',
  },
  v2: {
    receipts: '/api/v2/receipts', // New response format
    products: '/api/v2/products', // Additional fields
    status: 'beta',
  },
};

// Backward compatibility middleware
app.use('/api/v1/*', v1CompatibilityLayer);
app.use('/api/v2/*', v2Features);

// Version deprecation warnings
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1')) {
    res.setHeader('Deprecation', 'Sun, 01 Jan 2026 00:00:00 GMT');
    res.setHeader('Sunset', 'Sun, 01 Jul 2026 00:00:00 GMT');
    res.setHeader('Link', '</api/v2>; rel="successor-version"');
  }
  next();
});
```

**Breaking Changes Policy:**

1. **Major Version** (v1 → v2) - Breaking changes allowed
   - Response structure changes
   - Endpoint removal
   - Required field additions
   - Authentication method changes

2. **Minor Version** (v1.0 → v1.1) - Backward compatible
   - New optional fields
   - New endpoints
   - Performance improvements
   - Bug fixes

3. **Patch Version** (v1.0.0 → v1.0.1) - Bug fixes only
   - Security patches
   - Critical bug fixes
   - No API changes

**Version Support Matrix:**

| Version | Status     | Support Level | End of Support |
| ------- | ---------- | ------------- | -------------- |
| v2.x    | Beta       | Full support  | -              |
| v1.x    | Stable     | Full support  | July 2026      |
| v0.x    | Deprecated | Security only | January 2025   |

**Migration Strategy:**

- 6-month overlap for stable versions
- Automated migration tools
- Comprehensive migration guides
- Version-specific SDKs
- Client library auto-updates
- Gradual rollout with feature flags

**Example Migration Guide:**

```markdown
# Migrating from v1 to v2

## Receipt Response Changes

### v1 Response

{
"id": "123",
"items": [...],
"total": 45.99
}

### v2 Response

{
"id": "123",
"receiptData": {
"items": [...],
"totals": {
"subtotal": 42.00,
"tax": 3.99,
"total": 45.99
}
},
"metadata": {
"ocrConfidence": 0.95,
"processingTime": 1234
}
}

## Breaking Changes

1. `total` moved to `receiptData.totals.total`
2. Added `subtotal` and `tax` breakdown
3. New `metadata` object with OCR details

## Migration Code

// Before (v1)
const total = receipt.total;

// After (v2)
const total = receipt.receiptData.totals.total;
```

### 6.2 Data Privacy

**User Data Protection:**

- PII encryption at rest (AES-256)
- GDPR compliance for EU users
- Receipt images encrypted in storage
- User data isolation (row-level security)
- OAuth tokens encrypted in database
- No storage of social login passwords
- Right to be forgotten (GDPR Article 17)
- Data export functionality
- Secure token rotation

**Privacy by Design:**

- Minimal data collection from social providers (email, name, profile picture)
- No sharing of user data with third parties
- Anonymous analytics (no PII in logs)
- Secure session management

### 6.3 Security Headers

```javascript
// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

## 7. Performance Optimization

### 7.1 Caching Strategy

- Redis for frequently accessed price data
- CDN for static assets
- Browser caching for PWA
- Database query result caching

### 7.2 Database Optimization

- Partitioning price_history by date
- Materialized views for common aggregations
- Connection pooling
- Read replicas for analytics queries

### 7.3 Image Processing

- Lazy loading for receipt images
- Progressive image loading
- WebP format support
- Client-side compression before upload

## 8. Monitoring & Observability

### 8.1 Logging

- Structured logging (JSON format)
- Log aggregation (ELK stack or CloudWatch)
- Error tracking (Sentry)

### 8.2 Metrics

- Application metrics (Prometheus + Grafana)
- Business metrics dashboard
- OCR accuracy tracking
- API response times

### 8.3 Health Checks

```typescript
// Health check endpoints
GET / health / live; // Kubernetes liveness probe
GET / health / ready; // Kubernetes readiness probe
GET / health / metrics; // Prometheus metrics
```

## 9. Development Workflow

### 9.1 Local Development

```bash
# Docker Compose setup
docker-compose up -d postgres redis minio
npm run dev:frontend
npm run dev:backend
```

### 9.2 CI/CD Pipeline

1. **Build**: TypeScript compilation, linting
2. **Test**: Unit tests, integration tests
3. **Security**: Dependency scanning, SAST
4. **Deploy**: Blue-green deployment
5. **Monitor**: Smoke tests, performance checks

## 10. Scalability Considerations

### 10.1 Horizontal Scaling

- Stateless API services
- Load balancer (AWS ALB/nginx)
- Auto-scaling based on CPU/memory
- Database read replicas

### 10.2 Vertical Scaling

- OCR processing queue with workers
- Batch processing for analytics
- Async job processing (Bull/BullMQ)

## 11. Cost Optimization

### 11.1 Cloud Services

- Use spot instances for OCR workers
- S3 lifecycle policies for old receipts
- Reserved instances for databases
- CloudFront for static asset delivery

### 11.2 Local Deployment

- Single Docker host for small deployments
- K3s for lightweight Kubernetes
- PostgreSQL with minimal resources
- Tesseract for free OCR

## 12. Future Enhancements

### Phase 2

- Barcode scanning support
- Multi-language receipt support
- Social features (share prices, community pricing)
- Browser notifications for price drops
- Background sync for offline receipts

### Phase 3

- AI-powered shopping suggestions
- Predictive price trends
- Loyalty card integration
- Recipe suggestions based on purchases
- Web Share API integration

### Optional: Native Apps (Long-term)

- If app store presence becomes necessary, consider Capacitor.js or PWABuilder
- Convert existing PWA to native wrapper without code rewrite
- Only pursue if web distribution proves insufficient

## 13. Technical Risks & Mitigations

| Risk                    | Impact | Mitigation                                 |
| ----------------------- | ------ | ------------------------------------------ |
| OCR accuracy issues     | High   | Multiple OCR engines, manual correction UI |
| Product matching errors | Medium | ML model training, user feedback loop      |
| Scalability bottlenecks | High   | Microservices architecture, caching        |
| Data privacy concerns   | High   | Encryption, compliance, data minimization  |

## 14. Conclusion

This architecture provides a robust, scalable foundation for the Pricy application with flexibility for both local and cloud deployments. The modular design allows for incremental feature development while maintaining performance and reliability.
