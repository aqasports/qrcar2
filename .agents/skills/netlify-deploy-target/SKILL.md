---
name: netlify-deploy-target
description: Project-specific Netlify deployment conventions for this app — which Netlify primitives to use for DB, files, and functions, and required env vars. Use whenever writing backend code, data access, file storage, or deployment config.
---

# Netlify Deployment Target — Conventions for This Project

## Stack decisions (do not substitute without asking)
- Framework: Next.js (App Router), deployed via Netlify's Next Runtime.
- Database: Netlify DB (Postgres, powered by Neon). Use the `@netlify/neon` package:
  `import { neon } from '@netlify/neon'; const sql = neon();` — it reads
  `NETLIFY_DATABASE_URL` automatically, do not hardcode connection strings.
- File storage (invoice PDFs, QR code images, action photos): Netlify Blobs
  (`@netlify/blobs`), not local filesystem — Netlify Functions are ephemeral.
- QR code generation: the `qrcode` npm package (pure JS, generates PNG/SVG buffers) — do NOT
  use a headless-browser approach; Netlify Functions have execution time and bundle size
  limits that fight Puppeteer/Chromium.
- Invoice PDF generation: `@react-pdf/renderer` (pure JS/React, no headless browser) for the
  same reason.
- Auth: Auth.js (NextAuth) with a Credentials provider, users table in Netlify DB, bcrypt
  password hashing, JWT session in an httpOnly cookie. Do not attempt to use Netlify
  Identity — it is deprecated and not available for new projects.

## Required environment variables (set via `netlify env:set` or the dashboard)
- `NETLIFY_DATABASE_URL` — auto-provisioned by Netlify DB, do not set manually.
- `AUTH_SECRET` — random 32+ byte secret for session signing.
- `PUBLIC_BASE_URL` — the deployed site URL, used to build QR code target URLs
  (`${PUBLIC_BASE_URL}/v/{token}`).
- `INVOICE_TAX_RATE` — default VAT/tax percentage.

## Migrations
- Keep raw SQL migration files under `/migrations`, applied via a small script run at
  build time or manually via `netlify dev` — do not rely on an ORM's auto-sync in
  production.

## Netlify config
- A `netlify.toml` at the project root must set the Next.js plugin, and route
  `/v/*` and `/api/*` explicitly if any custom redirects are needed.
- Public route bundle (`/v/:token`) must not import any admin-only code paths, to keep
  that function's bundle small and its blast radius (in case of a bug) limited to
  read-only operations.
