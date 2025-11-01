/**
 * Landing page for Pricey web app
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

import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Demo } from '@/components/landing/demo';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricey - Smart Receipt Scanning & Price Comparison',
  description:
    'Never lose a receipt again. Scan, digitize, and track your purchases with AI-powered vision models. 85-99% accuracy, 100% open source, privacy first.',
  keywords: [
    'receipt scanning',
    'receipt OCR',
    'price comparison',
    'receipt tracker',
    'shopping tracker',
    'AI vision',
    'open source',
  ],
  openGraph: {
    title: 'Pricey - Smart Receipt Scanning & Price Comparison',
    description:
      'Scan, digitize, and track your purchases with AI-powered vision models.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Pricey - Smart Receipt Scanning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricey - Smart Receipt Scanning & Price Comparison',
    description:
      'Scan, digitize, and track your purchases with AI-powered vision models.',
    images: ['/og-image.png'],
  },
};

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Demo />
    </>
  );
}
