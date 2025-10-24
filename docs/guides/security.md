# Security Best Practices

> **Comprehensive security guide for Pricy application**  
> Last Updated: October 24, 2025

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication & Authorization](#authentication--authorization)
3. [Data Protection](#data-protection)
4. [API Security](#api-security)
5. [Frontend Security](#frontend-security)
6. [Infrastructure Security](#infrastructure-security)
7. [Secrets Management](#secrets-management)
8. [Security Monitoring](#security-monitoring)
9. [Compliance](#compliance)
10. [Security Checklist](#security-checklist)

---

## Security Overview

### Security Principles

Pricy follows the **CIA Triad** and **Zero Trust** security model:

- **Confidentiality**: Data is accessible only to authorized users
- **Integrity**: Data is accurate and hasn't been tampered with
- **Availability**: Systems and data are available when needed
- **Zero Trust**: Never trust, always verify - even internal requests

### Threat Model

| Threat                            | Risk Level | Mitigation                                  |
| --------------------------------- | ---------- | ------------------------------------------- |
| SQL Injection                     | High       | Prisma ORM (parameterized queries)          |
| XSS (Cross-Site Scripting)        | High       | Content Security Policy, input sanitization |
| CSRF (Cross-Site Request Forgery) | Medium     | CSRF tokens, SameSite cookies               |
| Brute Force Attacks               | Medium     | Rate limiting, account lockout              |
| Man-in-the-Middle                 | High       | HTTPS/TLS 1.3, certificate pinning          |
| Data Breach                       | High       | Encryption at rest and in transit           |
| DDoS                              | Medium     | Rate limiting, WAF, CDN                     |
| OAuth Token Theft                 | Medium     | Secure storage, token rotation              |
| Insecure Direct Object References | Medium     | Authorization checks                        |
| Insufficient Logging              | Low        | Comprehensive audit logging                 |

---

## Authentication & Authorization

### Authentication Strategy

#### Multi-Factor Authentication (MFA)

```typescript
// filepath: apps/api/src/services/mfa.service.ts
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export class MFAService {
  /**
   * Generate MFA secret for user
   */
  async generateSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Pricy (${email})`,
      issuer: "Pricy",
    });

    // Store secret in database (encrypted)
    await prisma.user.update({
      where: { id: userId },
      data: {
        mfaSecret: encrypt(secret.base32),
        mfaEnabled: false, // Enable after verification
      },
    });

    // Generate QR code for authenticator app
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  /**
   * Verify MFA token
   */
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { mfaSecret: true },
    });

    if (!user?.mfaSecret) {
      throw new Error("MFA not configured");
    }

    const secret = decrypt(user.mfaSecret);

    return speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 2, // Allow 2 time steps before/after for clock drift
    });
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase()
    );

    // Hash codes before storing
    const hashedCodes = await Promise.all(
      codes.map((code) => bcrypt.hash(code, 10))
    );

    await prisma.user.update({
      where: { id: userId },
      data: { mfaBackupCodes: hashedCodes },
    });

    return codes; // Return unhashed codes to user (only shown once!)
  }
}
```

### Authorization

#### Role-Based Access Control (RBAC)

```typescript
// filepath: packages/types/src/permissions.ts
export enum Role {
  USER = "user",
  PREMIUM = "premium",
  ADMIN = "admin",
}

export enum Permission {
  // Receipt permissions
  RECEIPT_READ = "receipt:read",
  RECEIPT_CREATE = "receipt:create",
  RECEIPT_UPDATE = "receipt:update",
  RECEIPT_DELETE = "receipt:delete",

  // Product permissions
  PRODUCT_READ = "product:read",
  PRODUCT_CREATE = "product:create",
  PRODUCT_UPDATE = "product:update",

  // Admin permissions
  USER_MANAGE = "user:manage",
  SETTINGS_MANAGE = "settings:manage",
  ANALYTICS_ADMIN = "analytics:admin",
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.RECEIPT_READ,
    Permission.RECEIPT_CREATE,
    Permission.RECEIPT_UPDATE,
    Permission.RECEIPT_DELETE,
    Permission.PRODUCT_READ,
  ],
  [Role.PREMIUM]: [
    // All user permissions plus:
    ...rolePermissions[Role.USER],
    Permission.ANALYTICS_ADMIN,
  ],
  [Role.ADMIN]: [
    // All permissions
    ...Object.values(Permission),
  ],
};
```

```typescript
// filepath: apps/api/src/middleware/permissions.middleware.ts
import { Permission, rolePermissions } from "@pricy/types";

export function requirePermission(...permissions: Permission[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user!;
    const userPermissions = rolePermissions[user.role as Role] || [];

    const hasPermission = permissions.every((perm) =>
      userPermissions.includes(perm)
    );

    if (!hasPermission) {
      throw new ForbiddenError(
        "Insufficient permissions to perform this action"
      );
    }
  };
}

// Usage in routes
app.delete(
  "/receipts/:id",
  {
    onRequest: [authenticate, requirePermission(Permission.RECEIPT_DELETE)],
  },
  deleteReceipt
);
```

#### Row-Level Security (RLS)

```typescript
// filepath: apps/api/src/middleware/row-level-security.ts
export async function enforceUserOwnership(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;
  const resourceId = request.params.id;

  // Check if user owns the resource
  const resource = await prisma.receipt.findFirst({
    where: {
      id: resourceId,
      userId: userId, // Critical: ensure user owns this receipt
    },
  });

  if (!resource) {
    throw new NotFoundError("Resource not found or access denied");
  }

  // Attach resource to request for later use
  request.resource = resource;
}
```

---

## Data Protection

### Encryption at Rest

```typescript
// filepath: packages/utils/src/encryption.ts
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex"); // 32 bytes
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Return: iv + authTag + encrypted data
  return iv.toString("hex") + authTag.toString("hex") + encrypted;
}

export function decrypt(encrypted: string): string {
  const iv = Buffer.from(encrypted.slice(0, IV_LENGTH * 2), "hex");
  const authTag = Buffer.from(
    encrypted.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
    "hex"
  );
  const encryptedData = encrypted.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// Usage: Encrypt sensitive user data
const encryptedSSN = encrypt(user.ssn);
await prisma.user.update({
  where: { id: user.id },
  data: { ssnEncrypted: encryptedSSN },
});
```

### Encryption in Transit

```nginx
# nginx.conf - TLS 1.3 Configuration
server {
    listen 443 ssl http2;
    server_name api.pricy.app;

    # Modern SSL configuration
    ssl_certificate /etc/letsencrypt/live/pricy.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pricy.app/privkey.pem;

    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;

    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/pricy.app/chain.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### Data Sanitization

```typescript
// filepath: packages/utils/src/sanitize.ts
import DOMPurify from "isomorphic-dompurify";
import validator from "validator";

export class Sanitizer {
  /**
   * Sanitize HTML to prevent XSS
   */
  static html(dirty: string): string {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a"],
      ALLOWED_ATTR: ["href"],
    });
  }

  /**
   * Sanitize user input
   */
  static input(input: string): string {
    return validator.escape(input.trim());
  }

  /**
   * Sanitize SQL-like patterns (extra safety layer)
   */
  static sql(input: string): string {
    // Remove SQL keywords and special characters
    return input
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/gi, "")
      .replace(/[;'"\\]/g, "");
  }

  /**
   * Mask PII in logs
   */
  static maskPII(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ["password", "ssn", "creditCard", "token"];

    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => {
        if (
          sensitiveFields.some((field) => key.toLowerCase().includes(field))
        ) {
          return [key, "***REDACTED***"];
        }
        return [key, value];
      })
    );
  }
}
```

---

## API Security

### Input Validation

```typescript
// filepath: packages/validation/src/schemas/receipt.schema.ts
import { z } from "zod";

export const receiptUploadSchema = z.object({
  image: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File must be less than 10MB"
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "File must be an image (JPEG, PNG, or WebP)"
    ),
  storeId: z.string().uuid().optional(),
  date: z.coerce
    .date()
    .max(new Date(), "Date cannot be in the future")
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export const receiptQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  storeId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sortBy: z.enum(["date", "amount", "store"]).default("date"),
  order: z.enum(["asc", "desc"]).default("desc"),
});
```

### Rate Limiting Strategy

```typescript
// filepath: apps/api/src/config/rate-limit.ts
import rateLimit from "@fastify/rate-limit";

export const rateLimitConfig = {
  // Global rate limit
  global: {
    max: 100,
    timeWindow: "15 minutes",
  },

  // Auth endpoints (stricter)
  auth: {
    max: 5,
    timeWindow: "15 minutes",
    keyGenerator: (req: FastifyRequest) => req.body?.email || req.ip,
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: "Too Many Requests",
      message: "Too many login attempts. Please try again in 15 minutes.",
    }),
  },

  // Upload endpoints
  upload: {
    max: 10,
    timeWindow: "1 hour",
    keyGenerator: (req: FastifyRequest) => req.user?.id || req.ip,
  },

  // API endpoints (per user)
  api: {
    max: 1000,
    timeWindow: "1 hour",
    keyGenerator: (req: FastifyRequest) => req.user?.id || req.ip,
  },
};

// Apply rate limits
app.register(rateLimit, rateLimitConfig.global);

// Route-specific rate limits
app.register(authRoutes, {
  prefix: "/auth",
  rateLimit: rateLimitConfig.auth,
});
```

### CORS Configuration

```typescript
// filepath: apps/api/src/config/cors.ts
import cors from "@fastify/cors";

const allowedOrigins = [
  "https://pricy.app",
  "https://www.pricy.app",
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3001", "http://localhost:3000"]
    : []),
];

export const corsConfig = {
  origin: (origin: string, callback: Function) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  maxAge: 600, // 10 minutes
};
```

### Content Security Policy (CSP)

```typescript
// filepath: apps/web/next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googletagmanager.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://api.pricy.app wss://api.pricy.app;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: ContentSecurityPolicy.replace(/\s{2,}/g, " ").trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

module.exports = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## Frontend Security

### XSS Prevention

```typescript
// filepath: apps/web/src/lib/utils/sanitize.ts
import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitize user-generated content before rendering
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOWED_URI_REGEXP: /^https?:\/\//,
  });
}

// Usage in components
export function UserContent({ content }: { content: string }) {
  const sanitized = sanitizeHTML(content);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitized }}
      className="user-content"
    />
  );
}
```

### CSRF Protection

```typescript
// filepath: apps/web/src/lib/api/csrf.ts
import { cookies } from "next/headers";

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString("hex");

  cookies().set("csrf-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return token;
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  const cookieToken = cookies().get("csrf-token")?.value;
  return token === cookieToken;
}

// Middleware for API routes
export async function csrfMiddleware(request: Request) {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const token = request.headers.get("X-CSRF-Token");

    if (!token || !verifyCSRFToken(token)) {
      return new Response("Invalid CSRF token", { status: 403 });
    }
  }
}
```

### Secure Local Storage

```typescript
// filepath: apps/web/src/lib/storage/secure-storage.ts
/**
 * Never store sensitive data in localStorage!
 * Use this for non-sensitive preferences only.
 */
export class SecureStorage {
  private prefix = "pricy_";

  /**
   * Store non-sensitive data
   */
  set(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error("Storage error:", error);
    }
  }

  /**
   * Retrieve data
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error("Storage error:", error);
      return null;
    }
  }

  /**
   * Clear all app data
   */
  clear(): void {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(this.prefix))
      .forEach((key) => localStorage.removeItem(key));
  }
}

// NEVER store tokens or passwords:
// ❌ localStorage.setItem('token', accessToken);
// ✅ Use HTTP-only cookies instead
```

---

## Infrastructure Security

### Docker Security

```dockerfile
# Secure Dockerfile example
FROM node:20-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory with proper ownership
WORKDIR /app
RUN chown nodejs:nodejs /app

# Copy and install dependencies
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application code
COPY --chown=nodejs:nodejs . .

# Remove development dependencies and sensitive files
RUN rm -rf .git .env.example tests/

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/index.js"]
```

### Docker Compose Security

```yaml
# docker-compose.prod.yml
version: "3.8"

services:
  api:
    image: pricy/api:latest
    read_only: true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    security_opt:
      - no-new-privileges:true
    tmpfs:
      - /tmp
    environment:
      - NODE_ENV=production
    secrets:
      - database_url
      - jwt_secret

secrets:
  database_url:
    external: true
  jwt_secret:
    external: true
```

### Kubernetes Security

```yaml
# k8s/deployment.yaml
apiVersion: v1
kind: Pod
metadata:
  name: pricy-api
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
    - name: api
      image: pricy/api:latest
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
          add:
            - NET_BIND_SERVICE
      resources:
        limits:
          memory: "512Mi"
          cpu: "500m"
        requests:
          memory: "256Mi"
          cpu: "250m"
      livenessProbe:
        httpGet:
          path: /health
          port: 3000
        initialDelaySeconds: 30
        periodSeconds: 10
      readinessProbe:
        httpGet:
          path: /health/ready
          port: 3000
        initialDelaySeconds: 5
        periodSeconds: 5
```

---

## Secrets Management

### Environment Variables

```bash
# .env.production (NEVER commit this!)
# Use secrets management service in production

# Generate secure secrets
DATABASE_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)
```

### AWS Secrets Manager

```typescript
// filepath: apps/api/src/config/secrets.ts
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });

export async function getSecret(secretName: string): Promise<string> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    return response.SecretString!;
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

// Usage
const dbPassword = await getSecret("pricy/database/password");
const jwtSecret = await getSecret("pricy/jwt/secret");
```

### HashiCorp Vault (Alternative)

```typescript
// filepath: apps/api/src/config/vault.ts
import vault from "node-vault";

const vaultClient = vault({
  apiVersion: "v1",
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

export async function getVaultSecret(path: string): Promise<any> {
  try {
    const result = await vaultClient.read(path);
    return result.data;
  } catch (error) {
    console.error("Vault error:", error);
    throw error;
  }
}
```

---

## Security Monitoring

### Audit Logging

```typescript
// filepath: apps/api/src/services/audit-log.service.ts
export class AuditLogger {
  async log(event: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    ip: string;
    userAgent: string;
    result: "success" | "failure";
    metadata?: Record<string, any>;
  }) {
    await prisma.auditLog.create({
      data: {
        ...event,
        timestamp: new Date(),
      },
    });
  }
}

// Usage in controllers
await auditLogger.log({
  userId: request.user.id,
  action: "DELETE",
  resource: "receipt",
  resourceId: receiptId,
  ip: request.ip,
  userAgent: request.headers["user-agent"],
  result: "success",
});
```

### Security Event Monitoring

```typescript
// filepath: apps/api/src/services/security-monitor.service.ts
export class SecurityMonitor {
  /**
   * Detect suspicious login attempts
   */
  async detectBruteForce(email: string, ip: string): Promise<boolean> {
    const failedAttempts = await prisma.loginAttempt.count({
      where: {
        email,
        ip,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - 15 * 60 * 1000), // Last 15 minutes
        },
      },
    });

    if (failedAttempts >= 5) {
      // Alert security team
      await this.alertSecurityTeam("Brute force detected", {
        email,
        ip,
        attempts: failedAttempts,
      });
      return true;
    }

    return false;
  }

  /**
   * Detect anomalous behavior
   */
  async detectAnomalies(userId: string) {
    const recentActivity = await prisma.auditLog.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Check for unusual patterns
    const uniqueIPs = new Set(recentActivity.map((a) => a.ip));
    const uniqueLocations = uniqueIPs.size;

    if (uniqueLocations > 3) {
      // Multiple locations in 24h - suspicious
      await this.alertUser(userId, "Unusual account activity detected");
    }
  }
}
```

---

## Compliance

### GDPR Compliance

```typescript
// filepath: apps/api/src/services/gdpr.service.ts
export class GDPRService {
  /**
   * Export all user data (GDPR Article 15 - Right of Access)
   */
  async exportUserData(userId: string): Promise<any> {
    const [user, receipts, shoppingLists, settings] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.receipt.findMany({
        where: { userId },
        include: { items: true, store: true },
      }),
      prisma.shoppingList.findMany({
        where: { userId },
        include: { items: true },
      }),
      prisma.userSettings.findUnique({ where: { userId } }),
    ]);

    return {
      personal_data: {
        email: user?.email,
        name: user?.name,
        created_at: user?.createdAt,
      },
      receipts,
      shopping_lists: shoppingLists,
      settings,
      export_date: new Date().toISOString(),
    };
  }

  /**
   * Delete all user data (GDPR Article 17 - Right to Erasure)
   */
  async deleteUserData(userId: string): Promise<void> {
    // Soft delete or anonymize data
    await prisma.$transaction([
      // Anonymize user
      prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@pricy.app`,
          name: "Deleted User",
          passwordHash: null,
          image: null,
          emailVerified: false,
        },
      }),
      // Delete receipts
      prisma.receipt.deleteMany({ where: { userId } }),
      // Delete shopping lists
      prisma.shoppingList.deleteMany({ where: { userId } }),
      // Delete settings
      prisma.userSettings.delete({ where: { userId } }),
    ]);

    // Log deletion for compliance
    await prisma.auditLog.create({
      data: {
        userId,
        action: "GDPR_DELETE",
        resource: "user",
        result: "success",
        timestamp: new Date(),
      },
    });
  }
}
```

### PCI DSS (if handling payments)

⚠️ **Important**: If you add payment processing:

1. **Never store credit card numbers**
2. **Use PCI-compliant payment processor** (Stripe, PayPal)
3. **Tokenize payment methods**
4. **Annual PCI compliance assessment**
5. **Network segmentation**
6. **Regular security scans**

---

## Security Checklist

### Development

- [ ] Use TypeScript strict mode
- [ ] Enable all ESLint security rules
- [ ] Run `npm audit` regularly
- [ ] Use Dependabot for dependency updates
- [ ] Code review all changes
- [ ] Never commit secrets to git
- [ ] Use `.env.example` for environment templates

### Authentication & Authorization

- [ ] Implement MFA for admin accounts
- [ ] Use strong password requirements
- [ ] Implement account lockout after failed attempts
- [ ] Use secure session management
- [ ] Implement proper JWT token expiration
- [ ] Rotate refresh tokens
- [ ] Log all authentication attempts

### API Security

- [ ] Validate all inputs with Zod
- [ ] Implement rate limiting on all endpoints
- [ ] Use CORS properly
- [ ] Implement CSRF protection
- [ ] Use Content Security Policy
- [ ] Add security headers (HSTS, X-Frame-Options, etc.)
- [ ] Sanitize all outputs

### Data Protection

- [ ] Encrypt sensitive data at rest (AES-256)
- [ ] Use TLS 1.3 for all communications
- [ ] Implement data retention policies
- [ ] Regular database backups
- [ ] Encrypt database backups
- [ ] Secure backup storage

### Infrastructure

- [ ] Run containers as non-root user
- [ ] Use read-only file systems
- [ ] Implement resource limits
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Enable firewall rules
- [ ] Regular security patches
- [ ] Network segmentation

### Monitoring & Incident Response

- [ ] Implement audit logging
- [ ] Set up security alerts
- [ ] Monitor failed login attempts
- [ ] Track anomalous behavior
- [ ] Have incident response plan
- [ ] Regular security reviews
- [ ] Penetration testing annually

### Compliance

- [ ] GDPR: Right to access implementation
- [ ] GDPR: Right to erasure implementation
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Cookie consent banner
- [ ] Data processing agreement
- [ ] Regular compliance audits

---

## Security Incident Response

### Incident Response Plan

1. **Detection**: Security monitoring alerts
2. **Analysis**: Determine severity and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Post-incident review

### Contact Information

```yaml
Security Team:
  Email: security@pricy.app
  PGP Key: https://pricy.app/.well-known/security.txt
  Bug Bounty: https://pricy.app/security/bug-bounty

Responsible Disclosure:
  - Report vulnerabilities to security@pricy.app
  - Allow 90 days for fix before public disclosure
  - No testing on production without permission
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**Last Updated**: October 24, 2025  
**Maintained by**: Pricy Security Team  
**Review Schedule**: Quarterly
