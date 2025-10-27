# Using GitHub Models with Your Copilot Subscription

Since your local Ollama LLM isn't working well, you can use GitHub Models (GPT-4o) with your GitHub Copilot subscription. This is often better quality and faster.

## Quick Setup

### Step 1: Get Your GitHub Token

1. Go to: <https://github.com/settings/tokens>
2. Click "Generate new token (classic)"
3. Give it a name like "Pricey OCR"
4. **No scopes needed** - just create the token
5. Copy the token (starts with `ghp_`)

### Step 2: Configure Pricey

Add these lines to your `.env.local` file:

```bash
LLM_PROVIDER="github"
GITHUB_TOKEN="ghp_YOUR_TOKEN_HERE"
GITHUB_MODEL="gpt-4o"
```

### Step 3: Restart the OCR Service

```bash
pnpm --filter @pricey/ocr-service dev
```

That's it! Now your receipts will be processed using GPT-4o vision model.

## Why This Is Better

✅ **Better accuracy** - GPT-4o has excellent vision capabilities
✅ **Faster** - Cloud-hosted, no local GPU needed  
✅ **No setup** - No Ollama installation or model downloads
✅ **Free** - Included with your Copilot subscription
✅ **Works immediately** - No troubleshooting local models

## Switch Back to Ollama Later

If you get Ollama working properly, just change:

```bash
LLM_PROVIDER="ollama"
```

The architecture now supports any LLM provider, so you can easily switch between them.

## Full Documentation

See `docs/guides/llm-providers.md` for complete guide on all supported providers.
