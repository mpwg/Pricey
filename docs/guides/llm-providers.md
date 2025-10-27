# LLM Provider Configuration Guide

Pricey supports multiple LLM providers for receipt parsing. Choose the provider that best fits your needs.

## Available Providers

### 1. Ollama (Local, Self-Hosted)

**Best for:** Privacy, no API costs, offline use

**Pros:**

- Free, unlimited use
- Runs locally (no data leaves your machine)
- Works offline
- No API keys needed

**Cons:**

- Slower than cloud APIs (unless using GPU)
- Requires local setup
- Limited to available models

**Setup:**

```bash
# Mac (with GPU acceleration - 10-20x faster!)
brew install ollama
ollama serve --host 0.0.0.0:10000

# Pull a vision model
ollama pull llava
```

**Configuration (.env.local):**

```bash
LLM_PROVIDER="ollama"
LLM_BASE_URL="http://localhost:10000"  # or 11434 for Docker
LLM_MODEL="llava"  # or llama3.2-vision:11b, moondream
```

---

### 2. GitHub Models (Cloud, via Copilot)

**Best for:** GitHub Copilot users, high accuracy, low latency

**Pros:**

- Uses GPT-4o (state-of-the-art vision model)
- Fast inference
- Included with GitHub Copilot subscription
- No additional cost

**Cons:**

- Requires GitHub Copilot subscription
- Requires internet connection
- Data sent to GitHub/OpenAI

**Setup:**

1. Get your GitHub token from: https://github.com/settings/tokens
2. No special scopes needed (uses your Copilot subscription)
3. Add to `.env.local`

**Configuration (.env.local):**

```bash
LLM_PROVIDER="github"
GITHUB_TOKEN="ghp_your_token_here"
GITHUB_MODEL="gpt-4o"  # or gpt-4o-mini for faster/cheaper
```

---

### 3. OpenAI (Cloud, Direct API)

**Status:** Coming soon

**Best for:** High accuracy, no GitHub account

**Setup:** TBD

---

### 4. Claude (Anthropic)

**Status:** Coming soon

**Best for:** High accuracy, alternative to OpenAI

**Setup:** TBD

---

## Quick Start

### Option A: Use GitHub Models (Easiest, Best Quality)

```bash
# 1. Get your GitHub token
# Visit: https://github.com/settings/tokens
# Click "Generate new token (classic)"
# No scopes needed - just create it

# 2. Configure
echo 'LLM_PROVIDER="github"' >> .env.local
echo 'GITHUB_TOKEN="ghp_YOUR_TOKEN"' >> .env.local
echo 'GITHUB_MODEL="gpt-4o"' >> .env.local

# 3. Start services
pnpm dev
```

### Option B: Use Local Ollama (Privacy, Free)

```bash
# 1. Install Ollama
brew install ollama

# 2. Start Ollama with GPU acceleration
ollama serve --host 0.0.0.0:10000

# 3. Pull a vision model (in another terminal)
ollama pull llava

# 4. Configure
echo 'LLM_PROVIDER="ollama"' >> .env.local
echo 'LLM_BASE_URL="http://localhost:10000"' >> .env.local
echo 'LLM_MODEL="llava"' >> .env.local

# 5. Start services
pnpm dev
```

---

## Model Comparison

| Provider   | Model            | Speed                  | Accuracy           | Cost              | Privacy  |
| ---------- | ---------------- | ---------------------- | ------------------ | ----------------- | -------- |
| **GitHub** | GPT-4o           | ⚡️⚡️⚡️ Fast         | 🎯🎯🎯🎯 Excellent | Free with Copilot | ⚠️ Cloud |
| **GitHub** | GPT-4o-mini      | ⚡️⚡️⚡️⚡️ Very Fast | 🎯🎯🎯 Good        | Free with Copilot | ⚠️ Cloud |
| **Ollama** | LLaVA            | ⚡️⚡️ Medium          | 🎯🎯 Fair          | Free              | ✅ Local |
| **Ollama** | Llama 3.2 Vision | ⚡️ Slow               | 🎯🎯🎯 Good        | Free              | ✅ Local |

---

## Adding a New Provider

To add support for a new LLM provider (e.g., Claude, Gemini, etc.):

1. Create a new parser class implementing `IReceiptParser`:

```typescript
// apps/ocr-service/src/parsers/my-provider-parser.ts
import {
  IReceiptParser,
  ReceiptData,
  buildStandardPrompt,
} from './base-receipt-parser.js';

export class MyProviderParser implements IReceiptParser {
  async parse(imageBuffer: Buffer): Promise<ReceiptData> {
    // Implement your provider's API call
  }

  async healthCheck(): Promise<boolean> {
    // Check if service is available
  }
}
```

2. Add your provider to the factory:

```typescript
// apps/ocr-service/src/parsers/parser-factory.ts
case 'myprovider':
  return new MyProviderParser();
```

3. Update the environment schema:

```typescript
// apps/ocr-service/src/config/env.ts
LLM_PROVIDER: z.enum(['ollama', 'github', 'myprovider']).default('ollama'),
```

4. Add configuration to `.env.example`

5. Document in this README

---

## Troubleshooting

### GitHub Models

**Error: "Unauthorized"**

- Check your GitHub token is valid
- Ensure you have an active Copilot subscription
- Token should start with `ghp_`

**Error: "Rate limit exceeded"**

- GitHub Models has rate limits
- Try switching to Ollama temporarily

### Ollama

**Error: "Connection refused"**

- Ensure Ollama is running: `ollama serve --host 0.0.0.0:10000`
- Check the port matches LLM_BASE_URL

**Error: "Model not found"**

- Pull the model first: `ollama pull llava`
- Check model name matches LLM_MODEL

**Slow inference**

- Use Mac's local Ollama with GPU (not Docker)
- Try a smaller model: `llava` instead of `llama3.2-vision:11b`

---

## Performance Tips

1. **GitHub Models:** Already optimized, no action needed
2. **Ollama on Mac:** Use `ollama serve` directly (not via Docker) for 10-20x speedup with GPU
3. **Ollama on Linux:** Install CUDA drivers for GPU acceleration
4. **Model Size:** Smaller models = faster, but less accurate

---

## Privacy & Security

- **Ollama:** All data stays local, no internet required
- **GitHub Models:** Data sent to GitHub/OpenAI (see [GitHub Models Privacy](https://docs.github.com/en/github-models/prototyping-with-ai-models#privacy))
- **OpenAI Direct:** Data sent to OpenAI (see [OpenAI Privacy](https://openai.com/policies/privacy-policy))

For maximum privacy, use Ollama locally.
