/**
 * Analytics tracking utility
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

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> }
    ) => void;
  }
}

/**
 * Track a custom event with Plausible Analytics
 * @param eventName - The name of the event (e.g., 'receipt_upload_completed')
 * @param properties - Optional properties to attach to the event
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') {
    return; // Server-side, do nothing
  }

  if (window.plausible) {
    window.plausible(eventName, properties ? { props: properties } : undefined);
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties);
  }
}

/**
 * Track page views automatically (handled by Plausible script)
 * This function is a no-op and exists for documentation purposes
 */
export function trackPageView(): void {
  // Plausible automatically tracks page views
  // No action needed
}

/**
 * Pre-defined events for consistency
 */
export const AnalyticsEvents = {
  // Receipt events
  RECEIPT_UPLOAD_STARTED: 'receipt_upload_started',
  RECEIPT_UPLOAD_COMPLETED: 'receipt_upload_completed',
  RECEIPT_UPLOAD_FAILED: 'receipt_upload_failed',
  RECEIPT_VIEWED: 'receipt_viewed',
  RECEIPT_LIST_VIEWED: 'receipt_list_viewed',

  // Landing page events
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  DEMO_WATCHED: 'demo_watched',
  CTA_CLICKED: 'cta_clicked',

  // Phase 1+ events (future)
  USER_SIGNED_UP: 'user_signed_up',
  USER_SIGNED_IN: 'user_signed_in',
  RECEIPT_EDITED: 'receipt_edited',
  RECEIPT_DELETED: 'receipt_deleted',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];
