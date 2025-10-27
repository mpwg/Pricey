# Integration Tests with GitHub Models (Copilot)

This directory contains integration tests that verify the receipt processing pipeline using **real images** with **GitHub Models** (accessible through GitHub Copilot).

## Overview

The integration tests (`receipt-processor.integration.test.ts`) verify:

- Real receipt image processing with vision LLM
- Item extraction accuracy
- Store name and date parsing
- Total calculation and validation
- Error handling for invalid/empty images

## Running Integration Tests

### Prerequisites

To run these tests with real GitHub Models API calls, you need:

1. **GitHub Copilot subscription** (Individual or Business)
2. **GitHub Personal Access Token** with Copilot access

### Getting Your GitHub Token

1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Generate new token (classic)"
3. Select scopes:
   - ✅ `read:user`
   - ✅ Your Copilot subscription automatically grants API access
4. Copy the token (starts with `ghp_`)

### Running Tests

#### Option 1: Set Environment Variable (Recommended)

```bash
# Set token for this session
export GITHUB_TOKEN="ghp_your_token_here"

# Run integration tests
cd apps/ocr-service
pnpm test src/processors/receipt-processor.integration.test.ts
```

#### Option 2: Add to .env.local

```bash
# In root .env.local file
GITHUB_TOKEN="ghp_your_token_here"
GITHUB_MODEL="gpt-5-mini"  # or gpt-4o, claude-sonnet-4.5, etc.
```

Then run:

```bash
cd apps/ocr-service
pnpm test src/processors/receipt-processor.integration.test.ts
```

#### Option 3: Inline Token (Not recommended for security)

```bash
GITHUB_TOKEN="ghp_your_token_here" pnpm test src/processors/receipt-processor.integration.test.ts
```

### Without GitHub Token

If you don't have a GitHub token, the tests will **gracefully skip** with a warning:

```
⚠️  GITHUB_TOKEN not set - integration tests will use mock responses
✓ should process receipt image using GitHub Models (Copilot) (skipped)
```

This allows the test suite to pass in CI/CD without requiring tokens.

## Test Structure

### Test Files

- `receipt-processor.integration.test.ts` - Main integration test with real images
- Sample receipt: `../../samples/Rechung_1.png` (291 KB)

### What Gets Tested

1. **Image Loading**: Verifies receipt image loads correctly
2. **Vision LLM Processing**: Uses GitHub Models to analyze the image
3. **Data Extraction**:
   - Store name extraction
   - Purchase date parsing
   - Item list with names, prices, quantities
   - Total amount
4. **Confidence Scoring**: Verifies LLM confidence is within 0-1 range
5. **Total Validation**: Checks extracted total vs. calculated total (±10%)
6. **Error Handling**:
   - Invalid image data
   - Empty buffers

### Expected Behavior

✅ **With GITHUB_TOKEN**:

- Tests run against real GitHub Models API
- Actual receipt parsing with LLM vision model
- ~90 second timeout for API calls
- Detailed assertions on extracted data

❌ **Without GITHUB_TOKEN**:

- Tests skip gracefully
- No API calls made
- Suite passes to allow CI/CD

## Debugging

### Enable Debug Logging

The test automatically logs:

- Image size loaded
- Processing results (store, items, totals)
- Item-by-item details
- Total difference calculations

To see logs, check test output for structured data.

### Common Issues

**Issue**: Tests skip even with token set

```bash
# Check token is actually exported
echo $GITHUB_TOKEN
# Should print: ghp_...

# Verify length
echo ${#GITHUB_TOKEN}
# Should be > 20 characters
```

**Issue**: API timeout

- Increase timeout in test (default: 90s)
- Check internet connection
- Verify GitHub token permissions

**Issue**: No items extracted

- Check sample image exists: `../../samples/Rechung_1.png`
- Verify image is a valid receipt
- Try different GITHUB_MODEL (e.g., `gpt-4o` instead of `gpt-5-mini`)

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Run Integration Tests
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    cd apps/ocr-service
    pnpm test src/processors/receipt-processor.integration.test.ts
```

The GitHub Actions `GITHUB_TOKEN` is automatically available and has Copilot access if the repository has Copilot enabled.

## Performance

Typical execution times:

- **With GitHub token**: 5-15 seconds per test (actual API call)
- **Without token**: <1ms (immediate skip)

## Security Notes

⚠️ **Never commit GitHub tokens to git!**

- Use environment variables
- Add `.env.local` to `.gitignore`
- Rotate tokens regularly
- Use fine-grained tokens when possible

## Further Reading

- [GitHub Models Documentation](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-with-models)
- [Pricey LLM Provider Guide](../../../../docs/guides/llm-providers.md)
- [Pricey Architecture](../../../../docs/architecture.md)
