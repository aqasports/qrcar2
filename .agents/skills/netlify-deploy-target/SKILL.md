---
name: netlify-deploy-target
description: Project-specific Netlify deployment conventions for this app — which Netlify primitives to use for DB, files, and functions, and required env vars. Use whenever writing backend code, data access, file storage, or deployment config.
---

# Netlify Deployment Target — Conventions for This Project

## Stack decisions (do not substitute without asking)
- Framework: Next.js (App Router), deployed via Netlify's Next Runtime.
- Database: Netlify DB (Postgres, powered by Neon). Use `@netlify/neon` / `@neondatabase/serverless` with Drizzle ORM.
- File storage (invoice PDFs, QR code images, action photos): Netlify Blobs
  (`@netlify/blobs`), not local filesystem — Netlify Functions are ephemeral.
- QR code generation: the `qrcode` npm package (pure JS, generates PNG/SVG buffers) — do NOT
  use a headless-browser approach; Netlify Functions have execution time and bundle size
  limits that fight Puppeteer/Chromium.
- Invoice PDF generation: `@react-pdf/renderer` (pure JS/React, no headless browser) for the
  same reason.
- Auth: Auth.js (NextAuth) with a Credentials provider, users & organization_members in Netlify DB, bcrypt
  password hashing, JWT session in an httpOnly cookie. Do not attempt to use Netlify
  Identity — it is deprecated and not available for new projects.

## Required environment variables (set via `netlify env:set` or the dashboard)
- `NETLIFY_DATABASE_URL` — auto-provisioned by Netlify DB, do not set manually.
- `AUTH_SECRET` — random 32+ byte secret for session signing.
- `PUBLIC_BASE_URL` — the deployed site URL, used to build QR code target URLs
  (`${PUBLIC_BASE_URL}/v/{token}`).
- `INVOICE_TAX_RATE` — default VAT/tax percentage.

## Migrations
- Keep versioned SQL migration files under `database/migrations`, managed with Drizzle Kit and applied cleanly.

## Netlify config
- A `netlify.toml` at the project root must set the Next.js plugin, and route
  `/v/*` and `/api/*` explicitly if any custom redirects are needed.
- Public route bundle (`/v/:token`) must not import any admin-only code paths, to keep
  that function's bundle small and its blast radius (in case of a bug) limited to
  read-only operations.

## Amendments for the mega-SaaS migration
- Data access layer: migrate off raw `pg`/`neon` template-tag queries and the legacy
  in-memory/JSON-file fallback in `src/lib/db.ts` entirely. Use Drizzle ORM with real,
  versioned migrations (`drizzle-kit generate` / `drizzle-kit migrate`), still against
  Netlify DB (Postgres via Neon) using `@netlify/neon`. DELETE the string-matching
  `executeInMemoryQuery` function and the `.data/db_store.json` fallback path — if the
  database is unreachable, fail loudly (500 + alert), never silently serve fake data.
- Enable Postgres Row-Level Security on every tenant table per garage-tenancy-rules; set
  `app.current_org_id` via `SET LOCAL` at the start of every request inside the Drizzle
  transaction/session wrapper.
- New required env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `STRIPE_PRICE_ID_STARTER` / `_PRO` / `_ENTERPRISE`, `RESEND_API_KEY` (or chosen email
  provider), `SMS_PROVIDER_API_KEY`, `PLATFORM_ADMIN_ALERT_EMAIL`.
- Public marketing/signup pages (`/`, `/pricing`, `/signup`) and the professional
  directory (`/directory`, `/pro/:slug`) are new server-rendered route groups, separate
  from both `/admin` and `/v/:token`, and must not import authenticated-admin code paths.
