# Monitoring & Observability Guide

> **Comprehensive monitoring strategy for Pricy application**  
> Last Updated: October 24, 2025

## Table of Contents

1. [Observability Overview](#observability-overview)
2. [Logging Strategy](#logging-strategy)
3. [Metrics & Monitoring](#metrics--monitoring)
4. [Distributed Tracing](#distributed-tracing)
5. [Error Tracking](#error-tracking)
6. [Performance Monitoring](#performance-monitoring)
7. [Alerting](#alerting)
8. [Dashboards](#dashboards)
9. [On-Call & Incident Response](#on-call--incident-response)

---

## Observability Overview

### The Three Pillars

Pricy implements comprehensive observability using the **three pillars**:

```
┌─────────────────────────────────────────────┐
│         OBSERVABILITY PILLARS               │
├─────────────────────────────────────────────┤
│  📝 LOGS          📊 METRICS      🔍 TRACES │
│  What happened    How much        Why slow  │
│  · Events         · Counters      · Spans   │
│  · Errors         · Gauges         · Flow   │
│  · Debugging      · Histograms    · Deps    │
└─────────────────────────────────────────────┘
```

### Technology Stack

| Component   | Tool                         | Purpose                      |
| ----------- | ---------------------------- | ---------------------------- |
| **Logs**    | Pino + Loki                  | Structured logging           |
| **Metrics** | Prometheus + Grafana         | Time-series metrics          |
| **Traces**  | OpenTelemetry + Jaeger       | Distributed tracing          |
| **APM**     | Sentry                       | Error tracking & performance |
| **Uptime**  | Uptime Robot                 | Service availability         |
| **RUM**     | Vercel Analytics / Plausible | Real user monitoring         |

---

## Logging Strategy

### Structured Logging with Pino

```typescript
// filepath: packages/logger/src/logger.ts
import pino from "pino";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      service: process.env.SERVICE_NAME,
      version: process.env.APP_VERSION,
    }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.token",
    ],
    remove: true,
  },
});

export default logger;
```

### Log Levels

| Level     | When to Use                                | Example                   |
| --------- | ------------------------------------------ | ------------------------- |
| **FATAL** | System crash, requires immediate attention | Database unreachable      |
| **ERROR** | Request failed, but system continues       | Failed to process receipt |
| **WARN**  | Unexpected but recoverable                 | Slow OCR response (>5s)   |
| **INFO**  | Important events                           | User uploaded receipt     |
| **DEBUG** | Detailed information for debugging         | OCR confidence scores     |
| **TRACE** | Very detailed information                  | Request/response payloads |

### Contextual Logging

```typescript
// filepath: apps/api/src/middleware/logger.middleware.ts
import logger from "@pricy/logger";
import { randomUUID } from "crypto";

export function requestLogger(
  req: FastifyRequest,
  reply: FastifyReply,
  done: Function
) {
  const requestId = randomUUID();

  // Attach request ID to request
  req.id = requestId;
  reply.header("X-Request-ID", requestId);

  // Create child logger with context
  req.log = logger.child({
    requestId,
    userId: req.user?.id,
    method: req.method,
    path: req.url,
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Log request
  req.log.info("Incoming request");

  // Log response
  reply.addHook("onResponse", () => {
    req.log.info(
      {
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      },
      "Request completed"
    );
  });

  done();
}
```

### Business Event Logging

```typescript
// filepath: apps/api/src/services/receipt.service.ts
export class ReceiptService {
  async createReceipt(data: CreateReceiptDto): Promise<Receipt> {
    logger.info(
      {
        event: "receipt.created",
        userId: data.userId,
        storeId: data.storeId,
        itemCount: data.items.length,
        totalAmount: data.totalAmount,
      },
      "Receipt created successfully"
    );

    try {
      const receipt = await prisma.receipt.create({ data });

      // Emit event for analytics
      await eventBus.emit("receipt.created", {
        receiptId: receipt.id,
        userId: data.userId,
        timestamp: new Date(),
      });

      return receipt;
    } catch (error) {
      logger.error(
        {
          event: "receipt.creation_failed",
          userId: data.userId,
          error: error.message,
          stack: error.stack,
        },
        "Failed to create receipt"
      );

      throw error;
    }
  }
}
```

### Log Aggregation (Grafana Loki)

```yaml
# filepath: docker-compose.monitoring.yml
version: "3.8"

services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      - loki-data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail-config.yaml:/etc/promtail/config.yaml
    command: -config.file=/etc/promtail/config.yaml
```

```yaml
# filepath: loki-config.yaml
auth_enabled: false

server:
  http_listen_port: 3100

ingester:
  lifecycler:
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
  chunk_idle_period: 5m
  chunk_retain_period: 30s

schema_config:
  configs:
    - from: 2024-01-01
      store: boltdb
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 168h

storage_config:
  boltdb:
    directory: /loki/index
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h
```

---

## Metrics & Monitoring

### Prometheus Metrics

```typescript
// filepath: packages/metrics/src/metrics.ts
import client from "prom-client";

// Register default metrics (CPU, memory, etc.)
client.collectDefaultMetrics();

// Custom metrics
export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

export const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
});

export const activeConnections = new client.Gauge({
  name: "active_connections",
  help: "Number of active connections",
});

export const receiptProcessingDuration = new client.Histogram({
  name: "receipt_processing_duration_seconds",
  help: "Time taken to process receipts",
  labelNames: ["ocr_provider", "status"],
  buckets: [1, 2, 5, 10, 30, 60],
});

export const databaseQueryDuration = new client.Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries",
  labelNames: ["operation", "table"],
  buckets: [0.001, 0.01, 0.1, 0.5, 1, 5],
});

export const queueSize = new client.Gauge({
  name: "queue_size",
  help: "Number of items in queue",
  labelNames: ["queue_name"],
});

// Business metrics
export const receiptsCreated = new client.Counter({
  name: "receipts_created_total",
  help: "Total number of receipts created",
  labelNames: ["store"],
});

export const ocrErrorRate = new client.Counter({
  name: "ocr_errors_total",
  help: "Total number of OCR errors",
  labelNames: ["provider", "error_type"],
});
```

### Metrics Middleware

```typescript
// filepath: apps/api/src/middleware/metrics.middleware.ts
import {
  httpRequestDuration,
  httpRequestTotal,
  activeConnections,
} from "@pricy/metrics";

export function metricsMiddleware(
  req: FastifyRequest,
  reply: FastifyReply,
  done: Function
) {
  const start = Date.now();

  activeConnections.inc();

  reply.addHook("onResponse", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.routerPath || req.url;

    httpRequestDuration
      .labels(req.method, route, reply.statusCode.toString())
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, reply.statusCode.toString())
      .inc();

    activeConnections.dec();
  });

  done();
}
```

### Prometheus Configuration

```yaml
# filepath: prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: "api-gateway"
    static_configs:
      - targets: ["api:3000"]
    metrics_path: "/metrics"

  - job_name: "ocr-service"
    static_configs:
      - targets: ["ocr-service:3001"]

  - job_name: "product-service"
    static_configs:
      - targets: ["product-service:3002"]

  - job_name: "postgres"
    static_configs:
      - targets: ["postgres-exporter:9187"]

  - job_name: "redis"
    static_configs:
      - targets: ["redis-exporter:9121"]

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]
```

---

## Distributed Tracing

### OpenTelemetry Setup

```typescript
// filepath: packages/tracing/src/tracing.ts
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.SERVICE_NAME || "pricy",
    [SemanticResourceAttributes.SERVICE_VERSION]:
      process.env.APP_VERSION || "1.0.0",
  }),
  traceExporter: new JaegerExporter({
    endpoint:
      process.env.JAEGER_ENDPOINT || "http://localhost:14268/api/traces",
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk
    .shutdown()
    .then(() => console.log("Tracing terminated"))
    .catch((error) => console.error("Error terminating tracing", error));
});
```

### Manual Span Creation

```typescript
// filepath: apps/api/src/services/receipt.service.ts
import { trace } from "@opentelemetry/api";

const tracer = trace.getTracer("receipt-service");

export class ReceiptService {
  async processReceipt(receiptId: string): Promise<Receipt> {
    const span = tracer.startSpan("processReceipt");

    try {
      span.setAttribute("receipt.id", receiptId);

      // OCR processing
      const ocrSpan = tracer.startSpan("ocr.process", {
        parent: span,
      });
      const ocrResult = await this.ocrService.processImage(receiptId);
      ocrSpan.setAttribute("ocr.confidence", ocrResult.confidence);
      ocrSpan.end();

      // Product matching
      const matchSpan = tracer.startSpan("product.match", {
        parent: span,
      });
      const products = await this.productService.matchProducts(ocrResult.items);
      matchSpan.setAttribute("product.count", products.length);
      matchSpan.end();

      span.setStatus({ code: SpanStatusCode.OK });
      return receipt;
    } catch (error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}
```

---

## Error Tracking

### Sentry Integration

```typescript
// filepath: apps/api/src/config/sentry.ts
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: `pricy@${process.env.APP_VERSION}`,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  profilesSampleRate: 1.0,

  integrations: [new ProfilingIntegration()],

  // Error filtering
  beforeSend(event, hint) {
    // Don't send validation errors
    if (hint.originalException?.name === "ValidationError") {
      return null;
    }

    // Scrub sensitive data
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }

    return event;
  },
});

// Express/Fastify error handler
export function sentryErrorHandler(error: Error, req: any, reply: any) {
  Sentry.captureException(error, {
    user: {
      id: req.user?.id,
      email: req.user?.email,
    },
    tags: {
      route: req.url,
      method: req.method,
    },
    extra: {
      body: req.body,
      query: req.query,
    },
  });
}
```

### Frontend Error Tracking

```typescript
// filepath: apps/web/src/lib/sentry.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Replay session
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Ignore common errors
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
  ],
});
```

---

## Performance Monitoring

### Application Performance Monitoring (APM)

```typescript
// filepath: apps/api/src/middleware/apm.middleware.ts
import { performance } from "perf_hooks";

export function performanceMonitoring(
  req: FastifyRequest,
  reply: FastifyReply,
  done: Function
) {
  const start = performance.now();

  reply.addHook("onResponse", () => {
    const duration = performance.now() - start;

    // Track slow requests
    if (duration > 1000) {
      logger.warn(
        {
          route: req.url,
          method: req.method,
          duration,
          userId: req.user?.id,
        },
        "Slow request detected"
      );
    }

    // Report to APM
    apm.recordTransaction({
      name: `${req.method} ${req.routerPath}`,
      type: "request",
      duration,
      result: reply.statusCode < 400 ? "success" : "error",
    });
  });

  done();
}
```

### Database Query Monitoring

```typescript
// filepath: packages/database/src/monitoring.ts
import { PrismaClient } from "@prisma/client";
import { databaseQueryDuration } from "@pricy/metrics";

const prisma = new PrismaClient();

// Prisma middleware for query monitoring
prisma.$use(async (params, next) => {
  const start = Date.now();

  try {
    const result = await next(params);
    const duration = (Date.now() - start) / 1000;

    databaseQueryDuration
      .labels(params.action, params.model || "unknown")
      .observe(duration);

    // Log slow queries
    if (duration > 1) {
      logger.warn(
        {
          model: params.model,
          action: params.action,
          duration,
        },
        "Slow database query"
      );
    }

    return result;
  } catch (error) {
    logger.error(
      {
        model: params.model,
        action: params.action,
        error: error.message,
      },
      "Database query failed"
    );
    throw error;
  }
});
```

---

## Alerting

### Alert Rules

```yaml
# filepath: alertmanager/alerts.yml
groups:
  - name: api_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec"

      # Slow response time
      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 2
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "API response time is slow"
          description: "95th percentile is {{ $value }}s"

      # High CPU usage
      - alert: HighCPUUsage
        expr: process_cpu_seconds_total > 0.8
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage"

      # Database connection pool exhausted
      - alert: DatabasePoolExhausted
        expr: database_connections_active >= database_connections_max * 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"

      # Queue backlog
      - alert: QueueBacklog
        expr: queue_size{queue_name="ocr"} > 1000
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "OCR queue backlog"
          description: "{{ $value }} items in queue"
```

### Notification Channels

```yaml
# filepath: alertmanager/config.yml
global:
  resolve_timeout: 5m

route:
  group_by: ["alertname", "severity"]
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 12h
  receiver: "default"

  routes:
    # Critical alerts -> PagerDuty + Slack
    - match:
        severity: critical
      receiver: "pagerduty-critical"
      continue: true

    - match:
        severity: critical
      receiver: "slack-critical"

    # Warnings -> Slack only
    - match:
        severity: warning
      receiver: "slack-warnings"

receivers:
  - name: "default"
    webhook_configs:
      - url: "http://localhost:5001/webhook"

  - name: "pagerduty-critical"
    pagerduty_configs:
      - service_key: "<PAGERDUTY_KEY>"
        severity: "critical"

  - name: "slack-critical"
    slack_configs:
      - api_url: "<SLACK_WEBHOOK_URL>"
        channel: "#alerts-critical"
        title: "🚨 CRITICAL ALERT"
        text: "{{ range .Alerts }}{{ .Annotations.description }}{{ end }}"

  - name: "slack-warnings"
    slack_configs:
      - api_url: "<SLACK_WEBHOOK_URL>"
        channel: "#alerts-warnings"
        title: "⚠️ Warning"
```

---

## Dashboards

### Grafana Dashboards

**API Overview Dashboard:**

```json
{
  "dashboard": {
    "title": "Pricy API Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status_code=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Active Connections",
        "targets": [
          {
            "expr": "active_connections",
            "legendFormat": "connections"
          }
        ]
      }
    ]
  }
}
```

### Custom Dashboards

1. **API Performance**

   - Request rate (RPS)
   - Error rate (%)
   - Response time percentiles (p50, p95, p99)
   - Active connections

2. **Business Metrics**

   - Receipts uploaded/hour
   - OCR success rate
   - Product match accuracy
   - User registrations

3. **Infrastructure**

   - CPU usage
   - Memory usage
   - Disk I/O
   - Network throughput

4. **Database**
   - Query latency
   - Connection pool usage
   - Slow queries
   - Lock wait time

---

## On-Call & Incident Response

### Incident Severity Levels

| Level    | Description              | Response Time     | Example              |
| -------- | ------------------------ | ----------------- | -------------------- |
| **SEV1** | Critical - Service down  | < 15 minutes      | Database unreachable |
| **SEV2** | High - Major degradation | < 1 hour          | API error rate > 10% |
| **SEV3** | Medium - Partial impact  | < 4 hours         | Slow OCR processing  |
| **SEV4** | Low - Minor issue        | Next business day | UI bug               |

### Runbooks

```markdown
# Runbook: High API Error Rate

## Symptoms

- Alert: HighErrorRate
- Error rate > 5% for 5 minutes
- Status code 5xx

## Investigation Steps

1. Check Grafana dashboard for affected endpoints
2. Review Sentry for error details
3. Check recent deployments
4. Review application logs in Loki

## Resolution Steps

1. If recent deployment:
   - Rollback: `kubectl rollout undo deployment/api`
2. If database issue:
   - Check database connections
   - Scale up connection pool
3. If external service:
   - Enable circuit breaker
   - Use fallback strategy

## Escalation

- If unresolved in 30 minutes: Page senior engineer
- If database-related: Page DBA
```

---

**Last Updated**: October 24, 2025  
**Maintained by**: Pricy DevOps Team  
**Review Schedule**: Quarterly
