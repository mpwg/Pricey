/**
 * Landing page demo section
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

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const screenshots = [
  {
    title: 'Upload Interface',
    description: 'Simple drag-and-drop or click to upload',
    image: '/screenshots/upload.png',
  },
  {
    title: 'Processing',
    description: 'Real-time status updates',
    image: '/screenshots/processing.png',
  },
  {
    title: 'Receipt Details',
    description: 'Clean, organized data view',
    image: '/screenshots/details.png',
  },
];

export function Demo() {
  const [activeScreenshot, setActiveScreenshot] = useState(0);

  return (
    <section id="demo" className="py-20 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            See It In Action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how Pricey digitizes your receipts in seconds
          </p>
        </div>

        {/* Demo Video Placeholder */}
        <div className="mx-auto mt-12 max-w-4xl">
          <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
            {/* TODO: Replace with actual demo video when available */}
            <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
              <svg
                className="h-16 w-16 text-muted-foreground"
                fill="none"
                strokeWidth={1.5}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold">
                  Demo Video Coming Soon
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We&apos;re preparing a comprehensive video demonstration
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/receipts">Try It Live Instead →</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Screenshots Gallery */}
        <div className="mx-auto mt-16 max-w-5xl">
          <h3 className="mb-8 text-center text-2xl font-bold">Screenshots</h3>

          <div className="grid gap-8 lg:grid-cols-3">
            {screenshots.map((screenshot, index) => (
              <button
                key={screenshot.title}
                onClick={() => setActiveScreenshot(index)}
                className={`group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-lg ${
                  activeScreenshot === index ? 'ring-2 ring-primary' : 'ring-0'
                }`}
              >
                {/* Placeholder for screenshot */}
                <div className="aspect-[3/4] bg-muted">
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl">{index + 1}</div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        Screenshot placeholder
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold">{screenshot.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {screenshot.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              📸 <strong>Note:</strong> Screenshots will be added before launch
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
