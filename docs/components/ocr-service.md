# OCR Service Component

## Overview

The OCR (Optical Character Recognition) Service extracts text from receipt images and structures it into machine-readable format. It supports multiple OCR engines (Tesseract for local, Google Cloud Vision/AWS Textract for cloud) and includes intelligent parsing logic to identify stores, dates, items, and prices.

## Technology Stack

- **Framework**: Fastify
- **Language**: TypeScript 5+
- **OCR Engines**:
  - **Local**: Tesseract.js
  - **Cloud**: Google Cloud Vision API, AWS Textract
- **Queue**: BullMQ (Redis-based job queue)
- **Image Processing**: Sharp
- **NLP**: Natural (for text analysis)
- **Validation**: Zod

## Project Structure

```
services/ocr/
├── src/
│   ├── index.ts
│   ├── server.ts
│   ├── routes/
│   │   └── ocr.routes.ts
│   ├── controllers/
│   │   └── ocr.controller.ts
│   ├── services/
│   │   ├── ocr/
│   │   │   ├── base.ts
│   │   │   ├── tesseract.ts
│   │   │   ├── google-vision.ts
│   │   │   └── aws-textract.ts
│   │   ├── parser/
│   │   │   ├── receipt-parser.ts
│   │   │   ├── store-detector.ts
│   │   │   ├── date-extractor.ts
│   │   │   ├── item-extractor.ts
│   │   │   └── price-extractor.ts
│   │   └── queue/
│   │       ├── processor.ts
│   │       └── worker.ts
│   ├── utils/
│   │   ├── image.ts
│   │   ├── logger.ts
│   │   └── patterns.ts
│   └── types/
│       └── index.ts
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Core Implementation

### OCR Base Interface

```typescript
// filepath: services/ocr/src/services/ocr/base.ts
export interface OCRResult {
  text: string;
  confidence: number;
  blocks: TextBlock[];
}

export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface OCRProvider {
  name: string;
  extractText(imageUrl: string): Promise<OCRResult>;
}
```

### Tesseract Implementation

```typescript
// filepath: services/ocr/src/services/ocr/tesseract.ts
import Tesseract from 'tesseract.js';
import { OCRProvider, OCRResult } from './base';
import { preprocessImage } from '../../utils/image';

export class TesseractOCR implements OCRProvider {
  name = 'tesseract';
  private worker: Tesseract.Worker | null = null;

  async initialize() {
    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => console.log(m),
    });
  }

  async extractText(imageUrl: string): Promise<OCRResult> {
    if (!this.worker) {
      await this.initialize();
    }

    // Download and preprocess image
    const imageBuffer = await this.downloadImage(imageUrl);
    const processedBuffer = await preprocessImage(imageBuffer);

    const {
      data: { text, confidence, blocks },
    } = await this.worker!.recognize(processedBuffer);

    return {
      text,
      confidence,
      blocks: blocks.map((block) => ({
        text: block.text,
        confidence: block.confidence,
        boundingBox: {
          x: block.bbox.x0,
          y: block.bbox.y0,
          width: block.bbox.x1 - block.bbox.x0,
          height: block.bbox.y1 - block.bbox.y0,
        },
      })),
    };
  }

  private async downloadImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async terminate() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }
}
```

### Google Cloud Vision Implementation

```typescript
// filepath: services/ocr/src/services/ocr/google-vision.ts
import vision from '@google-cloud/vision';
import { OCRProvider, OCRResult } from './base';

export class GoogleVisionOCR implements OCRProvider {
  name = 'google-vision';
  private client: vision.ImageAnnotatorClient;

  constructor() {
    this.client = new vision.ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  async extractText(imageUrl: string): Promise<OCRResult> {
    const [result] = await this.client.textDetection(imageUrl);
    const detections = result.textAnnotations || [];

    if (detections.length === 0) {
      return {
        text: '',
        confidence: 0,
        blocks: [],
      };
    }

    // First annotation contains full text
    const fullText = detections[0];

    return {
      text: fullText.description || '',
      confidence: 0.95, // Google doesn't provide overall confidence
      blocks: detections.slice(1).map((detection) => ({
        text: detection.description || '',
        confidence: 0.95,
        boundingBox: {
          x: detection.boundingPoly?.vertices?.[0]?.x || 0,
          y: detection.boundingPoly?.vertices?.[0]?.y || 0,
          width:
            (detection.boundingPoly?.vertices?.[2]?.x || 0) -
            (detection.boundingPoly?.vertices?.[0]?.x || 0),
          height:
            (detection.boundingPoly?.vertices?.[2]?.y || 0) -
            (detection.boundingPoly?.vertices?.[0]?.y || 0),
        },
      })),
    };
  }
}
```

### Receipt Parser

```typescript
// filepath: services/ocr/src/services/parser/receipt-parser.ts
import { StoreDetector } from './store-detector';
import { DateExtractor } from './date-extractor';
import { ItemExtractor } from './item-extractor';

export interface ParsedReceipt {
  store: {
    name: string;
    address?: string;
    confidence: number;
  } | null;
  date: Date | null;
  items: ParsedItem[];
  total?: number;
  rawText: string;
}

export interface ParsedItem {
  description: string;
  quantity: number;
  unit: string;
  price: number;
  lineNumber: number;
}

export class ReceiptParser {
  private storeDetector: StoreDetector;
  private dateExtractor: DateExtractor;
  private itemExtractor: ItemExtractor;

  constructor() {
    this.storeDetector = new StoreDetector();
    this.dateExtractor = new DateExtractor();
    this.itemExtractor = new ItemExtractor();
  }

  async parse(text: string): Promise<ParsedReceipt> {
    const lines = text.split('\n').filter((line) => line.trim().length > 0);

    // Extract store information
    const store = this.storeDetector.detect(lines);

    // Extract date
    const date = this.dateExtractor.extract(text);

    // Extract items
    const items = this.itemExtractor.extract(lines);

    // Extract total (usually at the end)
    const total = this.extractTotal(lines);

    return {
      store,
      date,
      items,
      total,
      rawText: text,
    };
  }

  private extractTotal(lines: string[]): number | undefined {
    const totalPatterns = [
      /total[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /sum[:\s]*€?\s*(\d+[.,]\d{2})/i,
      /gesamt[:\s]*€?\s*(\d+[.,]\d{2})/i,
    ];

    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
      const line = lines[i];
      for (const pattern of totalPatterns) {
        const match = line.match(pattern);
        if (match) {
          return parseFloat(match[1].replace(',', '.'));
        }
      }
    }

    return undefined;
  }
}
```

### Store Detector

```typescript
// filepath: services/ocr/src/services/parser/store-detector.ts
import { prisma } from '@pricy/database';

export class StoreDetector {
  private knownStores: Map<string, string> = new Map();

  async initialize() {
    // Load known stores from database
    const stores = await prisma.store.findMany({
      select: { id: true, name: true },
    });

    stores.forEach((store) => {
      this.knownStores.set(store.name.toLowerCase(), store.id);
    });
  }

  detect(lines: string[]): {
    name: string;
    address?: string;
    confidence: number;
  } | null {
    // Check first 10 lines for store name
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      const line = lines[i].toLowerCase();

      // Check against known stores
      for (const [storeName, storeId] of this.knownStores) {
        if (line.includes(storeName)) {
          return {
            name: storeName,
            address: this.extractAddress(lines, i),
            confidence: 0.9,
          };
        }
      }
    }

    // Fallback: first non-empty line is probably the store
    if (lines.length > 0) {
      return {
        name: lines[0],
        confidence: 0.5,
      };
    }

    return null;
  }

  private extractAddress(
    lines: string[],
    storeLineIndex: number
  ): string | undefined {
    // Address is usually on the next 1-3 lines
    const addressLines = lines.slice(storeLineIndex + 1, storeLineIndex + 4);

    return addressLines.join(', ') || undefined;
  }
}
```

### Item Extractor

```typescript
// filepath: services/ocr/src/services/parser/item-extractor.ts
import { ParsedItem } from './receipt-parser';

export class ItemExtractor {
  private pricePattern = /€?\s*(\d+[.,]\d{2})\s*€?/;
  private quantityPattern = /(\d+[.,]?\d*)\s*(kg|g|l|ml|stk|x|pcs)/i;

  extract(lines: string[]): ParsedItem[] {
    const items: ParsedItem[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip header/footer lines
      if (this.isHeaderOrFooter(line)) {
        continue;
      }

      const item = this.parseItemLine(line, i);
      if (item) {
        items.push(item);
      }
    }

    return items;
  }

  private parseItemLine(line: string, lineNumber: number): ParsedItem | null {
    // Extract price (usually at the end)
    const priceMatch = line.match(this.pricePattern);
    if (!priceMatch) {
      return null;
    }

    const price = parseFloat(priceMatch[1].replace(',', '.'));

    // Remove price from line to get description
    const descriptionPart = line.substring(0, priceMatch.index);

    // Extract quantity and unit
    const quantityMatch = descriptionPart.match(this.quantityPattern);
    let quantity = 1;
    let unit = 'pcs';
    let description = descriptionPart.trim();

    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1].replace(',', '.'));
      unit = quantityMatch[2].toLowerCase();
      // Remove quantity from description
      description = descriptionPart.substring(0, quantityMatch.index).trim();
    }

    // Clean up description
    description = this.cleanDescription(description);

    if (description.length === 0) {
      return null;
    }

    return {
      description,
      quantity,
      unit,
      price,
      lineNumber,
    };
  }

  private isHeaderOrFooter(line: string): boolean {
    const headerFooterKeywords = [
      'receipt',
      'bon',
      'kassenbon',
      'thank',
      'danke',
      'mwst',
      'vat',
      'tax',
      'total',
      'sum',
      'card',
      'cash',
    ];

    const lowerLine = line.toLowerCase();
    return headerFooterKeywords.some((keyword) => lowerLine.includes(keyword));
  }

  private cleanDescription(description: string): string {
    // Remove special characters, extra spaces
    return description.replace(/[*#@]/g, '').replace(/\s+/g, ' ').trim();
  }
}
```

### Job Queue Processor

```typescript
// filepath: services/ocr/src/services/queue/processor.ts
import { Queue, Worker } from 'bullmq';
import { prisma } from '@pricy/database';
import { TesseractOCR } from '../ocr/tesseract';
import { GoogleVisionOCR } from '../ocr/google-vision';
import { ReceiptParser } from '../parser/receipt-parser';
import { logger } from '../../utils/logger';

interface OCRJob {
  receiptId: string;
  imageUrl: string;
}

export class OCRProcessor {
  private queue: Queue<OCRJob>;
  private worker: Worker<OCRJob>;
  private ocrProvider: any;
  private parser: ReceiptParser;

  constructor() {
    this.queue = new Queue('ocr-processing', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    // Select OCR provider
    this.ocrProvider =
      process.env.OCR_PROVIDER === 'google'
        ? new GoogleVisionOCR()
        : new TesseractOCR();

    this.parser = new ReceiptParser();

    this.worker = new Worker<OCRJob>(
      'ocr-processing',
      async (job) => {
        return this.processJob(job.data);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
        },
        concurrency: 5,
      }
    );

    this.worker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'OCR job completed');
    });

    this.worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, error: err }, 'OCR job failed');
    });
  }

  async addJob(data: OCRJob) {
    await this.queue.add('process-receipt', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }

  private async processJob(data: OCRJob) {
    const { receiptId, imageUrl } = data;

    try {
      // Update status
      await prisma.receipt.update({
        where: { id: receiptId },
        data: { status: 'processing' },
      });

      // Extract text
      const ocrResult = await this.ocrProvider.extractText(imageUrl);

      // Parse receipt
      const parsed = await this.parser.parse(ocrResult.text);

      // Save parsed data
      await this.saveReceiptData(receiptId, parsed);

      // Update status
      await prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: 'completed',
          rawOcrText: ocrResult.text,
        },
      });

      logger.info({ receiptId }, 'Receipt processed successfully');
    } catch (error) {
      logger.error({ receiptId, error }, 'Receipt processing failed');

      await prisma.receipt.update({
        where: { id: receiptId },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  private async saveReceiptData(receiptId: string, parsed: any) {
    // Find or create store
    let storeId: string | null = null;
    if (parsed.store) {
      const store = await prisma.store.upsert({
        where: { name: parsed.store.name },
        create: { name: parsed.store.name },
        update: {},
      });
      storeId = store.id;
    }

    // Update receipt with store and date
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        storeId,
        date: parsed.date,
        totalAmount: parsed.total,
      },
    });

    // Save items (will be normalized by Product Service)
    for (const item of parsed.items) {
      await prisma.receiptItem.create({
        data: {
          receiptId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
        },
      });
    }
  }

  async close() {
    await this.worker.close();
    await this.queue.close();
  }
}
```

### Image Preprocessing

```typescript
// filepath: services/ocr/src/utils/image.ts
import sharp from 'sharp';

export async function preprocessImage(buffer: Buffer): Promise<Buffer> {
  return (
    sharp(buffer)
      // Convert to grayscale
      .grayscale()
      // Increase contrast
      .normalize()
      // Sharpen
      .sharpen()
      // Resize if too large (max 2000px width)
      .resize(2000, null, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      // Convert to PNG for best OCR results
      .png()
      .toBuffer()
  );
}
```

## API Endpoints

```typescript
// filepath: services/ocr/src/routes/ocr.routes.ts
import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import * as ocrController from '../controllers/ocr.controller';

export default async function ocrRoutes(app: FastifyInstance) {
  app.post(
    '/process',
    {
      schema: {
        body: Type.Object({
          receiptId: Type.String({ format: 'uuid' }),
          imageUrl: Type.String({ format: 'uri' }),
        }),
      },
    },
    ocrController.processReceipt
  );

  app.get(
    '/status/:receiptId',
    {
      schema: {
        params: Type.Object({
          receiptId: Type.String({ format: 'uuid' }),
        }),
      },
    },
    ocrController.getStatus
  );
}
```

## Environment Variables

```bash
# filepath: services/ocr/.env.example
PORT=3001
NODE_ENV=development

# OCR Provider: tesseract | google | aws
OCR_PROVIDER=tesseract

# Google Cloud Vision
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Redis (for job queue)
REDIS_HOST=localhost
REDIS_PORT=6379

# Database
DATABASE_URL=postgresql://pricy:pricy@localhost:5432/pricy
```

## Performance Optimization

1. **Image Preprocessing**: Improves OCR accuracy by 20-30%
2. **Job Queue**: Process multiple receipts concurrently
3. **Caching**: Cache OCR results for duplicate images
4. **Provider Selection**: Use cloud OCR for better accuracy in production

## Testing

```typescript
// filepath: services/ocr/src/__tests__/parser.test.ts
import { test } from 'tap';
import { ReceiptParser } from '../services/parser/receipt-parser';

test('ReceiptParser - parse simple receipt', async (t) => {
  const parser = new ReceiptParser();
  const text = `
    WALMART
    123 Main St
    Date: 01/15/2024
    
    Apple Red 1kg     €2.50
    Bread             €1.99
    Milk 1L           €0.99
    
    Total:            €5.48
  `;

  const result = await parser.parse(text);

  t.equal(result.store?.name, 'walmart');
  t.equal(result.items.length, 3);
  t.equal(result.total, 5.48);
  t.end();
});
```

## Best Practices

1. Always preprocess images before OCR
2. Use job queues for async processing
3. Implement retry logic for failed jobs
4. Cache OCR results to save costs
5. Monitor OCR accuracy and adjust
6. Support multiple OCR providers
7. Validate and clean extracted data
