/**
 * Terms of Service page
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

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - Pricey',
  description: 'Terms of service for Pricey receipt scanning application',
};

export default function TermsPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl prose prose-slate dark:prose-invert">
        <h1>Terms of Service</h1>
        <p className="lead">
          Last updated: <time dateTime="2025-01-28">January 28, 2025</time>
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using Pricey (&quot;the Service&quot;), you accept
          and agree to be bound by these Terms of Service (&quot;Terms&quot;).
          If you do not agree to these Terms, please do not use the Service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Pricey is a receipt scanning and price comparison service that uses
          optical character recognition (OCR) and large language models (LLMs)
          to extract and digitize information from receipt images. The Service
          is currently in MVP phase (Phase 0).
        </p>

        <h3>2.1 Open Source Software</h3>
        <p>
          Pricey is open-source software licensed under the{' '}
          <a
            href="https://www.gnu.org/licenses/agpl-3.0.en.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            GNU Affero General Public License v3.0 (AGPL-3.0)
          </a>
          . You can view, modify, and self-host the source code at{' '}
          <a
            href="https://github.com/mpwg/Pricey"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/mpwg/Pricey
          </a>
          .
        </p>

        <h2>3. User Obligations</h2>
        <p>You agree to:</p>
        <ul>
          <li>Provide accurate information when using the Service</li>
          <li>
            Only upload receipt images that you own or have permission to use
          </li>
          <li>Not use the Service for any illegal or unauthorized purpose</li>
          <li>
            Not attempt to gain unauthorized access to any part of the Service
          </li>
          <li>
            Not abuse, harass, threaten, or intimidate other users or our team
          </li>
          <li>Not transmit any viruses, malware, or other malicious code</li>
          <li>Not scrape, spider, or crawl the Service</li>
        </ul>

        <h2>4. Acceptable Use Policy</h2>
        <h3>4.1 Prohibited Uses</h3>
        <p>You may not use the Service to:</p>
        <ul>
          <li>Upload illegal, harmful, or offensive content</li>
          <li>Infringe on intellectual property rights</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Attempt to reverse engineer or decompile the Service</li>
          <li>
            Overload or disrupt the Service (e.g., DDoS attacks, excessive API
            requests)
          </li>
        </ul>

        <h3>4.2 Rate Limits</h3>
        <p>To ensure fair usage, we impose rate limits:</p>
        <ul>
          <li>API requests: 100 requests per minute per IP address</li>
          <li>Receipt uploads: 10 uploads per hour per IP address (Phase 0)</li>
        </ul>

        <h2>5. Intellectual Property</h2>
        <h3>5.1 Your Content</h3>
        <p>
          You retain all rights to the receipt images and data you upload
          (&quot;Your Content&quot;). By uploading Content, you grant us a
          non-exclusive, worldwide license to process and store Your Content for
          the purpose of providing the Service.
        </p>

        <h3>5.2 Our Software</h3>
        <p>
          The Pricey software is licensed under AGPL-3.0. You are free to use,
          modify, and distribute the software in accordance with the license
          terms. See the{' '}
          <a
            href="https://github.com/mpwg/Pricey/blob/main/LICENSE.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            LICENSE.md
          </a>{' '}
          file for details.
        </p>

        <h2>6. Data and Privacy</h2>
        <p>
          Your use of the Service is also governed by our{' '}
          <a href="/privacy">Privacy Policy</a>. Please review it carefully.
        </p>

        <h2>7. Disclaimer of Warranties</h2>
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTY OF ANY
          KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
          IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>We do not guarantee that:</p>
        <ul>
          <li>The Service will be uninterrupted or error-free</li>
          <li>The OCR results will be 100% accurate</li>
          <li>All features will work as expected (this is an MVP)</li>
          <li>Your data will be permanently retained</li>
        </ul>

        <h2>8. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
          INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
          LOSSES RESULTING FROM:
        </p>
        <ul>
          <li>Your use or inability to use the Service</li>
          <li>Any unauthorized access to or use of our servers</li>
          <li>
            Any bugs, viruses, or other harmful code transmitted through the
            Service
          </li>
          <li>Any errors or omissions in the OCR results or extracted data</li>
        </ul>

        <h2>9. Indemnification</h2>
        <p>
          You agree to indemnify and hold harmless Pricey, its developers,
          contributors, and affiliates from any claims, damages, losses,
          liabilities, costs, and expenses (including reasonable attorney&apos;s
          fees) arising from:
        </p>
        <ul>
          <li>Your use of the Service</li>
          <li>Your violation of these Terms</li>
          <li>Your violation of any rights of another user or third party</li>
        </ul>

        <h2>10. Termination</h2>
        <h3>10.1 By You</h3>
        <p>
          You may stop using the Service at any time. In Phase 1+, you will be
          able to delete your account and all associated data.
        </p>

        <h3>10.2 By Us</h3>
        <p>
          We reserve the right to suspend or terminate your access to the
          Service at any time, for any reason, including but not limited to:
        </p>
        <ul>
          <li>Violation of these Terms</li>
          <li>Fraudulent, abusive, or illegal activity</li>
          <li>Excessive use that affects other users</li>
        </ul>

        <h2>11. Changes to the Service</h2>
        <p>
          We reserve the right to modify or discontinue the Service (or any part
          thereof) at any time with or without notice. We are currently in MVP
          phase and expect significant changes as we develop the Service.
        </p>

        <h2>12. Changes to Terms</h2>
        <p>
          We may revise these Terms from time to time. We will notify you of any
          changes by updating the &quot;Last updated&quot; date at the top of
          this page. Continued use of the Service after changes constitutes
          acceptance of the revised Terms.
        </p>

        <h2>13. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of [Your Jurisdiction], without regard to its conflict of law
          provisions.
        </p>

        <h2>14. Dispute Resolution</h2>
        <p>
          Any disputes arising from these Terms or your use of the Service shall
          first be attempted to be resolved through good-faith negotiation. If
          negotiation fails, disputes shall be resolved through binding
          arbitration in accordance with the rules of [Arbitration Provider].
        </p>

        <h2>15. Severability</h2>
        <p>
          If any provision of these Terms is found to be unenforceable or
          invalid, that provision will be limited or eliminated to the minimum
          extent necessary, and the remaining provisions will remain in full
          force and effect.
        </p>

        <h2>16. Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire
          agreement between you and Pricey regarding the use of the Service.
        </p>

        <h2>17. Contact Information</h2>
        <p>If you have any questions about these Terms, please contact us:</p>
        <ul>
          <li>
            Email: <a href="mailto:legal@mpwg.eu">legal@mpwg.eu</a>
          </li>
          <li>
            GitHub:{' '}
            <a
              href="https://github.com/mpwg/Pricey/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/mpwg/Pricey/issues
            </a>
          </li>
        </ul>

        <h2>18. MVP Phase Disclaimer</h2>
        <p>
          <strong>IMPORTANT:</strong> Pricey is currently in MVP phase (Phase
          0). This means:
        </p>
        <ul>
          <li>Features are limited and may not work perfectly</li>
          <li>There is no user authentication yet (planned for Phase 1)</li>
          <li>Data may be lost during updates or migrations</li>
          <li>
            The Service is intended for early adopters and testing purposes
          </li>
          <li>We may make breaking changes without notice</li>
        </ul>
        <p>
          <strong>
            DO NOT use the Service for critical or sensitive data during the MVP
            phase.
          </strong>
        </p>

        <hr />
        <p className="text-sm text-muted-foreground">
          By using Pricey, you acknowledge that you have read, understood, and
          agree to be bound by these Terms of Service.
        </p>
      </div>
    </div>
  );
}
