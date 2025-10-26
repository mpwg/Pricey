# Pricy Web App

Smart receipt scanning and price comparison PWA built with Next.js 16.

## 📦 Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **React**: 19+
- **TypeScript**: 5+
- **Styling**: Tailwind CSS v4+
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Notifications**: Sonner

## 🚀 Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- API Gateway running on `http://localhost:3001`

### Environment Variables

Create a `.env.local` file (copy from `.env.local.example`):

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
# Install dependencies (from monorepo root)
pnpm install

# Start dev server
pnpm --filter @pricy/web dev

# Or from this directory
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 📁 Project Structure

```
apps/web/
├── app/                    # Next.js app directory (routes)
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Home page (upload)
│   ├── not-found.tsx       # 404 page
│   ├── error.tsx           # Error boundary
│   └── receipts/           # Receipts routes
│       ├── page.tsx        # Receipt list
│       └── [id]/           # Receipt detail
│           └── page.tsx
├── components/             # React components
│   ├── layout/             # Header, Footer
│   ├── receipts/           # Receipt-related components
│   ├── upload/             # Upload form components
│   └── ui/                 # shadcn/ui components
├── hooks/                  # Custom React hooks
│   └── use-receipt-polling.ts
├── lib/                    # Utilities and API client
│   ├── api.ts              # API client
│   ├── format.ts           # Formatting utilities
│   └── utils.ts            # General utilities
└── public/                 # Static assets
```

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

## 🎨 Styling

This project uses Tailwind CSS v4 with a custom theme configuration in `app/globals.css`.

### Design Tokens

- Colors: Defined using OKLCH color space
- Spacing: 4px base unit (0.25rem)
- Border radius: Configurable via `--radius` CSS variable
- Typography: Inter font family

### Dark Mode

Dark mode is supported via Tailwind's `dark:` variant. Theme switching will be added in Phase 1.

## 📱 Routes

| Route            | Description                |
| ---------------- | -------------------------- |
| `/`              | Home page with upload form |
| `/receipts`      | List of all receipts       |
| `/receipts/[id]` | Receipt detail page        |

## 🔧 Available Scripts

| Script      | Description                          |
| ----------- | ------------------------------------ |
| `dev`       | Start development server (port 3000) |
| `build`     | Build for production                 |
| `start`     | Start production server              |
| `lint`      | Run ESLint                           |
| `typecheck` | Run TypeScript type checking         |
| `test`      | Run tests                            |
| `test:ui`   | Run tests with UI                    |
| `clean`     | Remove build artifacts               |

## 🚦 Development Workflow

1. **Start infrastructure** (from monorepo root):

   ```bash
   pnpm docker:dev
   ```

2. **Start API Gateway**:

   ```bash
   pnpm --filter @pricy/api-gateway dev
   ```

3. **Start web app**:

   ```bash
   pnpm --filter @pricy/web dev
   ```

4. **Make changes** and test locally

5. **Run tests**:

   ```bash
   pnpm test
   ```

6. **Run linting**:
   ```bash
   pnpm lint
   ```

## 🎯 Phase 0 (MVP) Status

### ✅ Completed Features

- [x] Receipt upload with drag & drop
- [x] Mobile camera capture support
- [x] Receipt list with chronological sorting
- [x] Receipt detail view with items
- [x] Real-time processing status updates
- [x] Error handling and user feedback
- [x] Responsive design (mobile-first)
- [x] Loading states and skeletons
- [x] Toast notifications

### ⚠️ Known Limitations (MVP Scope)

- No authentication (all receipts public)
- No pagination (shows all receipts)
- No manual OCR correction
- No search/filtering
- No offline support (deferred to Phase 1)
- Basic design system (full design in Phase 1)

## 🔗 Related Documentation

- [Copilot Instructions](../../.github/copilot-instructions.md)
- [Architecture Documentation](../../docs/architecture.md)
- [Phase 0 MVP Roadmap](../../docs/phases/phase-0-mvp/)
- [Testing Strategy](../../docs/guides/testing-strategy.md)

## 📄 License

AGPL-3.0 - See [LICENSE.md](../../LICENSE.md) for details.

Copyright (C) 2025 Matthias Wallner-Géhri
