/**
 * Privacy Policy page
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
  title: 'Privacy Policy - Pricey',
  description: 'Privacy policy for Pricey receipt scanning application',
};

export default function PrivacyPage() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-4xl prose prose-slate dark:prose-invert">
        <h1>Privacy Policy</h1>
        <p className="lead">
          Last updated: <time dateTime="2025-01-28">January 28, 2025</time>
        </p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to Pricey (&quot;we,&quot; &quot;our,&quot; or
          &quot;us&quot;). We are committed to protecting your privacy and
          handling your data in an open and transparent manner. This Privacy
          Policy explains how we collect, use, and protect your personal
          information when you use our receipt scanning and price comparison
          service.
        </p>
        <p>
          <strong>Note:</strong> Pricey is open-source software licensed under
          AGPL-3.0. If you self-host Pricey, you are the data controller and
          this privacy policy does not apply. This policy only applies to the
          hosted service at <code>pricey.mpwg.eu</code>.
        </p>

        <h2>2. Information We Collect</h2>
        <h3>2.1 Receipt Images and Data</h3>
        <ul>
          <li>
            <strong>Receipt Images:</strong> When you upload receipt images, we
            store them securely to enable OCR processing
          </li>
          <li>
            <strong>Extracted Data:</strong> Store names, purchase dates, items,
            quantities, and prices extracted from your receipts
          </li>
          <li>
            <strong>OCR Metadata:</strong> Processing time, confidence scores,
            and provider used (Ollama or GitHub Models)
          </li>
        </ul>

        <h3>2.2 Technical Information</h3>
        <ul>
          <li>IP address and approximate location</li>
          <li>Browser type and version</li>
          <li>Device type and operating system</li>
          <li>Timestamps of actions</li>
        </ul>

        <h3>2.3 Phase 1+ (Future)</h3>
        <p>When authentication is added, we will also collect:</p>
        <ul>
          <li>Email address (via OAuth providers)</li>
          <li>Profile information from OAuth providers (name, avatar)</li>
          <li>Account creation and last login timestamps</li>
        </ul>

        <h2>3. How We Use Your Information</h2>
        <p>We use the collected information for:</p>
        <ul>
          <li>
            Processing and analyzing your receipt images using OCR/LLM models
          </li>
          <li>Providing price comparison and tracking features (Phase 1+)</li>
          <li>Improving our service and fixing bugs</li>
          <li>Monitoring system performance and usage patterns</li>
          <li>Complying with legal obligations</li>
        </ul>

        <h2>4. Data Storage and Security</h2>
        <h3>4.1 Where We Store Data</h3>
        <ul>
          <li>
            <strong>Images:</strong> S3-compatible storage (MinIO or AWS S3)
            with encryption at rest
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL with SSL/TLS encrypted
            connections
          </li>
          <li>
            <strong>Cache:</strong> Redis for temporary session data
          </li>
        </ul>

        <h3>4.2 Security Measures</h3>
        <ul>
          <li>TLS/SSL encryption for all data in transit</li>
          <li>Encrypted storage for images and database</li>
          <li>Regular security audits and updates</li>
          <li>Rate limiting to prevent abuse</li>
          <li>Access controls and authentication (Phase 1+)</li>
        </ul>

        <h2>5. Third-Party Services</h2>
        <p>We use the following third-party services:</p>
        <ul>
          <li>
            <strong>Ollama (Local LLM):</strong> For local receipt parsing - no
            data leaves our servers
          </li>
          <li>
            <strong>GitHub Models (Cloud LLM):</strong> For cloud-based receipt
            parsing - subject to{' '}
            <a
              href="https://github.com/marketplace/models/azure-openai/gpt-4o-mini"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub&apos;s privacy policy
            </a>
          </li>
          <li>
            <strong>Sentry (Error Tracking):</strong> For monitoring errors -
            subject to{' '}
            <a
              href="https://sentry.io/privacy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sentry&apos;s privacy policy
            </a>
          </li>
          <li>
            <strong>Plausible Analytics:</strong> Privacy-friendly analytics -
            no cookies, no personal data tracking
          </li>
        </ul>

        <h2>6. Data Retention</h2>
        <ul>
          <li>
            <strong>Receipt Images:</strong> Retained indefinitely unless you
            request deletion
          </li>
          <li>
            <strong>Extracted Data:</strong> Retained indefinitely unless you
            request deletion
          </li>
          <li>
            <strong>Access Logs:</strong> Retained for 90 days
          </li>
          <li>
            <strong>Error Logs:</strong> Retained for 30 days
          </li>
        </ul>

        <h2>7. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>
            <strong>Access:</strong> Request a copy of all data we hold about
            you
          </li>
          <li>
            <strong>Deletion:</strong> Request deletion of your data (Phase 1+
            with authentication)
          </li>
          <li>
            <strong>Rectification:</strong> Correct inaccurate data
          </li>
          <li>
            <strong>Portability:</strong> Export your data in JSON format
          </li>
          <li>
            <strong>Object:</strong> Object to certain processing activities
          </li>
        </ul>
        <p>
          To exercise these rights, please contact us at{' '}
          <a href="mailto:privacy@mpwg.eu">privacy@mpwg.eu</a>.
        </p>

        <h2>8. Cookies and Tracking</h2>
        <p>
          <strong>Phase 0 (MVP):</strong> We do not use cookies for tracking. We
          use Plausible Analytics which is privacy-friendly and does not use
          cookies.
        </p>
        <p>
          <strong>Phase 1+:</strong> We will use strictly necessary cookies for
          authentication (HTTP-only, secure cookies).
        </p>

        <h2>9. Self-Hosting</h2>
        <p>
          Pricey is open-source (AGPL-3.0) and can be self-hosted. When you
          self-host Pricey:
        </p>
        <ul>
          <li>You are the data controller and processor</li>
          <li>This privacy policy does not apply</li>
          <li>You are responsible for your own data protection compliance</li>
          <li>No data is sent to us</li>
        </ul>
        <p>
          See our{' '}
          <a href="https://github.com/mpwg/Pricey/blob/main/docs/guides/self-hosting.md">
            self-hosting guide
          </a>{' '}
          for more information.
        </p>

        <h2>10. Children&apos;s Privacy</h2>
        <p>
          Pricey is not intended for children under 13 years of age. We do not
          knowingly collect personal information from children under 13.
        </p>

        <h2>11. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by updating the &quot;Last updated&quot; date at
          the top of this policy.
        </p>

        <h2>12. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact
          us:
        </p>
        <ul>
          <li>
            Email: <a href="mailto:privacy@mpwg.eu">privacy@mpwg.eu</a>
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

        <h2>13. GDPR Compliance (EU Users)</h2>
        <p>
          For users in the European Union, we comply with the General Data
          Protection Regulation (GDPR):
        </p>
        <ul>
          <li>
            <strong>Legal Basis:</strong> Legitimate interest for service
            provision
          </li>
          <li>
            <strong>Data Processing:</strong> Data is processed in accordance
            with GDPR
          </li>
          <li>
            <strong>DPO Contact:</strong>{' '}
            <a href="mailto:dpo@mpwg.eu">dpo@mpwg.eu</a>
          </li>
          <li>
            <strong>Supervisory Authority:</strong> You have the right to lodge
            a complaint with your local data protection authority
          </li>
        </ul>
      </div>
    </div>
  );
}
