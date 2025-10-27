# OCR Service

Receipt OCR processing service using Ollama LLMs and BullMQ for background job processing.

## Features

- Receipt image OCR using Ollama with LLaVA/Llama 3.2 Vision models
- Image preprocessing with Sharp
- Structured JSON extraction with retry logic
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
│   ├── ocr/             # OCR engine (Ollama LLM)
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

# OCR Configuration (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2-vision
OCR_CONCURRENCY=5
OCR_TIMEOUT=60000
OCR_MAX_RETRIES=3
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
3. **Image Preprocessing**: Image converted to optimal format for LLM vision processing
4. **OCR Processing**: Ollama LLM with vision model extracts structured data from receipt
5. **JSON Parsing**: Structured JSON response parsed and validated with Zod
6. **Database Update**: Receipt and items saved to PostgreSQL
7. **Job Complete**: Status updated and job marked as complete

## Store Detection

The LLM can identify various stores from receipt headers and logos, including:

- **Austrian Stores**: Billa, Spar, Hofer, Lidl, Penny, MPreis, Merkur, dm, Müller, Bipa
- **International**: IKEA, H&M, C&A, MediaMarkt, Saturn
- **Gas Stations**: OMV, BP, Shell
- **Hardware**: Bauhaus, OBI, Hornbach

## Item Extraction

Items are extracted using LLM vision processing that:

- Identifies product names, quantities, and prices
- Handles multi-line items and complex receipt layouts
- Extracts structured data in JSON format
- Validates item totals against receipt total

## Error Handling

- **Retry Logic**: Jobs are retried up to 3 times with exponential backoff
- **Timeout**: Processing timeout set to 60 seconds
- **Failed Jobs**: Receipts marked as FAILED in database
- **Logging**: Comprehensive logging with Pino
- **LLM Fallbacks**: Multiple retry attempts with adjusted prompts

## Performance

- **Concurrency**: 5 concurrent jobs (configurable)
- **Rate Limiting**: 10 jobs per minute
- **Processing Time**: Target < 60 seconds per receipt
- **Accuracy**: Target 85%+ item extraction accuracy with LLM processing

## License

AGPL-3.0 - See LICENSE file for details
