# Push Notifications Setup Guide

Enable push notifications for price alerts in your PWA.

## Prerequisites

- PWA installed (already configured with next-pwa)
- HTTPS in production (required for service workers)

## Setup Steps

### 1. Generate VAPID Keys

VAPID keys are needed for web push notifications.

```bash
npx web-push generate-vapid-keys
```

Save the output to your `.env`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-public-key"
VAPID_PRIVATE_KEY="your-private-key"
```

### 2. Install Web Push Library

```bash
npm install web-push
```

### 3. Create Notification Service

Create `src/lib/notifications.ts`:

```typescript
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendNotification(subscription: any, payload: any) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
```

### 4. Update Prisma Schema

Add to `prisma/schema.prisma`:

```prisma
model PushSubscription {
  id           String   @id @default(cuid())
  userId       String
  endpoint     String   @unique
  keys         Json
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("push_subscriptions")
}

// Update User model
model User {
  // ... existing fields ...
  pushSubscriptions PushSubscription[]
}
```

### 5. Create Subscription API Route

Create `src/app/api/notifications/subscribe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { userId, subscription } = await req.json();

  await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    },
  });

  return NextResponse.json({ success: true });
}
```

### 6. Client-Side Subscription

Create `src/components/NotificationButton.tsx`:

```typescript
"use client";

import { useState } from "react";
import Button from "./ui/Button";

export function NotificationButton({ userId }: { userId: string }) {
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, subscription }),
      });

      setSubscribed(true);
    } catch (error) {
      console.error("Subscription error:", error);
    }
  };

  return (
    <Button onClick={subscribe} disabled={subscribed}>
      {subscribed ? "Notifications Enabled" : "Enable Notifications"}
    </Button>
  );
}
```

### 7. Update Service Worker

Create `public/sw.js`:

```javascript
self.addEventListener("push", (event) => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    data: data.url,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
```

### 8. Send Price Alert Notification

Create `src/lib/price-alerts.ts`:

```typescript
import { prisma } from "./prisma";
import { sendNotification } from "./notifications";

export async function checkPriceAlerts(productId: string, newPrice: number) {
  const alerts = await prisma.priceAlert.findMany({
    where: {
      productId,
      targetPrice: { gte: newPrice },
      active: true,
      notified: false,
    },
    include: {
      user: {
        include: {
          pushSubscriptions: true,
        },
      },
      product: true,
    },
  });

  for (const alert of alerts) {
    const notification = {
      title: "Price Alert! 🏷️",
      body: `${alert.product.name} is now $${newPrice} (target: $${alert.targetPrice})`,
      url: `/products/${productId}`,
    };

    // Send to all user's devices
    for (const sub of alert.user.pushSubscriptions) {
      await sendNotification(
        {
          endpoint: sub.endpoint,
          keys: sub.keys,
        },
        notification
      );
    }

    // Mark as notified
    await prisma.priceAlert.update({
      where: { id: alert.id },
      data: { notified: true },
    });
  }
}
```

## Testing

1. Start dev server with HTTPS:

```bash
npm run dev -- --experimental-https
```

2. Request notification permission
3. Subscribe to push notifications
4. Send test notification:

```typescript
// In your API route or script
await sendNotification(subscription, {
  title: "Test",
  body: "Hello!",
  url: "/",
});
```

## Production Deployment

1. Ensure HTTPS is enabled
2. Configure environment variables
3. Test on actual devices (iOS requires add to home screen)

## Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox
- ✅ Safari (macOS 16.4+, iOS requires PWA installation)
- ❌ iOS Safari (in-browser, only works in installed PWA)

## Best Practices

1. Always ask permission with context
2. Don't spam users with too many notifications
3. Allow users to unsubscribe easily
4. Respect "Do Not Disturb" settings
5. Make notifications actionable
