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

## Best Practices

1. **Always test offline functionality** in DevTools Network tab
2. **Optimize images** before upload to save bandwidth
3. **Use React Query** for all API calls
4. **Implement error boundaries** for graceful error handling
5. **Add loading states** for better UX
6. **Use TypeScript strictly** - no `any` types
7. **Follow accessibility guidelines** (WCAG 2.1)
8. **Test on real devices** for PWA functionality

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
