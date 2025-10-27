# LLM-Based Receipt Parsing - Quick Start

This guide helps you get started with vision-based LLM receipt parsing in Pricey.

## What Changed?

Pricey now uses **vision-capable LLMs** to directly analyze receipt images. This provides:

✅ **Better accuracy** (85-99% vs. 60-70%)
✅ **Vision-based** - Analyzes images directly (no OCR)
✅ **Multi-provider** - Switch between Ollama (local) and GitHub Models (cloud)
✅ **Handles any receipt layout**
✅ **No manual template maintenance**
✅ **Multilingual support**

## Quick Setup (2 options)

### Option A: GitHub Models (Fastest - 1 minute)

Best for GitHub Copilot users. Uses state-of-the-art models like GPT-5 mini or Claude Sonnet 4.5.

```bash
# 1. Get GitHub token from https://github.com/settings/tokens
# 2. Configure
echo 'LLM_PROVIDER="github"' >> .env.local
echo 'GITHUB_TOKEN="ghp_YOUR_TOKEN"' >> .env.local
echo 'GITHUB_MODEL="gpt-5-mini"' >> .env.local

# 3. Start services (no Docker needed for LLM)
pnpm dev
```

**Done!** No model downloads, ready in seconds.

### Option B: Ollama Local (Self-Hosted - 3 minutes)

Best for privacy and offline use.

#### 1. Configure Model (Optional)

The default model is `llava` (vision-capable). To use a different model, set it in your `.env`:

```bash
# Copy example file
cp .env.example .env

# Edit .env and set your preferred model
OLLAMA_MODEL=llava  # Default (recommended)
# Options: llava, llama3.2-vision, moondream
```

#### 2. Start Infrastructure

```bash
# Start Docker services (PostgreSQL, Redis, MinIO, Ollama)
# The model will be automatically downloaded on first start
pnpm docker:dev
```

The Ollama container will automatically:

- ✅ Start the Ollama server
- ✅ Download the vision model specified in `OLLAMA_MODEL`
- ✅ Be ready to parse receipt images

**First start** may take 2-5 minutes to download the model (1.7-7.9GB).

#### 3. Start Services

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

### GitHub Models

```bash
# Update .env.local
GITHUB_MODEL=claude-sonnet-4.5  # or gpt-5-mini, gemini-2.5-pro, claude-opus-4.1

# Restart service
pnpm --filter @pricey/ocr-service dev
```

### Ollama Models

Want better accuracy? Switch to a larger vision model:

```bash
# 1. Update .env
OLLAMA_MODEL=llama3.2-vision  # Or moondream for faster processing

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

### Ollama (Local)

| Model             | Size  | Speed     | Best For                |
| ----------------- | ----- | --------- | ----------------------- |
| `llava` (default) | 4.5GB | Fast      | Recommended for all use |
| `llama3.2-vision` | 7.9GB | Moderate  | Highest accuracy        |
| `moondream`       | 1.7GB | Very Fast | Low-resource systems    |

### GitHub Models (Cloud)

| Model               | Speed     | Best For                     |
| ------------------- | --------- | ---------------------------- |
| `gpt-5-mini`        | Very Fast | Recommended (balanced)       |
| `claude-sonnet-4.5` | Very Fast | Best coding model (Oct 2025) |
| `claude-opus-4.1`   | Moderate  | Highest accuracy             |
| `gemini-2.5-pro`    | Fast      | Scientific analysis          |

**Note:** GPT-4o was retired on October 23, 2025.

## Troubleshooting

### GitHub Models Issues

**Error: "Unauthorized"**

- Check your GitHub token is valid
- Ensure you have an active Copilot subscription
- Token should start with `ghp_`

**Error: "Rate limit exceeded"**

- GitHub Copilot has usage limits based on your plan
- Try switching to Ollama temporarily
- Consider using a different model

### Ollama Issues

**Ollama not responding**

```bash
# Check if Ollama is running
docker ps | grep ollama

# Restart if needed
docker restart pricey-ollama

# Check logs
docker logs pricey-ollama
```

**Model not found**

```bash
# List available models
docker exec pricey-ollama ollama list

# Pull if missing (for vision models)
docker exec pricey-ollama ollama pull llava
```

**Parsing too slow**

- Switch to `moondream` for faster (but less accurate) parsing
- Use GitHub Models for cloud-based speed (2-4 seconds)
- Enable GPU acceleration (Mac: see [Mac Ollama Acceleration Guide](./mac-ollama-acceleration.md))
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
