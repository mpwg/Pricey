# Pricey - Current System Architecture (M0.2)

**Status**: Phase 0 - MVP  
**Last Updated**: October 26, 2025  
**Implemented Features**: Receipt Upload & OCR Processing

## Executive Summary

Pricey is currently in Phase 0 (MVP) with M0.2 complete. The system implements receipt upload, OCR processing, and data extraction capabilities. This document reflects **only the currently implemented components**.

## System Overview

```mermaid
graph TB
    subgraph "Client Layer (Not Yet Implemented)"
        Client[Web Browser / API Client]
    end

    subgraph "API Gateway (Port 3001)"
        Gateway[Fastify API Gateway]
        UploadRoute[POST /api/v1/receipts]
        StatusRoute[GET /api/v1/receipts/:id]
        ListRoute[GET /api/v1/receipts]
        HealthRoute[GET /health]
        BullBoard[Bull Board Dashboard<br/>/admin/queues]
    end

    subgraph "Storage Layer"
        MinIO[MinIO/S3<br/>Port 9000]
        Redis[Redis<br/>Port 6379]
    end

    subgraph "OCR Service"
        Worker[BullMQ Worker]
        Tesseract[Tesseract.js OCR Engine]
        ImagePreprocessor[Sharp Image Preprocessor]
        StoreDetector[Store Detector<br/>20+ Patterns]
        ItemParser[Item Parser]
        DateParser[Date Parser<br/>chrono-node]
        TotalParser[Total Parser]
    end

    subgraph "Database"
        PostgreSQL[(PostgreSQL<br/>Port 5432)]
        Receipts[Receipts Table]
        ReceiptItems[Receipt Items Table]
        Stores[Stores Table<br/>20+ Seeded]
    end

    Client -->|HTTP/REST| Gateway
    Gateway -->|Multipart Upload| UploadRoute
    Gateway -->|Query Receipt| StatusRoute
    Gateway -->|List Receipts| ListRoute
    Gateway -->|Monitor Jobs| BullBoard

    UploadRoute -->|Store Image| MinIO
    UploadRoute -->|Queue Job| Redis
    UploadRoute -->|Create Record| PostgreSQL

    Redis -->|Process Job| Worker
    Worker -->|Download Image| MinIO
    Worker -->|Preprocess| ImagePreprocessor
    ImagePreprocessor -->|Optimized Image| Tesseract
    Worker -->|Run OCR| Tesseract
    Tesseract -->|Raw Text| StoreDetector
    Tesseract -->|Raw Text| ItemParser
    Tesseract -->|Raw Text| DateParser
    Tesseract -->|Raw Text| TotalParser

    StoreDetector -->|Parsed Data| Worker
    ItemParser -->|Parsed Data| Worker
    DateParser -->|Parsed Data| Worker
    TotalParser -->|Parsed Data| Worker

    Worker -->|Update Receipt| Receipts
    Worker -->|Create Items| ReceiptItems

    StatusRoute -->|Query| Receipts
    StatusRoute -->|Query| ReceiptItems
    StatusRoute -->|Query| Stores
    ListRoute -->|Query| Receipts

    style Client fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style Gateway fill:#bbf,stroke:#333,stroke-width:2px
    style Worker fill:#bfb,stroke:#333,stroke-width:2px
    style PostgreSQL fill:#fbb,stroke:#333,stroke-width:2px
```

## Technology Stack

### Currently Implemented

| Component            | Technology   | Version  | Purpose                 |
| -------------------- | ------------ | -------- | ----------------------- |
| **API Gateway**      | Fastify      | ^5.2.1   | REST API server         |
| **OCR Service**      | Tesseract.js | ^6.0.1   | Text extraction         |
| **Database**         | PostgreSQL   | 18       | Data persistence        |
| **ORM**              | Prisma       | ^6.2.1   | Database access         |
| **Cache**            | Redis        | 8        | Job queue backing       |
| **Job Queue**        | BullMQ       | ^5.36.3  | Background processing   |
| **Storage**          | MinIO Client | ^8.0.6   | Receipt image storage   |
| **Image Processing** | Sharp        | ^0.34.4  | Image preprocessing     |
| **Date Parsing**     | chrono-node  | ^2.9.0   | Natural date extraction |
| **Monitoring**       | Bull Board   | ^6.14.0  | Queue dashboard         |
| **Logger**           | Pino         | ^10.1.0  | Structured logging      |
| **Validation**       | Zod          | ^3.24.1  | Schema validation       |
| **Runtime**          | Node.js      | 24.10.0+ | JavaScript runtime      |

### Not Yet Implemented

- Frontend (Next.js PWA) - Planned for Phase 1
- Authentication - Planned for Phase 1
- Product Service - Planned for Phase 2
- Analytics Service - Planned for Phase 2

## Architecture Components

### 1. API Gateway (apps/api-gateway)

**Purpose**: Main REST API entry point for receipt management

**Port**: 3001

**Key Features**:

- File upload with validation (JPG/PNG, max 10MB, min 100x100px)
- Receipt listing with pagination
- Receipt detail retrieval
- Error handling with structured responses
- Rate limiting (100 requests/minute)
- CORS support
- Security headers (Helmet)
- Request logging with Pino
- Request ID tracking

**Endpoints**:

```typescript
POST /api/v1/receipts
- Content-Type: multipart/form-data
- Field: image (required)
- Validates image (type, size, dimensions)
- Uploads to MinIO/S3
- Creates database record (status: PENDING)
- Queues OCR job
- Returns: { id, status, imageUrl, createdAt }

GET /api/v1/receipts/:id
- Returns complete receipt details
- Includes all items and store information
- Status can be: PENDING, PROCESSING, COMPLETED, FAILED
- Returns: Full receipt object with items array

GET /api/v1/receipts
- Lists all receipts with pagination
- Query params: page (default: 1), limit (default: 10)
- Returns: { receipts: [...], pagination: { page, limit, total, totalPages } }

GET /health
- Health check endpoint
- Returns: { status: "ok", timestamp, uptime }

GET /admin/queues (dev only)
- Bull Board queue monitoring dashboard
- View jobs, retry, clear queues
- Real-time job updates
```

**Plugins & Middleware**:

- `@fastify/multipart` - File upload handling with busboy
- `@fastify/cors` - CORS configuration
- `@fastify/helmet` - Security headers
- `@fastify/rate-limit` - Rate limiting (100 req/min default)
- Custom error handler with standardized error responses
- Request/response logging hooks with Pino

**Services**:

```typescript
StorageService (apps/api-gateway/src/services/storage.ts)
- uploadReceipt(file, userId?): Promise<string>
- downloadFile(key): Promise<Buffer>
- getFileUrl(key): string
- Uses MinIO client for S3-compatible storage

QueueService (apps/api-gateway/src/services/queue.ts)
- addReceiptProcessingJob(receiptId, imageUrl): Promise<void>
- Uses BullMQ to enqueue jobs to 'receipt-processing' queue
```

### 2. OCR Service (apps/ocr-service)

**Purpose**: Background worker for receipt OCR and data extraction

**Process Flow**:

```mermaid
sequenceDiagram
    participant Q as BullMQ Queue
    participant W as OCR Worker
    participant S as Storage (MinIO)
    participant Sharp as Sharp Preprocessor
    participant T as Tesseract
    participant P as Parsers
    participant DB as PostgreSQL

    Q->>W: Job: { receiptId, imageUrl }
    W->>DB: Update status to PROCESSING
    W->>S: Download image
    S-->>W: Image buffer
    W->>Sharp: Preprocess image
    Sharp->>Sharp: Grayscale, normalize, sharpen, enhance
    Sharp-->>W: Optimized buffer
    W->>T: Process optimized image
    T-->>W: Raw OCR text + confidence
    W->>P: Parse store name (fuzzy match)
    P-->>W: Store name
    W->>P: Parse date (chrono-node)
    P-->>W: Purchase date
    W->>P: Parse items (regex patterns)
    P-->>W: Items with prices
    W->>P: Parse total (validation)
    P-->>W: Total amount
    W->>DB: Update receipt + create items
    W->>DB: Update status to COMPLETED
    W-->>Q: Job complete
```

**Components**:

#### Tesseract OCR Wrapper

```typescript
// apps/ocr-service/src/ocr/tesseract.ts
processReceipt(imageBuffer: Buffer): Promise<OCRResult>
- Preprocesses with Sharp: grayscale, normalize, sharpen, resize (2x scale)
- Configures Tesseract:
  - PSM: PSM.AUTO (Automatic page segmentation)
  - Tesseract.js language: eng (English)
  - Character whitelist for prices and text
- Returns: { text, confidence }
- Average processing time: ~1.2s
- Confidence threshold: 60% minimum
```

#### Store Detector

```typescript
// apps/ocr-service/src/parsers/store-detector.ts
detectStore(text: string, stores: Store[]): string | null
- Searches first 15 lines of receipt
- Matches against seeded store patterns
- Uses fuzzy matching (Levenshtein distance ≤3)
- Supports store aliases from database
- Stores: Billa, Spar, Hofer/Aldi, Lidl, dm, Müller, Penny, etc.
- Returns normalized store name or null
```

#### Date Parser

```typescript
// apps/ocr-service/src/parsers/date-parser.ts
extractDate(text: string): Date | null
- Uses chrono-node for natural language parsing
- Supports formats: MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD, D. Mon YYYY
- Validates: must be past date, not >1 year old, not future
- Searches entire receipt text
- Falls back to current date if not found or invalid
- Returns Date object or null
```

#### Item Parser

```typescript
// apps/ocr-service/src/parsers/item-parser.ts
extractItems(text: string): ReceiptItem[]
- Price patterns: $X.XX, X.XX, X,XX (various formats)
- Quantity patterns: 2 @, 2 x, Qty: 2, 2X
- Line-by-line parsing with confidence scoring
- Skips headers/footers/totals/tax lines
- Validates: price > 0, reasonable values
- Returns: { name, price, quantity, lineNumber, confidence }
- Minimum confidence: 50%
```

#### Total Parser

```typescript
// apps/ocr-service/src/parsers/total-parser.ts
extractTotal(text: string, items: ReceiptItem[]): TotalResult
- Keywords: TOTAL, SUM, AMOUNT DUE, BALANCE, Grand Total
- Extracts both found total and calculates sum of items
- Validates: total within 10% of item sum (allows for rounding/fees)
- Returns: { found: number | null, calculated: number, isValid: boolean }
```

**Worker Configuration**:

```typescript
// apps/ocr-service/src/worker.ts
Queue: 'receipt-processing'
Concurrency: 5 workers
Timeout: 60 seconds per job
Retries: 3 attempts with exponential backoff (1s, 2s, 4s)
Remove on complete: Last 100 jobs
Remove on fail: Last 50 jobs
Logging: Structured logs with job context
```

### 3. Database Schema (PostgreSQL + Prisma)

```prisma
// packages/database/prisma/schema.prisma

model Receipt {
  id              String        @id @default(uuid())
  userId          String?
  storeId         String?
  store           Store?        @relation(fields: [storeId], references: [id])
  storeName       String?       // Detected from OCR
  imageUrl        String        // MinIO/S3 URL
  purchaseDate    DateTime?     // Parsed from receipt
  totalAmount     Decimal?      @db.Decimal(10, 2)
  currency        String        @default("EUR")
  status          ReceiptStatus @default(PENDING)
  ocrProvider     String        @default("tesseract")
  ocrConfidence   Float?        // 0-100 percentage
  rawOcrText      String?       @db.Text
  processingTime  Int?          // milliseconds
  errorMessage    String?
  items           ReceiptItem[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId, status, purchaseDate(sort: Desc)])
  @@index([storeId])
  @@index([createdAt(sort: Desc)])
}

enum ReceiptStatus {
  PENDING      // Uploaded, waiting for OCR
  PROCESSING   // OCR in progress
  COMPLETED    // OCR completed successfully
  FAILED       // OCR failed after retries
}

model ReceiptItem {
  id          String   @id @default(uuid())
  receiptId   String
  receipt     Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  name        String   // Product name from receipt
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int      @default(1)
  lineNumber  Int?     // Line number on receipt
  confidence  Float?   // OCR confidence for this item
  createdAt   DateTime @default(now())

  @@index([receiptId])
}

model Store {
  id        String    @id @default(uuid())
  name      String    @unique
  aliases   String[]  // Alternative names for fuzzy matching
  logoUrl   String?
  receipts  Receipt[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([name])
}
```

**Seeded Data** (packages/database/prisma/seed.ts):

- 20+ Austrian and international stores
- Store aliases for fuzzy matching (e.g., "BILLA", "Billa Plus")
- Common retail chains: Billa, Spar, Hofer, Lidl, dm, Müller, etc.

### 4. Storage (MinIO/S3)

**Purpose**: Receipt image storage with S3-compatible API

**Configuration**:

```typescript
// Environment variables
S3_ENDPOINT: localhost (dev) / s3.amazonaws.com (prod)
S3_PORT: 9000
S3_ACCESS_KEY: minioadmin (dev)
S3_SECRET_KEY: minioadmin (dev)
S3_BUCKET: pricey-receipts
S3_USE_SSL: false (dev) / true (prod)
S3_REGION: us-east-1 (default)
```

**Storage Structure**:

```
pricey-receipts/
├── receipts/
│   ├── 2025-01-15/
│   │   ├── 550e8400-e29b-41d4-a716-446655440000.jpg
│   │   └── 6ba7b810-9dad-11d1-80b4-00c04fd430c8.png
│   └── 2025-01-16/
│       └── ...
```

**Operations**:

```typescript
// apps/api-gateway/src/services/storage.ts
uploadReceipt(file: File, userId?: string): Promise<string>
- Generates unique key with date prefix
- Validates file before upload
- Sets proper content-type
- Returns: full URL to stored image

downloadFile(key: string): Promise<Buffer>
- Used by OCR worker to retrieve images
- Returns raw image buffer

getFileUrl(key: string): string
- Generates public URL for stored image
- Used in API responses
```

### 5. Job Queue (BullMQ + Redis)

**Purpose**: Asynchronous OCR job processing with retry logic

**Queue Configuration**:

```typescript
// apps/ocr-service/src/worker.ts
Queue Name: 'receipt-processing'
Redis Connection: redis://localhost:6379 (dev)

Job Options:
- attempts: 3
- backoff: { type: 'exponential', delay: 1000 }
- removeOnComplete: { count: 100, age: 86400 }
- removeOnFail: { count: 50, age: 604800 }

Worker Options:
- concurrency: 5
- maxStalledCount: 2
- stalledInterval: 30000
```

**Job Data Structure**:

```typescript
{
  receiptId: string; // UUID, used as job ID for idempotency
  imageUrl: string; // Full URL to image in storage
}
```

**Job States**:

- **waiting**: Queued, not yet processing
- **active**: Currently being processed
- **completed**: Successfully processed
- **failed**: Failed after all retries
- **delayed**: Waiting for retry backoff

**Monitoring**: Bull Board UI at `http://localhost:3001/admin/queues` (development only)

## Data Flow Diagrams

### Receipt Upload Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant V as Validation
    participant S3 as MinIO/S3
    participant DB as PostgreSQL
    participant Q as BullMQ Queue

    C->>GW: POST /api/v1/receipts<br/>(multipart/form-data)
    GW->>V: Validate image
    alt Invalid file
        V-->>GW: ValidationError
        GW-->>C: 400 Bad Request
    else Valid file
        V-->>GW: OK
        GW->>S3: Upload to receipts/YYYY-MM-DD/uuid.ext
        S3-->>GW: imageUrl
        GW->>DB: Create receipt (status: PENDING)
        DB-->>GW: receipt object
        GW->>Q: Enqueue job { receiptId, imageUrl }
        Q-->>GW: Job ID
        GW-->>C: 201 Created<br/>{ id, status: "pending", imageUrl, createdAt }
    end
```

### OCR Processing Flow

```mermaid
sequenceDiagram
    participant Q as BullMQ Queue
    participant W as OCR Worker
    participant S3 as MinIO
    participant Sharp as Image Preprocessor
    participant OCR as Tesseract.js
    participant P as Parsers
    participant DB as PostgreSQL

    Q->>W: Dequeue job { receiptId, imageUrl }
    W->>DB: UPDATE status = PROCESSING
    W->>S3: Download image buffer
    S3-->>W: Raw image bytes
    W->>Sharp: Preprocess (grayscale, normalize, sharpen)
    Sharp-->>W: Optimized buffer
    W->>OCR: Recognize text
    OCR-->>W: { text, confidence }

    par Parse fields in parallel
        W->>P: Detect store (fuzzy match)
        P-->>W: storeName
    and
        W->>P: Extract date (chrono-node)
        P-->>W: purchaseDate
    and
        W->>P: Extract items (regex)
        P-->>W: items[]
    and
        W->>P: Extract total (validate)
        P-->>W: totalAmount
    end

    W->>DB: BEGIN transaction
    W->>DB: UPDATE receipt (store, date, total, status=COMPLETED)
    W->>DB: INSERT receipt_items
    W->>DB: COMMIT
    DB-->>W: Success
    W-->>Q: Job completed
```

### Receipt Query Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant Cache as Redis (future)
    participant DB as PostgreSQL

    C->>GW: GET /api/v1/receipts/:id
    GW->>DB: SELECT receipt + items + store
    alt Not found
        DB-->>GW: null
        GW-->>C: 404 Not Found
    else Found
        DB-->>GW: Receipt with relations
        GW->>GW: Format response
        GW-->>C: 200 OK<br/>{ receipt with items and store }
    end
```

## Infrastructure

### Development Setup (Docker Compose)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:18-alpine
    container_name: pricey-postgres
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: pricey
      POSTGRES_USER: pricey
      POSTGRES_PASSWORD: pricey_dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8-alpine
    container_name: pricey-redis
    ports: ['6379:6379']
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio:latest
    container_name: pricey-minio
    ports:
      - '9000:9000' # S3 API
      - '9001:9001' # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### Application Services

```bash
# API Gateway
PORT: 3001
NODE_ENV: development
DEPENDENCIES: PostgreSQL, Redis, MinIO

# OCR Worker Service
DEPENDENCIES: Redis (queue), MinIO (storage), PostgreSQL (database)
CONCURRENCY: 5 workers
PROCESS: Long-running Node.js process
```

**Starting Services**:

```bash
# 1. Infrastructure
pnpm docker:dev  # Start PostgreSQL, Redis, MinIO

# 2. Database
pnpm db:migrate  # Run Prisma migrations
pnpm db:seed     # Seed stores data

# 3. Applications
pnpm dev         # Start all services (Turborepo)
# OR individually:
pnpm --filter @pricey/api-gateway dev
pnpm --filter @pricey/ocr-service dev
```

## Security

### Currently Implemented

- **Input Validation**:
  - File type whitelist (image/jpeg, image/png)
  - File size limit (10MB max)
  - Image dimension validation (min 100x100px)
  - Zod schema validation for all inputs
- **CORS**: Configurable origins (`CORS_ORIGIN` env var)
- **Rate Limiting**: 100 requests per minute per IP (configurable)
- **Security Headers**: Via `@fastify/helmet`
  - Content Security Policy
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
- **Error Handling**: No sensitive data leaked in error responses
- **SQL Injection**: Protected via Prisma ORM (parameterized queries)
- **Request Logging**: Structured logs with sanitized data
- **Request ID Tracking**: Unique ID per request for tracing

### Not Yet Implemented (Planned for Phase 1)

- User authentication (OAuth 2.0 + JWT)
- API key management
- User data isolation (multi-tenancy)
- File malware scanning
- Encryption at rest for images
- Audit logging
- GDPR compliance features

## Monitoring & Observability

### Logging

```typescript
// Configuration
Library: Pino
Format: JSON (production) / Pretty (development)
Level: info (configurable via LOG_LEVEL env)

// Log Fields
{
  level: 30-60,
  time: 1704067200000,
  pid: 12345,
  hostname: "localhost",
  reqId: "req-550e8400",
  msg: "Request completed",
  req: { method, url, ... },
  res: { statusCode, ... },
  responseTime: 45
}
```

### Metrics (Available but not collected)

- Request count by endpoint
- Request latency (p50, p95, p99)
- OCR processing time
- Queue depth and processing rate
- Error rate by type
- File upload sizes

### Queue Monitoring

**Bull Board Dashboard** (dev only):

- URL: `http://localhost:3001/admin/queues`
- Features:
  - View all queues and job states
  - Job details with stack traces
  - Retry failed jobs
  - Clear completed/failed jobs
  - Real-time updates via polling

### Health Checks

```typescript
GET /health
Response: {
  status: "ok",
  timestamp: "2025-01-15T10:30:00.000Z",
  uptime: 123.456
}
```

## Performance Characteristics

### Measured Performance

| Metric              | Target     | Actual (M0.2) | Status |
| ------------------- | ---------- | ------------- | ------ |
| Upload Time         | <2s        | ~50-100ms     | ✅     |
| OCR Processing      | <30s (p95) | ~1.2-2.5s     | ✅     |
| Image Preprocessing | <500ms     | ~200-300ms    | ✅     |
| File Validation     | <100ms     | ~5-10ms       | ✅     |
| API Response (GET)  | <500ms     | <100ms        | ✅     |
| Database Query      | <100ms     | <50ms         | ✅     |

### Scalability Considerations

**Current Single-Instance Limits**:

- Concurrent OCR jobs: 5
- API throughput: ~100 requests/minute (rate limited)
- Max file size: 10MB
- Supported formats: JPG, PNG only
- Storage: Limited by disk/MinIO capacity

**Horizontal Scaling Strategy** (Future):

1. **API Gateway**: Multiple instances behind load balancer (stateless)
2. **OCR Workers**: Multiple workers consuming from shared Redis queue
3. **Database**: Read replicas for query load distribution
4. **Storage**: S3 for unlimited, distributed storage
5. **Queue**: Redis Cluster for high availability

## Error Handling

### Error Response Format

```typescript
{
  error: string;        // Human-readable message
  code?: string;        // Machine-readable error code
  statusCode: number;   // HTTP status code
  details?: any;        // Additional context (dev only)
}
```

### Error Codes

```typescript
// File Upload Errors
FILE_TOO_LARGE; // Exceeds 10MB limit
INVALID_FILE_TYPE; // Not JPG/PNG
INVALID_IMAGE_DIMENSIONS; // Below 100x100px minimum
NO_FILE_PROVIDED; // Missing image field

// OCR Processing Errors
OCR_TIMEOUT; // Processing exceeded 60s
OCR_LOW_CONFIDENCE; // Below 60% confidence threshold
OCR_TEXT_EMPTY; // No text detected
PREPROCESSING_FAILED; // Image preprocessing error

// Storage Errors
STORAGE_UPLOAD_FAILED; // Failed to upload to MinIO/S3
STORAGE_DOWNLOAD_FAILED; // Failed to retrieve from storage
STORAGE_NOT_CONFIGURED; // Missing S3 credentials

// Database Errors
DATABASE_ERROR; // Generic database error
RECEIPT_NOT_FOUND; // Receipt ID not found

// Validation Errors
VALIDATION_ERROR; // Invalid request data
```

### Retry Strategy

```typescript
// File Upload
- No automatic retry (client must retry)
- Returns 4xx error immediately

// OCR Processing (BullMQ)
- Attempts: 3
- Backoff: Exponential (1s, 2s, 4s)
- After 3 failures: status = FAILED, error logged

// Database Operations
- Prisma handles connection pooling and transient errors
- Application-level retries for specific operations
```

## API Response Examples

### Successful Upload

```json
POST /api/v1/receipts
Content-Type: multipart/form-data; boundary=---boundary
Body: image=@receipt.jpg

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "imageUrl": "http://localhost:9000/pricey-receipts/receipts/2025-01-15/550e8400-e29b-41d4-a716-446655440000.jpg",
  "createdAt": "2025-01-15T10:30:00.000Z"
}
```

### Receipt Details (Completed)

```json
GET /api/v1/receipts/550e8400-e29b-41d4-a716-446655440000

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "imageUrl": "http://localhost:9000/pricey-receipts/receipts/2025-01-15/550e8400.jpg",
  "storeName": "Billa",
  "purchaseDate": "2025-01-14T00:00:00.000Z",
  "totalAmount": "45.67",
  "currency": "EUR",
  "ocrConfidence": 87.5,
  "processingTime": 1234,
  "items": [
    {
      "id": "item-uuid-1",
      "name": "Milk 2%",
      "price": "3.99",
      "quantity": 1,
      "confidence": 92.5
    },
    {
      "id": "item-uuid-2",
      "name": "Bread",
      "price": "2.49",
      "quantity": 2,
      "confidence": 88.3
    }
  ],
  "store": {
    "id": "store-uuid",
    "name": "Billa",
    "logoUrl": null
  },
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:02.234Z"
}
```

### Receipt List

```json
GET /api/v1/receipts?page=1&limit=10

Response: 200 OK
{
  "receipts": [
    {
      "id": "550e8400-...",
      "status": "completed",
      "storeName": "Billa",
      "totalAmount": "45.67",
      "purchaseDate": "2025-01-14T00:00:00.000Z",
      "createdAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Error Response

```json
POST /api/v1/receipts
Body: (no file)

Response: 400 Bad Request
{
  "error": "No image file provided",
  "code": "NO_FILE_PROVIDED",
  "statusCode": 400
}
```

## Testing

### Test Coverage

```bash
# Current test results (as of M0.2)
@pricey/api-gateway:     132 tests, 100% passing
@pricey/ocr-service:     232 tests, 100% passing
@pricey/database:         12 tests, 100% passing
-------------------------------------------
Total:                  376 tests, 100% passing
```

### Test Types

1. **Unit Tests**: Individual functions, parsers, validators
   - Store detector fuzzy matching
   - Date parser edge cases
   - Item parser regex patterns
   - Total validation logic
2. **Integration Tests**: API endpoints with mocked dependencies
   - Receipt upload flow
   - Receipt retrieval
   - Error handling
3. **End-to-End Tests**: Full OCR pipeline with real images
   - Sample receipts from various stores
   - OCR accuracy validation
4. **Load Tests**: Performance and concurrency testing
   - 100 concurrent uploads
   - Queue processing under load

### Running Tests

```bash
# All tests (Turborepo runs in parallel)
pnpm test

# Specific workspace
pnpm --filter @pricey/api-gateway test
pnpm --filter @pricey/ocr-service test

# With coverage report
pnpm test:coverage

# Watch mode
pnpm test:watch

# Load testing (requires running services)
pnpm --filter @pricey/api-gateway test:load
```

### Test Configuration

```typescript
// vitest.config.ts
Framework: Vitest
Coverage: Istanbul (c8)
Environment: Node.js
Timeout: 10s per test
Parallel: true
```

## Deployment

### Environment Variables

```bash
# API Gateway (.env.local)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://pricey:pricey_dev_password@localhost:5432/pricey
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pricey-receipts
S3_USE_SSL=false
S3_REGION=us-east-1
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000
LOG_LEVEL=info

# OCR Service (.env.local)
NODE_ENV=development
DATABASE_URL=postgresql://pricey:pricey_dev_password@localhost:5432/pricey
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pricey-receipts
S3_USE_SSL=false
S3_REGION=us-east-1
OCR_CONCURRENCY=5
LOG_LEVEL=info
```

### Production Considerations (Not Yet Implemented)

- Use managed PostgreSQL (AWS RDS, Supabase, etc.)
- Use managed Redis (AWS ElastiCache, Upstash, etc.)
- Use AWS S3 or CloudFlare R2 for storage
- Set `S3_USE_SSL=true`
- Use environment-specific secrets management
- Enable database connection pooling
- Configure proper CORS origins
- Set up monitoring and alerting
- Implement log aggregation
- Use CDN for static assets

## Future Enhancements (Not Yet Implemented)

The following features are planned but not part of the current M0.2 implementation:

### Phase 1 (Q1 2025)

- ✅ **Frontend** (Next.js 16 PWA)
  - Receipt upload UI
  - Receipt list and detail views
  - PWA offline support
- ✅ **Authentication**
  - OAuth 2.0 (Google, GitHub)
  - JWT tokens with refresh
  - User profile management
- ✅ **Manual OCR Correction**
  - Edit detected items
  - Add/remove items
  - Update store/date/total
- ✅ **Receipt Sharing**
  - Generate shareable links
  - View-only public receipts

### Phase 2 (Q2 2025)

- ✅ **Product Normalization**
  - Microservice for product matching
  - Barcode integration
  - Category classification
- ✅ **Price Comparison**
  - Track prices across stores
  - Price trends over time
  - Best price recommendations
- ✅ **Analytics Service**
  - Spending insights
  - Category breakdowns
  - Store comparisons

### Phase 3 (Q3-Q4 2025)

- ✅ **Cloud OCR Fallback** (Google Vision API)
- ✅ **Batch Processing** (multiple receipts)
- ✅ **Mobile Apps** (React Native)
- ✅ **Export Functionality** (CSV, PDF)
- ✅ **Advanced Search & Filters**
- ✅ **Shopping Lists Integration**

## References

### Internal Documentation

- [Getting Started Guide](./guides/getting-started.md)
- [API Gateway Details](./components/api-gateway.md)
- [OCR Service Details](./components/ocr-service.md)
- [Database Schema](./components/database-schema.md)
- [Testing Strategy](./guides/testing-strategy.md)
- [Monorepo Structure](./monorepo-structure.md)
- [Roadmap](./ROADMAP.md)

### External Documentation

- [Fastify v5](https://fastify.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Prisma ORM](https://www.prisma.io/docs)
- [BullMQ](https://docs.bullmq.io/)
- [MinIO JavaScript SDK](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
- [chrono-node Date Parser](https://github.com/wanasit/chrono)

### Source Code

- **Monorepo**: [GitHub Repository](https://github.com/yourusername/pricey)
- **API Gateway**: `apps/api-gateway/`
- **OCR Service**: `apps/ocr-service/`
- **Database Package**: `packages/database/`
- **Shared Types**: `packages/types/`

---

**Document Version**: 2.0 (M0.2 Complete - Updated January 2025)  
**Last Verified**: January 15, 2025  
**Validation**: All components tested and operational (376 tests passing)  
**License**: AGPL-3.0
