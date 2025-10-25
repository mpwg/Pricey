# Testing in Pricy

> **⚠️ MANDATORY**: All new implementations MUST include comprehensive unit tests.

## Overview

Pricy uses **Vitest** as its primary testing framework across all packages. This document provides a quick reference for running and writing tests.

For comprehensive testing guidelines, see [Testing Mandate](./.github/instructions/testing-mandate.instructions.md).

## Quick Start

### Running Tests

```bash
# Run all tests across all packages
pnpm test

# Run tests in watch mode (auto-rerun on changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with visual UI
pnpm test:ui

# Run tests for a specific package
pnpm --filter @pricy/api-gateway test

# Run a specific test file
pnpm --filter @pricy/api-gateway test src/utils/file-validation.test.ts
```

### Writing Your First Test

1. **Create a test file** next to your source file:

   ```
   src/utils/
   ├── date-parser.ts
   └── date-parser.test.ts  # ← Co-located test file
   ```

2. **Write your tests**:

   ```typescript
   import { describe, it, expect } from 'vitest';
   import { parseDate } from './date-parser';

   describe('parseDate', () => {
     it('should parse ISO date format', () => {
       expect(parseDate('2024-01-15')).toEqual(new Date('2024-01-15'));
     });

     it('should return null for invalid dates', () => {
       expect(parseDate('not-a-date')).toBeNull();
     });
   });
   ```

3. **Run your tests**:
   ```bash
   pnpm test
   ```

## Testing Requirements

### Coverage Targets

| Package/App        | Minimum Coverage |
| ------------------ | ---------------- |
| `packages/*`       | 80%              |
| `apps/api-gateway` | 75%              |
| `apps/ocr-service` | 75%              |
| `apps/web`         | 70%              |

### What to Test

✅ **ALWAYS test:**

- Pure functions
- Validation schemas (Zod)
- API routes
- Business logic
- Error handling
- Edge cases

❌ **Don't test:**

- Third-party libraries
- Simple getters/setters
- Type definitions

## Testing Patterns

### Pattern 1: Pure Functions

```typescript
// src/utils/format.ts
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// src/utils/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('should format positive amounts', () => {
    expect(formatPrice(10.5)).toBe('$10.50');
  });

  it('should format zero', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });

  it('should handle negative amounts', () => {
    expect(formatPrice(-5.99)).toBe('$-5.99');
  });

  it('should round to two decimal places', () => {
    expect(formatPrice(10.999)).toBe('$11.00');
  });
});
```

### Pattern 2: Testing with Mocks

```typescript
// src/services/email.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './email';

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSendEmail: any;

  beforeEach(() => {
    mockSendEmail = vi.fn().mockResolvedValue({ success: true });
    emailService = new EmailService(mockSendEmail);
  });

  it('should send email with correct parameters', async () => {
    await emailService.sendWelcomeEmail('[email protected]');

    expect(mockSendEmail).toHaveBeenCalledWith({
      to: '[email protected]',
      subject: 'Welcome to Pricy',
      template: 'welcome',
    });
  });

  it('should handle email errors', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP Error'));

    await expect(
      emailService.sendWelcomeEmail('[email protected]')
    ).rejects.toThrow('SMTP Error');
  });
});
```

### Pattern 3: Testing Zod Schemas

```typescript
// src/schemas/user.test.ts
import { describe, it, expect } from 'vitest';
import { userSchema } from './user';

describe('userSchema', () => {
  it('should validate correct user data', () => {
    const validUser = {
      email: '[email protected]',
      name: 'John Doe',
      age: 30,
    };

    const result = userSchema.safeParse(validUser);
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const invalidUser = {
      email: 'not-an-email',
      name: 'John Doe',
    };

    const result = userSchema.safeParse(invalidUser);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].path).toEqual(['email']);
    }
  });
});
```

### Pattern 4: Testing Fastify Routes

```typescript
// src/routes/health.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { build } from '../app';
import type { FastifyInstance } from 'fastify';

describe('Health Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = await build({ logger: false });
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 200 OK', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
    });
  });
});
```

## CI/CD Integration

Tests run automatically on:

- ✅ Every pull request
- ✅ Push to `main` or `develop` branches
- ✅ Before deployment

### Pre-commit Hook

Tests run automatically before commits:

```bash
# Install git hooks
pnpm prepare

# Now tests will run on changed files before each commit
```

## Troubleshooting

### Tests fail with "Cannot find module 'vitest'"

```bash
# Install dependencies
pnpm install
```

### Tests pass locally but fail in CI

- Check environment variables
- Verify database is seeded correctly
- Check for timezone issues

### Coverage is below threshold

```bash
# Check which files are not covered
pnpm test:coverage

# Open the HTML report
open coverage/index.html
```

## Resources

### Documentation

- [Testing Mandate](./.github/instructions/testing-mandate.instructions.md) - Comprehensive testing guide
- [Vitest Documentation](https://vitest.dev/) - Official Vitest docs
- [Testing Strategy](./docs/guides/testing-strategy.md) - Detailed testing strategy

### Examples

- [api-gateway test examples](./apps/api-gateway/src/utils/file-validation.test.ts)
- [OCR parser tests](./apps/ocr-service/src/parsers/) (to be added)

### Getting Help

- Check existing tests for patterns
- Ask in team chat
- Review the testing mandate document

---

**Remember**: Write tests. Not too many. Mostly integration. 🎯
