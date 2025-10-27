# Docker Ollama Configuration (Optional)

> **Learn how to enable or disable the optional Ollama Docker container**

## Overview

As of the latest version, the Ollama Docker container is **optional** and **disabled by default**. This change was made because:

1. **GitHub Models** provide a faster, zero-setup alternative for cloud-based LLM parsing
2. **Mac users** can use local Ollama with GPU acceleration (10-20x faster than Docker)
3. **Docker Ollama** runs on CPU only, making it slower and more resource-intensive

## Why Is Docker Ollama Optional?

### Recommended Alternatives

| Option                 | Speed        | Setup Required | Privacy | Cost        |
| ---------------------- | ------------ | -------------- | ------- | ----------- |
| **GitHub Models**      | Very Fast    | Token only     | Cloud   | Free (Beta) |
| **Mac Local Ollama**   | Fast (GPU)   | Homebrew       | Local   | Free        |
| **Docker Ollama**      | Slow (CPU)   | Docker         | Local   | Free        |
| **Linux Local Ollama** | Fast (GPU\*) | Package mgr    | Local   | Free        |

\*Requires NVIDIA GPU

### When to Use Docker Ollama

Use Docker Ollama if you:

- ✅ Don't have access to GitHub Models
- ✅ Need complete privacy (no cloud API calls)
- ✅ Can't install Ollama natively on your system
- ✅ Are okay with slower processing times (10-30 seconds per receipt)
- ✅ Have sufficient system memory (8GB+ recommended)

**Don't use Docker Ollama if you:**

- ❌ Are on a Mac (use local Ollama with GPU acceleration instead)
- ❌ Want fast processing times (use GitHub Models instead)
- ❌ Have limited system resources

## Enabling Docker Ollama

### Method 1: Using pnpm Scripts (Recommended)

```bash
# Start all infrastructure INCLUDING Ollama
pnpm docker:dev:ollama

# Stop all infrastructure including Ollama
pnpm docker:dev:ollama:down
```

### Method 2: Using Docker Compose Profiles

```bash
# Start with Ollama profile
docker-compose --profile ollama up -d

# Stop services with Ollama profile
docker-compose --profile ollama down
```

### Method 3: Setting Environment Variable

Add to your `.env.local`:

```bash
COMPOSE_PROFILES=ollama
```

Then use normal commands:

```bash
pnpm docker:dev     # Will now include Ollama
pnpm docker:dev:down
```

## Configuration

### Automatic Model Download

By default, Docker Ollama will **not** automatically download any models. To enable auto-download, set the `OLLAMA_MODEL` environment variable in `.env.local`:

```bash
# Enable auto-download of LLaVA vision model
OLLAMA_MODEL="llava"

# Or use a different model
OLLAMA_MODEL="llama3.2-vision:11b"
OLLAMA_MODEL="moondream"

# Disable auto-download (default)
OLLAMA_MODEL=""
```

**Available Vision Models:**

- `llava` - General-purpose vision model (default, ~4.5GB)
- `llama3.2-vision:11b` - Larger, more accurate (11GB)
- `llama3.2-vision:90b` - Highest accuracy (90GB, requires 64GB+ RAM)
- `moondream` - Lightweight vision model (~2GB)

### Memory Limits

The Docker Ollama service is configured with an 8GB memory limit by default. Adjust in `docker-compose.yml`:

```yaml
ollama:
  deploy:
    resources:
      limits:
        memory: 8G # Adjust based on your system
```

### GPU Support (NVIDIA only)

If you have an NVIDIA GPU, uncomment the GPU configuration in `docker-compose.yml`:

```yaml
ollama:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

Then install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html).

## Connecting to Docker Ollama

Once enabled, Docker Ollama is available at:

- **Endpoint**: `http://localhost:11434`
- **Health Check**: `curl http://localhost:11434/api/tags`

Configure your application to use it:

```bash
# In .env.local
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:11434"
LLM_MODEL="llava"
```

## Disabling Docker Ollama

### Method 1: Stop and Remove Container

```bash
docker-compose --profile ollama down
# or
pnpm docker:dev:ollama:down
```

### Method 2: Remove from Environment

Remove or comment out in `.env.local`:

```bash
# COMPOSE_PROFILES=ollama
OLLAMA_MODEL=""  # Disable auto-download
```

Then restart services:

```bash
pnpm docker:dev
```

## Troubleshooting

### Ollama Container Won't Start

**Problem**: Container exits immediately or fails health check.

**Solution**:

1. Check logs: `docker logs pricey-ollama`
2. Increase memory limit in `docker-compose.yml`
3. Ensure port 11434 is not already in use: `lsof -i :11434`

### Model Download Fails

**Problem**: Auto-download of model fails or times out.

**Solution**:

1. Pull manually inside container:

   ```bash
   docker exec -it pricey-ollama ollama pull llava
   ```

2. Check available disk space: `docker system df`
3. Increase Docker's disk space allocation in Docker Desktop settings

### Slow Performance

**Problem**: Receipt processing takes 20-30+ seconds.

**Solution**:

- **Mac users**: Switch to local Ollama with GPU acceleration (see [Mac Ollama Acceleration Guide](mac-ollama-acceleration.md))
- **Linux users with NVIDIA GPU**: Enable GPU support (see above)
- **Others**: Consider using GitHub Models for faster processing

### High Memory Usage

**Problem**: System runs out of memory when Docker Ollama is running.

**Solution**:

1. Reduce memory limit in `docker-compose.yml` (e.g., `4G`)
2. Use a smaller model: `OLLAMA_MODEL="moondream"`
3. Close other applications
4. Switch to GitHub Models (cloud-based, no local memory usage)

## Migrating from Always-On to Optional

If you're upgrading from a version where Ollama was always enabled:

### Step 1: Update .env.local

```bash
# Set model to empty to disable auto-download
OLLAMA_MODEL=""

# Or keep it to enable auto-download when container is started
OLLAMA_MODEL="llava"
```

### Step 2: Decide Your LLM Strategy

Choose one of:

**Option A: GitHub Models (Recommended for getting started)**

```bash
LLM_PROVIDER="github"
GITHUB_TOKEN="ghp_your_token_here"
GITHUB_MODEL="gpt-5-mini"
```

**Option B: Local Ollama (Mac users)**

```bash
brew install ollama
ollama serve --host 0.0.0.0:10000 &

# In .env.local:
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:10000"
LLM_MODEL="llava"
```

**Option C: Docker Ollama (fallback)**

```bash
pnpm docker:dev:ollama

# In .env.local:
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:11434"
LLM_MODEL="llava"
OLLAMA_MODEL="llava"  # Enable auto-download
```

### Step 3: Restart Services

```bash
# Stop all services
pnpm docker:dev:down

# Start without Ollama (if using GitHub Models or local Ollama)
pnpm docker:dev

# OR start with Ollama (if using Docker Ollama)
pnpm docker:dev:ollama
```

## Related Guides

- [LLM Quick Start Guide](LLM-QUICKSTART.md) - Overview of all LLM provider options
- [GitHub Models Quick Start](github-models-quickstart.md) - Set up GitHub Models in 2 minutes
- [Mac Ollama Acceleration Guide](mac-ollama-acceleration.md) - 10-20x faster local processing
- [LLM Providers Guide](llm-providers.md) - Detailed comparison of all providers

## FAQ

### Q: Will my existing setup break after this change?

**A**: No. If you had Ollama running before, you can enable it with `pnpm docker:dev:ollama`. Your environment variables will continue to work.

### Q: Is Docker Ollama going to be removed completely?

**A**: No. It remains available as an option for users who need it. It's just not started by default anymore.

### Q: What's the recommended LLM provider for production?

**A**: For production deployments:

- **Self-hosted**: Use local Ollama on a dedicated server with GPU
- **Cloud**: Use GitHub Models (free during beta) or OpenAI (paid, more reliable)
- **Hybrid**: Start with GitHub Models, migrate to self-hosted when volume increases

### Q: Can I run multiple LLM providers simultaneously?

**A**: Yes, but only one provider is used at a time. The `LLM_PROVIDER` environment variable determines which one. You can switch between providers by changing this variable and restarting the service.

---

**Last Updated**: January 2025  
**Related PRs**: #XX (Make Ollama Docker optional)
