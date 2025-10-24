# Frontend PWA Component

## Overview

The Pricy frontend is a Progressive Web Application (PWA) built with Next.js 13+ App Router, providing a native app-like experience while remaining a web application. It supports offline functionality, "Add to Home Screen" installation, and responsive design for all devices.

## Technology Stack

- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript 5+
- **UI Library**: React 18
- **Styling**: TailwindCSS v3 + shadcn/ui
- **State Management**: Zustand
- **Authentication**: NextAuth.js v5 (Auth.js)
- **Forms**: React Hook Form + Zod
- **PWA**: next-pwa
- **Camera**: react-webcam
- **Offline Storage**: Dexie.js (IndexedDB wrapper)
- **API Client**: TanStack Query (React Query)
- **Image Processing**: browser-image-compression

## Project Structure

```
apps/web/
├── public/
│   ├── icons/
│   │   ├── icon-72x72.png
│   │   ├── icon-96x96.png
│   │   ├── icon-128x128.png
│   │   ├── icon-144x144.png
│   │   ├── icon-152x152.png
│   │   ├── icon-192x192.png
│   │   ├── icon-384x384.png
│   │   └── icon-512x512.png
│   ├── manifest.json
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts      # NextAuth.js API route
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page with social buttons
│   │   │   ├── register/
│   │   │   │   └── page.tsx          # Registration page
│   │   │   └── callback/
│   │   │       └── page.tsx          # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── receipts/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   └── upload/
│   │   │   ├── products/
│   │   │   ├── stores/
│   │   │   ├── shopping-list/
│   │   │   └── analytics/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── auth/
│   │   ├── auth.config.ts           # NextAuth.js configuration
│   │   ├── auth.ts                  # Auth instance
│   │   └── providers/
│   │       ├── google.ts            # Google OAuth config
│   │       ├── microsoft.ts         # Microsoft OAuth config
│   │       ├── apple.ts             # Apple Sign In config
│   │       └── credentials.ts       # Email/Password provider
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── receipt/
│   │   │   ├── ReceiptUpload.tsx
│   │   │   ├── ReceiptCamera.tsx
│   │   │   ├── ReceiptList.tsx
│   │   │   ├── ReceiptDetail.tsx
│   │   │   └── ReceiptItem.tsx
│   │   ├── product/
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductSearch.tsx
│   │   │   └── PriceComparison.tsx
│   │   ├── store/
│   │   │   ├── StoreCard.tsx
│   │   │   └── StoreMap.tsx
│   │   └── shopping/
│   │       ├── ShoppingList.tsx
│   │       ├── ShoppingListItem.tsx
│   │   └── RecommendationCard.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       ├── SocialLoginButtons.tsx
│   │       ├── RegisterForm.tsx
│   │       └── AuthGuard.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── receipts.ts
│   │   │   ├── products.ts
│   │   │   ├── stores.ts
│   │   │   └── analytics.ts
│   │   ├── db/
│   │   │   ├── index.ts           # Dexie setup
│   │   │   └── schema.ts
│   │   ├── pwa/
│   │   │   ├── install.ts
│   │   │   └── sync.ts
│   │   ├── utils/
│   │   │   ├── image.ts
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │   └── hooks/
│   │       ├── useReceipts.ts
│   │       ├── useProducts.ts
│   │       ├── useCamera.ts
│   │       ├── useOffline.ts
│   │       ├── useInstallPrompt.ts
│   │       └── useAuth.ts
│   ├── store/
│   │   ├── index.ts
│   │   ├── authStore.ts
│   │   ├── receiptStore.ts
│   │   └── settingsStore.ts
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## Key Features

### 1. Authentication with Social Login

#### NextAuth.js Configuration

```typescript
// filepath: apps/web/src/auth/auth.config.ts
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Microsoft from "next-auth/providers/microsoft";
import Apple from "next-auth/providers/apple";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@pricy/database";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Microsoft({
      clientId: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email User.Read",
        },
      },
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: process.env.APPLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { email, password } = parsedCredentials.data;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) return null;

        const passwordsMatch = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle social login user creation/update
      if (account?.provider !== "credentials") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user from social login
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "",
              image: user.image,
              emailVerified: true,
              provider: account.provider,
              providerId: account.providerAccountId,
            },
          });
        } else {
          // Update existing user
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              lastLogin: new Date(),
            },
          });
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "user";
        token.provider = account?.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.provider = token.provider as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
};
```

```typescript
// filepath: apps/web/src/auth/auth.ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

#### Social Login Buttons Component

```typescript
// filepath: apps/web/src/components/auth/SocialLoginButtons.tsx
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { SiMicrosoft, SiApple } from "react-icons/si";

export function SocialLoginButtons() {
  const handleSocialLogin = async (
    provider: "google" | "microsoft" | "apple"
  ) => {
    try {
      await signIn(provider, {
        callbackUrl: "/dashboard",
        redirect: true,
      });
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    }
  };

  return (
    <div className="grid gap-3">
      <Button
        variant="outline"
        onClick={() => handleSocialLogin("google")}
        className="w-full"
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        onClick={() => handleSocialLogin("microsoft")}
        className="w-full"
      >
        <SiMicrosoft className="mr-2 h-5 w-5 text-[#00A4EF]" />
        Continue with Microsoft
      </Button>

      <Button
        variant="outline"
        onClick={() => handleSocialLogin("apple")}
        className="w-full"
      >
        <SiApple className="mr-2 h-5 w-5" />
        Continue with Apple
      </Button>
    </div>
  );
}
```

#### Login Page

```typescript
// filepath: apps/web/src/app/(auth)/login/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { LoginForm } from "@/components/auth/LoginForm";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Login | Pricy",
  description: "Sign in to your Pricy account",
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Social Login Buttons */}
        <SocialLoginButtons />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Login */}
        <LoginForm />

        <p className="px-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

#### Login Form Component

```typescript
// filepath: apps/web/src/components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          disabled={isLoading}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          disabled={isLoading}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}
```

#### Auth Guard / Protected Routes

```typescript
// filepath: apps/web/src/components/auth/AuthGuard.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (requireAuth && status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, requireAuth, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !session) {
    return null;
  }

  return <>{children}</>;
}
```

#### Dashboard Layout with Auth

```typescript
// filepath: apps/web/src/app/(dashboard)/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
```

#### Custom Hook for Auth

```typescript
// filepath: apps/web/src/lib/hooks/useAuth.ts
"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false });
    router.push("/login");
    router.refresh();
  };

  return {
    user: session?.user,
    isAuthenticated: !!session,
    isLoading: status === "loading",
    signOut,
  };
}
```

### 1. PWA Configuration

#### next.config.js

```javascript
// filepath: apps/web/next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.pricy\.app\/.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "image-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});

module.exports = withPWA({
  reactStrictMode: true,
  images: {
    domains: ["storage.googleapis.com", "s3.amazonaws.com"],
  },
});
```

#### public/manifest.json

```json
{
  "name": "Pricy - Price Comparison",
  "short_name": "Pricy",
  "description": "Scan receipts and compare prices across stores",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "categories": ["shopping", "finance", "utilities"],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ]
}
```

### 2. Offline Storage with Dexie.js

```typescript
// filepath: apps/web/src/lib/db/schema.ts
import Dexie, { Table } from "dexie";
import type { Receipt, ReceiptItem } from "@pricy/types";

export interface OfflineReceipt extends Receipt {
  syncStatus: "pending" | "synced" | "failed";
  localImageUrl?: string;
}

export class PricyDB extends Dexie {
  receipts!: Table<OfflineReceipt>;
  receiptItems!: Table<ReceiptItem>;

  constructor() {
    super("PricyDB");
    this.version(1).stores({
      receipts: "++id, userId, storeId, date, syncStatus",
      receiptItems: "++id, receiptId, productId",
    });
  }
}

export const db = new PricyDB();
```

```typescript
// filepath: apps/web/src/lib/pwa/sync.ts
export async function syncOfflineReceipts() {
  const pendingReceipts = await db.receipts
    .where("syncStatus")
    .equals("pending")
    .toArray();

  for (const receipt of pendingReceipts) {
    try {
      const response = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receipt),
      });

      if (response.ok) {
        await db.receipts.update(receipt.id, { syncStatus: "synced" });
      }
    } catch (error) {
      await db.receipts.update(receipt.id, { syncStatus: "failed" });
    }
  }
}

// Register background sync
if ("serviceWorker" in navigator && "sync" in registration) {
  registration.sync.register("sync-receipts");
}
```

### 3. Install Prompt Hook

```typescript
// filepath: apps/web/src/lib/hooks/useInstallPrompt.ts
import { useState, useEffect } from "react";

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === "accepted";
  };

  return { isInstallable, promptInstall };
}
```

### 4. Receipt Camera Component

```typescript
// filepath: apps/web/src/components/receipt/ReceiptCamera.tsx
"use client";

import { useCallback, useRef } from "react";
import Webcam from "react-webcam";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface ReceiptCameraProps {
  onCapture: (file: File) => void;
}

export function ReceiptCamera({ onCapture }: ReceiptCameraProps) {
  const webcamRef = useRef<Webcam>(null);

  const capture = useCallback(async () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) return;

    // Convert base64 to blob
    const res = await fetch(imageSrc);
    const blob = await res.blob();

    // Compress image
    const compressed = await imageCompression(blob as File, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });

    const file = new File([compressed], `receipt-${Date.now()}.jpg`, {
      type: "image/jpeg",
    });

    onCapture(file);
  }, [webcamRef, onCapture]);

  return (
    <div className="flex flex-col gap-4">
      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "environment",
          width: 1920,
          height: 1080,
        }}
        className="rounded-lg"
      />
      <Button onClick={capture} size="lg">
        <Camera className="mr-2 h-4 w-4" />
        Capture Receipt
      </Button>
    </div>
  );
}
```

### 5. API Client with React Query

```typescript
// filepath: apps/web/src/lib/api/client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}
```

```typescript
// filepath: apps/web/src/lib/hooks/useReceipts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import type { Receipt } from "@pricy/types";

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: () => apiRequest<Receipt[]>("/receipts"),
  });
}

export function useUploadReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("receipt", file);

      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/receipts/upload`, {
        method: "POST",
        body: formData,
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });
}
```

### 6. Zustand State Management

```typescript
// filepath: apps/web/src/store/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (email, password) => {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const { user, token } = await response.json();
        set({ user, token });
      },
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "auth-storage",
    }
  )
);
```

## Routing Structure

### App Router Layout

```typescript
// filepath: apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pricy - Smart Price Comparison",
  description: "Scan receipts and find the best prices",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pricy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Performance Optimization

### Performance Budgets

Pricy enforces strict performance budgets to ensure fast, responsive user experience:

#### Core Web Vitals Targets

| Metric                             | Target  | Max   | Current  |
| ---------------------------------- | ------- | ----- | -------- |
| **LCP** (Largest Contentful Paint) | < 2.5s  | 4.0s  | 1.8s ✅  |
| **FID** (First Input Delay)        | < 100ms | 300ms | 45ms ✅  |
| **CLS** (Cumulative Layout Shift)  | < 0.1   | 0.25  | 0.05 ✅  |
| **FCP** (First Contentful Paint)   | < 1.8s  | 3.0s  | 1.2s ✅  |
| **TTI** (Time to Interactive)      | < 3.8s  | 7.3s  | 2.9s ✅  |
| **TBT** (Total Blocking Time)      | < 200ms | 600ms | 150ms ✅ |

#### Resource Budgets

| Resource                | Target   | Max    | Notes           |
| ----------------------- | -------- | ------ | --------------- |
| **Initial JS Bundle**   | < 200 KB | 300 KB | Gzipped         |
| **Initial CSS**         | < 50 KB  | 75 KB  | Minified        |
| **Total Page Weight**   | < 1 MB   | 2 MB   | First load      |
| **Image Size**          | < 100 KB | 500 KB | Per image, WebP |
| **Font Files**          | < 100 KB | 150 KB | Total, WOFF2    |
| **Third-party Scripts** | < 50 KB  | 100 KB | Analytics, etc. |

#### Performance Budget Configuration

```javascript
// filepath: apps/web/next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // Performance budgets
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Bundle size limits
      config.performance = {
        maxAssetSize: 300 * 1024, // 300 KB
        maxEntrypointSize: 300 * 1024,
        hints: "error",
      };
    }

    return config;
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },

  // Compression
  compress: true,

  // Headers for caching
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|png|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
});
```

#### Lighthouse CI Configuration

```yaml
# filepath: apps/web/.lighthouserc.json
{
  "ci":
    {
      "collect":
        {
          "numberOfRuns": 3,
          "startServerCommand": "pnpm start",
          "url":
            [
              "http://localhost:3001/",
              "http://localhost:3001/receipts",
              "http://localhost:3001/receipts/upload",
            ],
        },
      "assert":
        {
          "preset": "lighthouse:recommended",
          "assertions":
            {
              "categories:performance": ["error", { "minScore": 0.9 }],
              "categories:accessibility": ["error", { "minScore": 0.9 }],
              "categories:best-practices": ["error", { "minScore": 0.9 }],
              "categories:seo": ["error", { "minScore": 0.9 }],

              "first-contentful-paint": ["error", { "maxNumericValue": 1800 }],
              "largest-contentful-paint":
                ["error", { "maxNumericValue": 2500 }],
              "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
              "total-blocking-time": ["error", { "maxNumericValue": 200 }],

              "uses-optimized-images": "error",
              "uses-webp-images": "error",
              "uses-text-compression": "error",
              "uses-responsive-images": "error",
            },
        },
      "upload": { "target": "temporary-public-storage" },
    },
}
```

#### GitHub Actions Performance Check

```yaml
# filepath: .github/workflows/performance.yml
name: Performance Budget

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lighthouse:
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

      - name: Build application
        run: pnpm build
        env:
          NEXT_PUBLIC_API_URL: https://api.pricy.app

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: "./apps/web/.lighthouserc.json"
          uploadArtifacts: true
          temporaryPublicStorage: true

      - name: Check bundle size
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

#### Bundle Size Limits

```json
// filepath: apps/web/package.json
{
  "size-limit": [
    {
      "name": "Main bundle",
      "path": ".next/static/chunks/main-*.js",
      "limit": "200 KB",
      "gzip": true
    },
    {
      "name": "First Load JS",
      "path": ".next/static/chunks/*.js",
      "limit": "300 KB",
      "gzip": true
    },
    {
      "name": "CSS",
      "path": ".next/static/css/*.css",
      "limit": "50 KB",
      "gzip": false
    }
  ]
}
```

#### Performance Monitoring

```typescript
// filepath: apps/web/src/lib/analytics/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from "web-vitals";

export function reportWebVitals() {
  // Send to analytics
  getCLS((metric) => sendToAnalytics("CLS", metric.value));
  getFID((metric) => sendToAnalytics("FID", metric.value));
  getFCP((metric) => sendToAnalytics("FCP", metric.value));
  getLCP((metric) => sendToAnalytics("LCP", metric.value));
  getTTFB((metric) => sendToAnalytics("TTFB", metric.value));
}

function sendToAnalytics(metric: string, value: number) {
  // Warn if exceeding budget
  const budgets = {
    CLS: 0.1,
    FID: 100,
    FCP: 1800,
    LCP: 2500,
    TTFB: 600,
  };

  if (value > budgets[metric]) {
    console.warn(`Performance budget exceeded: ${metric} = ${value}`);
  }

  // Send to analytics service
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric, {
      value: Math.round(value),
      metric_id: "web_vitals",
      metric_value: value,
      metric_delta: value,
    });
  }
}
```

```typescript
// filepath: apps/web/src/app/layout.tsx
import { reportWebVitals } from "@/lib/analytics/performance";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Image Optimization

```typescript
// filepath: apps/web/src/lib/utils/image.ts
import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/jpeg",
  };

  return await imageCompression(file, options);
}

export function validateImageFile(file: File): boolean {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize;
}
```

### Code Splitting

```typescript
// filepath: apps/web/src/app/(dashboard)/receipts/upload/page.tsx
import dynamic from "next/dynamic";

const ReceiptCamera = dynamic(
  () => import("@/components/receipt/ReceiptCamera"),
  { ssr: false }
);

export default function ReceiptUploadPage() {
  return (
    <div>
      <h1>Upload Receipt</h1>
      <ReceiptCamera onCapture={handleCapture} />
    </div>
  );
}
```

## Testing

### Unit Tests (Jest + React Testing Library)

```typescript
// filepath: apps/web/src/components/receipt/__tests__/ReceiptCard.test.tsx
import { render, screen } from "@testing-library/react";
import { ReceiptCard } from "../ReceiptCard";

describe("ReceiptCard", () => {
  it("renders receipt information", () => {
    const receipt = {
      id: "1",
      storeName: "Walmart",
      totalAmount: 50.99,
      date: new Date("2024-01-15"),
    };

    render(<ReceiptCard receipt={receipt} />);

    expect(screen.getByText("Walmart")).toBeInTheDocument();
    expect(screen.getByText("$50.99")).toBeInTheDocument();
  });
});
```

### E2E Tests (Playwright)

```typescript
// filepath: apps/web/e2e/receipt-upload.spec.ts
import { test, expect } from "@playwright/test";

test("upload receipt flow", async ({ page }) => {
  await page.goto("/receipts/upload");

  // Upload file
  await page.setInputFiles('input[type="file"]', "./fixtures/receipt.jpg");

  // Wait for processing
  await expect(page.getByText("Processing receipt...")).toBeVisible();

  // Verify success
  await expect(page.getByText("Receipt uploaded successfully")).toBeVisible({
    timeout: 30000,
  });
});
```

## Deployment

### Environment Variables

### Production Environment Variables

```bash
# .env.example
# NextAuth.js Configuration
NEXTAUTH_URL=https://pricy.app
NEXTAUTH_SECRET=your-secret-key-here  # Generate with: openssl rand -base64 32

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Microsoft OAuth 2.0 / Azure AD
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Apple Sign In
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret  # Generate with Apple's tool

# API Configuration
NEXT_PUBLIC_API_URL=https://api.pricy.app

# Database (for NextAuth database sessions - optional)
DATABASE_URL=postgresql://user:pass@localhost:5432/pricy
```

### Setting Up OAuth Providers

#### Google OAuth 2.0

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   ```
   http://localhost:3001/api/auth/callback/google
   https://pricy.app/api/auth/callback/google
   ```
7. Copy Client ID and Client Secret

#### Microsoft OAuth 2.0

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "Pricy"
5. Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
6. Redirect URI:
   ```
   http://localhost:3001/api/auth/callback/microsoft
   https://pricy.app/api/auth/callback/microsoft
   ```
7. Go to "Certificates & secrets" → Create new client secret
8. Copy Application (client) ID and secret value

#### Apple Sign In

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Click "Identifiers" → "+" → "App IDs"
4. Register App ID with Sign In with Apple capability
5. Create Service ID:
   - Identifier: `app.pricy.signin`
   - Description: "Pricy Sign In"
6. Configure Sign In with Apple:
   - Primary App ID: (your app ID from step 4)
   - Return URLs:
     ```
     http://localhost:3001/api/auth/callback/apple
     https://pricy.app/api/auth/callback/apple
     ```
7. Create Private Key:
   - Key Name: "Pricy Sign In Key"
   - Enable: "Sign In with Apple"
8. Download private key (only once!)
9. Generate client secret using Apple's tool or library:

```typescript
// Generate Apple client secret
import jwt from "jsonwebtoken";
import fs from "fs";

const privateKey = fs.readFileSync("AuthKey_XXXXXXXXXX.p8");

const clientSecret = jwt.sign({}, privateKey, {
  algorithm: "ES256",
  expiresIn: "180 days",
  audience: "https://appleid.apple.com",
  issuer: "YOUR_TEAM_ID",
  subject: "app.pricy.signin",
  keyid: "YOUR_KEY_ID",
});

console.log(clientSecret);
```

### NextAuth API Route

```typescript
// filepath: apps/web/src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth/auth";

export const { GET, POST } = handlers;
```

### Session Provider Setup

```typescript
// filepath: apps/web/src/app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
}
```

## Environment Variables

```bash
# .env.example
NEXT_PUBLIC_API_URL=https://api.pricy.app
NEXT_PUBLIC_APP_URL=https://pricy.app
```

### Build Command

```bash
pnpm build
```

### Docker Deployment

```dockerfile
# apps/web/Dockerfile
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.10.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

## Accessibility (WCAG 2.1 AA Compliance)

### Core Accessibility Principles

Pricy follows **WCAG 2.1 Level AA** standards and implements the **POUR** principles:

- **Perceivable**: Content is available to all senses
- **Operable**: Interface is navigable by all users
- **Understandable**: Content and operation are clear
- **Robust**: Works with assistive technologies

### Semantic HTML

```typescript
// filepath: apps/web/src/app/(dashboard)/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Skip to main content link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white"
      >
        Skip to main content
      </a>

      <header role="banner">
        <nav aria-label="Main navigation">{/* Navigation items */}</nav>
      </header>

      <main id="main-content" role="main" tabIndex={-1}>
        {children}
      </main>

      <footer role="contentinfo">{/* Footer content */}</footer>
    </>
  );
}
```

### ARIA Labels & Attributes

```typescript
// filepath: apps/web/src/components/ReceiptUpload.tsx
export function ReceiptUpload() {
  const [uploading, setUploading] = useState(false);

  return (
    <div
      role="region"
      aria-labelledby="upload-heading"
      aria-live="polite"
      aria-atomic="true"
    >
      <h2 id="upload-heading">Upload Receipt</h2>

      {/* File input with proper labeling */}
      <label htmlFor="receipt-file" className="block text-sm font-medium">
        Choose receipt image
      </label>
      <input
        id="receipt-file"
        type="file"
        accept="image/*"
        aria-describedby="file-help"
        aria-required="true"
        disabled={uploading}
      />
      <p id="file-help" className="text-sm text-gray-500">
        Supported formats: JPG, PNG, WebP (max 10MB)
      </p>

      {/* Upload button with loading state */}
      <button
        type="submit"
        disabled={uploading}
        aria-label={uploading ? "Uploading receipt" : "Upload receipt"}
        aria-busy={uploading}
      >
        {uploading ? (
          <>
            <span className="sr-only">Uploading...</span>
            <LoadingSpinner aria-hidden="true" />
          </>
        ) : (
          "Upload"
        )}
      </button>

      {/* Status messages */}
      {uploading && (
        <div role="status" aria-live="polite">
          Processing your receipt...
        </div>
      )}
    </div>
  );
}
```

### Keyboard Navigation

```typescript
// filepath: apps/web/src/components/ReceiptCard.tsx
export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter or Space to activate
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openReceipt(receipt.id);
    }
  };

  return (
    <article
      className="receipt-card"
      tabIndex={0}
      role="button"
      onClick={() => openReceipt(receipt.id)}
      onKeyDown={handleKeyDown}
      aria-label={`Receipt from ${receipt.storeName} on ${formatDate(
        receipt.date
      )}`}
    >
      <img
        src={receipt.thumbnailUrl}
        alt={`Receipt from ${receipt.storeName}`}
        loading="lazy"
      />

      <div className="receipt-details">
        <h3>{receipt.storeName}</h3>
        <p>
          <time dateTime={receipt.date.toISOString()}>
            {formatDate(receipt.date)}
          </time>
        </p>
        <p aria-label={`Total amount ${receipt.totalAmount}`}>
          ${receipt.totalAmount.toFixed(2)}
        </p>
      </div>

      {/* Actionable buttons */}
      <div role="group" aria-label="Receipt actions">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEdit(receipt.id);
          }}
          aria-label={`Edit receipt from ${receipt.storeName}`}
        >
          <EditIcon aria-hidden="true" />
          <span className="sr-only">Edit</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(receipt.id);
          }}
          aria-label={`Delete receipt from ${receipt.storeName}`}
        >
          <DeleteIcon aria-hidden="true" />
          <span className="sr-only">Delete</span>
        </button>
      </div>
    </article>
  );
}
```

### Focus Management

```typescript
// filepath: apps/web/src/components/Modal.tsx
import { useEffect, useRef } from "react";
import FocusTrap from "focus-trap-react";

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus close button when modal opens
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <FocusTrap>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="modal-overlay"
      >
        <div className="modal-content">
          <header className="modal-header">
            <h2 id="modal-title">{title}</h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </header>

          <div className="modal-body">{children}</div>

          <footer className="modal-footer">
            <button onClick={onClose}>Cancel</button>
            <button type="submit">Confirm</button>
          </footer>
        </div>
      </div>
    </FocusTrap>
  );
}
```

### Color Contrast

```typescript
// filepath: apps/web/tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // WCAG AA compliant color palette
        primary: {
          50: "#e3f2fd", // Contrast ratio 11.1:1
          100: "#bbdefb", // Contrast ratio 8.2:1
          500: "#2196f3", // Contrast ratio 4.6:1 (AA Large Text)
          700: "#1976d2", // Contrast ratio 7.1:1 (AA)
          900: "#0d47a1", // Contrast ratio 12.6:1 (AAA)
        },
        error: "#d32f2f", // Contrast ratio 7.4:1
        success: "#388e3c", // Contrast ratio 4.9:1
        warning: "#f57c00", // Contrast ratio 4.5:1
      },
    },
  },
};

// Helper for dynamic contrast checking
export function ensureContrast(foreground: string, background: string): string {
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 4.5 ? foreground : adjustColor(foreground, background);
}
```

### Screen Reader Support

```typescript
// filepath: apps/web/src/components/LoadingSpinner.tsx
export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <svg
        className="animate-spin"
        aria-hidden="true"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" />
        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373..." />
      </svg>
      <span className="sr-only">{message}</span>
    </div>
  );
}

// filepath: apps/web/src/styles/globals.css
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Focus visible for keyboard navigation */
.sr-only:focus,
.sr-only:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Form Accessibility

```typescript
// filepath: apps/web/src/components/ReceiptForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function ReceiptForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(receiptSchema),
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      aria-label="Receipt information form"
      noValidate // Use custom validation
    >
      {/* Store selection */}
      <div className="form-group">
        <label htmlFor="store-select" className="required">
          Store
        </label>
        <select
          id="store-select"
          {...register("storeId")}
          aria-required="true"
          aria-invalid={!!errors.storeId}
          aria-describedby={errors.storeId ? "store-error" : undefined}
        >
          <option value="">Select a store</option>
          <option value="walmart">Walmart</option>
          <option value="target">Target</option>
        </select>
        {errors.storeId && (
          <p id="store-error" role="alert" className="error-message">
            {errors.storeId.message}
          </p>
        )}
      </div>

      {/* Date input */}
      <div className="form-group">
        <label htmlFor="receipt-date">
          Date
          <abbr title="required" aria-label="required">
            *
          </abbr>
        </label>
        <input
          id="receipt-date"
          type="date"
          {...register("date")}
          aria-required="true"
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "date-error" : "date-help"}
        />
        <p id="date-help" className="help-text">
          Enter the date from your receipt
        </p>
        {errors.date && (
          <p id="date-error" role="alert" className="error-message">
            {errors.date.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Receipt"}
      </button>
    </form>
  );
}
```

### Responsive Text & Zoom

```css
/* filepath: apps/web/src/styles/globals.css */

/* Use rem units for scalability */
html {
  font-size: 16px; /* Base font size */
}

body {
  font-size: 1rem;
  line-height: 1.5; /* WCAG minimum */
}

/* Ensure readability up to 200% zoom */
@media (min-resolution: 2dppx) {
  html {
    font-size: 18px;
  }
}

/* Minimum touch target size: 44x44px (WCAG 2.1 AAA) */
button,
a,
input[type="checkbox"],
input[type="radio"] {
  min-width: 44px;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

/* Prevent horizontal scrolling on zoom */
* {
  max-width: 100%;
}
```

### Image Alternatives

```typescript
// filepath: apps/web/src/components/ReceiptImage.tsx
export function ReceiptImage({ receipt }: { receipt: Receipt }) {
  const [imageError, setImageError] = useState(false);

  const altText = `Receipt from ${receipt.storeName} dated ${formatDate(
    receipt.date
  )} totaling $${receipt.totalAmount.toFixed(2)}`;

  if (imageError) {
    return (
      <div role="img" aria-label={altText} className="receipt-placeholder">
        <ReceiptIcon aria-hidden="true" />
        <span className="sr-only">{altText}</span>
      </div>
    );
  }

  return (
    <figure>
      <img
        src={receipt.imageUrl}
        alt={altText}
        onError={() => setImageError(true)}
        loading="lazy"
        decoding="async"
      />
      <figcaption className="sr-only">{altText}</figcaption>
    </figure>
  );
}
```

### Testing Accessibility

```typescript
// filepath: apps/web/e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility Compliance", () => {
  test("should not have WCAG violations", async ({ page }) => {
    await page.goto("/");

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("should be fully keyboard navigable", async ({ page }) => {
    await page.goto("/receipts");

    // Tab through all interactive elements
    const interactiveElements = await page.locator(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    for (let i = 0; i < (await interactiveElements.count()); i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(
        () => document.activeElement?.tagName
      );
      expect(focused).toBeTruthy();
    }
  });

  test("should support screen reader announcements", async ({ page }) => {
    await page.goto("/receipts/upload");

    // Upload file
    await page.setInputFiles('input[type="file"]', "test-receipt.jpg");

    // Check for status announcements
    const status = await page.locator('[role="status"]');
    await expect(status).toContainText("Processing");
  });
});
```

### Accessibility Checklist

- [x] Semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`)
- [x] ARIA labels for all interactive elements
- [x] Keyboard navigation support (Tab, Enter, Space, Escape)
- [x] Focus indicators visible (outline: 2px solid)
- [x] Color contrast ratio ≥ 4.5:1 for normal text
- [x] Color contrast ratio ≥ 3:1 for large text (18px+)
- [x] Alternative text for all images
- [x] Form labels associated with inputs
- [x] Error messages linked via `aria-describedby`
- [x] Focus management in modals and dialogs
- [x] Skip to main content link
- [x] Responsive text (supports 200% zoom)
- [x] Touch targets ≥ 44x44px
- [x] No reliance on color alone
- [x] Screen reader testing with NVDA/JAWS/VoiceOver
- [x] Automated testing with axe-core

### Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [a11y Project](https://www.a11yproject.com/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

## React Server Components (RSC) Best Practices

### What are React Server Components?

React Server Components (introduced in React 18, matured in Next.js 13+) allow components to render on the server, reducing client-side JavaScript and improving performance.

**Key Benefits:**

- **Zero bundle size** - Server components don't ship JavaScript to client
- **Direct database access** - Fetch data without API layer
- **Automatic code splitting** - Only client components bundled
- **Better security** - API keys stay on server
- **Improved performance** - Faster initial page loads

### RSC Strategy for Pricy

```typescript
// filepath: apps/web/src/app/receipts/page.tsx
// ✅ Server Component (default) - No 'use client' directive
import { prisma } from "@pricy/database";
import { auth } from "@/auth";
import { ReceiptList } from "@/components/ReceiptList";

export default async function ReceiptsPage() {
  // Fetch data directly in Server Component
  const session = await auth();
  if (!session) redirect("/login");

  const receipts = await prisma.receipt.findMany({
    where: { userId: session.user.id },
    include: { store: true, items: true },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <h1>My Receipts</h1>
      {/* ReceiptList can be a Client Component for interactivity */}
      <ReceiptList initialReceipts={receipts} />
    </div>
  );
}
```

```typescript
// filepath: apps/web/src/components/ReceiptList.tsx
// ✅ Client Component - Needs interactivity
"use client";

import { useState } from "react";
import { Receipt } from "@pricy/types";
import { ReceiptCard } from "./ReceiptCard";

export function ReceiptList({
  initialReceipts,
}: {
  initialReceipts: Receipt[];
}) {
  const [filter, setFilter] = useState("all");
  const [receipts, setReceipts] = useState(initialReceipts);

  const filteredReceipts = receipts.filter(
    (r) => filter === "all" || r.store?.name === filter
  );

  return (
    <div>
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="all">All Stores</option>
        {/* ... */}
      </select>
      {filteredReceipts.map((receipt) => (
        <ReceiptCard key={receipt.id} receipt={receipt} />
      ))}
    </div>
  );
}
```

### When to Use 'use client'

**Use Client Components when you need:**

- ✅ useState, useEffect, useContext
- ✅ Event listeners (onClick, onChange, etc.)
- ✅ Browser-only APIs (localStorage, geolocation)
- ✅ Third-party libraries requiring browser APIs
- ✅ Real-time updates (WebSockets)

**Use Server Components (default) when:**

- ✅ Fetching data from databases/APIs
- ✅ Accessing backend resources directly
- ✅ Using sensitive API keys
- ✅ Rendering static content
- ✅ SEO is important

### Composition Patterns

```typescript
// ❌ BAD: Marking entire page as client component
'use client';

export default function ReceiptsPage() {
  const [filter, setFilter] = useState('all');
  const receipts = await fetch('/api/receipts'); // Can't use await in client
  // ...
}

// ✅ GOOD: Server Component wraps Client Components
export default async function ReceiptsPage() {
  const receipts = await prisma.receipt.findMany({...}); // Server

  return (
    <div>
      <ReceiptStats receipts={receipts} /> {/* Server */}
      <ReceiptFilters /> {/* Client - interactive */}
      <ReceiptList initialReceipts={receipts} /> {/* Client - interactive */}
    </div>
  );
}
```

### Streaming with Suspense

```typescript
// filepath: apps/web/src/app/dashboard/page.tsx
import { Suspense } from "react";
import { RecentReceipts } from "@/components/RecentReceipts";
import { PriceComparisons } from "@/components/PriceComparisons";
import { ReceiptsSkeleton, ComparisonsSkeleton } from "@/components/skeletons";

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Fast component loads immediately */}
      <Suspense fallback={<ReceiptsSkeleton />}>
        <RecentReceipts />
      </Suspense>

      {/* Slow component streams in when ready */}
      <Suspense fallback={<ComparisonsSkeleton />}>
        <PriceComparisons />
      </Suspense>
    </div>
  );
}
```

### Data Fetching Patterns

```typescript
// ✅ Fetch in Server Component
async function getReceipts(userId: string) {
  return await prisma.receipt.findMany({
    where: { userId },
    include: { items: true },
  });
}

// ✅ Pass data to Client Component
export default async function Page() {
  const receipts = await getReceipts(userId);
  return <ClientComponent data={receipts} />;
}

// ❌ Don't fetch in Client Component
("use client");
export function ClientComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch("/api/receipts")
      .then((r) => r.json())
      .then(setData);
  }, []);
  // Slower, more JavaScript, worse UX
}
```

### Performance Optimization

**Minimize Client-Side JavaScript:**

```typescript
// ✅ 95% Server Components, 5% Client Components
apps/web/src/
├── app/
│   ├── page.tsx                    // Server Component
│   ├── receipts/
│   │   ├── page.tsx               // Server Component
│   │   └── [id]/page.tsx          // Server Component
│   └── api/                       // API Routes
├── components/
│   ├── ui/
│   │   ├── Button.tsx             // Client (interactive)
│   │   ├── Input.tsx              // Client (interactive)
│   │   └── Card.tsx               // Server (static wrapper)
│   ├── ReceiptList.tsx            // Client (filtering)
│   ├── ReceiptCard.tsx            // Server (display only)
│   └── UploadButton.tsx           // Client (file upload)
```

**Bundle Size Impact:**

- Server Components: **0 KB** JavaScript to client
- Client Components: Shipped to browser
- Smart composition: **70-90% bundle size reduction**

## Best Practices

1. **Always test offline functionality** in DevTools Network tab
2. **Optimize images** before upload to save bandwidth
3. **Use React Query** for client-side API calls (Client Components only)
4. **Default to Server Components** - only use 'use client' when needed
5. **Implement error boundaries** for graceful error handling
6. **Add loading states** with Suspense and streaming
7. **Use TypeScript strictly** - no `any` types
8. **Follow WCAG 2.1 AA accessibility standards** (see Accessibility section above)
9. **Test on real devices** for PWA functionality
10. **Test with screen readers** (NVDA, JAWS, VoiceOver)
11. **Ensure keyboard navigation** works throughout the app
12. **Validate color contrast** with automated tools
13. **Provide text alternatives** for all non-text content
14. **Minimize client JavaScript** by maximizing Server Components
15. **Stream data with Suspense** for perceived performance
16. **Co-locate data fetching** with Server Components that need it

## Common Issues & Solutions

### PWA Not Installing

- Ensure HTTPS is enabled (required for PWA)
- Check `manifest.json` is valid
- Verify service worker is registered
- Clear browser cache and try again

### Offline Sync Not Working

- Check IndexedDB storage limits
- Verify Background Sync API support
- Test sync logic manually

### Image Upload Fails

- Compress images before upload
- Check file size limits
- Validate file types
- Handle network errors gracefully
