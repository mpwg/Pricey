# Launch Announcement Templates

## Twitter/X Post

🎉 Excited to launch Pricey - an open-source receipt scanner & price tracker!

📸 Snap receipts, auto-digitize with AI
🤖 Powered by GPT-5, Claude 4.5 & LLaVA
📊 85-99% accuracy
🔒 Privacy-first, AGPL-3.0 licensed
🚀 Self-hostable

Try it now: https://pricey.mpwg.eu

#opensource #AI #receipts #pricetracking

---

## LinkedIn Post

I'm thrilled to announce the launch of Pricey - a smart receipt scanning and price comparison application! 🎉

**What is Pricey?**

Pricey uses state-of-the-art vision models (GPT-5 mini, Claude Sonnet 4.5, LLaVA) to automatically digitize your receipts with 85-99% accuracy. No more manually entering purchases or losing paper receipts!

**Why I built this:**

I was frustrated with losing receipts and manually tracking expenses. I wanted a privacy-first, open-source solution that leverages the latest AI technology while giving users full control of their data.

**Key Features:**

- 📸 Easy receipt capture (phone or desktop)
- 🤖 AI-powered OCR with multi-provider support
- ⚡ Fast processing (5-30 seconds)
- 🔒 Privacy-first with self-hosting option
- 💯 100% open-source (AGPL-3.0)

**Tech Stack:**

Built with Next.js 16, Fastify 5, PostgreSQL 18, Prisma 6, BullMQ, and integrated with Ollama (local) and GitHub Models (cloud) for flexibility.

**Try it out:**

🌐 Live demo: https://pricey.mpwg.eu
💻 Source code: https://github.com/mpwg/Pricey
📖 Documentation: https://github.com/mpwg/Pricey/tree/main/docs

This is just the MVP (Phase 0) - price tracking, user authentication, and manual correction are coming in Phase 1 (Q1 2025).

I'd love your feedback! What features would you like to see?

#opensource #AI #receipts #webdev #typescript #nextjs #fastify #postgresql

---

## Reddit Post (r/selfhosted)

**[Project] Pricey - Open-source receipt scanner with AI-powered OCR**

Hey r/selfhosted! I just launched Pricey, an open-source receipt scanning and price comparison app that I thought you might appreciate.

**TL;DR:**

- Scan receipts with AI (GPT-5, Claude 4.5, or local LLaVA)
- 85-99% accuracy, fully self-hostable
- AGPL-3.0 licensed, Docker Compose setup
- Tech: Next.js, Fastify, PostgreSQL, Prisma, BullMQ

**Why self-host?**

- Full control of your purchase data
- Run local Ollama models (no cloud dependencies)
- Customize and extend as needed
- No privacy concerns

**Links:**

- Live demo: https://pricey.mpwg.eu
- GitHub: https://github.com/mpwg/Pricey
- Self-hosting guide: https://github.com/mpwg/Pricey/blob/main/docs/guides/self-hosting.md

**Current Status:**

Phase 0 MVP is live. Phase 1 (Q1 2025) will add user authentication, manual correction, and price tracking.

**Looking for:**

- Beta testers and feedback
- Contributors (all skill levels welcome!)
- Feature suggestions

Happy to answer any questions!

---

## Product Hunt Launch

**Tagline:**

Never lose a receipt again - AI-powered receipt scanner & price tracker

**Description:**

Pricey is an open-source Progressive Web App that uses state-of-the-art vision models to automatically digitize your receipts. Stop manually entering purchases or losing paper receipts!

**Key Features:**

📸 Easy Capture - Take photos or upload images from any device
🤖 AI-Powered OCR - 85-99% accuracy with GPT-5, Claude 4.5, or local LLaVA
⚡ Lightning Fast - Get results in 5-30 seconds
🔒 Privacy First - Self-hostable with AGPL-3.0 license
🌍 Multi-Provider - Choose between local Ollama or cloud GitHub Models
📊 Price Tracking - Compare prices across stores (coming Phase 1)

**Built with modern tech:**

- Next.js 16 + React 19
- Fastify 5 + Node.js 24+
- PostgreSQL 18 + Prisma 6
- BullMQ for async processing
- Docker Compose for easy deployment

**Perfect for:**

- Anyone tired of losing receipts
- Budget-conscious shoppers
- Self-hosters who want data control
- Developers interested in AI/OCR

**Open Source:**

100% free and open-source under AGPL-3.0. View, modify, and self-host the code at github.com/mpwg/Pricey

Try the live demo at pricey.mpwg.eu or deploy your own instance in minutes!

---

## Email Announcement (to beta testers)

**Subject**: 🎉 Pricey is Live! Try the MVP Now

Hi [Name],

I'm excited to announce that Pricey, the AI-powered receipt scanner we've been working on, is now live!

**What's New:**

✅ Live MVP at https://pricey.mpwg.eu
✅ Upload and scan receipts instantly
✅ AI-powered extraction with 85-99% accuracy
✅ View your receipt history

**How You Can Help:**

As an early adopter, your feedback is invaluable! Please:

1. Try uploading a few receipts
2. Let me know what works well and what doesn't
3. Report any bugs or issues
4. Suggest features you'd like to see

**Give Feedback:**

- Email: feedback@mpwg.eu
- GitHub Issues: github.com/mpwg/Pricey/issues
- Quick Survey: [survey link]

**What's Next:**

Phase 1 (Q1 2025) will bring:

- User authentication
- Manual correction of OCR results
- Price tracking across stores
- Mobile PWA

**Share the Love:**

If you like Pricey, please:

- ⭐ Star the repo: github.com/mpwg/Pricey
- 📢 Share on social media
- 🤝 Invite friends to try it

Thank you for being an early supporter! Your feedback will shape the future of Pricey.

Best regards,
[Your Name]

P.S. Pricey is 100% open-source (AGPL-3.0). You can self-host it too! See the docs: github.com/mpwg/Pricey/tree/main/docs

---

## GitHub Release Notes

**Release v0.1.0 - MVP Launch** 🎉

**Phase 0: MVP is here!**

After weeks of development, I'm thrilled to release Pricey v0.1.0 - the first public MVP!

**Features:**

- 📸 Receipt image upload (JPEG, PNG, WEBP)
- 🤖 AI-powered OCR with multi-provider support:
  - Ollama (local): LLaVA, Llama 3.2 Vision, Moondream
  - GitHub Models (cloud): GPT-5 mini, Claude Sonnet 4.5, Gemini 2.5 Pro
- 💾 Automatic extraction of store, date, items, prices (85-99% accuracy)
- 📊 Receipt list and detail views
- ⚡ Asynchronous processing with BullMQ
- 🖼️ Image storage with MinIO/S3
- 📈 Queue monitoring with Bull Board
- 🔄 Real-time updates via Server-Sent Events (SSE)

**Tech Stack:**

- Frontend: Next.js 16, React 19, TypeScript, TailwindCSS
- Backend: Fastify 5, Node.js 24.10.0+
- Database: PostgreSQL 18 + Prisma 6
- Cache: Redis 8
- Queue: BullMQ
- Monorepo: Turborepo + pnpm

**Try It:**

- 🌐 Live demo: https://pricey.mpwg.eu
- 📖 Docs: https://github.com/mpwg/Pricey/tree/main/docs
- 🐳 Self-host: https://github.com/mpwg/Pricey/blob/main/docs/guides/self-hosting.md

**Known Limitations (MVP):**

- ❌ No authentication yet (Phase 1)
- ❌ No manual correction UI (Phase 1)
- ❌ No price tracking yet (Phase 1)
- ✅ All receipts currently public

**Coming in Phase 1 (Q1 2025):**

- User authentication (OAuth 2.0)
- Manual OCR correction
- Price tracking across stores
- Progressive Web App features

**Contributing:**

Contributions welcome! See CONTRIBUTING.md for guidelines.

**License:**

AGPL-3.0 - See LICENSE.md

**Feedback:**

Please report bugs and suggest features in the Issues tab!

Thank you to all early testers! 🙏

---

## Blog Post Outline

**Title**: Introducing Pricey: Open-Source Receipt Scanner with AI

**Sections:**

1. **The Problem** - Why I built Pricey
2. **The Solution** - How Pricey works
3. **Technology** - Architecture and tech stack
4. **Features** - What you can do today
5. **Roadmap** - What's coming next
6. **Try It** - Live demo and self-hosting
7. **Open Source** - Why AGPL-3.0 and how to contribute

**Call to Action:**

- Try the demo
- Star the repo
- Join the community
- Share your feedback
