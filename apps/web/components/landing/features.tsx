/**
 * Landing page features section
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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Feature {
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: '📸',
    title: 'Easy Receipt Capture',
    description:
      'Take a photo with your phone or upload an existing image. Supports all major receipt formats.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Vision',
    description:
      'State-of-the-art vision models (GPT-5, Claude 4.5, LLaVA) analyze your receipts with 85-99% accuracy.',
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Asynchronous processing with BullMQ. Get results in seconds, not minutes.',
  },
  {
    icon: '💾',
    title: 'Automatic Digitization',
    description:
      'Extracts store name, purchase date, items, quantities, and prices automatically.',
  },
  {
    icon: '📊',
    title: 'Price Tracking',
    description:
      'Compare prices across stores and track trends over time to find the best deals.',
    badge: 'Coming Soon',
  },
  {
    icon: '🔒',
    title: 'Privacy First',
    description:
      'Self-hostable with AGPL-3.0 license. Your data stays under your control.',
  },
  {
    icon: '🌐',
    title: 'Multi-Provider LLM',
    description:
      'Choose between local Ollama models or cloud-based GitHub Models for flexibility.',
  },
  {
    icon: '📱',
    title: 'Progressive Web App',
    description:
      'Works on any device - desktop, mobile, or tablet. No app store required.',
    badge: 'Phase 1',
  },
  {
    icon: '🔄',
    title: 'Real-time Updates',
    description:
      'Monitor processing status with live updates and queue visibility.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 lg:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Everything You Need
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features to digitize and track all your purchases
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="text-4xl">{feature.icon}</div>
                  {feature.badge && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
