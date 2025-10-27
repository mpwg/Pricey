# OCR Service

Receipt parsing service using vision-capable LLMs and BullMQ for background job processing.

## Features

- **Vision-based parsing** - Direct image analysis (no OCR preprocessing)
- **Multi-provider support** - Ollama (local) or GitHub Models (cloud)
- **State-of-the-art models** - GPT-5 mini, Claude Sonnet 4.5, LLaVA, Llama Vision
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
│   ├── parsers/         # Vision LLM parsers (Ollama, GitHub, OpenAI)
│   │   ├── base-receipt-parser.ts      # Interface & schemas
│   │   ├── llm-receipt-parser.ts       # Ollama implementation
│   │   ├── github-models-receipt-parser.ts  # GitHub Models implementation
│   │   └── parser-factory.ts           # Provider selection
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

# LLM Configuration
LLM_PROVIDER=ollama  # Options: ollama, github, openai (future)
LLM_TIMEOUT=60000

# Ollama Configuration (for local processing)
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llava  # Options: llava, llama3.2-vision, moondream
LLM_TEMPERATURE=0.1

# GitHub Models Configuration (for cloud processing)
GITHUB_TOKEN=ghp_your_token_here
GITHUB_MODEL=gpt-5-mini  # Options: gpt-5-mini, claude-sonnet-4.5, gemini-2.5-pro

# Processing Configuration
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

1. **Job Received**: Worker receives processing job from Redis queue
2. **Download Image**: Image downloaded from MinIO/S3
3. **Image Preprocessing**: Image converted to optimal format for vision model
4. **Vision LLM Processing**: Provider-agnostic parser analyzes image directly
   - Ollama: Uses local LLaVA/Llama Vision models
   - GitHub Models: Uses GPT-5 mini/Claude Sonnet 4.5
5. **JSON Validation**: Structured JSON response validated with Zod schemas
6. **Database Update**: Receipt and items saved to PostgreSQL
7. **Job Complete**: Status updated and job marked as complete

**No OCR preprocessing** - Vision models analyze images directly for better accuracy.

## Store Detection

The Vision LLM can identify various stores from receipt headers and logos, including:

- Walmart, Target, Costco
- Kroger, Safeway, Whole Foods
- CVS, Walgreens
- Generic stores
- International retailers

## Item Extraction

Items are extracted using vision LLM processing that:

- Identifies product names from image
- Extracts prices (handles various formats: $1.99, 1,99€, etc.)
- Detects quantities (explicit or inferred)
- Preserves item order as it appears
- Handles multi-line items and descriptions

## Performance

- **Accuracy**: Target 85%+ item extraction accuracy with vision LLM processing
  - Ollama (local): 85-95% accuracy
  - GitHub Models: 90-99% accuracy (GPT-5 mini, Claude Sonnet 4.5)
- **Speed**:
  - Ollama Docker (CPU): 10-30 seconds per receipt
  - Ollama Mac (GPU): 2-5 seconds per receipt
  - GitHub Models: 2-4 seconds per receipt
- **Concurrency**: Configurable (default: 5 concurrent jobs)

## License

AGPL-3.0 - See LICENSE file for details
