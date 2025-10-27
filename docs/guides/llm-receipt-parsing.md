# LLM-Based Receipt Parsing

**Last updated:** October 27, 2025

## Overview

Pricey now uses **Large Language Models (LLMs)** instead of regex-based parsing to extract structured data from receipt text. This approach provides:

- **Higher accuracy** - Context-aware understanding of receipt formats
- **Flexibility** - Handles varying layouts without templates
- **Multilingual support** - Works with receipts in different languages
- **Structured output** - Guaranteed JSON schema compliance
- **Self-hosted** - No cloud APIs or data privacy concerns

## Architecture

```text
Receipt Image → Tesseract OCR → Raw Text → LLM Parser → Structured Data
                                              ↓
                                         Ollama (Docker)
                                              ↓
                                    Llama 3.2 / Mistral / etc.
```

## Supported LLM Models

| Model           | Size  | Speed     | Accuracy  | Best For             |
| --------------- | ----- | --------- | --------- | -------------------- |
| **llama3.2:3b** | 1.9GB | Fast      | Good      | Development, testing |
| **llama3.2:1b** | 1.0GB | Very Fast | Fair      | Low-resource systems |
| **mistral:7b**  | 4.1GB | Moderate  | Excellent | Production use       |
| **phi3:mini**   | 2.3GB | Fast      | Good      | Compact deployments  |

## Configuration

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Docker - Model to auto-download on startup
OLLAMA_MODEL=llama3.2:3b                     # Options: llama3.2:1b, llama3.2:3b, mistral:7b, phi3:mini

# Application - LLM Parser Configuration
LLM_PROVIDER=ollama                          # Provider: 'ollama' or 'openai' (future)
LLM_BASE_URL=http://localhost:11434         # Ollama API endpoint
LLM_MODEL=llama3.2:3b                        # Model to use (should match OLLAMA_MODEL)
LLM_TIMEOUT=60000                            # Timeout in milliseconds
LLM_TEMPERATURE=0.1                          # Temperature (0.0-1.0, lower = more deterministic)
```

### Docker Services

The LLM service is defined in `docker-compose.yml` with automatic model downloading:

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: pricey-ollama
  ports:
    - '11434:11434'
  volumes:
    - ollama_data:/root/.ollama
    - ./docker/ollama-entrypoint.sh:/entrypoint.sh:ro
  environment:
    OLLAMA_HOST: 0.0.0.0:11434
    OLLAMA_MODEL: ${OLLAMA_MODEL:-llama3.2:3b} # Auto-pulls on startup
  entrypoint: ['/bin/bash', '/entrypoint.sh']
  deploy:
    resources:
      limits:
        memory: 8G # Adjust based on your system
```

## Setup Instructions

### 1. Configure Model (Optional)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env to set your preferred model
OLLAMA_MODEL=llama3.2:3b  # Default (recommended)
# Or: mistral:7b, llama3.2:1b, phi3:mini
```

### 2. Start Docker Services

```bash
# Start all infrastructure (PostgreSQL, Redis, MinIO, Ollama)
# The model will be automatically downloaded on first start
pnpm docker:dev
```

**First startup** downloads the model automatically (1-4GB, takes 2-5 minutes).
Subsequent starts are instant (model is cached).

### 3. Verify Setup

```bash
# Check available models
docker exec pricey-ollama ollama list

# Test the API
curl http://localhost:11434/api/tags

# Test parsing (example)
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:3b",
  "prompt": "Parse this receipt: Store: Walmart, Date: 2025-10-27, Total: $25.99",
  "stream": false
}'
```

### 4. Start the OCR Service

```bash
# Start the OCR service
pnpm --filter @pricey/ocr-service dev
```

## Switching Models

To use a different model, simply update your `.env` and restart:

1. **Update environment variable:**

   ```bash
   # In .env file
   OLLAMA_MODEL=mistral:7b
   LLM_MODEL=mistral:7b  # Keep in sync
   ```

2. **Restart Docker services:**

   ```bash
   pnpm docker:dev:down
   pnpm docker:dev
   ```

   The new model will be automatically downloaded on startup.

### Manual Model Management

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull a model manually (if needed)
docker exec pricey-ollama ollama pull phi3:mini

# Remove unused models to save space
docker exec pricey-ollama ollama rm llama3.2:1b
```

## Structured Output Schema

The LLM parser extracts the following fields:

```typescript
{
  storeName: string | null,        // "Walmart", "Target", etc.
  date: string | null,             // ISO 8601 format: "2025-10-27"
  items: Array<{
    name: string,                  // Product name
    price: number,                 // Price per unit
    quantity: number               // Quantity (default: 1)
  }>,
  total: number | null,            // Total amount (including tax)
  currency: string,                // "USD", "EUR", "CHF", etc.
  confidence: number               // 0.0 - 1.0 (extraction confidence)
}
```

## API Usage

### Health Check

```typescript
import { LlmReceiptParser } from './parsers/llm-receipt-parser';

const parser = new LlmReceiptParser();
const isHealthy = await parser.healthCheck();
```

### Parse Receipt Text

```typescript
const ocrText = `
  WALMART
  Date: 10/27/2025
  Milk           $3.99
  Bread x2       $4.98
  TOTAL          $8.97
`;

const result = await parser.parse(ocrText);
console.log(result);
// {
//   storeName: "Walmart",
//   date: "2025-10-27",
//   items: [
//     { name: "Milk", price: 3.99, quantity: 1 },
//     { name: "Bread", price: 2.49, quantity: 2 }
//   ],
//   total: 8.97,
//   currency: "USD",
//   confidence: 0.95
// }
```

## Performance Considerations

### Memory Requirements

| Model       | RAM Required | GPU Required |
| ----------- | ------------ | ------------ |
| llama3.2:1b | 2-4GB        | No           |
| llama3.2:3b | 4-6GB        | No           |
| mistral:7b  | 8-12GB       | No           |

**Note:** GPU acceleration is optional but provides 5-10x speed improvement.

### Response Times

Average processing times (CPU-only):

- **llama3.2:1b**: 2-5 seconds
- **llama3.2:3b**: 5-10 seconds
- **mistral:7b**: 10-20 seconds

With GPU acceleration:

- **llama3.2:3b**: 1-2 seconds
- **mistral:7b**: 2-4 seconds

### Enabling GPU Support (Optional)

If you have an NVIDIA GPU:

1. Install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html)

2. Uncomment GPU settings in `docker-compose.yml`:

   ```yaml
   ollama:
     # ...
     deploy:
       resources:
         reservations:
           devices:
             - driver: nvidia
               count: 1
               capabilities: [gpu]
   ```

3. Restart services:

   ```bash
   pnpm docker:dev:down
   pnpm docker:dev
   ```

## Troubleshooting

### Ollama Service Not Starting

```bash
# Check logs
docker logs pricey-ollama

# Verify port is not in use
lsof -i :11434

# Restart service
docker restart pricey-ollama
```

### Model Not Found

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull the model
docker exec pricey-ollama ollama pull llama3.2:3b
```

### Slow Parsing

- **Switch to a smaller model** (llama3.2:1b)
- **Enable GPU acceleration** (see above)
- **Increase timeout** in environment variables
- **Reduce temperature** for faster inference

### Low Accuracy

- **Switch to a larger model** (mistral:7b)
- **Improve OCR quality** (better image preprocessing)
- **Adjust temperature** (lower = more deterministic)

## Comparison: LLM vs. Regex Parser

| Feature          | Regex Parser (Old)         | LLM Parser (New)        |
| ---------------- | -------------------------- | ----------------------- |
| **Accuracy**     | 60-70%                     | 85-95%                  |
| **Flexibility**  | Low (brittle)              | High (adaptive)         |
| **Setup**        | None                       | Requires Docker + model |
| **Speed**        | <100ms                     | 2-20s (model-dependent) |
| **Maintenance**  | High (many regex patterns) | Low (prompt-based)      |
| **Multilingual** | No                         | Yes                     |
| **Privacy**      | Full                       | Full (self-hosted)      |

## Future Enhancements

- [ ] Support for cloud-based LLMs (OpenAI, Anthropic) via `LLM_PROVIDER=openai`
- [ ] Multi-modal vision models (parse receipt images directly, skip OCR)
- [ ] Model fine-tuning on receipt datasets for improved accuracy
- [ ] Batch processing for multiple receipts
- [ ] Streaming responses for faster perceived performance
- [ ] Automatic model selection based on receipt complexity

## References

- [Ollama Documentation](https://github.com/ollama/ollama)
- [Llama 3.2 Model Card](https://ollama.com/library/llama3.2)
- [Mistral Documentation](https://docs.mistral.ai/)
- [Structured Output with Ollama](https://ollama.com/blog/structured-outputs)

---

**Questions?** Check the [main documentation](/docs/README.md) or open an issue on GitHub.
