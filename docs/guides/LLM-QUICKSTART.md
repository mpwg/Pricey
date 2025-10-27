# LLM-Based Receipt Parsing - Quick Start

This guide helps you get started with the new LLM-based receipt parser in Pricey.

## What Changed?

Pricey now uses **LLMs (Large Language Models)** instead of regex patterns to parse receipt text. This provides:

✅ **Better accuracy** (85-95% vs. 60-70%)
✅ **Handles any receipt layout**
✅ **No manual template maintenance**
✅ **Multilingual support**
✅ **Self-hosted (privacy-first)**

## Quick Setup (3 minutes)

### 1. Configure Model (Optional)

The default model is `llama3.2:3b`. To use a different model, set it in your `.env`:

```bash
# Copy example file
cp .env.example .env

# Edit .env and set your preferred model
OLLAMA_MODEL=llama3.2:3b  # or mistral:7b, llama3.2:1b, phi3:mini
```

### 2. Start Infrastructure

```bash
# Start Docker services (PostgreSQL, Redis, MinIO, Ollama)
# The model will be automatically downloaded on first start
pnpm docker:dev
```

The Ollama container will automatically:

- ✅ Start the Ollama server
- ✅ Download the model specified in `OLLAMA_MODEL`
- ✅ Be ready to parse receipts

**First start** may take 2-5 minutes to download the model (1-4GB).

### 3. Start Services

```bash
# Start OCR service
pnpm --filter @pricey/ocr-service dev

# Or start all services
pnpm dev
```

## Test It

Upload a receipt via the API:

```bash
curl -X POST http://localhost:3001/api/receipts/upload \
  -F "receipt=@path/to/receipt.jpg"
```

The response will include parsed data:

```json
{
  "storeName": "Walmart",
  "date": "2025-10-27",
  "items": [
    { "name": "Milk", "price": 3.99, "quantity": 1 },
    { "name": "Bread", "price": 2.49, "quantity": 2 }
  ],
  "total": 8.97,
  "confidence": 0.95
}
```

## Switch Models

Want better accuracy? Use Mistral 7B:

```bash
# 1. Update .env
OLLAMA_MODEL=mistral:7b

# 2. Restart Docker services
pnpm docker:dev:down
pnpm docker:dev
```

The new model will be automatically downloaded on startup.

### Manual Model Management

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull a specific model manually
docker exec pricey-ollama ollama pull phi3:mini

# Remove a model to save space
docker exec pricey-ollama ollama rm llama3.2:1b
```

## Available Models

| Model         | Size | Speed     | Best For                           |
| ------------- | ---- | --------- | ---------------------------------- |
| `llama3.2:1b` | 1GB  | Very Fast | Low-resource systems               |
| `llama3.2:3b` | 2GB  | Fast      | **Recommended for development**    |
| `mistral:7b`  | 4GB  | Moderate  | **Production use (best accuracy)** |
| `phi3:mini`   | 2GB  | Fast      | Compact deployments                |

## Troubleshooting

### Ollama not responding

```bash
# Check if Ollama is running
docker ps | grep ollama

# Restart if needed
docker restart pricey-ollama

# Check logs
docker logs pricey-ollama
```

### Model not found

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull if missing
docker exec pricey-ollama ollama pull llama3.2:3b
```

### Parsing too slow

- Switch to `llama3.2:1b` for faster (but less accurate) parsing
- Enable GPU acceleration (requires NVIDIA GPU + Docker GPU support)
- Increase `LLM_TIMEOUT` if getting timeouts

## Full Documentation

See [docs/guides/llm-receipt-parsing.md](/docs/guides/llm-receipt-parsing.md) for:

- Architecture details
- Performance tuning
- GPU acceleration
- Advanced configuration
- API reference

---

**Questions?** Open an issue or check the [main docs](/docs/README.md).
