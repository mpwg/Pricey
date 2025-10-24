# Testing Strategy

> **Comprehensive testing guide for Pricy application**  
> Last Updated: October 24, 2025

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Pyramid](#testing-pyramid)
3. [Unit Testing](#unit-testing)
4. [Integration Testing](#integration-testing)
5. [End-to-End Testing](#end-to-end-testing)
6. [API Testing](#api-testing)
7. [Frontend Testing](#frontend-testing)
8. [Visual Regression Testing](#visual-regression-testing)
9. [Performance Testing](#performance-testing)
10. [Security Testing](#security-testing)
11. [Test Coverage](#test-coverage)
12. [CI/CD Integration](#cicd-integration)

---

## Testing Philosophy

### Core Principles

Pricy follows the **Testing Trophy** model with emphasis on:

1. **Write tests. Not too many. Mostly integration.** (Kent C. Dodds)
2. **Test behavior, not implementation**
3. **Confidence over coverage** - aim for 80%+ coverage on critical paths
4. **Fast feedback loops** - unit tests run in <1s, full suite in <5min
5. **Test in production-like environments**

### Testing Goals

- ✅ **Prevent regressions**: Catch bugs before they reach production
- ✅ **Document behavior**: Tests serve as living documentation
- ✅ **Enable refactoring**: Safely improve code with confidence
- ✅ **Faster debugging**: Pinpoint failures quickly
- ✅ **Code quality**: Encourage better design through testability

---

## Testing Pyramid

```
        ┌─────────────┐
       │    E2E      │  5%  - Critical user flows
       │   (Playwright) │
      └───────────────┘
     ┌─────────────────┐
    │   Integration   │  30% - API, DB, services
    │   (Vitest)     │
   └───────────────────┘
  ┌──────────────────────┐
 │   Unit Tests        │  65% - Pure functions, utils
 │   (Vitest)         │
└──────────────────────┘
```

### Test Distribution

| Type            | % of Tests | Example                           | Speed  |
| --------------- | ---------- | --------------------------------- | ------ |
| **Unit**        | 65%        | Pure functions, utils, validation | <1s    |
| **Integration** | 30%        | API routes, database operations   | 1-10s  |
| **E2E**         | 5%         | Critical user journeys            | 10-60s |

---

## Unit Testing

### Technology Stack

- **Framework**: Vitest (fast Vite-native test runner)
- **Assertions**: Expect API (Jest-compatible)
- **Mocking**: `vi.mock()`, `vi.spyOn()`
- **Coverage**: c8 (V8 code coverage)

### Setup

```bash
# filepath: packages/utils/vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

### Examples

#### Testing Pure Functions

```typescript
// filepath: packages/utils/src/date.test.ts
import { describe, it, expect } from "vitest";
import { formatDate, getDaysInMonth, isLeapYear } from "./date";

describe("Date Utilities", () => {
  describe("formatDate", () => {
    it("should format date in ISO format", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      expect(formatDate(date, "iso")).toBe("2024-03-15");
    });

    it("should format date in US format", () => {
      const date = new Date("2024-03-15T10:30:00Z");
      expect(formatDate(date, "us")).toBe("03/15/2024");
    });

    it("should handle invalid dates", () => {
      expect(() => formatDate(new Date("invalid"), "iso")).toThrow(
        "Invalid date"
      );
    });
  });

  describe("isLeapYear", () => {
    it("should identify leap years", () => {
      expect(isLeapYear(2024)).toBe(true);
      expect(isLeapYear(2000)).toBe(true);
    });

    it("should identify non-leap years", () => {
      expect(isLeapYear(2023)).toBe(false);
      expect(isLeapYear(1900)).toBe(false);
    });
  });

  describe("getDaysInMonth", () => {
    it("should return correct days for each month", () => {
      expect(getDaysInMonth(2024, 2)).toBe(29); // Feb in leap year
      expect(getDaysInMonth(2023, 2)).toBe(28); // Feb in non-leap year
      expect(getDaysInMonth(2024, 4)).toBe(30); // April
      expect(getDaysInMonth(2024, 1)).toBe(31); // January
    });

    it("should throw error for invalid months", () => {
      expect(() => getDaysInMonth(2024, 0)).toThrow();
      expect(() => getDaysInMonth(2024, 13)).toThrow();
    });
  });
});
```

#### Testing with Mocks

```typescript
// filepath: packages/utils/src/api.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiClient } from "./api";

describe("ApiClient", () => {
  let apiClient: ApiClient;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
    apiClient = new ApiClient("https://api.example.com");
  });

  it("should make GET request", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await apiClient.get("/users");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.example.com/users",
      expect.objectContaining({
        method: "GET",
      })
    );
    expect(result).toEqual({ data: "test" });
  });

  it("should handle errors", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(apiClient.get("/users/999")).rejects.toThrow("Not Found");
  });

  it("should retry on failure", async () => {
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

    const result = await apiClient.get("/users", { retries: 3 });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ data: "success" });
  });
});
```

#### Testing Validation Schemas

```typescript
// filepath: packages/validation/src/receipt.test.ts
import { describe, it, expect } from "vitest";
import { receiptUploadSchema, receiptQuerySchema } from "./receipt.schema";

describe("Receipt Validation Schemas", () => {
  describe("receiptUploadSchema", () => {
    it("should validate valid receipt upload", () => {
      const validData = {
        image: new File(["test"], "receipt.jpg", { type: "image/jpeg" }),
        storeId: "123e4567-e89b-12d3-a456-426614174000",
        date: new Date("2024-01-15"),
        notes: "Weekly groceries",
      };

      expect(() => receiptUploadSchema.parse(validData)).not.toThrow();
    });

    it("should reject oversized images", () => {
      const oversizedFile = new File(
        [new ArrayBuffer(11 * 1024 * 1024)], // 11MB
        "large.jpg",
        { type: "image/jpeg" }
      );

      expect(() => receiptUploadSchema.parse({ image: oversizedFile })).toThrow(
        "File must be less than 10MB"
      );
    });

    it("should reject invalid file types", () => {
      const invalidFile = new File(["test"], "doc.pdf", {
        type: "application/pdf",
      });

      expect(() => receiptUploadSchema.parse({ image: invalidFile })).toThrow(
        "File must be an image"
      );
    });

    it("should reject future dates", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const data = {
        image: new File(["test"], "receipt.jpg", { type: "image/jpeg" }),
        date: futureDate,
      };

      expect(() => receiptUploadSchema.parse(data)).toThrow(
        "Date cannot be in the future"
      );
    });
  });

  describe("receiptQuerySchema", () => {
    it("should apply defaults", () => {
      const result = receiptQuerySchema.parse({});

      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortBy: "date",
        order: "desc",
      });
    });

    it("should validate pagination", () => {
      expect(() => receiptQuerySchema.parse({ page: 0 })).toThrow();

      expect(() => receiptQuerySchema.parse({ limit: 101 })).toThrow();
    });
  });
});
```

---

## Integration Testing

### Technology Stack

- **Framework**: Vitest
- **Database**: Test PostgreSQL container (Docker)
- **API**: Supertest for HTTP assertions
- **Fixtures**: Test data generators

### Setup

```typescript
// filepath: apps/api/vitest.setup.ts
import { beforeAll, afterAll, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

beforeAll(async () => {
  // Start test database
  execSync("docker-compose -f docker-compose.test.yml up -d postgres-test");

  // Wait for database to be ready
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Run migrations
  execSync("DATABASE_URL=$TEST_DATABASE_URL pnpm prisma migrate deploy");
});

afterEach(async () => {
  // Clean up test data between tests
  await prisma.receipt.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  execSync("docker-compose -f docker-compose.test.yml down");
});
```

### Examples

#### Testing API Endpoints

```typescript
// filepath: apps/api/src/routes/receipts.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { app } from "../app";
import { createTestUser, createAuthToken } from "../test/helpers";

describe("Receipt API", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    userId = user.id;
    authToken = createAuthToken(user);
  });

  describe("POST /receipts", () => {
    it("should upload receipt successfully", async () => {
      const response = await request(app)
        .post("/receipts")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", "test/fixtures/receipt.jpg")
        .field("storeId", "test-store-id")
        .field("date", "2024-01-15")
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        userId,
        storeId: "test-store-id",
        status: "pending",
      });
    });

    it("should reject unauthenticated requests", async () => {
      await request(app)
        .post("/receipts")
        .attach("image", "test/fixtures/receipt.jpg")
        .expect(401);
    });

    it("should validate image size", async () => {
      await request(app)
        .post("/receipts")
        .set("Authorization", `Bearer ${authToken}`)
        .attach("image", "test/fixtures/large-receipt.jpg") // 11MB
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain("File must be less than 10MB");
        });
    });
  });

  describe("GET /receipts", () => {
    beforeEach(async () => {
      // Create test receipts
      await prisma.receipt.createMany({
        data: [
          { userId, storeId: "store-1", date: new Date("2024-01-01") },
          { userId, storeId: "store-2", date: new Date("2024-01-02") },
          { userId, storeId: "store-1", date: new Date("2024-01-03") },
        ],
      });
    });

    it("should return paginated receipts", async () => {
      const response = await request(app)
        .get("/receipts?page=1&limit=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2,
      });
    });

    it("should filter by store", async () => {
      const response = await request(app)
        .get("/receipts?storeId=store-1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(
        response.body.data.every((r: any) => r.storeId === "store-1")
      ).toBe(true);
    });

    it("should only return user's own receipts", async () => {
      // Create another user's receipt
      const otherUser = await createTestUser({ email: "other@example.com" });
      await prisma.receipt.create({
        data: { userId: otherUser.id, storeId: "store-3" },
      });

      const response = await request(app)
        .get("/receipts")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3); // Only current user's receipts
    });
  });

  describe("DELETE /receipts/:id", () => {
    it("should delete receipt", async () => {
      const receipt = await prisma.receipt.create({
        data: { userId, storeId: "store-1" },
      });

      await request(app)
        .delete(`/receipts/${receipt.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      const deleted = await prisma.receipt.findUnique({
        where: { id: receipt.id },
      });
      expect(deleted).toBeNull();
    });

    it("should prevent deleting other user's receipts", async () => {
      const otherUser = await createTestUser({ email: "other@example.com" });
      const otherReceipt = await prisma.receipt.create({
        data: { userId: otherUser.id, storeId: "store-1" },
      });

      await request(app)
        .delete(`/receipts/${otherReceipt.id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404); // Not found (row-level security)
    });
  });
});
```

#### Testing Database Operations

```typescript
// filepath: apps/api/src/services/receipt.service.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ReceiptService } from "./receipt.service";
import { createTestUser } from "../test/helpers";

describe("ReceiptService", () => {
  let service: ReceiptService;
  let userId: string;

  beforeEach(async () => {
    service = new ReceiptService();
    const user = await createTestUser();
    userId = user.id;
  });

  describe("createReceipt", () => {
    it("should create receipt with items", async () => {
      const receipt = await service.createReceipt({
        userId,
        storeId: "store-1",
        items: [
          { name: "Milk", price: 3.99, quantity: 1 },
          { name: "Bread", price: 2.49, quantity: 2 },
        ],
      });

      expect(receipt.id).toBeDefined();
      expect(receipt.items).toHaveLength(2);
      expect(receipt.totalAmount).toBe(8.97);
    });

    it("should handle transaction rollback on error", async () => {
      await expect(
        service.createReceipt({
          userId,
          storeId: "store-1",
          items: [
            { name: "Milk", price: -1, quantity: 1 }, // Invalid price
          ],
        })
      ).rejects.toThrow();

      // Verify no partial data was saved
      const receipts = await prisma.receipt.findMany({ where: { userId } });
      expect(receipts).toHaveLength(0);
    });
  });

  describe("getReceiptStatistics", () => {
    beforeEach(async () => {
      // Create test data
      await prisma.receipt.createMany({
        data: [
          {
            userId,
            storeId: "store-1",
            totalAmount: 50,
            date: new Date("2024-01-01"),
          },
          {
            userId,
            storeId: "store-2",
            totalAmount: 30,
            date: new Date("2024-01-15"),
          },
          {
            userId,
            storeId: "store-1",
            totalAmount: 70,
            date: new Date("2024-02-01"),
          },
        ],
      });
    });

    it("should calculate monthly statistics", async () => {
      const stats = await service.getReceiptStatistics(userId, {
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-01-31"),
      });

      expect(stats).toMatchObject({
        totalSpent: 80,
        receiptCount: 2,
        averageAmount: 40,
        topStore: "store-1",
      });
    });
  });
});
```

---

## End-to-End Testing

### Technology Stack

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit
- **Visual Testing**: Percy (optional)
- **Accessibility**: axe-core integration

### Setup

```typescript
// filepath: apps/web/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    // Mobile
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Examples

#### Testing User Flows

```typescript
// filepath: apps/web/e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should sign up with email and password", async ({ page }) => {
    await page.goto("/signup");

    // Fill form
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "SecurePassword123!");
    await page.fill('[name="confirmPassword"]', "SecurePassword123!");

    // Submit
    await page.click('button[type="submit"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL("/dashboard");
    await expect(page.locator("h1")).toContainText("Welcome");
  });

  test("should login with Google OAuth", async ({ page, context }) => {
    await page.goto("/login");

    // Click Google sign-in button
    const [popup] = await Promise.all([
      context.waitForEvent("page"),
      page.click('button:has-text("Continue with Google")'),
    ]);

    // Handle Google OAuth popup (mocked in test environment)
    await popup.waitForLoadState();
    await popup.fill('[name="email"]', "test@gmail.com");
    await popup.fill('[name="password"]', "password");
    await popup.click('button[type="submit"]');

    // Verify redirect back to app
    await expect(page).toHaveURL("/dashboard");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText(
      "Invalid email or password"
    );
  });
});
```

#### Testing Receipt Upload Flow

```typescript
// filepath: apps/web/e2e/receipt-upload.spec.ts
import { test, expect } from "@playwright/test";
import path from "path";

test.describe("Receipt Upload", () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto("/login");
    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/dashboard");
  });

  test("should upload receipt with camera", async ({ page, context }) => {
    // Grant camera permissions
    await context.grantPermissions(["camera"]);

    await page.goto("/receipts/upload");

    // Click camera button
    await page.click('button:has-text("Take Photo")');

    // Wait for camera to initialize
    await page.waitForSelector("video");

    // Simulate taking photo
    await page.click('button:has-text("Capture")');

    // Verify preview
    await expect(page.locator('img[alt="Receipt preview"]')).toBeVisible();

    // Submit
    await page.click('button:has-text("Upload Receipt")');

    // Verify processing state
    await expect(page.locator("text=Processing receipt...")).toBeVisible();

    // Wait for completion (mock OCR service)
    await page.waitForSelector("text=Receipt processed successfully", {
      timeout: 10000,
    });

    // Verify receipt appears in list
    await page.goto("/receipts");
    await expect(page.locator(".receipt-item").first()).toBeVisible();
  });

  test("should upload receipt from file", async ({ page }) => {
    await page.goto("/receipts/upload");

    // Upload file
    const filePath = path.join(__dirname, "fixtures", "test-receipt.jpg");
    await page.setInputFiles('input[type="file"]', filePath);

    // Verify preview
    await expect(page.locator('img[alt="Receipt preview"]')).toBeVisible();

    // Add metadata
    await page.fill('[name="notes"]', "Weekly groceries");
    await page.selectOption('[name="storeId"]', "walmart");

    // Submit
    await page.click('button:has-text("Upload Receipt")');

    // Verify success
    await expect(
      page.locator("text=Receipt uploaded successfully")
    ).toBeVisible();
  });

  test("should validate file size", async ({ page }) => {
    await page.goto("/receipts/upload");

    // Try to upload oversized file
    const largePath = path.join(__dirname, "fixtures", "large-receipt.jpg");
    await page.setInputFiles('input[type="file"]', largePath);

    // Verify error message
    await expect(page.locator('[role="alert"]')).toContainText(
      "File must be less than 10MB"
    );
  });
});
```

#### Testing Accessibility

```typescript
// filepath: apps/web/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test("should not have accessibility violations on homepage", async ({
    page,
  }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should be keyboard navigable", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    await page.keyboard.press("Tab");
    await expect(page.locator('a[href="/login"]')).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator('a[href="/signup"]')).toBeFocused();

    // Test skip link
    await page.keyboard.press("Tab");
    await expect(page.locator('a:has-text("Skip to content")')).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
  });

  test("should support screen readers", async ({ page }) => {
    await page.goto("/receipts");

    // Verify ARIA labels
    await expect(
      page.locator('button[aria-label="Upload receipt"]')
    ).toBeVisible();
    await expect(
      page.locator('nav[aria-label="Main navigation"]')
    ).toBeVisible();

    // Verify semantic HTML
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("footer")).toBeVisible();
  });
});
```

---

## API Testing

### Using Bruno (Postman Alternative)

```json
# filepath: apps/api/bruno/receipts/create-receipt.bru
meta {
  name: Create Receipt
  type: http
  seq: 1
}

post {
  url: {{baseUrl}}/receipts
  body: multipart
  auth: bearer
}

auth:bearer {
  token: {{authToken}}
}

body:multipart {
  image: @file(./fixtures/receipt.jpg)
  storeId: walmart-1
  date: 2024-01-15
  notes: Weekly groceries
}

assert {
  res.status: eq 201
  res.body.id: isDefined
  res.body.status: eq pending
  res.body.userId: eq {{userId}}
}

tests {
  test("should create receipt with correct data", function() {
    const data = res.getBody();
    expect(data.storeId).to.equal("walmart-1");
    expect(data.notes).to.equal("Weekly groceries");
  });

  test("should start OCR processing", function() {
    const data = res.getBody();
    expect(data.ocrStatus).to.equal("queued");
  });
}
```

---

## Frontend Testing

### Component Testing with React Testing Library

```typescript
// filepath: apps/web/src/components/ReceiptCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ReceiptCard } from "./ReceiptCard";

describe("ReceiptCard", () => {
  const mockReceipt = {
    id: "123",
    storeName: "Walmart",
    date: new Date("2024-01-15"),
    totalAmount: 45.99,
    itemCount: 5,
    imageUrl: "/receipts/123.jpg",
  };

  it("should render receipt information", () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    expect(screen.getByText("Walmart")).toBeInTheDocument();
    expect(screen.getByText("$45.99")).toBeInTheDocument();
    expect(screen.getByText("5 items")).toBeInTheDocument();
  });

  it("should handle delete action", async () => {
    const onDelete = vi.fn();
    render(<ReceiptCard receipt={mockReceipt} onDelete={onDelete} />);

    // Click delete button
    fireEvent.click(screen.getByLabelText("Delete receipt"));

    // Confirm deletion
    fireEvent.click(screen.getByText("Confirm"));

    expect(onDelete).toHaveBeenCalledWith("123");
  });

  it("should display receipt image", () => {
    render(<ReceiptCard receipt={mockReceipt} />);

    const image = screen.getByAlt("Walmart receipt");
    expect(image).toHaveAttribute("src", "/receipts/123.jpg");
  });
});
```

### Hook Testing

```typescript
// filepath: apps/web/src/hooks/useReceipts.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useReceipts } from "./useReceipts";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

describe("useReceipts", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("should fetch receipts", async () => {
    const { result } = renderHook(() => useReceipts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(3);
  });

  it("should handle loading state", () => {
    const { result } = renderHook(() => useReceipts(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it("should handle errors", async () => {
    // Mock API error
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useReceipts(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
  });
});
```

---

## Visual Regression Testing

### Setup with Percy

```typescript
// filepath: apps/web/e2e/visual.spec.ts
import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

test.describe("Visual Regression", () => {
  test("homepage desktop", async ({ page }) => {
    await page.goto("/");
    await percySnapshot(page, "Homepage - Desktop");
  });

  test("homepage mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await percySnapshot(page, "Homepage - Mobile");
  });

  test("receipt list with data", async ({ page }) => {
    await page.goto("/receipts");
    await percySnapshot(page, "Receipt List - With Data");
  });

  test("receipt list empty state", async ({ page }) => {
    await page.goto("/receipts?empty=true");
    await percySnapshot(page, "Receipt List - Empty");
  });
});
```

---

## Performance Testing

### Load Testing with k6

```javascript
// filepath: apps/api/k6/load-test.js
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 10 }, // Ramp up to 10 users
    { duration: "3m", target: 10 }, // Stay at 10 users
    { duration: "1m", target: 50 }, // Spike to 50 users
    { duration: "3m", target: 50 }, // Stay at 50 users
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    errors: ["rate<0.1"], // Error rate under 10%
  },
};

export default function () {
  // Test receipt listing
  const listRes = http.get("https://api.pricy.app/receipts", {
    headers: {
      Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
    },
  });

  check(listRes, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // Test receipt upload
  const uploadRes = http.post(
    "https://api.pricy.app/receipts",
    {
      image: http.file(open("./fixtures/receipt.jpg", "b"), "receipt.jpg"),
      storeId: "walmart-1",
    },
    {
      headers: {
        Authorization: `Bearer ${__ENV.AUTH_TOKEN}`,
      },
    }
  );

  check(uploadRes, {
    "upload status is 201": (r) => r.status === 201,
    "upload time < 2s": (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);

  sleep(2);
}
```

---

## Security Testing

### Automated Security Scans

```yaml
# filepath: .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: "0 0 * * 1" # Weekly on Monday

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "pricy"
          path: "."
          format: "HTML"

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: "fs"
          scan-ref: "."
          severity: "CRITICAL,HIGH"
```

---

## Test Coverage

### Coverage Targets

| Package             | Target  | Current    |
| ------------------- | ------- | ---------- |
| `@pricy/utils`      | 90%     | 92% ✅     |
| `@pricy/validation` | 95%     | 97% ✅     |
| `@pricy/types`      | 100%    | 100% ✅    |
| `apps/api`          | 80%     | 78% ⚠️     |
| `apps/web`          | 75%     | 71% ⚠️     |
| **Overall**         | **80%** | **84%** ✅ |

### Coverage Reports

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
open coverage/index.html

# Upload to Codecov (CI)
bash <(curl -s https://codecov.io/bash)
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# filepath: .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/pricy_test

      - name: Run integration tests
        run: pnpm test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps

      - name: Run E2E tests
        run: pnpm test:e2e

      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Running Tests

### Local Development

```bash
# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests
pnpm test:integration

# Run E2E tests
pnpm test:e2e

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/utils/date.test.ts

# Run tests matching pattern
pnpm test --grep "receipt upload"
```

### CI Environment

Tests run automatically on:

- ✅ Every pull request
- ✅ Commits to `main` and `develop`
- ✅ Nightly (full E2E suite)
- ✅ Before deployment

---

## Best Practices

### Test Organization

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── receipts.ts
│   │   └── receipts.test.ts          # Co-located with source
│   ├── services/
│   │   ├── receipt.service.ts
│   │   └── receipt.service.test.ts
│   └── utils/
│       ├── validation.ts
│       └── validation.test.ts
├── e2e/
│   ├── auth.spec.ts                   # E2E tests separate
│   ├── receipts.spec.ts
│   └── fixtures/
│       └── test-data.json
└── test/
    ├── helpers.ts                     # Test utilities
    ├── fixtures.ts                    # Data generators
    └── setup.ts                       # Global setup
```

### Writing Good Tests

```typescript
// ✅ Good: Descriptive, tests behavior
test("should reject expired tokens", async () => {
  const expiredToken = generateToken({ exp: Date.now() - 1000 });
  await expect(validateToken(expiredToken)).rejects.toThrow("Token expired");
});

// ❌ Bad: Vague, tests implementation
test("token validation", async () => {
  const result = validateToken("abc");
  expect(result).toBe(false);
});

// ✅ Good: Arrange-Act-Assert pattern
test("should calculate receipt total", () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 },
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(25);
});

// ✅ Good: Test edge cases
test("should handle empty receipt", () => {
  expect(calculateTotal([])).toBe(0);
});

test("should handle negative quantities", () => {
  expect(() => calculateTotal([{ price: 10, quantity: -1 }])).toThrow();
});
```

---

**Last Updated**: October 24, 2025  
**Maintained by**: Pricy Engineering Team  
**Review Schedule**: Quarterly
