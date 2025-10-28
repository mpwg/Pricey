# Frequently Asked Questions (FAQ)

## General Questions

### What is Pricey?

Pricey is an open-source receipt scanning and price comparison application that uses AI-powered vision models to automatically digitize your receipts. It helps you track your purchases and find the best deals across stores.

### Is Pricey free?

Yes! Pricey is completely free and open-source under the AGPL-3.0 license. You can use the hosted service at `pricey.mpwg.eu` or self-host it on your own infrastructure.

### What platforms does Pricey support?

Pricey is a Progressive Web App (PWA) that works on:

- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Android Chrome)
- Can be installed as an app on your device (Phase 1)

### Is Pricey available in my country?

Yes! Pricey works worldwide and supports multiple currencies. However, OCR accuracy may vary depending on the receipt format and language.

---

## Features & Functionality

### How accurate is the OCR?

Pricey achieves 85-99% accuracy depending on:

- Receipt quality and clarity
- Store format and layout
- LLM model used (GPT-5, Claude 4.5, or LLaVA)

You can review and edit extracted data manually (Phase 1+).

### What receipt formats are supported?

Pricey supports:

- **File Formats**: JPEG, PNG, WEBP
- **Max Size**: 10MB per image
- **Receipt Types**: Grocery stores, restaurants, retail, gas stations, etc.

### Can I track prices over time?

Price tracking is planned for Phase 1 (Q1 2025). Currently, Pricey focuses on receipt digitization.

### Does Pricey work offline?

Not yet. Offline support with PWA caching is planned for Phase 1.

---

## Privacy & Security

### Is my data secure?

Yes! Pricey takes security seriously:

- All data encrypted in transit (TLS/SSL)
- Images stored with encryption at rest
- Regular security audits
- No tracking cookies
- Privacy-friendly analytics (Plausible)

See our [Privacy Policy](/privacy) for details.

### Who can see my receipts?

**Phase 0 (MVP)**: All receipts are currently public (no authentication).

**Phase 1+**: Only you can see your receipts after we implement user authentication.

### Can I self-host Pricey?

Absolutely! Pricey is open-source (AGPL-3.0). See our [Self-Hosting Guide](https://github.com/mpwg/Pricey/blob/main/docs/guides/self-hosting.md) for instructions.

When you self-host:

- You have full control of your data
- No data is sent to our servers
- You can customize and modify the code

### What are the AGPL-3.0 license requirements?

AGPL-3.0 means:

- ✅ You can use Pricey for free
- ✅ You can modify the source code
- ✅ You can self-host it
- ⚠️ If you modify and host it publicly, you must share your modifications under AGPL-3.0

See the [LICENSE.md](https://github.com/mpwg/Pricey/blob/main/LICENSE.md) for full details.

---

## Technical Questions

### How long does receipt processing take?

Typically **5-30 seconds** depending on:

- Receipt complexity
- Number of items
- LLM provider (local Ollama vs cloud GitHub Models)
- Server load

### What LLM models does Pricey use?

Pricey supports multiple providers:

**Local (Ollama):**

- LLaVA (recommended)
- Llama 3.2 Vision
- Moondream

**Cloud (GitHub Models):**

- GPT-5 mini (fast, affordable)
- Claude Sonnet 4.5 (highest accuracy)
- Gemini 2.5 Pro

### Can I use my own LLM provider?

Yes! Pricey's architecture supports custom providers. See the [LLM Providers Guide](https://github.com/mpwg/Pricey/blob/main/docs/guides/llm-providers.md).

### What is the API rate limit?

- **API Requests**: 100 per minute per IP
- **Receipt Uploads**: 10 per hour per IP (Phase 0)

Rate limits will be per-user in Phase 1.

---

## Troubleshooting

### Why is my receipt processing stuck?

Common reasons:

1. **Large image size**: Images >10MB are rejected
2. **Invalid format**: Only JPEG, PNG, WEBP supported
3. **Server overload**: Wait a few minutes and try again
4. **LLM provider issue**: Check system status

Try refreshing the page or re-uploading.

### The OCR results are incorrect. What can I do?

**Phase 0**: Unfortunately, manual correction is not yet available.

**Phase 1+**: You'll be able to manually edit all extracted fields.

Tips for better results:

- Use high-resolution images
- Ensure good lighting and no blur
- Flatten the receipt (no creases)
- Crop to show only the receipt

### Can I delete my receipts?

**Phase 0**: Not yet. Contact us at [support@mpwg.eu](mailto:support@mpwg.eu).

**Phase 1+**: You'll be able to delete receipts from your account dashboard.

### The app is not loading. What should I do?

1. Check your internet connection
2. Try refreshing the page (Cmd+Shift+R or Ctrl+Shift+R)
3. Clear your browser cache
4. Try a different browser
5. Check GitHub Issues for known problems

If the problem persists, [report an issue](https://github.com/mpwg/Pricey/issues).

---

## Account & Billing

### Do I need an account to use Pricey?

**Phase 0**: No account needed! Just upload and use.

**Phase 1+**: You'll need to sign in with Google OAuth to save your receipts.

### Will Pricey always be free?

The core features will always be free and open-source. We may introduce premium features in the future (e.g., advanced analytics, bulk processing), but basic receipt scanning will remain free forever.

### How can I support the project?

- ⭐ Star the [GitHub repository](https://github.com/mpwg/Pricey)
- 🐛 Report bugs and suggest features
- 🤝 Contribute code or documentation
- ☕ Sponsor the project (coming soon)
- 📢 Spread the word on social media

---

## Development & Contribution

### How can I contribute to Pricey?

We welcome contributions! See our [Contributing Guide](https://github.com/mpwg/Pricey/blob/main/CONTRIBUTING.md).

Ways to contribute:

- Report bugs and suggest features
- Submit pull requests
- Improve documentation
- Translate to other languages (Phase 1+)
- Share your self-hosting experience

### What tech stack does Pricey use?

- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: Fastify 5, Node.js 24.10.0+
- **Database**: PostgreSQL 18 + Prisma 6
- **Cache**: Redis 8
- **Storage**: MinIO / S3
- **Queue**: BullMQ
- **Monorepo**: Turborepo + pnpm

### Where can I find the source code?

GitHub: [github.com/mpwg/Pricey](https://github.com/mpwg/Pricey)

---

## Roadmap & Future Plans

### What features are coming next?

**Phase 1 (Q1 2025):**

- User authentication (OAuth 2.0)
- Manual OCR correction
- Price tracking across stores
- Mobile app (PWA)
- Dark mode

**Phase 2 (Q2 2025):**

- Product normalization
- Store comparison
- Price alerts
- Export to CSV/Excel

See the full [Roadmap](https://github.com/mpwg/Pricey/blob/main/docs/ROADMAP.md).

### When will mobile apps be available?

Pricey is a Progressive Web App (PWA) that can be installed on your phone like a native app (Phase 1). Native iOS/Android apps are not currently planned.

### Will you add support for [feature]?

Check our [Roadmap](https://github.com/mpwg/Pricey/blob/main/docs/ROADMAP.md) and [GitHub Issues](https://github.com/mpwg/Pricey/issues). If your feature isn't listed, feel free to suggest it!

---

## Contact & Support

### How do I report a bug?

Please [open an issue](https://github.com/mpwg/Pricey/issues/new) on GitHub with:

- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser/device information

### How do I request a feature?

Please [open a feature request](https://github.com/mpwg/Pricey/issues/new?labels=enhancement) on GitHub.

### How can I get help?

- 📖 **Documentation**: [Pricey Docs](https://github.com/mpwg/Pricey/tree/main/docs)
- 💬 **GitHub Discussions**: [Discussions](https://github.com/mpwg/Pricey/discussions)
- 🐛 **GitHub Issues**: [Issues](https://github.com/mpwg/Pricey/issues)
- 📧 **Email**: [support@mpwg.eu](mailto:support@mpwg.eu)

---

## Still Have Questions?

If your question isn't answered here, please:

- Check the [Documentation](https://github.com/mpwg/Pricey/tree/main/docs)
- Search [GitHub Issues](https://github.com/mpwg/Pricey/issues)
- Ask in [GitHub Discussions](https://github.com/mpwg/Pricey/discussions)
- Email us at [support@mpwg.eu](mailto:support@mpwg.eu)

We're here to help! 😊
