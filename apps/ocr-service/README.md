# OCR Service

Receipt OCR processing service using Tesseract.js and BullMQ for background job processing.

## Features

- Receipt image OCR using Tesseract.js
- Image preprocessing with Sharp
- Store name detection
- Date extraction
- Item extraction with price and quantity
- Total amount extraction
- Background job processing with BullMQ
- Retry logic and error handling

## Architecture

```plaintext
OCR Service
├── src/
│   ├── config/          # Environment configuration
│   ├── ocr/             # OCR engine (Tesseract)
│   ├── parsers/         # Text parsing (store, date, items, total)
│   ├── processors/      # Receipt processing orchestration
│   ├── services/        # Storage service
│   ├── worker/          # BullMQ worker
│   └── index.ts         # Entry point
```

## Environment Variables

```env
NODE_ENV=development
DATABASE_URL=postgresql://pricey:pricey@localhost:5432/pricey
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# S3/MinIO Storage
S3_ENDPOINT=localhost
S3_PORT=9000
S3_USE_SSL=false
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=pricey-receipts

# OCR Configuration
OCR_CONCURRENCY=5
OCR_TIMEOUT=30000
```

## Running

### Development

```bash
pnpm dev
```

### Production

```bash
pnpm build
pnpm start
```

## How It Works

1. **Job Received**: Worker receives OCR job from Redis queue
2. **Download Image**: Image downloaded from MinIO/S3
3. **Image Preprocessing**: Image converted to grayscale, normalized, and sharpened
4. **OCR Processing**: Tesseract extracts text from image
5. **Text Parsing**:
   - Store name detected using pattern matching
   - Date extracted using various date formats
   - Items extracted with prices and quantities
   - Total amount extracted and validated
6. **Database Update**: Receipt and items saved to PostgreSQL
7. **Job Complete**: Status updated and job marked as complete

## Store Detection

The service can detect 20+ major stores including:

- **Austrian Stores**: Billa, Spar, Hofer, Lidl, Penny, MPreis, Merkur, dm, Müller, Bipa
- **International**: IKEA, H&M, C&A, MediaMarkt, Saturn
- **Gas Stations**: OMV, BP, Shell
- **Hardware**: Bauhaus, OBI, Hornbach

## Item Extraction

Items are extracted using multiple patterns:

- Price patterns: `$3.99`, `3.99 ea`, `$3.99 each`
- Quantity patterns: `2 @ $3.99`, `2 x Item`, `Qty: 2`
- Confidence scoring based on pattern matching

## Error Handling

- **Retry Logic**: Jobs are retried up to 3 times with exponential backoff
- **Timeout**: Processing timeout set to 30 seconds
- **Failed Jobs**: Receipts marked as FAILED in database
- **Logging**: Comprehensive logging with Pino

## Performance

- **Concurrency**: 5 concurrent jobs (configurable)
- **Rate Limiting**: 10 jobs per minute
- **Processing Time**: Target < 30 seconds per receipt
- **Accuracy**: Target 70%+ item extraction accuracy

## License

AGPL-3.0 - See LICENSE file for details
