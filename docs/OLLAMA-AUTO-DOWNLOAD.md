# Automatic LLM Model Download in Docker

**Date:** October 27, 2025
**Status:** ✅ Implemented

## Summary

The Ollama Docker container now **automatically downloads the LLM model** on startup. No manual setup script needed!

## What Changed

### 1. Automatic Model Download

- Created `docker/ollama-entrypoint.sh` script
- Modified `docker-compose.yml` to use custom entrypoint
- Model is configured via `OLLAMA_MODEL` environment variable

### 2. Configuration

Set your preferred model in `.env`:

```bash
# Model to auto-download (options: llama3.2:1b, llama3.2:3b, mistral:7b, phi3:mini)
OLLAMA_MODEL=llama3.2:3b
```

### 3. Updated Setup Process

**Before:**

```bash
pnpm docker:dev
./scripts/setup-ollama.sh  # Manual step
pnpm dev
```

**After:**

```bash
pnpm docker:dev  # Model downloads automatically!
pnpm dev
```

## How It Works

1. **Docker starts** → Ollama container launches
2. **Entrypoint script runs** → Checks if model exists
3. **Auto-download** → Pulls model if not present (or if changed)
4. **Ready to use** → Service is ready for parsing

### First Start

- Model download happens automatically (1-4GB, 2-5 minutes)
- Progress shown in Docker logs: `docker logs -f pricey-ollama`

### Subsequent Starts

- Model cached in Docker volume
- Instant startup (skip download if model exists)

## Features

✅ **Zero manual steps** - Just start Docker
✅ **Configurable** - Change model via environment variable
✅ **Smart caching** - Only downloads if model is missing
✅ **Progress feedback** - Shows download status in logs
✅ **Graceful handling** - Server starts even if download fails

## Configuration Options

### Available Models

Set `OLLAMA_MODEL` to any of these:

| Model         | Size | Speed     | Best For                       |
| ------------- | ---- | --------- | ------------------------------ |
| `llama3.2:1b` | 1GB  | Very Fast | Low-resource systems           |
| `llama3.2:3b` | 2GB  | Fast      | **Development (default)**      |
| `mistral:7b`  | 4GB  | Moderate  | **Production (best accuracy)** |
| `phi3:mini`   | 2GB  | Fast      | Compact deployments            |

### Switching Models

1. Update `.env`:

   ```bash
   OLLAMA_MODEL=mistral:7b
   LLM_MODEL=mistral:7b  # Keep in sync for app config
   ```

2. Restart Docker:

   ```bash
   pnpm docker:dev:down
   pnpm docker:dev
   ```

New model downloads automatically!

## Docker Compose Configuration

```yaml
ollama:
  image: ollama/ollama:latest
  volumes:
    - ollama_data:/root/.ollama # Model cache
    - ./docker/ollama-entrypoint.sh:/entrypoint.sh # Custom script
  environment:
    OLLAMA_MODEL: ${OLLAMA_MODEL:-llama3.2:3b} # Auto-pull this model
  entrypoint: ['/bin/bash', '/entrypoint.sh'] # Custom startup
  healthcheck:
    start_period: 120s # Allow time for model download
```

## Entrypoint Script Features

The `docker/ollama-entrypoint.sh` script:

1. ✅ Starts Ollama server in background
2. ✅ Waits for server to be ready
3. ✅ Checks if `OLLAMA_MODEL` is set
4. ✅ Checks if model already exists
5. ✅ Downloads model if missing
6. ✅ Lists available models
7. ✅ Keeps container running

## Monitoring Download Progress

Watch the download in real-time:

```bash
# Follow Ollama container logs
docker logs -f pricey-ollama
```

You'll see:

```text
🚀 Starting Ollama server...
⏳ Waiting for Ollama server to be ready...
✅ Ollama server is ready!
📥 Pulling model 'llama3.2:3b'...
   This may take a few minutes on first run...
✅ Model 'llama3.2:3b' downloaded successfully!
🎉 Ollama is ready and serving on port 11434

📋 Available models:
NAME             ID              SIZE    MODIFIED
llama3.2:3b      abc123def456    1.9 GB  2 minutes ago
```

## Benefits

### Developer Experience

- ⚡ **Faster onboarding** - One command to start everything
- 🎯 **Less confusion** - No separate setup scripts
- 🔄 **Easy switching** - Just change env var and restart

### Operations

- 📦 **Containerized** - All dependencies in Docker
- 🔐 **Reproducible** - Same setup everywhere
- 💾 **Efficient caching** - Model downloaded once, reused forever

### Flexibility

- 🎛️ **Configurable** - Choose any supported model
- 🚀 **Version control** - Lock model version in `.env`
- 🧪 **Easy testing** - Quickly switch models for comparison

## Files Changed

### Created

- `docker/ollama-entrypoint.sh` (48 lines)

### Modified

- `docker-compose.yml` (added entrypoint, env vars, start_period)
- `.env.example` (added `OLLAMA_MODEL` configuration)
- `docs/guides/LLM-QUICKSTART.md` (updated setup steps)
- `docs/guides/llm-receipt-parsing.md` (updated configuration)
- `README.md` (removed manual setup step)

### Deprecated (No Longer Needed)

- `scripts/setup-ollama.sh` - Can be removed or kept for manual use

## Troubleshooting

### Model not downloading?

```bash
# Check logs
docker logs pricey-ollama

# Verify environment variable
docker exec pricey-ollama env | grep OLLAMA_MODEL

# Manually pull if needed
docker exec pricey-ollama ollama pull llama3.2:3b
```

### Wrong model downloaded?

```bash
# Update .env
OLLAMA_MODEL=mistral:7b

# Remove old container and restart
pnpm docker:dev:down
pnpm docker:dev
```

### Download interrupted?

Just restart - the script will resume/retry:

```bash
docker restart pricey-ollama
```

## Testing

Test the automatic download:

```bash
# 1. Clean slate (remove existing volume)
docker volume rm pricey_ollama_data

# 2. Set model in .env
echo "OLLAMA_MODEL=llama3.2:3b" >> .env

# 3. Start services and watch logs
docker-compose up ollama

# You should see automatic download progress
```

## Future Enhancements

- [ ] Parallel model downloads for faster startup
- [ ] Model verification (checksum validation)
- [ ] Automatic model updates when new versions available
- [ ] Pre-warming model (load into memory on startup)
- [ ] Support for multiple models simultaneously

## Migration Guide

For existing installations:

1. **Pull latest code** with entrypoint script
2. **Add to .env**: `OLLAMA_MODEL=llama3.2:3b`
3. **Restart Docker**: `pnpm docker:dev:down && pnpm docker:dev`
4. **Done!** Model downloads automatically

Existing models in the Docker volume are preserved.

---

**Result:** LLM setup is now fully automated and production-ready! 🎉
