# Pricy - Current System Architecture (M0.2)

**Status**: Phase 0 - MVP  
**Last Updated**: October 26, 2025  
**Implemented Features**: Receipt Upload & OCR Processing

## Executive Summary

Pricy is currently in Phase 0 (MVP) with M0.2 complete. The system implements receipt upload, OCR processing, and data extraction capabilities. This document reflects **only the currently implemented components**.

## System Overview

```mermaid
graph TB
    subgraph "Client Layer (Not Yet Implemented)"
        Client[Web Browser / API Client]
    end

    subgraph "API Gateway (Port 3001)"
        Gateway[Fastify API Gateway]
        UploadRoute[POST /api/v1/receipts/upload]
        StatusRoute[GET /api/v1/receipts/:id/status]
        DetailsRoute[GET /api/v1/receipts/:id]
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
        StoreDetector[Store Detector<br/>20+ Patterns]
        ItemParser[Item Parser]
        DateParser[Date Parser]
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
    Gateway -->|Query Status| StatusRoute
    Gateway -->|Get Details| DetailsRoute
    Gateway -->|Monitor Jobs| BullBoard

    UploadRoute -->|Store Image| MinIO
    UploadRoute -->|Queue Job| Redis
    UploadRoute -->|Create Record| PostgreSQL

    Redis -->|Process Job| Worker
    Worker -->|Download Image| MinIO
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
    DetailsRoute -->|Query| Receipts
    DetailsRoute -->|Query| ReceiptItems
    DetailsRoute -->|Query| Stores

    style Client fill:#f9f,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    style Gateway fill:#bbf,stroke:#333,stroke-width:2px
    style Worker fill:#bfb,stroke:#333,stroke-width:2px
    style PostgreSQL fill:#fbb,stroke:#333,stroke-width:2px
```

## Technology Stack

### Currently Implemented

| Component            | Technology   | Version | Purpose                 |
| -------------------- | ------------ | ------- | ----------------------- |
| **API Gateway**      | Fastify      | ^5.6.1  | REST API server         |
| **OCR Service**      | Tesseract.js | ^6.0.1  | Text extraction         |
| **Database**         | PostgreSQL   | 18      | Data persistence        |
| **ORM**              | Prisma       | 6       | Database access         |
| **Cache**            | Redis        | 8       | Job queue backing       |
| **Job Queue**        | BullMQ       | ^5.61.2 | Background processing   |
| **Storage**          | MinIO        | ^8.0.6  | Receipt image storage   |
| **Image Processing** | Sharp        | ^0.34.4 | Image preprocessing     |
| **Date Parsing**     | chrono-node  | ^2.9.0  | Natural date extraction |
| **Monitoring**       | Bull Board   | ^6.14.0 | Queue dashboard         |
| **Logger**           | Pino         | ^10.1.0 | Structured logging      |

### Not Yet Implemented

- Frontend (Next.js PWA) - Planned for Phase 1
- Authentication - Planned for Phase 1
- Product Service - Planned for Phase 1
- Analytics Service - Planned for Phase 1

## Architecture Components

### 1. API Gateway (apps/api-gateway)

**Purpose**: Main REST API entry point for receipt management

**Port**: 3001

**Key Features**:

- File upload with validation (JPG/PNG, max 10MB)
- Receipt status tracking
- Error handling with structured responses
- Rate limiting (configurable)
- CORS support
- Security headers (Helmet)
- Request logging with Pino

**Endpoints**:

```typescript
POST /api/v1/receipts/upload
- Content-Type: multipart/form-data
- Validates image (type, size, dimensions)
- Uploads to MinIO/S3
- Creates database record
- Queues OCR job
- Returns: { id, status, uploadedAt, imageUrl }

GET /api/v1/receipts/:id/status
- Returns processing status
- Includes OCR results when complete
- Returns: { id, status, progress, ocrResult?, processingTime? }

GET /api/v1/receipts/:id
- Returns complete receipt details
- Includes all items and store information
- Returns: Full receipt object with items array

GET /health
- Health check endpoint
- Returns: { status: "ok", timestamp }

GET /admin/queues (dev only)
- Bull Board queue monitoring dashboard
- View jobs, retry, clear queues
```

**Plugins & Middleware**:

- `@fastify/multipart` - File upload handling
- `@fastify/cors` - CORS configuration
- `@fastify/helmet` - Security headers
- `@fastify/rate-limit` - Rate limiting
- Custom error handler
- Request/response logging hooks

**Services**:

```typescript
StorageService
- uploadReceipt(file): Promise<string>
- downloadFile(key): Promise<Buffer>
- deleteFile(key): Promise<void>

QueueService
- queueOCRJob(receiptId, imageUrl): Promise<void>
- getJobStatus(jobId): Promise<JobStatus>
- getQueue(): Queue
```

### 2. OCR Service (apps/ocr-service)

**Purpose**: Background worker for receipt OCR and data extraction

**Process Flow**:

```mermaid
sequenceDiagram
    participant Q as BullMQ Queue
    participant W as OCR Worker
    participant S as Storage (MinIO)
    participant T as Tesseract
    participant P as Parsers
    participant DB as PostgreSQL

    Q->>W: Job: { receiptId, imageUrl }
    W->>DB: Update status to PROCESSING
    W->>S: Download image
    S-->>W: Image buffer
    W->>T: Process image
    T->>T: Preprocess (grayscale, normalize, sharpen)
    T-->>W: Raw OCR text + confidence
    W->>P: Parse store name
    P-->>W: Store name (fuzzy matched)
    W->>P: Parse date
    P-->>W: Purchase date
    W->>P: Parse items
    P-->>W: Items with prices
    W->>P: Parse total
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
- Preprocesses image: grayscale, normalize, sharpen, resize
- Configures Tesseract (PSM.AUTO, character whitelist)
- Returns: { text, confidence }
- Processing time: ~1.2s average
```

#### Store Detector

```typescript
// apps/ocr-service/src/parsers/store-detector.ts
detectStore(text: string): string | null
- Searches first 10 lines of receipt
- Matches against 20+ store patterns
- Uses fuzzy matching (Levenshtein distance)
- Supports store aliases
- Stores: Billa, Spar, Hofer, Lidl, dm, etc. (Austrian focus)
```

#### Date Parser

```typescript
// apps/ocr-service/src/parsers/date-parser.ts
extractDate(text: string): Date | null
- Uses chrono-node for natural language parsing
- Validates: must be past, not >1 year old
- Formats: MM/DD/YYYY, DD.MM.YYYY, YYYY-MM-DD, etc.
- Falls back to upload date if not found
```

#### Item Parser

```typescript
// apps/ocr-service/src/parsers/item-parser.ts
extractItems(text: string): ReceiptItem[]
- Detects price patterns ($3.99, 3.99 ea)
- Extracts quantities (2 @, 2 x, Qty: 2)
- Skips headers/footers/totals
- Returns: { name, price, quantity, lineNumber, confidence }
```

#### Total Parser

```typescript
// apps/ocr-service/src/parsers/total-parser.ts
extractTotal(text: string): number | null
- Searches for total indicators (TOTAL, Amount Due, etc.)
- Validates against item sum (5% variance allowed)
- Returns extracted and calculated totals
```

**Worker Configuration**:

- **Concurrency**: 5 workers
- **Timeout**: 30 seconds per job
- **Retries**: 3 attempts with exponential backoff
- **Rate Limit**: 10 jobs per minute
- **Job Retention**: Last 100 completed, 50 failed

### 3. Database Schema (PostgreSQL + Prisma)

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  receipts  Receipt[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Store {
  id        String    @id @default(uuid())
  name      String    @unique
  aliases   String[]  // ["BILLA", "Billa Plus"]
  logoUrl   String?
  receipts  Receipt[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Receipt {
  id              String        @id @default(uuid())
  userId          String?
  user            User?         @relation(fields: [userId], references: [id])
  storeId         String?
  store           Store?        @relation(fields: [storeId], references: [id])
  storeName       String?       // Detected store name
  imageUrl        String
  purchaseDate    DateTime?
  totalAmount     Decimal?      @db.Decimal(10, 2)
  status          ReceiptStatus @default(PROCESSING)
  ocrProvider     String        @default("tesseract")
  ocrConfidence   Float?
  rawOcrText      String?       @db.Text
  processingTime  Int?          // milliseconds
  items           ReceiptItem[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([userId, status, purchaseDate])
  @@index([storeId])
}

enum ReceiptStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model ReceiptItem {
  id          String   @id @default(uuid())
  receiptId   String
  receipt     Receipt  @relation(fields: [receiptId], references: [id], onDelete: Cascade)
  name        String
  price       Decimal  @db.Decimal(10, 2)
  quantity    Int      @default(1)
  category    String?
  lineNumber  Int?
  confidence  Float?
  createdAt   DateTime @default(now())

  @@index([receiptId])
}
```

**Seeded Data**:

- 20+ stores (Austrian and international)
- Store aliases for fuzzy matching
- Test user in development mode

### 4. Storage (MinIO/S3)

**Purpose**: Receipt image storage

**Configuration**:

- **Endpoint**: localhost:9000 (dev) / S3 endpoint (prod)
- **Bucket**: pricy-receipts
- **Structure**: `receipts/YYYY-MM-DD/[uuid].[ext]`
- **Access**: Private with signed URLs

**Operations**:

```typescript
uploadReceipt(file)
- Validates file
- Generates unique key: receipts/2025-10-26/uuid.jpg
- Sets content type
- Returns public URL

downloadFile(key)
- Used by OCR worker
- Returns image buffer

deleteFile(key)
- Cleanup for failed uploads (future)
```

### 5. Job Queue (BullMQ + Redis)

**Purpose**: Asynchronous OCR job processing

**Queue**: `ocr-processing`

**Job Data**:

```typescript
{
  receiptId: string; // Used as job ID for idempotency
  imageUrl: string;
}
```

**Configuration**:

```typescript
{
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 }
}
```

**Monitoring**: Bull Board dashboard at `/admin/queues` (development only)

## Data Flow Diagrams

### Receipt Upload Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant V as Validation
    participant S3 as MinIO/S3
    participant DB as PostgreSQL
    participant Q as BullMQ

    C->>GW: POST /receipts/upload<br/>(multipart)
    GW->>V: Validate image
    alt Invalid file
        V-->>GW: ValidationError
        GW-->>C: 400 Bad Request
    else Valid file
        V-->>GW: OK
        GW->>S3: Upload image
        S3-->>GW: imageUrl
        GW->>DB: Create receipt<br/>(status: PROCESSING)
        DB-->>GW: receipt.id
        GW->>Q: Queue OCR job
        Q-->>GW: Job queued
        GW-->>C: 201 Created<br/>{ id, status, imageUrl }
    end
```

### OCR Processing Flow

```mermaid
sequenceDiagram
    participant Q as BullMQ
    participant W as Worker
    participant S3 as MinIO
    participant OCR as Tesseract
    participant P as Parsers
    participant DB as Database

    Q->>W: Dequeue job
    W->>DB: Set status=PROCESSING
    W->>S3: Download image
    S3-->>W: Image buffer
    W->>OCR: Process with preprocessing
    OCR-->>W: Raw text + confidence

    par Parse all fields
        W->>P: Detect store
        P-->>W: Store name
        W->>P: Extract date
        P-->>W: Purchase date
        W->>P: Extract items
        P-->>W: Items array
        W->>P: Extract total
        P-->>W: Total amount
    end

    W->>DB: Update receipt + insert items
    DB-->>W: Success
    W->>DB: Set status=COMPLETED
    W->>Q: Job complete
```

### Receipt Status Query Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant GW as API Gateway
    participant DB as PostgreSQL

    C->>GW: GET /receipts/:id/status
    GW->>DB: Query receipt + items
    alt Not found
        DB-->>GW: null
        GW-->>C: 404 Not Found
    else Found
        DB-->>GW: Receipt data
        alt Status = COMPLETED
            GW->>GW: Build OCR result
            GW-->>C: 200 OK + full results
        else Status = PROCESSING/PENDING
            GW-->>C: 200 OK + progress
        else Status = FAILED
            GW-->>C: 200 OK + error info
        end
    end
```

## Infrastructure

### Development Setup (Docker Compose)

```yaml
services:
  postgres:
    image: postgres:18-alpine
    ports: ['5432:5432']
    environment:
      POSTGRES_DB: pricy
      POSTGRES_USER: pricy
      POSTGRES_PASSWORD: pricy

  redis:
    image: redis:8-alpine
    ports: ['6379:6379']

  minio:
    image: minio/minio
    ports:
      - '9000:9000' # API
      - '9001:9001' # Console
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
```

### Application Services

```bash
# API Gateway
PORT: 3001
ENV: development
DEPENDENCIES: PostgreSQL, Redis, MinIO

# OCR Service
DEPENDENCIES: Redis, MinIO, PostgreSQL
CONCURRENCY: 5 workers
```

## Security

### Currently Implemented

- **Input Validation**: File type, size, dimensions
- **CORS**: Configurable origins
- **Rate Limiting**: Configurable per endpoint
- **Security Headers**: Via Helmet
- **Error Handling**: No sensitive data in responses
- **SQL Injection**: Protected via Prisma ORM
- **Request Logging**: Structured logs with request IDs

### Not Yet Implemented (Phase 1)

- Authentication & Authorization
- API keys/JWT tokens
- User isolation
- File scanning for malware
- Encryption at rest

## Monitoring & Observability

### Logging

- **Library**: Pino
- **Format**: JSON structured logs
- **Pretty Print**: Development mode only
- **Fields**: timestamp, level, requestId, context
- **Levels**: trace, debug, info, warn, error, fatal

### Metrics (Available but not collected yet)

- Request latency
- OCR processing time
- Queue depth
- Job success/failure rates

### Queue Monitoring

- **Bull Board Dashboard**: http://localhost:3001/admin/queues (dev only)
- View pending, active, completed, failed jobs
- Retry failed jobs
- Clear queues
- Real-time job updates

## Performance Characteristics

### Measured Performance

| Metric          | Target     | Actual | Status |
| --------------- | ---------- | ------ | ------ |
| Upload Time     | <2s        | ~50ms  | ✅     |
| OCR Processing  | <30s (p95) | ~1.2s  | ✅     |
| File Validation | <100ms     | ~5ms   | ✅     |
| API Response    | <500ms     | <100ms | ✅     |

### Scalability Considerations

**Current Limits** (Single Instance):

- Concurrent OCR jobs: 5
- Rate limit: 100 req/min (configurable)
- Max file size: 10MB
- Supported formats: JPG, PNG

**Horizontal Scaling** (Future):

- Multiple OCR workers can process from same Redis queue
- API Gateway instances behind load balancer
- PostgreSQL read replicas for queries
- S3/MinIO distributed storage

## Error Handling

### Error Codes

```typescript
FILE_TOO_LARGE      - File exceeds 10MB
INVALID_FILE_TYPE   - Not JPG/PNG
INVALID_IMAGE       - Corrupted or invalid image
OCR_TIMEOUT         - Processing took >30s
OCR_FAILED          - Could not extract text
STORAGE_ERROR       - Failed to upload/download
DATABASE_ERROR      - Database operation failed
NOT_FOUND           - Receipt not found
```

### Retry Strategy

- **File upload**: No retry (client should retry)
- **OCR processing**: 3 attempts with exponential backoff (2s, 4s, 8s)
- **Database operations**: Prisma handles transient errors

## API Response Examples

### Successful Upload

```json
POST /api/v1/receipts/upload

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "uploadedAt": "2025-10-26T18:30:00.000Z",
  "processingStartedAt": "2025-10-26T18:30:01.000Z",
  "imageUrl": "http://localhost:9000/pricy-receipts/receipts/2025-10-26/550e8400.jpg"
}
```

### Processing Status

```json
GET /api/v1/receipts/:id/status

Response: 200 OK (Completed)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "ocrResult": {
    "storeName": "Billa",
    "date": "2025-10-25T00:00:00.000Z",
    "items": [
      {
        "name": "Milk 2%",
        "price": 3.99,
        "quantity": 1,
        "confidence": 0.92
      }
    ],
    "total": 45.67
  },
  "processingTime": 1200
}
```

### Error Response

```json
POST /api/v1/receipts/upload

Response: 400 Bad Request
{
  "error": "File size exceeds maximum of 10MB",
  "code": "FILE_TOO_LARGE"
}
```

## Testing

### Test Coverage

- **API Gateway**: 132 tests
- **OCR Service**: 232 tests
- **Total**: 364 tests, 100% pass rate

### Test Types

1. **Unit Tests**: Individual functions and classes
2. **Integration Tests**: API endpoints with mocked dependencies
3. **Real Receipt Test**: Full OCR pipeline with actual image

### Running Tests

```bash
# All tests
pnpm test

# Specific workspace
pnpm --filter @pricy/api-gateway test
pnpm --filter @pricy/ocr-service test

# With coverage
pnpm test:coverage

# Load test (requires running services)
pnpm --filter @pricy/api-gateway test:load
```

## Deployment

### Development

```bash
# 1. Start infrastructure
pnpm docker:dev

# 2. Run migrations
pnpm db:migrate

# 3. Seed database
pnpm db:seed

# 4. Start services
pnpm dev

# Services will be available at:
# - API Gateway: http://localhost:3001
# - Bull Board: http://localhost:3001/admin/queues
# - MinIO Console: http://localhost:9001
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Environment Variables

```bash
# API Gateway
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://pricy:pricy@localhost:5432/pricy
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pricy-receipts
S3_USE_SSL=false
CORS_ORIGIN=*
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# OCR Service
NODE_ENV=development
DATABASE_URL=postgresql://pricy:pricy@localhost:5432/pricy
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=localhost
S3_PORT=9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pricy-receipts
S3_USE_SSL=false
OCR_CONCURRENCY=5
LOG_LEVEL=info
```

## Future Enhancements (Not Yet Implemented)

The following are planned but not yet part of the current architecture:

- Frontend (Next.js PWA)
- User authentication & authorization
- Product normalization service
- Price comparison analytics
- Shopping recommendations
- Batch receipt processing
- Cloud OCR fallback (Google Vision API)
- Manual OCR correction UI
- Receipt sharing
- Export functionality
- Mobile apps (React Native)

## References

### Documentation

- [Getting Started Guide](./guides/getting-started.md)
- [API Documentation](./components/api-gateway.md)
- [OCR Service Details](./components/ocr-service.md)
- [Database Schema](./components/database-schema.md)
- [Testing Strategy](./guides/testing-strategy.md)

### External Documentation

- [Fastify](https://fastify.dev/)
- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Prisma](https://www.prisma.io/docs)
- [BullMQ](https://docs.bullmq.io/)
- [MinIO](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)

---

**Document Version**: 1.0 (M0.2 Complete)  
**Last Verified**: October 26, 2025  
**Validation**: All components tested and operational (364 tests passing)
