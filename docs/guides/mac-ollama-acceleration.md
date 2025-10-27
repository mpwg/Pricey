# Using Mac's Accelerated Ollama (GPU/Neural Engine)

For **significantly faster** receipt processing on macOS, you can use your Mac's local Ollama with GPU/Neural Engine acceleration instead of the Docker container.

> **Note**: If you're using [Msty](https://msty.app) or another Ollama GUI client, it may already be running Ollama for you!

## Performance Comparison

- **Docker Ollama**: ~40-60 seconds per receipt (no acceleration)
- **Mac Ollama**: ~2-5 seconds per receipt (with GPU/Neural Engine) ⚡

## Setup Instructions

### Option A: Using Msty (GUI Client)

If you're already using [Msty](https://msty.app), Ollama is likely already running! Msty typically runs on port `11434`.

1. **Check if Msty is running**: Open Msty app
2. **Verify the model**: Make sure `llava` is installed in Msty
3. **Update your environment**:

Create or edit `apps/ocr-service/.env.local`:

```bash
# Msty typically uses the default Ollama port
LLM_BASE_URL=http://localhost:11434
LLM_MODEL=llava
```

4. **Restart your dev server**: `pnpm dev`

That's it! Msty handles the Ollama server for you with GPU acceleration.

### Option B: Standalone Ollama Installation

### 1. Install Ollama on Your Mac

```bash
brew install ollama
```

### 2. Pull the Vision Model

```bash
ollama pull llava
```

Recommended models for Mac:

- `llava` - Best balance (4.7GB)
- `llama3.2-vision:11b` - More accurate but larger (11GB)
- `moondream` - Smallest, fastest (1.7GB)

### 3. Start Ollama on Port 10000

**Option A: Using the helper script (recommended)**

```bash
pnpm ollama:mac
```

**Option B: Manually**

```bash
OLLAMA_HOST=0.0.0.0:10000 ollama serve
```

### 4. Update Your Environment

Create or edit `apps/ocr-service/.env.local`:

```bash
# Use Mac's accelerated Ollama
LLM_BASE_URL=http://localhost:10000
LLM_MODEL=llava
```

### 5. Restart Your Dev Server

```bash
pnpm dev
```

## Switching Back to Docker

To switch back to the Docker Ollama container:

1. Stop the Mac Ollama server (Ctrl+C)
2. Remove or comment out `LLM_BASE_URL` in `.env.local`
3. The default `http://localhost:11434` will be used

## Port Reference

- **11434**: Docker Ollama container (slow, no acceleration)
- **10000**: Mac's local Ollama (fast, with GPU/Neural Engine)

## Troubleshooting

### Port Already in Use

If port 10000 is already in use, you can choose a different port:

```bash
# Use port 10001 instead
OLLAMA_HOST=0.0.0.0:10001 ollama serve
```

Then update `.env.local`:

```bash
LLM_BASE_URL=http://localhost:10001
```

### Model Not Found

If you get "model not found" errors:

```bash
ollama pull llava
```

### Check Running Status

```bash
# List available models
ollama list

# Test the API
curl http://localhost:10000/api/tags
```

## Performance Tips

1. **Close other apps**: Free up RAM and GPU resources
2. **Use smaller models for dev**: `moondream` is faster for quick testing
3. **Keep model loaded**: First request is slower (model loading), subsequent requests are fast
4. **Monitor Activity Monitor**: Check if GPU is being utilized

## Technical Details

The Mac's Ollama uses:

- **Apple Silicon**: Neural Engine + GPU acceleration
- **Intel Macs**: GPU acceleration via Metal
- **Unified Memory**: Faster model loading and inference

This provides 10-20x faster inference compared to CPU-only Docker containers.
