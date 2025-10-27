# LLM-Based Receipt Parsing

**Last updated:** October 27, 2025

## Overview

Pricey uses **vision-capable Large Language Models (LLMs)** to directly analyze receipt images and extract structured data. This approach provides:

- **Higher accuracy** - Context-aware understanding of receipt formats
- **Vision-based** - Analyzes actual images, not just text
- **Multi-provider** - Switch between local (Ollama) and cloud (GitHub Models)
- **Flexibility** - Handles varying layouts without templates
- **Multilingual support** - Works with receipts in different languages
- **Structured output** - Guaranteed JSON schema compliance

## Architecture

```text
Receipt Image → Vision LLM → Structured Data
                    ↓
         Ollama (local) OR GitHub Models (cloud)
                    ↓
         LLaVA / Llama Vision / GPT-5 mini / Claude 4.5
```

**No OCR step needed** - Vision models analyze images directly.

## Supported Providers & Models

### Ollama (Local, Self-Hosted)

| Model               | Size  | Speed     | Accuracy  | Vision | Best For                   |
| ------------------- | ----- | --------- | --------- | ------ | -------------------------- |
| **llava** (default) | 4.5GB | Fast      | Excellent | ✅ Yes | Recommended for all use    |
| **llama3.2-vision** | 7.9GB | Moderate  | Excellent | ✅ Yes | High-accuracy requirements |
| **moondream**       | 1.7GB | Very Fast | Good      | ✅ Yes | Low-resource systems       |

### GitHub Models (Cloud, Copilot)

| Model                 | Speed     | Accuracy  | Vision | Best For                      |
| --------------------- | --------- | --------- | ------ | ----------------------------- |
| **gpt-5-mini**        | Very Fast | Excellent | ✅ Yes | Recommended (balanced)        |
| **claude-sonnet-4.5** | Very Fast | Excellent | ✅ Yes | Best coding model (Oct 2025)  |
| **claude-opus-4.1**   | Moderate  | Excellent | ✅ Yes | Highest accuracy              |
| **gemini-2.5-pro**    | Fast      | Excellent | ✅ Yes | Scientific/technical analysis |

**Note:** GPT-4o was retired on October 23, 2025.

## Configuration

### Environment Variables

Add these to your `.env` file:

**For Ollama (Local):**

```bash
# Docker - Model to auto-download on startup
OLLAMA_MODEL=llava                           # Options: llava, llama3.2-vision, moondream

# Application - LLM Parser Configuration
LLM_PROVIDER=ollama                          # Provider: 'ollama', 'github', or 'openai' (future)
LLM_BASE_URL=http://localhost:11434         # Ollama API endpoint
LLM_MODEL=llava                              # Model to use (should match OLLAMA_MODEL)
LLM_TIMEOUT=60000                            # Timeout in milliseconds
LLM_TEMPERATURE=0.1                          # Temperature (0.0-1.0, lower = more deterministic)
```

**For GitHub Models (Cloud):**

```bash
# Application - GitHub Models Configuration
LLM_PROVIDER=github
GITHUB_TOKEN=ghp_your_token_here             # Get from https://github.com/settings/tokens
GITHUB_MODEL=gpt-5-mini                      # Options: gpt-5-mini, claude-sonnet-4.5, gemini-2.5-pro
```

### Docker Services

The Ollama service is defined in `docker-compose.yml` with automatic model downloading:

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
    OLLAMA_MODEL: ${OLLAMA_MODEL:-llava} # Auto-pulls vision model on startup
  entrypoint: ['/bin/bash', '/entrypoint.sh']
  deploy:
    resources:
      limits:
        memory: 8G # Adjust based on your system
```

## Setup Instructions

### Option A: GitHub Models (Fastest Setup)

```bash
# 1. Get GitHub token from https://github.com/settings/tokens
# 2. Configure
echo 'LLM_PROVIDER="github"' >> .env.local
echo 'GITHUB_TOKEN="ghp_YOUR_TOKEN"' >> .env.local
echo 'GITHUB_MODEL="gpt-5-mini"' >> .env.local

# 3. Start services (no Docker needed for LLM)
pnpm dev
```

### Option B: Ollama Local Setup

#### 1. Configure Model (Optional)

```bash
# Copy example environment file
cp .env.example .env

# Edit .env to set your preferred model
OLLAMA_MODEL=llava  # Default (recommended)
# Or: llama3.2-vision, moondream
```

#### 2. Start Docker Services

```bash
# Start all infrastructure (PostgreSQL, Redis, MinIO, Ollama)
# The model will be automatically downloaded on first start
pnpm docker:dev
```

**First startup** downloads the model automatically (1.7-7.9GB, takes 2-5 minutes).
Subsequent starts are instant (model is cached).

#### 3. Verify Setup

```bash
# Check available models (Ollama)
docker exec pricey-ollama ollama list

# Test the Ollama API
curl http://localhost:11434/api/tags

# Test vision parsing with an image
curl http://localhost:11434/api/generate -d '{
  "model": "llava",
  "prompt": "Describe this receipt image",
  "images": ["base64_encoded_image_here"],
  "stream": false
}'
```

#### 4. Start the OCR Service

```bash
# Start the OCR service
pnpm --filter @pricey/ocr-service dev
```

## Switching Models

### Ollama Models

To use a different Ollama model, update your `.env` and restart:

1. **Update environment variable:**

   ```bash
   # In .env file
   OLLAMA_MODEL=llama3.2-vision
   LLM_MODEL=llama3.2-vision  # Keep in sync
   ```

2. **Restart Docker services:**

   ```bash
   pnpm docker:dev:down
   pnpm docker:dev
   ```

   The new model will be automatically downloaded on startup.

### GitHub Models

```bash
# Update .env
GITHUB_MODEL=claude-sonnet-4.5  # or gpt-5-mini, gemini-2.5-pro

# Restart service
pnpm --filter @pricey/ocr-service dev
```

### Manual Model Management (Ollama)

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull a model manually (if needed)
docker exec pricey-ollama ollama pull moondream

# Remove unused models to save space
docker exec pricey-ollama ollama rm llama3.2-vision
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
import { createReceiptParser } from './parsers/parser-factory';

const parser = createReceiptParser();
const isHealthy = await parser.healthCheck();
```

### Parse Receipt Image

```typescript
import { createReceiptParser } from './parsers/parser-factory';
import fs from 'fs';

const parser = createReceiptParser();

// Read receipt image
const imageBuffer = fs.readFileSync('receipt.jpg');

// Parse directly from image (no OCR needed)
const result = await parser.parse(imageBuffer);

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

console.log(result);
// {
// storeName: "Walmart",
// date: "2025-10-27",
// items: [
// { name: "Milk", price: 3.99, quantity: 1 },
// { name: "Bread", price: 2.49, quantity: 2 }
// ],
// total: 8.97,
// currency: "USD",
// confidence: 0.95
// }

````

## Performance Considerations

### Memory Requirements (Ollama)

| Model            | RAM Required | GPU Required | Vision |
| ---------------- | ------------ | ------------ | ------ |
| moondream        | 3-4GB        | No           | ✅ Yes |
| llava            | 6-8GB        | No           | ✅ Yes |
| llama3.2-vision  | 10-12GB      | No           | ✅ Yes |

**Note:** GPU acceleration is optional but provides 5-10x speed improvement.

### Response Times

**Ollama (CPU-only):**

- **moondream**: 5-10 seconds
- **llava**: 10-20 seconds
- **llama3.2-vision**: 15-30 seconds

**Ollama (with GPU):**

- **moondream**: 2-3 seconds
- **llava**: 3-5 seconds
- **llama3.2-vision**: 4-8 seconds

**GitHub Models:**

- **gpt-5-mini**: 2-4 seconds (cloud)
- **claude-sonnet-4.5**: 2-4 seconds (cloud)
- **claude-opus-4.1**: 3-6 seconds (cloud)

### Enabling GPU Support (Optional, Ollama only)

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
````

3. Restart services:

   ```bash
   pnpm docker:dev:down
   pnpm docker:dev
   ```

For Mac users, see [Mac Ollama Acceleration Guide](./mac-ollama-acceleration.md) for 10-20x speedup using Metal GPU.

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
