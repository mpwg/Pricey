# Using GitHub Models with Your Copilot Subscription

Use GitHub's latest AI models (GPT-5 mini, Claude Sonnet 4.5) with your GitHub Copilot subscription for fast, accurate receipt parsing.

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
GITHUB_MODEL="gpt-5-mini"  # or claude-sonnet-4.5, gemini-2.5-pro
```

### Step 3: Restart the OCR Service

```bash
pnpm --filter @pricey/ocr-service dev
```

That's it! Now your receipts will be processed using state-of-the-art vision models.

## Available Models

- **gpt-5-mini** (recommended) - Fast, accurate, with vision support
- **claude-sonnet-4.5** - Best coding model (Oct 2025), excellent for receipts
- **claude-opus-4.1** - Highest accuracy, deeper reasoning
- **gemini-2.5-pro** - Great for complex analysis
- **gpt-5-codex** - Optimized for structured data extraction

## Why This Is Better

✅ **State-of-the-art accuracy** - Latest models (GPT-5, Claude 4.5)
✅ **Faster** - Cloud-hosted, 2-4 seconds per receipt
✅ **No setup** - No Ollama installation or model downloads
✅ **Free** - Included with your Copilot subscription
✅ **Works immediately** - No troubleshooting local models
✅ **Vision support** - Direct image analysis

## Switch Back to Ollama Later

If you prefer local processing, just change:

```bash
LLM_PROVIDER="ollama"
```

The architecture supports any LLM provider, so you can easily switch between them.

## Full Documentation

See `docs/guides/llm-providers.md` for complete guide on all supported providers.

**Note:** GPT-4o was retired on October 23, 2025. Use GPT-5 mini or Claude Sonnet 4.5 instead.
