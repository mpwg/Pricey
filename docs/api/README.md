# API Documentation

Welcome to the Pricey API documentation. This guide covers all available endpoints, request/response formats, and authentication.

## Base URL

- **Production**: `https://pricey.mpwg.eu/api/v1`
- **Staging**: `https://staging.pricey.mpwg.eu/api/v1`
- **Development**: `http://localhost:3001/api/v1`

## Authentication

**Phase 0 (MVP)**: No authentication required.

**Phase 1+**: Bearer token authentication will be required for most endpoints.

```http
Authorization: Bearer YOUR_TOKEN_HERE
```

## Rate Limits

- **API Requests**: 100 requests per minute per IP
- **Receipt Uploads**: 10 uploads per hour per IP (Phase 0)

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1706486400
```

## Endpoints

### Health Check

Check if the API is running.

```http
GET /health
```

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-28T12:00:00Z",
  "uptime": 86400,
  "version": "0.1.0"
}
```

---

### Upload Receipt

Upload a receipt image for OCR processing.

```http
POST /api/v1/receipts
Content-Type: multipart/form-data
```

**Request Body:**

- `file` (required): Receipt image file (JPEG, PNG, WEBP)
- `userId` (optional): User ID (Phase 1+)

**Example:**

```bash
curl -X POST https://pricey.mpwg.eu/api/v1/receipts \
  -F "file=@receipt.jpg"
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PROCESSING",
  "createdAt": "2025-01-28T12:00:00Z",
  "imageUrl": "https://storage.pricey.mpwg.eu/receipts/550e8400.jpg"
}
```

**Status Codes:**

- `200 OK`: Receipt uploaded successfully
- `400 Bad Request`: Invalid file or file too large (>10MB)
- `415 Unsupported Media Type`: Invalid file format
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

### Get Receipt by ID

Retrieve a single receipt by its ID.

```http
GET /api/v1/receipts/:id
```

**Path Parameters:**

- `id` (required): Receipt UUID

**Example:**

```bash
curl https://pricey.mpwg.eu/api/v1/receipts/550e8400-e29b-41d4-a716-446655440000
```

**Response:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "storeName": "Walmart",
  "purchaseDate": "2025-01-27T00:00:00Z",
  "totalAmount": "45.67",
  "currency": "USD",
  "ocrProvider": "github",
  "ocrConfidence": 0.95,
  "processingTime": 3500,
  "imageUrl": "https://storage.pricey.mpwg.eu/receipts/550e8400.jpg",
  "createdAt": "2025-01-28T12:00:00Z",
  "updatedAt": "2025-01-28T12:00:04Z",
  "items": [
    {
      "id": "item-1",
      "name": "Organic Bananas",
      "quantity": 1.5,
      "unitPrice": "0.59",
      "totalPrice": "0.89",
      "unit": "lb"
    }
  ]
}
```

**Status Codes:**

- `200 OK`: Receipt found
- `404 Not Found`: Receipt not found
- `500 Internal Server Error`: Server error

---

### List Receipts

Retrieve a list of all receipts.

```http
GET /api/v1/receipts
```

**Query Parameters:**

- `limit` (optional): Number of receipts to return (default: 50, max: 100)
- `offset` (optional): Number of receipts to skip (default: 0)
- `status` (optional): Filter by status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`)
- `userId` (optional): Filter by user ID (Phase 1+)

**Example:**

```bash
curl "https://pricey.mpwg.eu/api/v1/receipts?limit=10&status=COMPLETED"
```

**Response:**

```json
{
  "receipts": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "COMPLETED",
      "storeName": "Walmart",
      "purchaseDate": "2025-01-27T00:00:00Z",
      "totalAmount": "45.67",
      "currency": "USD",
      "createdAt": "2025-01-28T12:00:00Z",
      "updatedAt": "2025-01-28T12:00:04Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

**Status Codes:**

- `200 OK`: Receipts retrieved successfully
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

---

### Server-Sent Events (SSE)

Real-time updates for receipt processing.

```http
GET /api/v1/receipts/events
Accept: text/event-stream
```

**Example:**

```javascript
const eventSource = new EventSource(
  'https://pricey.mpwg.eu/api/v1/receipts/events'
);

eventSource.addEventListener('receipt-update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Receipt updated:', data);
});
```

**Event Types:**

- `receipt-created`: New receipt uploaded
- `receipt-update`: Receipt status changed
- `receipt-completed`: OCR processing completed
- `receipt-failed`: OCR processing failed

**Event Data:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "storeName": "Walmart",
  "totalAmount": "45.67"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPEG, PNG, and WEBP images are supported",
    "details": {
      "allowedTypes": ["image/jpeg", "image/png", "image/webp"]
    }
  }
}
```

### Common Error Codes

- `INVALID_FILE_TYPE`: Unsupported file format
- `FILE_TOO_LARGE`: File exceeds 10MB limit
- `RECEIPT_NOT_FOUND`: Receipt ID not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Unexpected server error

---

## Data Models

### Receipt

```typescript
interface Receipt {
  id: string; // UUID
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  storeName: string | null;
  storeAddress: string | null;
  purchaseDate: string | null; // ISO 8601
  totalAmount: string | null; // Decimal string
  subtotal: string | null; // Decimal string
  taxAmount: string | null; // Decimal string
  currency: string; // ISO 4217 code (e.g., "USD")
  ocrProvider: string; // "llm", "github", "ollama"
  ocrConfidence: number | null; // 0.0 to 1.0
  rawOcrText: string | null;
  processingTime: number | null; // milliseconds
  errorMessage: string | null;
  imageUrl: string;
  userId: string | null; // Phase 1+
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  items: ReceiptItem[];
}
```

### ReceiptItem

```typescript
interface ReceiptItem {
  id: string;
  receiptId: string;
  name: string;
  quantity: number;
  unitPrice: string | null; // Decimal string
  totalPrice: string; // Decimal string
  unit: string | null; // "lb", "kg", "each", etc.
  category: string | null;
  barcode: string | null;
}
```

---

## SDKs and Libraries

### JavaScript/TypeScript

```bash
npm install @pricey/sdk
```

```typescript
import { PriceyClient } from '@pricey/sdk';

const client = new PriceyClient({
  baseUrl: 'https://pricey.mpwg.eu/api/v1',
  apiKey: 'YOUR_API_KEY', // Phase 1+
});

// Upload receipt
const receipt = await client.receipts.upload(file);

// Get receipt
const receipt = await client.receipts.get('receipt-id');

// List receipts
const receipts = await client.receipts.list({ limit: 10 });
```

**Note**: SDK coming in Phase 1.

---

## Postman Collection

Download our Postman collection for easy testing:

[Download Postman Collection](https://github.com/mpwg/Pricey/blob/main/docs/api/Pricey.postman_collection.json)

---

## OpenAPI Specification

View the full OpenAPI 3.0 specification:

[View OpenAPI Spec](https://github.com/mpwg/Pricey/blob/main/docs/api/openapi.yaml)

---

## Support

- **GitHub Issues**: [github.com/mpwg/Pricey/issues](https://github.com/mpwg/Pricey/issues)
- **Documentation**: [Pricey Docs](https://github.com/mpwg/Pricey/tree/main/docs)
