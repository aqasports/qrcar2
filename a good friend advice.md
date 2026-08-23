# qrCar Developer Platform — Public API, Webhooks & App Store
## Build Specification & Delivery Roadmap

**Prepared for:** qrCar (Garage Management Platform)
**Document type:** Pre-development spec — extends `antigravity-megasaas-build-package.md`
**Version:** 1.0
**Scope:** Turning qrCar into an extensible platform the way Shopify's Admin API + Webhooks + App Store turned Shopify from "a store builder" into "a commerce operating system."

---

## 1. Executive Summary

Everything qrCar has built so far — multi-tenant `organizations`, RLS-scoped data, plan-gated features, the card studio, the marketplace, the directory, messaging — makes garages *customers* of the platform. A developer ecosystem makes qrCar a *platform other software builds on*. That's the actual mechanism behind Shopify's scale: Shopify doesn't build every feature a merchant wants (loyalty programs, accounting sync, custom POS hardware, review widgets) — it builds an API, a webhook system, and a store where 10,000+ third-party developers build those features instead, and Shopify takes a cut or a fee for hosting the ecosystem.

For qrCar the equivalent surface is:
- **A versioned public API** so a garage's own accountant's software, a national auto-parts ERP, a custom SMS/WhatsApp bot, or a franchise's internal BI tool can read/write vehicle, action, invoice, and stock data without going through the admin UI.
- **Outbound webhooks** so external systems react in real time (`action.completed`, `invoice.issued`, `stock.low`) instead of polling.
- **An App Store** where third-party developers (or your own team) publish installable apps that a garage owner turns on with one click and grants explicit scopes to — never blanket access.
- **A developer console** separate from the garage-owner admin and separate from `platform_admin`, where developers register apps, manage keys, and read webhook delivery logs.

This is a genuinely large addition — comparable in size to everything already built. It should **not** be built as one phase. Section 9 breaks it into six phases with explicit stop points, in the same style as your existing `antigravity-megasaas-build-package.md`.

---

## 2. Current State (verified against the uploaded codebase)

What already exists that this spec builds *on top of*, not around:

| Piece | File(s) | Reusable for the dev platform? |
|---|---|---|
| Multi-tenant RLS scoping | `src/lib/db.ts` (`withOrgScope`), Postgres RLS on every tenant table | Yes — a resolved `organization_id` from an API key must feed the exact same `withOrgScope` path session auth uses today |
| Session/role resolution | `src/lib/auth.ts` (NextAuth, JWT, `organization_members`) | Pattern to mirror, not reuse directly — API requests are stateless, no cookie session |
| Plan/feature gating | `src/lib/plans.ts` (`assertActionAllowed`, live DB check, never cached in a claim) | Yes — app install limits, public API access itself, and webhook counts should gate the same way |
| Audit logging | `src/lib/audit.ts` (`logAudit`) | Yes — every API key issuance, scope grant, app install/uninstall, and webhook delivery failure must write here |
| HMAC signing/verification | `src/lib/chargily.ts` (`verifyChargilyWebhookSignature`, `crypto.timingSafeEqual`) | This exact pattern becomes qrCar's **outbound** webhook signature — you already have the correct implementation, just flip direction |
| Approval state machines | `card_designs` (`draft→submitted→approved/rejected→archived`), `card_orders` | This is the right template for the App Store's `apps` lifecycle — reuse the pattern, not the table |
| Platform-admin console | `/platform-admin/*`, `src/app/platform-admin/*` | Extend with an "Apps" review queue exactly like the card-design review queue already planned |
| Async delivery queue | `notificationQueue` table, `src/lib/notifications.ts` | Extend for webhook delivery + retry, don't build a second queue system |
| Rate limiting | `src/lib/rate-limit.ts` | **Not reusable as-is** — in-memory `Map`, dies on every cold start and doesn't share state across serverless instances. Fine for internal admin traffic today; not safe once third-party apps are hammering a public API. Flagged as a hard requirement in Phase 0. |

What does **not** exist yet, confirmed by searching the codebase for `api_key`, `webhook` (outbound), `developer`, `oauth`, `scope`: nothing. This is a clean, additive build — no migration of existing routes required, only new ones alongside them.

---

## 3. Design Principles (the guardrails)

These mirror how `garage-tenancy-rules` and `billing-and-plans-rules` are written in your existing skill files — treat them as constraints for whoever (or whatever agent) builds this.

1. **Public API traffic never touches NextAuth session cookies.** Every public API request authenticates via an API key or OAuth bearer token, resolves to exactly one `organization_id` + a scope set, and that resolution feeds the *same* `withOrgScope` / RLS path the admin UI already uses. Two auth mechanisms, one data-access path — never a second, parallel query layer that could drift out of RLS coverage.
2. **Scopes are explicit and least-privilege by default.** An app requests scopes (`read_vehicles`, `write_actions`, etc.) at install time; the garage owner sees exactly what's being requested and approves or declines. No app ever gets client PII (phone/email/address) without a distinct, separately-called-out scope — same principle as `marketplace-community-rules`' PII protections, applied to apps instead of public profiles.
3. **Nothing enters the App Store without human review.** Mirrors the card-design approval gate: an app in `submitted` status is inert until a `platform_admin` moves it to `approved`. This protects garages from malicious or broken third-party code the same way design approval protects your print vendor relationship.
4. **Webhook delivery is at-least-once, signed, and logged — never fire-and-forget.** Every delivery attempt (success or failure) writes a row. Failures retry with backoff. A developer can see delivery history for their own app; a garage owner can see which of their installed apps received which events.
5. **Feature-gate at the moment of the API call, not at key issuance.** An expired/past-due organization's API keys must fail live, the same way `assertActionAllowed` re-checks plan status on every gated admin action — never bake "has API access" into a long-lived token claim.
6. **Rate limiting must be durable across instances before this ships publicly.** This is the one piece of existing infrastructure that must change before Phase 1, not after.

---

## 4. New Actors & Concepts

| Concept | Analogy to Shopify | Purpose |
|---|---|---|
| **Developer account** | Shopify Partner account | A person/company who builds apps. Separate signup from garage `organizations` — a developer doesn't own a garage. |
| **App** | Shopify app listing | A registered integration: name, description, icon, requested scopes, redirect URLs, lifecycle status. |
| **App version** | App Store binary versioning | Apps evolve; scopes/webhooks can change between versions, each re-reviewed. |
| **App install** | "Install app" on a merchant's store | Join row: which `organization_id` has which `app_id` installed, with which *granted* scopes (may be a subset of requested, if you add partial-consent later — MVP: all-or-nothing). |
| **API key / OAuth client** | Custom app API key / Public app OAuth client | Credential an app uses to call the public API on behalf of an org. |
| **Webhook subscription** | Shopify webhook topics | An app install subscribes to topics (`action.completed`, `stock.low`, …); qrCar pushes signed JSON to the app's callback URL. |
| **Private (custom) app** | Shopify "custom app" | A garage owner generates API credentials directly for their own internal tooling — no App Store listing, no review queue, still scoped to that one org only. |
| **Public app** | Shopify public app | Built by a third-party developer, listed in the App Store, installable by any garage, goes through review. |

Two paths, one underlying model — a private app is just an app with `visibility = 'private'` that skips the review queue and is only installable by its creator's own organization.

---

## 5. Data Model (new tables — proposed migration `0011_developer_platform.sql`)

Written in the same Drizzle style as the existing `src/db/schema.ts` so it can be dropped in directly.

```ts
// ==========================================
// DEVELOPER ACCOUNTS
// ==========================================
export const developerAccounts = pgTable('developer_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  contactEmail: varchar('contact_email', { length: 255 }).notNull(),
  websiteUrl: text('website_url'),
  status: varchar('status', { length: 30 }).notNull().default('active'), // active | suspended
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex('idx_dev_account_user').on(t.userId),
]);

// ==========================================
// APPS
// ==========================================
export const apps = pgTable('apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  developerAccountId: uuid('developer_account_id').references(() => developerAccounts.id, { onDelete: 'cascade' }).notNull(),
  ownerOrganizationId: uuid('owner_organization_id').references(() => organizations.id), // set only for private apps
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  iconUrl: text('icon_url'),
  visibility: varchar('visibility', { length: 20 }).notNull().default('private'), // private | public
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  // draft -> submitted -> approved | rejected -> published -> suspended
  rejectionReason: text('rejection_reason'),
  redirectUris: jsonb('redirect_uris').default([]),        // OAuth callback allowlist
  webhookCallbackUrl: text('webhook_callback_url'),
  requestedScopes: jsonb('requested_scopes').notNull().default([]), // e.g. ['read_vehicles','write_actions']
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_apps_developer').on(t.developerAccountId),
  index('idx_apps_status').on(t.status),
]);

// ==========================================
// APP INSTALLS (per-organization, per-app)
// ==========================================
export const appInstalls = pgTable('app_installs', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => apps.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  grantedScopes: jsonb('granted_scopes').notNull().default([]),
  installedByUserId: uuid('installed_by_user_id').references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active | uninstalled
  installedAt: timestamp('installed_at', { withTimezone: true }).defaultNow().notNull(),
  uninstalledAt: timestamp('uninstalled_at', { withTimezone: true }),
}, (t) => [
  uniqueIndex('idx_app_install_unique').on(t.appId, t.organizationId),
  index('idx_app_installs_org').on(t.organizationId),
]);

// ==========================================
// API CREDENTIALS
// ==========================================
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  appInstallId: uuid('app_install_id').references(() => appInstalls.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(), // shown in UI, e.g. "qrc_live_a1b2"
  hashedSecret: varchar('hashed_secret', { length: 255 }).notNull(), // bcrypt, never store raw
  scopes: jsonb('scopes').notNull().default([]),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_api_keys_org').on(t.organizationId),
  index('idx_api_keys_prefix').on(t.keyPrefix),
]);

// ==========================================
// WEBHOOK SUBSCRIPTIONS
// ==========================================
export const webhookSubscriptions = pgTable('webhook_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  appInstallId: uuid('app_install_id').references(() => appInstalls.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  topic: varchar('topic', { length: 100 }).notNull(), // 'action.completed', 'stock.low', ...
  targetUrl: text('target_url').notNull(),
  signingSecret: varchar('signing_secret', { length: 255 }).notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_webhook_subs_org').on(t.organizationId),
  index('idx_webhook_subs_topic').on(t.topic),
]);

// ==========================================
// WEBHOOK DELIVERY LOG
// ==========================================
export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  subscriptionId: uuid('subscription_id').references(() => webhookSubscriptions.id, { onDelete: 'cascade' }).notNull(),
  eventId: uuid('event_id').notNull(), // idempotency key sent to the receiver
  topic: varchar('topic', { length: 100 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | delivered | failed | exhausted
  attempts: integer('attempts').notNull().default(0),
  lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
  responseStatus: integer('response_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_webhook_deliveries_sub').on(t.subscriptionId),
  index('idx_webhook_deliveries_status').on(t.status),
]);

// ==========================================
// PUBLIC API REQUEST LOG (durable rate limiting + analytics)
// ==========================================
export const apiRequestLog = pgTable('api_request_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id').references(() => apiKeys.id, { onDelete: 'cascade' }).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  statusCode: integer('status_code'),
  windowBucket: timestamp('window_bucket', { withTimezone: true }).notNull(), // truncated to the minute
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('idx_api_log_key_bucket').on(t.apiKeyId, t.windowBucket),
]);
```

All six new tables get `organization_id` (directly or via `app_installs`/`api_keys`) and must be added to the RLS policy set alongside the existing tenant tables — `apiRequestLog` and `webhookDeliveries` in particular, since they carry per-org traffic data a competitor garage should never be able to query.

---

## 6. Scopes (initial catalog)

Modeled directly on your existing entities — one read/write pair per domain, no bundling:

```
read_vehicles        write_vehicles
read_clients          write_clients        (never bundled with vehicles by default — PII-sensitive)
read_actions          write_actions
read_inventory        write_inventory
read_invoices          write_invoices       (write scope should be rare — most apps only need to read invoices)
read_workers           write_workers
manage_webhooks                              (subscribe/unsubscribe topics — distinct from data scopes)
```

`read_clients` should carry a visible warning in the install-consent screen ("This app can see your customers' names, phone numbers, and addresses") — same instinct as the PII rules already written into `marketplace-community-rules`.

## 7. Webhook Topics (initial catalog)

Matches entities that already have clear state transitions in the schema:

```
vehicle.created
client.created
action.created
action.completed
invoice.issued
card.linked
card.revoked
stock.low                (fires from the existing low-stock threshold check)
appointment.created
appointment.cancelled
```

Delivery mechanics: JSON body, `X-QrCar-Topic`, `X-QrCar-Event-Id` (idempotency key), `X-QrCar-Signature` header computed exactly like `verifyChargilyWebhookSignature` — `HMAC-SHA256(rawBody, subscription.signingSecret)`, receiver does `crypto.timingSafeEqual`. Retry schedule: immediate, then 1m / 5m / 30m / 2h / 12h, then mark `exhausted` and surface it in the developer console — don't retry forever against a dead endpoint.

---

## 8. Public API Surface (illustrative — v1)

Namespaced separately from both `/api/*` (session-authenticated admin routes) and `/v/:token` (public read-only QR view), so none of the three ever accidentally share a code path:

```
Base: /api/public/v1

Auth
  All requests: Authorization: Bearer qrc_live_xxxxx

Vehicles
  GET    /vehicles
  GET    /vehicles/:id
  POST   /vehicles                      (requires write_vehicles)
  PATCH  /vehicles/:id                  (requires write_vehicles)

Actions
  GET    /actions
  GET    /actions/:id
  POST   /actions                       (requires write_actions)
  PATCH  /actions/:id/complete          (requires write_actions)

Inventory
  GET    /parts
  PATCH  /parts/:id/stock               (requires write_inventory)

Invoices
  GET    /invoices
  GET    /invoices/:id
  GET    /invoices/:id/pdf

Webhooks (app-management, not data)
  GET    /webhooks
  POST   /webhooks                      (requires manage_webhooks)
  DELETE /webhooks/:id

Meta
  GET    /me                            (resolves the calling org, granted scopes, rate limit status)
```

Every handler's first two lines should be identical in shape to the pattern already used in `src/app/api/vehicles/route.ts` — resolve identity, then scope every query to `organization_id` — except identity resolution here is `resolveApiKey(bearerToken)` instead of `getServerSession`.

---

## 9. Delivery Roadmap

Phased the same way as `antigravity-megasaas-build-package.md` — paste one phase at a time into your build agent, stop and confirm after each.

| Phase | Scope | Outcome |
|---|---|---|
| **Phase 0 — Durable rate limiting** | Replace the in-memory `Map` in `rate-limit.ts` with a Postgres-backed (or Redis, if provisioned) sliding-window limiter keyed by API key. This must land *before* any public endpoint exists. | Public API traffic can't be starved by a serverless cold-start reset or abused across instances. |
| **Phase 1 — Data layer & auth** | New tables from Section 5, migration `0011_developer_platform.sql`, RLS policies on all six, `resolveApiKey()` helper mirroring `getServerSession` + `withOrgScope`, bcrypt-hashed key storage (never log/store raw secrets). | A private app can be created, an API key issued, and one authenticated read-only endpoint (`GET /me`) works end-to-end. |
| **Phase 2 — Private/custom apps + core REST endpoints** | Garage owner can generate a private app + API key from `/admin/settings`. Build out the vehicles/actions/inventory/invoices endpoints from Section 8, each scope-checked and org-scoped. | A garage can wire their own accountant's software or an internal script against qrCar today, no App Store needed yet. |
| **Phase 3 — Outbound webhooks** | `webhook_subscriptions`, `webhook_deliveries`, signing per Section 7, retry/backoff worker (extend the existing `notificationQueue` delivery pattern rather than building a second queue). Developer console page showing delivery history per subscription. | Real-time push for the topics in Section 7, with visible delivery logs. |
| **Phase 4 — App Store (public apps)** | Developer account signup (separate from org signup), app registration + `requestedScopes`, `draft→submitted→approved/rejected→published` lifecycle, `platform_admin` review queue (`/platform-admin/apps`), OAuth 2.0 authorization-code flow for public apps (garage owner sees a consent screen listing exactly which scopes are requested, per Section 3 rule 2), install/uninstall flow surfaced in `/admin/settings` or a new `/admin/apps` page. | Third-party developers can build and list apps; garages can discover and install them with informed consent. |
| **Phase 5 — Hardening & launch** | Load-test the public API and webhook delivery worker; RLS audit specifically on `api_request_log` and `webhook_deliveries` (a garage must never see another garage's API traffic); confirm scope enforcement with a test matrix (one test per scope × one endpoint that should reject without it); developer-facing API docs page; abuse/kill-switch path for `platform_admin` to instantly revoke a misbehaving app across all installs. | Production-ready developer platform. |

---

## 10. Proposed New Skill File

To keep this consistent with how the rest of the codebase is governed, add a fifth guardrail file alongside the existing four:

**`.agents/skills/developer-platform-rules/SKILL.md`**

```markdown
---
name: developer-platform-rules
description: Rules for the public API, OAuth apps, webhooks, and App Store. Use whenever touching api_keys, apps, app_installs, webhook_subscriptions, webhook_deliveries, or api_request_log, or building ANY endpoint under /api/public/*.
---

# Developer Platform Rules

## Identity resolution — never share a code path with session auth, but always share a data path
- Public API requests resolve identity via `resolveApiKey(bearerToken)`, never `getServerSession`.
- The resolved `organization_id` MUST flow into the same `withOrgScope`/RLS-backed query layer
  session-authenticated routes use. Two entry points, one data-access guarantee.
- Never log a raw API secret. Store only a bcrypt hash + a short non-secret prefix for display.

## Scopes are checked per-request, not cached
- Every public endpoint declares its required scope(s). Check against `api_keys.scopes`
  (which mirrors `app_installs.granted_scopes` at issuance time) on every request — an app's
  granted scopes can change if a garage owner edits or revokes them, and a stale token must
  fail closed, not succeed on cached permissions.
- `read_clients` (or any endpoint returning client PII) requires that scope explicitly —
  never bundle it into a broader "read everything" scope.

## App lifecycle — review gate is non-negotiable for public apps
- `apps.status` follows `draft -> submitted -> approved | rejected -> published -> suspended`.
  Only `platform_admin` can move an app to `approved`, `published`, or `suspended`.
- Private apps (`visibility = 'private'`) skip review but are installable ONLY by their
  `owner_organization_id` — never listed, never installable by another org.
- A `platform_admin` suspension must immediately invalidate every `api_key` tied to that
  app's installs (checked live, not just flagged) and disable every associated webhook
  subscription.

## Webhooks
- Sign every outbound payload: `HMAC-SHA256(rawBody, subscription.signingSecret)`, sent as
  `X-QrCar-Signature`. This mirrors `verifyChargilyWebhookSignature` in `src/lib/chargily.ts` —
  same primitive, opposite direction.
- Every delivery attempt writes a `webhook_deliveries` row, success or failure. Retry with
  backoff (immediate, 1m, 5m, 30m, 2h, 12h) then mark `exhausted` — never retry forever.
- Include an idempotency `event_id` in every payload so a receiver that gets a duplicate
  delivery (retries can double-fire) can safely no-op.

## Rate limiting
- Public API traffic is rate-limited per `api_key_id` using the durable, DB/Redis-backed
  limiter from Phase 0 — never the in-memory `Map` used for internal admin routes. A cold
  start or a second serverless instance must not reset another app's rate-limit window.

## Cross-tenant leak surfaces
- `api_request_log` and `webhook_deliveries` are themselves tenant data. RLS-scope them like
  every other tenant table — a garage (or a developer building for multiple garages) must
  never see another organization's request/delivery history.
```

---

## 11. Open Questions to Confirm Before Build

1. **REST only, or GraphQL too?** Shopify runs both; REST-only is the pragmatic MVP given your existing routes are already REST-shaped. GraphQL can be a later phase if third-party demand justifies it.
2. **Revenue model for public apps** — free listing only for now, or a revenue-share/paid-listing model from day one? This changes whether Phase 4 needs a billing hook into Chargily for developers, not just for garages.
3. **Who can become a developer?** Open signup (anyone), or invite-only while the ecosystem is young (lower moderation burden, matches where the platform likely is right now)?
4. **OAuth scope granularity** — all-or-nothing consent (simpler, matches MVP above) or per-scope toggle at install time (more Shopify-like, more UI work)?
5. **Does a private app ever need to call the public API on behalf of a *technician* role**, or is API access owner/manager-only? Given technicians already have restricted admin routes, the same restriction likely should extend here.
6. **Webhook delivery infrastructure** — extend the existing `notificationQueue`/`src/lib/notifications.ts` pattern, or is a dedicated queue (e.g. a Netlify background function) preferred for delivery volume reasons? Worth deciding before Phase 3, since retrofitting later means migrating in-flight deliveries.

---

## 12. Summary

This spec adds a sixth pillar — **developer ecosystem** — to the five already defined in `antigravity-megasaas-build-package.md` (tenancy, billing, card studio, marketplace/community, and now this). It's deliberately additive: no existing route, table, or auth path needs to change except `rate-limit.ts`, which needs to change regardless of this feature the moment any endpoint is exposed to non-garage-owned traffic.

The order that matters most: **Phase 0 (durable rate limiting) and Phase 1 (data layer + scoped auth) are the foundation everything else depends on** — the same "do not skip Phase 0" instinct that governed the tenancy retrofit applies here for the same reason: retrofitting security primitives after third-party code is already calling your API is much harder than building them first.

*Next step: once this spec is validated, Phase 0 and Phase 1 can be scaffolded together as a single build-agent prompt, in the same paste-one-phase-at-a-time format as the existing build package.*
