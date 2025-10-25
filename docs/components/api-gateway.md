# API Gateway Component

## Overview

The API Gateway serves as the central entry point for all client requests, handling authentication, routing, rate limiting, and request/response transformation. It orchestrates communication between the frontend and backend microservices.

## Technology Stack

- **Framework**: Fastify (high performance) or Express
- **Language**: TypeScript 5+
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod schemas
- **Documentation**: OpenAPI 3.0 (Swagger)
- **Rate Limiting**: @fastify/rate-limit or express-rate-limit
- **CORS**: @fastify/cors or cors
- **Compression**: @fastify/compress
- **Logging**: Pino (structured JSON logs)
- **Health Checks**: @fastify/health-check

## Project Structure

```
apps/api/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── app.ts
│   ├── config/
│   │   ├── index.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── services.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts           # Authentication endpoints
│   │   ├── users.routes.ts          # User management
│   │   ├── receipts.routes.ts
│   │   ├── products.routes.ts
│   │   ├── stores.routes.ts
│   │   ├── shopping-lists.routes.ts
│   │   └── analytics.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts       # Login, register, social auth callbacks
│   │   ├── users.controller.ts      # User profile, settings
│   │   ├── receipts.controller.ts
│   │   ├── products.controller.ts
│   │   ├── stores.controller.ts
│   │   ├── shopping-lists.controller.ts
│   │   └── analytics.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── logging.middleware.ts
│   ├── services/
│   │   ├── ocr.client.ts
│   │   ├── product.client.ts
│   │   ├── analytics.client.ts
│   │   └── storage.client.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   └── types/
│       └── index.ts
├── .env.example
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Core Implementation

### Authentication Routes & Controller

```typescript
// filepath: apps/api/src/routes/auth.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import * as authController from '../controllers/auth.controller';

export default async function authRoutes(app: FastifyInstance) {
  // Register new user
  app.post(
    '/auth/register',
    {
      schema: {
        description: 'Register a new user with email/password',
        tags: ['auth'],
        body: Type.Object({
          email: Type.String({ format: 'email' }),
          password: Type.String({ minLength: 8 }),
          name: Type.String({ minLength: 1 }),
        }),
        response: {
          201: Type.Object({
            user: Type.Object({
              id: Type.String({ format: 'uuid' }),
              email: Type.String(),
              name: Type.String(),
            }),
            message: Type.String(),
          }),
        },
      },
    },
    authController.register
  );

  // Login with email/password
  app.post(
    '/auth/login',
    {
      schema: {
        description: 'Login with email and password',
        tags: ['auth'],
        body: Type.Object({
          email: Type.String({ format: 'email' }),
          password: Type.String(),
        }),
        response: {
          200: Type.Object({
            user: Type.Object({
              id: Type.String({ format: 'uuid' }),
              email: Type.String(),
              name: Type.String(),
              role: Type.String(),
            }),
            accessToken: Type.String(),
            refreshToken: Type.String(),
          }),
        },
      },
    },
    authController.login
  );

  // Refresh access token
  app.post(
    '/auth/refresh',
    {
      schema: {
        description: 'Refresh access token using refresh token',
        tags: ['auth'],
        body: Type.Object({
          refreshToken: Type.String(),
        }),
        response: {
          200: Type.Object({
            accessToken: Type.String(),
            refreshToken: Type.String(),
          }),
        },
      },
    },
    authController.refresh
  );

  // Logout
  app.post(
    '/auth/logout',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Logout current user',
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
      },
    },
    authController.logout
  );

  // Get current user
  app.get(
    '/auth/me',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get current authenticated user',
        tags: ['auth'],
        security: [{ bearerAuth: [] }],
      },
    },
    authController.getCurrentUser
  );

  // Social auth callback (for server-side OAuth flow if needed)
  app.post(
    '/auth/social/:provider',
    {
      schema: {
        description: 'Handle social OAuth callback',
        tags: ['auth'],
        params: Type.Object({
          provider: Type.Union([
            Type.Literal('google'),
            Type.Literal('microsoft'),
            Type.Literal('apple'),
          ]),
        }),
        body: Type.Object({
          code: Type.String(),
          state: Type.Optional(Type.String()),
        }),
      },
    },
    authController.socialAuth
  );
}
```

```typescript
// filepath: apps/api/src/controllers/auth.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pricy/database';
import bcrypt from 'bcryptjs';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
} from '../utils/errors';

export async function register(
  request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
      name: string;
    };
  }>,
  reply: FastifyReply
) {
  const { email, password, name } = request.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      provider: 'email',
      emailVerified: false, // Send verification email in production
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return reply.code(201).send({
    user,
    message: 'User registered successfully. Please verify your email.',
  });
}

export async function login(
  request: FastifyRequest<{
    Body: {
      email: string;
      password: string;
    };
  }>,
  reply: FastifyReply
) {
  const { email, password } = request.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid credentials');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    accessToken,
    refreshToken,
  };
}

export async function refresh(
  request: FastifyRequest<{
    Body: {
      refreshToken: string;
    };
  }>,
  reply: FastifyReply
) {
  const { refreshToken } = request.body;

  try {
    const payload = await verifyRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = generateTokens({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return tokens;
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  // In a production system, you might want to:
  // 1. Blacklist the token
  // 2. Delete refresh token from database
  // 3. Clear Redis cache for user

  return { message: 'Logged out successfully' };
}

export async function getCurrentUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      provider: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}

export async function socialAuth(
  request: FastifyRequest<{
    Params: {
      provider: 'google' | 'microsoft' | 'apple';
    };
    Body: {
      code: string;
      state?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { provider } = request.params;
  const { code } = request.body;

  // This is typically handled by NextAuth.js on the frontend
  // But you can implement server-side OAuth flow here if needed

  // 1. Exchange code for access token with provider
  // 2. Get user info from provider
  // 3. Create or update user in database
  // 4. Generate JWT tokens

  throw new BadRequestError(
    'Social auth should be handled by NextAuth.js on the frontend'
  );
}
```

### User Routes & Controller

```typescript
// filepath: apps/api/src/routes/users.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authenticate } from '../middleware/auth.middleware';
import * as usersController from '../controllers/users.controller';

export default async function usersRoutes(app: FastifyInstance) {
  // Get user profile
  app.get(
    '/users/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get user profile',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String({ format: 'uuid' }),
        }),
      },
    },
    usersController.getUserProfile
  );

  // Update user profile
  app.patch(
    '/users/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Update user profile',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String({ format: 'uuid' }),
        }),
        body: Type.Object({
          name: Type.Optional(Type.String()),
          image: Type.Optional(Type.String({ format: 'uri' })),
        }),
      },
    },
    usersController.updateUserProfile
  );

  // Delete user account
  app.delete(
    '/users/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Delete user account (GDPR right to be forgotten)',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String({ format: 'uuid' }),
        }),
      },
    },
    usersController.deleteUser
  );

  // Get user settings
  app.get(
    '/users/:id/settings',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get user settings',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
      },
    },
    usersController.getUserSettings
  );

  // Update user settings
  app.put(
    '/users/:id/settings',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Update user settings',
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        body: Type.Object({
          currency: Type.Optional(Type.String()),
          preferredStores: Type.Optional(Type.Array(Type.String())),
          notificationsEnabled: Type.Optional(Type.Boolean()),
        }),
      },
    },
    usersController.updateUserSettings
  );
}
```

```typescript
// filepath: apps/api/src/controllers/users.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pricy/database';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export async function getUserProfile(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  // Users can only view their own profile unless admin
  if (id !== request.user!.id && request.user!.role !== 'admin') {
    throw new ForbiddenError('You can only view your own profile');
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      provider: true,
      emailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return user;
}

export async function updateUserProfile(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      name?: string;
      image?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const { name, image } = request.body;

  // Users can only update their own profile
  if (id !== request.user!.id) {
    throw new ForbiddenError('You can only update your own profile');
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(image && { image }),
    },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
    },
  });

  return user;
}

export async function deleteUser(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  // Users can only delete their own account
  if (id !== request.user!.id) {
    throw new ForbiddenError('You can only delete your own account');
  }

  // Delete user and all associated data (CASCADE)
  await prisma.user.delete({
    where: { id },
  });

  return reply.code(204).send();
}

export async function getUserSettings(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  if (id !== request.user!.id) {
    throw new ForbiddenError('You can only view your own settings');
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: id },
  });

  if (!settings) {
    // Create default settings if not exists
    return await prisma.userSettings.create({
      data: { userId: id },
    });
  }

  return settings;
}

export async function updateUserSettings(
  request: FastifyRequest<{
    Params: { id: string };
    Body: {
      currency?: string;
      preferredStores?: string[];
      notificationsEnabled?: boolean;
    };
  }>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const data = request.body;

  if (id !== request.user!.id) {
    throw new ForbiddenError('You can only update your own settings');
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: id },
    create: {
      userId: id,
      ...data,
    },
    update: data,
  });

  return settings;
}
```

### Application Setup

```typescript
// filepath: apps/api/src/app.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import multipart from '@fastify/multipart';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

export async function buildApp() {
  const app = Fastify({
    logger: logger,
    bodyLimit: 10485760, // 10MB
  }).withTypeProvider<TypeBoxTypeProvider>();

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await app.register(cors, {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Rate limiting with proper headers
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
    cache: 10000,
    addHeaders: {
      'x-ratelimit-limit': true, // Total requests allowed
      'x-ratelimit-remaining': true, // Requests remaining
      'x-ratelimit-reset': true, // Reset timestamp
    },
    errorResponseBuilder: (req, context) => {
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(
          context.ttl / 1000
        )} seconds.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  });

  // Compression
  await app.register(compress);

  // Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 1,
    },
  });

  // Routes
  await app.register(routes, { prefix: '/api/v1' });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  return app;
}
```

### Authentication Middleware

```typescript
// filepath: apps/api/src/middleware/auth.middleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    request.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

export async function authorize(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Not authenticated');
    }

    if (!roles.includes(request.user.role)) {
      throw new UnauthorizedError('Insufficient permissions');
    }
  };
}
```

### Receipt Routes & Controller

```typescript
// filepath: apps/api/src/routes/receipts.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authenticate } from '../middleware/auth.middleware';
import * as receiptsController from '../controllers/receipts.controller';

export default async function receiptsRoutes(app: FastifyInstance) {
  // Upload receipt
  app.post(
    '/receipts/upload',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Upload a receipt image for processing',
        tags: ['receipts'],
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: Type.Object({
            id: Type.String({ format: 'uuid' }),
            status: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    receiptsController.uploadReceipt
  );

  // Get all receipts
  app.get(
    '/receipts',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get all receipts for the authenticated user',
        tags: ['receipts'],
        security: [{ bearerAuth: [] }],
        querystring: Type.Object({
          page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
          limit: Type.Optional(
            Type.Integer({ minimum: 1, maximum: 100, default: 20 })
          ),
          storeId: Type.Optional(Type.String({ format: 'uuid' })),
        }),
      },
    },
    receiptsController.getReceipts
  );

  // Get receipt by ID
  app.get(
    '/receipts/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Get a specific receipt',
        tags: ['receipts'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String({ format: 'uuid' }),
        }),
      },
    },
    receiptsController.getReceiptById
  );

  // Delete receipt
  app.delete(
    '/receipts/:id',
    {
      onRequest: [authenticate],
      schema: {
        description: 'Delete a receipt',
        tags: ['receipts'],
        security: [{ bearerAuth: [] }],
        params: Type.Object({
          id: Type.String({ format: 'uuid' }),
        }),
      },
    },
    receiptsController.deleteReceipt
  );
}
```

```typescript
// filepath: apps/api/src/controllers/receipts.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pricy/database';
import { ocrClient } from '../services/ocr.client';
import { storageClient } from '../services/storage.client';
import { BadRequestError, NotFoundError } from '../utils/errors';

export async function uploadReceipt(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = await request.file();

  if (!data) {
    throw new BadRequestError('No file uploaded');
  }

  // Validate file type
  if (!data.mimetype.startsWith('image/')) {
    throw new BadRequestError('File must be an image');
  }

  // Upload to storage
  const imageUrl = await storageClient.upload({
    file: data.file,
    filename: data.filename,
    mimetype: data.mimetype,
    userId: request.user!.id,
  });

  // Create receipt record
  const receipt = await prisma.receipt.create({
    data: {
      userId: request.user!.id,
      imageUrl,
      status: 'processing',
    },
  });

  // Queue OCR processing (async)
  ocrClient.processReceipt(receipt.id, imageUrl).catch((error) => {
    request.log.error(
      { receiptId: receipt.id, error },
      'OCR processing failed'
    );
  });

  return reply.code(201).send({
    id: receipt.id,
    status: 'processing',
    message: 'Receipt uploaded successfully and is being processed',
  });
}

export async function getReceipts(
  request: FastifyRequest<{
    Querystring: {
      page?: number;
      limit?: number;
      storeId?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { page = 1, limit = 20, storeId } = request.query;
  const skip = (page - 1) * limit;

  const where = {
    userId: request.user!.id,
    ...(storeId && { storeId }),
  };

  const [receipts, total] = await Promise.all([
    prisma.receipt.findMany({
      where,
      skip,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        store: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    }),
    prisma.receipt.count({ where }),
  ]);

  return {
    data: receipts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getReceiptById(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: request.params.id,
      userId: request.user!.id,
    },
    include: {
      store: true,
      items: {
        include: {
          product: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!receipt) {
    throw new NotFoundError('Receipt not found');
  }

  return receipt;
}

export async function deleteReceipt(
  request: FastifyRequest<{
    Params: { id: string };
  }>,
  reply: FastifyReply
) {
  const receipt = await prisma.receipt.findUnique({
    where: {
      id: request.params.id,
      userId: request.user!.id,
    },
  });

  if (!receipt) {
    throw new NotFoundError('Receipt not found');
  }

  // Delete from storage
  await storageClient.delete(receipt.imageUrl);

  // Delete from database (cascade deletes items)
  await prisma.receipt.delete({
    where: { id: request.params.id },
  });

  return reply.code(204).send();
}
```

### Service Clients

```typescript
// filepath: apps/api/src/services/ocr.client.ts
import { logger } from '../utils/logger';

class OCRClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.OCR_SERVICE_URL || 'http://localhost:3001';
  }

  async processReceipt(receiptId: string, imageUrl: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiptId,
          imageUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.statusText}`);
      }

      logger.info({ receiptId }, 'Receipt queued for OCR processing');
    } catch (error) {
      logger.error({ receiptId, error }, 'Failed to queue OCR processing');
      throw error;
    }
  }
}

export const ocrClient = new OCRClient();
```

```typescript
// filepath: apps/api/src/services/storage.client.ts
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import crypto from 'crypto';

class StorageClient {
  private s3: S3Client;
  private bucket: string;

  constructor() {
    this.s3 = new S3Client({
      region: process.env.S3_REGION || 'us-east-1',
      endpoint: process.env.S3_ENDPOINT, // For MinIO
      credentials: process.env.S3_ACCESS_KEY_ID
        ? {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
          }
        : undefined,
      forcePathStyle: !!process.env.S3_ENDPOINT, // Required for MinIO
    });
    this.bucket = process.env.S3_BUCKET || 'pricy-receipts';
  }

  async upload({
    file,
    filename,
    mimetype,
    userId,
  }: {
    file: Readable;
    filename: string;
    mimetype: string;
    userId: string;
  }): Promise<string> {
    const key = `receipts/${userId}/${crypto.randomUUID()}-${filename}`;

    const chunks: Buffer[] = [];
    for await (const chunk of file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      })
    );

    return this.getUrl(key);
  }

  async delete(url: string): Promise<void> {
    const key = this.extractKey(url);

    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    );
  }

  private getUrl(key: string): string {
    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  }

  private extractKey(url: string): string {
    const urlObj = new URL(url);
    return urlObj.pathname.replace(`/${this.bucket}/`, '');
  }
}

export const storageClient = new StorageClient();
```

### Error Handling

```typescript
// filepath: apps/api/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(401, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}
```

```typescript
// filepath: apps/api/src/middleware/error.middleware.ts
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { AppError } from '../utils/errors';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({
      error: {
        message: error.message,
        statusCode: error.statusCode,
      },
    });
  }

  // Validation errors
  if (error.validation) {
    return reply.code(400).send({
      error: {
        message: 'Validation failed',
        statusCode: 400,
        details: error.validation,
      },
    });
  }

  // Default error
  return reply.code(500).send({
    error: {
      message: 'Internal server error',
      statusCode: 500,
    },
  });
}
```

## API Documentation

### OpenAPI/Swagger Setup

```typescript
// filepath: apps/api/src/app.ts (additional)
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

// ...existing code...

// Swagger documentation
await app.register(swagger, {
  openapi: {
    info: {
      title: 'Pricy API',
      description: 'Receipt scanner and price comparison API',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
});

await app.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});
```

## Environment Variables

```bash
# filepath: apps/api/.env.example
# Server
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3001,https://pricy.app

# Database
DATABASE_URL=postgresql://pricy:pricy@localhost:5432/pricy

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Storage (S3/MinIO)
S3_BUCKET=pricy-receipts
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin

# Services
OCR_SERVICE_URL=http://localhost:3001
PRODUCT_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003
```

## Testing

```typescript
// filepath: apps/api/src/__tests__/receipts.test.ts
import { test } from 'tap';
import { buildApp } from '../app';

test('POST /api/v1/receipts/upload - unauthorized', async (t) => {
  const app = await buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/receipts/upload',
  });

  t.equal(response.statusCode, 401);
  t.end();
});

test('GET /api/v1/receipts - success', async (t) => {
  const app = await buildApp();

  // Mock authentication
  const token = 'mock-token';

  const response = await app.inject({
    method: 'GET',
    url: '/api/v1/receipts',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });

  t.equal(response.statusCode, 200);
  t.end();
});
```

## Deployment

### Dockerfile

```dockerfile
# filepath: apps/api/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @pricy/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Performance Considerations

1. **Connection Pooling**: Use Prisma connection pooling
2. **Caching**: Redis for frequently accessed data
3. **Compression**: Enable gzip/brotli compression
4. **Rate Limiting**: Prevent abuse
5. **Query Optimization**: Use indexes and pagination
6. **Load Balancing**: Multiple API instances
7. **Monitoring**: Track response times and errors

## Rate Limiting Best Practices

### HTTP Rate Limit Headers (2025 Standard)

All API responses include standardized rate limit headers for client transparency:

```typescript
// Example Response Headers
HTTP/1.1 200 OK
X-RateLimit-Limit: 100                    // Max requests per window
X-RateLimit-Remaining: 73                 // Requests remaining
X-RateLimit-Reset: 1698149700            // Unix timestamp when limit resets
X-RateLimit-Window: 900                  // Window size in seconds (15 min)
Retry-After: 127                         // (Only on 429) Seconds to wait
```

### Rate Limiting Strategy

```typescript
// filepath: apps/api/src/config/rate-limits.ts
export const rateLimits = {
  // Global default
  global: {
    max: 100,
    timeWindow: '15 minutes',
  },

  // Authentication endpoints (stricter)
  auth: {
    max: 5,
    timeWindow: '15 minutes',
    keyGenerator: (req) => req.body.email || req.ip, // Per email or IP
  },

  // File upload endpoints (very strict)
  upload: {
    max: 10,
    timeWindow: '1 hour',
  },

  // Read-only endpoints (lenient)
  readonly: {
    max: 300,
    timeWindow: '15 minutes',
  },

  // Premium users (higher limits)
  premium: {
    max: 1000,
    timeWindow: '15 minutes',
  },
};

// Apply endpoint-specific limits
app.register(rateLimit, {
  ...rateLimits.auth,
  // Custom key generator for user-based limiting
  keyGenerator: async (req) => {
    // Authenticated users: limit by user ID
    if (req.user) {
      return `user:${req.user.id}`;
    }
    // Anonymous users: limit by IP
    return `ip:${req.ip}`;
  },
  // Skip rate limiting for admins
  skip: (req) => req.user?.role === 'admin',
});
```

### Client-Side Rate Limit Handling

```typescript
// filepath: apps/web/src/utils/api-client.ts
export async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, options);

  // Parse rate limit headers
  const rateLimit = {
    limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
    remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
    reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
  };

  // Handle rate limit exceeded
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
    throw new RateLimitError(
      `Rate limit exceeded. Retry in ${retryAfter} seconds.`,
      retryAfter,
      rateLimit
    );
  }

  // Warn when approaching limit
  if (rateLimit.remaining < rateLimit.limit * 0.1) {
    console.warn('Approaching rate limit:', rateLimit);
  }

  return response;
}

// Exponential backoff with jitter
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof RateLimitError && i < maxRetries - 1) {
        const delay = error.retryAfter * 1000 + Math.random() * 1000; // Add jitter
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Benefits of Rate Limit Headers

✅ **Transparency**: Clients know their limits  
✅ **Proactive Handling**: Apps can slow down before hitting limits  
✅ **Better UX**: Show users remaining requests  
✅ **Debugging**: Easier to diagnose rate limit issues  
✅ **Compliance**: Industry standard (GitHub, Stripe, Twitter APIs)

## Best Practices

1. **Use TypeScript strict mode** for type safety
2. **Validate all inputs** with Zod or TypeBox
3. **Use structured logging** (JSON format with Pino)
4. **Implement proper error handling** with custom error classes
5. **Add comprehensive tests** (unit, integration, E2E)
6. **Document all endpoints** with OpenAPI 3.0
7. **Version your API** (URL versioning: `/api/v1`, `/api/v2`)
8. **Use environment variables** for all configuration
9. **Implement rate limiting** with clear headers
10. **Monitor API performance** with metrics and tracing
11. **Use short-lived JWT tokens** (15 minutes access, 7-30 days refresh)
12. **Store refresh tokens securely** (httpOnly cookies, not localStorage)
