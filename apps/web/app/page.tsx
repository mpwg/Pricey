/**
 * Home page with upload form for Pricey web app
 * Copyright (C) 2025 Matthias Wallner-Géhri
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { UploadForm } from '@/components/upload/upload-form';

export default function Home() {
  return (
    <div className="container py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Smart Receipt Scanning
          </h1>
          <p className="text-lg text-muted-foreground sm:text-xl">
            Track your purchases and compare prices across stores
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Upload a Receipt</h2>
          <UploadForm />
        </div>

        {/* Features Section */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-semibold">📸 Easy Capture</h3>
            <p className="text-sm text-muted-foreground">
              Take a photo with your phone or upload an existing image
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">🤖 Auto-Extract</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered OCR extracts items, prices, and store info
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">📊 Track & Compare</h3>
            <p className="text-sm text-muted-foreground">
              View your purchase history and find the best deals
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
