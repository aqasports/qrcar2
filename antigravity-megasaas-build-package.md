# Antigravity / Gemini 3.7 Build Package — Garage Management Mega-SaaS
### Multi-tenant platform + PVC card studio & fulfillment + parts/solutions marketplace + professional network

This package supersedes `antigravity-cli-build-package.md`. That file scaffolded a single-garage
app from zero. **This one migrates the existing codebase into a multi-tenant SaaS and bolts on
four new product surfaces.** Paste these into Antigravity CLI (Gemini 3.7) one phase at a time,
in order — do not skip Phase 0, everything else depends on it.

---

## 0. Setup

```bash
cd garage-platform   # your existing project, not an empty folder this time
git checkout -b mega-saas-migration

# Confirm existing skills are present
npx skills list

# Add a Postgres/Drizzle skill if available in the registry (optional but helpful)
npx skills add drizzle-orm/context --skill '*' --yes 2>/dev/null || true
```

Keep the existing `.agents/skills/netlify-deploy-target/SKILL.md`. **Replace**
`.agents/skills/garage-domain-rules/SKILL.md` with the updated tenancy-aware version below, and
**add** three new skill files. These four are the guardrails — the agent should treat them as
constraints, not suggestions, for the rest of this build.

---

## 1. Updated & new Skill files

### `.agents/skills/garage-tenancy-rules/SKILL.md` (replaces `garage-domain-rules`)

```markdown
---
name: garage-tenancy-rules
description: Non-negotiable multi-tenancy and business rules for the garage SaaS. Use whenever touching clients, vehicles, PVC cards, actions, stock, invoices, or ANY database query.
---

# Garage Tenancy & Domain Rules

## Multi-tenancy — the single most important rule in this codebase
- Every tenant-owned table has a NOT NULL `organization_id` column: clients, vehicles,
  pvc_cards, workers, actions, parts, stock_movements, invoices, appointments, reminders,
  audit_logs, card_designs, card_orders, marketplace_listings.
- Never hand-write a raw query against a tenant table. All data access goes through the
  shared query helper (`withOrgScope(orgId)` or the Drizzle repository layer) that
  automatically injects `WHERE organization_id = :orgId`. If you find yourself writing
  `db.select().from(clients)` with no org filter, stop — that is a cross-tenant data leak.
- Enforce this AGAIN at the database layer with Postgres Row-Level Security policies on
  every tenant table, keyed to a `app.current_org_id` session variable set at the top of
  every request from the authenticated session. Application-layer filtering is not
  sufficient on its own — RLS is the backstop for when application code has a bug.
- A `platform_admin` role (separate from `owner`/`super_admin`/`manager`/`technician`)
  exists for YOUR staff only (card fulfillment ops, support, moderation). It is the ONLY
  role allowed to query across organizations, and only through explicitly separate,
  audited admin routes under `/platform-admin/*` — never through the normal tenant API.

## Ownership model (unchanged from before)
- A `client` (garage's customer) owns N `vehicles`, scoped to one `organization_id`.
- A `pvc_card` links to a vehicle, never directly to a client.
- Transferring a vehicle to a new owner updates `client_id` in place; never delete/recreate.
  Log the transfer in `audit_logs`.

## PVC card lifecycle (do not simplify this state machine)
- Cards are generated in batches BEFORE assignment: status `unassigned`, random
  non-sequential token (128-bit minimum). See card-studio-fulfillment-rules for how
  unassigned cards now enter the system (via a PAID order, not free generation).
- Linking sets status `active` + `vehicle_id` + `linked_at`.
- Lost/damaged sets status `revoked` (never delete the row); a new pre-printed card links
  to the same vehicle. Revoked tokens show "this card has been deactivated" — never 404,
  never leak whether a token ever existed.
- Every link/revoke writes an `audit_logs` row scoped to the organization.

## Stock and actions (must be atomic, unchanged)
- Attaching a part to an action, in ONE transaction: insert `action_parts` with
  `unit_price_snapshot` = the part's current `sale_price` copied at that instant (never a
  live join); decrement `parts.quantity_in_stock`; insert a `stock_movements` row. Roll
  back all three on any failure.
- Manager role can soft-override an insufficient-stock warning; log the override.
- Changing `sale_price` later never touches historical `action_parts`/invoices.

## Invoicing (unchanged)
- Invoice numbers sequential PER organization PER year (e.g. `{org_slug}-2026-000123`),
  generated inside a transaction with a row lock — never `max + 1` via plain SELECT.
- Issued invoices are frozen; regenerating creates a new draft, never overwrites.

## Roles (now nested under organization_members, not a global users.role)
- `owner`: billing + everything below. Exactly one per organization initially (can add more).
- `super_admin` (org-scoped): everything except billing/plan changes.
- `manager`: day-to-day operations, no user management or billing.
- `technician`: read/write only on actions they're assigned to via `action_workers`. Cannot
  browse other clients' data or see cost/margin figures.
- `platform_admin`: Anthropic-style superuser for YOUR ops team only (see multi-tenancy
  section above).

## Public QR view (`/v/:token`)
- Strictly read-only, no write-capable endpoint reachable from this route.
- Never serialize client phone/email/address. Never expose other vehicles of the same
  client. Never expose `internal_notes`.
- Now also renders per-organization branding: logo, brand color, locale — resolved from
  the card's `organization_id`, cached aggressively (this data changes rarely).
- Rate-limited; tokens never enumerable/sequential.
```

### `.agents/skills/billing-and-plans-rules/SKILL.md` (new)

```markdown
---
name: billing-and-plans-rules
description: Subscription billing, plan tiers, and feature-gating rules. Use whenever building signup, billing, plan upgrade/downgrade, or ANY feature that should be gated by subscription tier (card studio, marketplace listings, directory placement, seats, branches).
---

# Billing & Plan Rules

## Source of truth
- Stripe is the source of truth for subscription status. `organizations.subscription_status`
  is updated ONLY by verified Stripe webhook events (checkout.session.completed,
  customer.subscription.updated/deleted, invoice.payment_failed, etc.) — never set it
  directly from a client request.
- Verify every webhook signature. Reject and log anything that doesn't verify.

## Plans (seed these three; business can tune pricing later — the shape matters more than the numbers)

| Plan | Branches | Seats | Card design studio | Marketplace listings | Directory tier |
|---|---|---|---|---|---|
| Starter | 1 | 3 | Template only (pick from presets, no custom studio) | 0/mo | Listed (name only) |
| Pro | 3 | 15 | Full studio (upload logo, custom colors/layout) | 20/mo | Featured (boosted ranking + badge) |
| Enterprise | Unlimited | Unlimited | Full studio + white-label (remove platform branding) | Unlimited | Spotlight (top placement, badge, homepage rotation) |

Store these as rows in a `plans` table with explicit boolean/numeric feature-flag columns —
never hardcode plan-name string comparisons scattered through the codebase. One place
reads the plan's feature flags; everything else asks that one place.

## Feature gating — check at time of ACTION, not at login
- Every gated action (create a card design, submit a card order, create a marketplace
  listing, message another professional, add a branch/seat beyond the plan limit) must
  re-check the organization's CURRENT plan + subscription_status at the moment of the
  action. A session/JWT claim set at login is not sufficient — plans change mid-session.
- `subscription_status = 'past_due'`: allow all reads, block all new writes except
  updating payment method, and show a persistent billing-issue banner.
- `subscription_status = 'canceled'`: read-only grace period (configurable, e.g. 30 days)
  before data access is fully suspended (never deleted — export remains available).
- Trials: default 14 days, `trial_ends_at` set at signup, no card required to start a trial.

## Plan changes
- Downgrading is blocked if current usage exceeds the target plan's limits (e.g. 5 branches
  on a Pro plan trying to downgrade to Starter's 1-branch limit) — surface exactly what
  needs to change first, don't silently truncate data.
- Upgrading takes effect immediately; downgrading takes effect at the end of the current
  billing period, per standard Stripe proration behavior.
```

### `.agents/skills/card-studio-fulfillment-rules/SKILL.md` (new)

```markdown
---
name: card-studio-fulfillment-rules
description: Rules for the PVC card design studio and the card reorder/fulfillment flow. Use whenever building card design, preview rendering, reorder detection, or order/shipping logic.
---

# Card Design Studio & Fulfillment Rules

## Design studio
- Canvas is a fixed CR-80 card size (85.6mm x 54mm) at print resolution (300dpi ->
  1011x638px). Enforce a safe-zone margin (~3mm / ~36px on every edge) — no text or logo
  may render inside that margin; the studio must visually indicate the safe zone and
  should not let a user export/submit a design with elements outside it.
- A design has independent front and back layouts. The QR code itself is ALWAYS
  system-generated (never user-uploadable as an image) and always placed with adequate
  quiet-zone margin so it stays scannable regardless of the rest of the layout.
- Design lifecycle: `draft` (freely editable) -> `submitted` (locked, awaiting review) ->
  `approved` (usable in orders) | `rejected` (editable again, with a reason shown to the
  garage) -> `archived`.
- **A design must be `approved` before it can be attached to a card_order.** Self-service
  preview/export is fine at any stage, but nothing enters production printing without an
  explicit approval step — this protects print-vendor relationships and card quality.
- Starter plan: restrict to a small set of platform-provided template designs (logo
  upload + one accent color only, no free-form layout editing). Pro/Enterprise: full
  studio access, per the plans table in billing-and-plans-rules.

## Reorder detection
- After every card link or revoke action, recompute `count(pvc_cards WHERE organization_id
  = X AND status = 'unassigned')` for that org.
- If the count is at or below `card_stock_settings.reorder_threshold`: surface an in-app
  banner + a scheduled email nudge. If `card_stock_settings.auto_reorder` is enabled,
  auto-create a `card_order` in status `draft` (never auto-charge — a human must still
  confirm and pay).

## Ordering & fulfillment (this is a real e-commerce checkout, treat it like one)
- A `card_order` requires: an APPROVED `card_design_id`, quantity, full shipping address,
  and a completed Stripe PaymentIntent/Checkout session before it can move past
  `pending_payment`. Never generate physical inventory (pvc_cards rows) for an unpaid order.
- Order status machine: `draft -> pending_payment -> paid -> in_production -> shipped ->
  delivered` (or `cancelled` from any pre-shipped state). Only `platform_admin` can advance
  an order past `paid` (this reflects real-world printing/shipping, done by your ops team,
  not automated).
- **The moment (and only the moment) an order transitions to `delivered`**, the system
  auto-inserts exactly `quantity` new `pvc_cards` rows: `status = 'unassigned'`,
  `organization_id` = the order's org, `card_design_id` = the order's design. A garage can
  never generate unassigned card rows any other way — that would be a free-inventory
  exploit against your physical card supply chain.
- Every status transition writes an audit log entry with the acting `platform_admin` user.
```

### `.agents/skills/marketplace-community-rules/SKILL.md` (new)

```markdown
---
name: marketplace-community-rules
description: Rules for the cross-garage parts marketplace, the mechanical solutions knowledge base, the professional directory, and direct messaging between professionals. Use whenever building any of these four surfaces.
---

# Marketplace & Community Rules

## Cross-tenant read, single-tenant write
- Parts marketplace listings, solution posts/comments, and professional directory
  profiles are PLATFORM-WIDE READ surfaces — any authenticated professional can browse
  them regardless of which organization they belong to. This is intentional; it's the
  whole point of the network effect.
- WRITE actions are still strictly scoped: a user can only create/edit listings, posts,
  and profile content attributed to their own `user_id` and/or their own
  `organization_id`. Never allow editing another org's listing or another user's post.

## Feature gating
- Creating a marketplace listing is gated by the acting organization's plan limit (see
  billing-and-plans-rules) and requires `subscription_status` in `('trialing','active')`.
  Browsing/searching listings is NOT gated — only creation is.
- Messaging another professional requires the SENDER's organization to have an active
  or trialing subscription. Reading existing conversation threads is always allowed even
  if the subscription later lapses (never lock users out of their own message history).

## Directory visibility — resolve at query time, never store
- `professional_profiles.visibility_tier` is NOT a column you set directly. Visibility
  (listed / featured / spotlight) is ALWAYS derived at query/render time by joining the
  profile's `organization_id` to that organization's CURRENT `plans.directory_tier`. If a
  garage downgrades or lapses, their team's directory boost disappears on the next query
  — automatically, with no separate sync job to maintain and no stale-badge bug possible.
- Directory search ranking: spotlight > featured > listed, then relevance/recency within
  tier. Never let a garage pay once and keep a boosted badge after downgrading.

## Content moderation
- Every piece of user-generated content (solution posts, comments, marketplace listing
  descriptions, profile bios) has a `status` supporting `published/active`, `flagged`,
  and `removed`. Any authenticated user can report content (creates a flag); only
  `platform_admin` can move something to `removed`. Removed content stays in the
  database (soft-delete) for moderation audit trail — never hard-delete user content.
- Never expose a garage's own customer PII (client phone/email/address) anywhere in a
  public solution post, marketplace listing, or professional profile — these are
  professional-facing surfaces about the mechanic/garage, not about their customers.
- Public professional profile pages (`/pro/{slug}`) are SEO-indexable and rendered
  server-side. Confirm at code-review time that the query backing that page selects ONLY
  professional_profiles + organization branding fields — never join anything from
  clients/vehicles/actions into that response.

## Contact-info protection
- Real phone/email of a professional is never rendered in a public listing, post, or
  directory card. It's revealed only inside an accepted marketplace inquiry thread or an
  active direct-message conversation — both are authenticated, logged interactions.
```

### `.agents/skills/netlify-deploy-target/SKILL.md` (amend, don't replace — append this block)

```markdown
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
```

---

## 2. The Master Prompt

Paste this first. It assumes you're pointing Antigravity at the **existing** repository, not an
empty folder.

```
This is an EXISTING Next.js garage-management codebase (App Router, TypeScript, Postgres via
Netlify DB, NextAuth, qrcode, @react-pdf/renderer). We are migrating it from a single-garage
prototype into a multi-tenant SaaS with a subscription business model, plus four new product
surfaces. Follow garage-tenancy-rules, billing-and-plans-rules, card-studio-fulfillment-rules,
marketplace-community-rules, and netlify-deploy-target for every decision below — they are
constraints, not suggestions.

## First: read before writing anything
Inventory the current codebase — schema in /database/migrations, src/lib/db.ts,
src/app/api/**, src/app/admin/**, src/middleware.ts, src/lib/auth.ts. Summarize your
understanding of what exists back to me before starting Phase 0. Do not assume; verify by
reading the actual files.

## What we're building on top of what exists
1. Multi-tenancy: every garage becomes an "organization" with its own users, clients,
   vehicles, cards, actions, inventory, and invoices — fully isolated from every other
   organization (Postgres RLS + app-layer scoping, per garage-tenancy-rules).
2. Subscription billing: garages sign up, pick a plan (Starter/Pro/Enterprise per
   billing-and-plans-rules), pay via Stripe, and features unlock/lock accordingly.
3. PVC card design studio: each garage can design their own branded card (front + back,
   logo, colors) within our print-safe template system, submit it for our approval, and
   order printed batches — replacing the old "admin generates cards for one garage" flow
   with a self-service, per-tenant, paid ordering flow.
4. Parts & mechanical solutions network: a cross-garage searchable marketplace for spare
   parts, and a searchable knowledge base of repair solutions/diagnostics contributed by
   individual mechanics, tagged by vehicle make/model/symptom.
5. Professional directory & messaging: every technician/mechanic gets a public
   professional profile (specialty, city, bio), searchable platform-wide, with
   plan-tier-based visibility boosting (a BMW mechanic in Algiers can find and message an
   injection specialist in Oran) and direct messaging between professionals.

## New/changed data model (full detail lives in the skill files — summary here)
- organizations, organization_members, branches, plans
- add organization_id to: clients, vehicles, pvc_cards, workers, actions, parts,
  stock_movements, invoices, appointments, reminders, audit_logs
- card_designs, card_stock_settings, card_orders
- parts_catalog, marketplace_listings, marketplace_inquiries
- solution_posts, solution_comments, solution_votes
- professional_profiles, connections, conversations, conversation_participants, messages

## Work order
Phase 0  — Tenancy retrofit (schema migration + RLS + Drizzle swap-in) — DO NOT SKIP
Phase 1  — Plans, Stripe billing, org signup/onboarding, platform-admin console
Phase 2  — Branding + i18n (fr/ar RTL/en) across admin, public QR page, invoices
Phase 3  — Card design studio
Phase 4  — Card ordering & fulfillment (reorder detection, checkout, ops fulfillment queue)
Phase 5  — Parts marketplace
Phase 6  — Mechanical solutions knowledge base
Phase 7  — Professional directory & plan-based visibility
Phase 8  — Direct messaging between professionals
Phase 9  — VIN decoding (NHTSA free provider + pluggable commercial provider, cached)
Phase 10 — Notifications (email/SMS/WhatsApp) across appointments, low-stock, marketplace,
           messages
Phase 11 — Hardening: RLS audit across every tenant table, rate limiting, load test the
           public QR + directory routes, launch checklist

## Ground rules for every phase
- Work phase by phase. After each phase, stop, summarize what changed, list any new env
  vars I need to set, and wait for my explicit confirmation before starting the next phase.
- Every new table gets a Drizzle schema definition AND a migration file — no ad hoc SQL
  run by hand.
- Every gated feature checks plan + subscription_status live at the moment of the action,
  per billing-and-plans-rules — never cache that check in a session/JWT claim.
- Every cross-tenant read surface (marketplace, solutions, directory) still enforces
  single-tenant writes and the PII rules in marketplace-community-rules.

Start with the "read before writing" step above, then Phase 0. Show me the current-state
summary first and wait for my go-ahead before touching the schema.
```

---

## 3. Phase Prompts

Paste one at a time, after reviewing and confirming the previous phase's output.

**Phase 0 — Tenancy retrofit (the foundation everything else depends on)**
```
Phase 0: Migrate the existing schema to multi-tenant. Add organizations, organization_members,
branches, and plans tables. Add organization_id to every existing tenant table (clients,
vehicles, pvc_cards, workers, actions, parts, stock_movements, invoices, appointments,
reminders, audit_logs) via a migration that backfills a single "Default Garage" organization
containing all current data, so nothing is lost. Replace the raw pg/neon query layer and the
JSON-file fallback in src/lib/db.ts entirely with Drizzle ORM + real migrations, per the
amended netlify-deploy-target skill — delete executeInMemoryQuery and the .data/ fallback
path completely. Enable Postgres Row-Level Security on every tenant table and wire
app.current_org_id into the request/session lifecycle. Update NextAuth so a user's role is
read from organization_members (org-scoped), not a global users.role column. Update
middleware.ts and every API route to resolve and enforce the current organization_id.
Do not build any new UI yet — this phase is data-layer only. Stop and show me the migration,
the RLS policies, and confirm the backfilled "Default Garage" preserves all existing data
before continuing.
```

**Phase 1 — Plans, billing, onboarding**
```
Phase 1: Seed the plans table (Starter/Pro/Enterprise per billing-and-plans-rules). Build
self-serve organization signup (business name -> becomes an organization + its first owner
user + a 14-day trial, no card required to start). Integrate Stripe Checkout for
plan selection/upgrade and Stripe webhooks (checkout.session.completed,
customer.subscription.updated/deleted, invoice.payment_failed) to update
organizations.subscription_status — never set that field from a client request. Build a
billing settings page (current plan, usage vs. limits, upgrade/downgrade, payment method,
invoices) for org owners. Build a platform-admin console (new platform_admin role) listing
all organizations, their plan, subscription status, and usage — this is your internal
God-view, reachable only via /platform-admin/*, never exposed to tenant users. Stop and
show me before continuing.
```

**Phase 2 — Branding & i18n**
```
Phase 2: Add per-organization branding fields (logo, primary/secondary color, locale,
currency, timezone) used to theme the admin panel header, the public /v/:token page, and
invoice PDFs. Implement next-intl with French, Arabic (RTL layout), and English bundles,
switchable per organization default and per-user override. Confirm invoice PDF generation
and the public QR page correctly render RTL for Arabic. Stop and show me before continuing.
```

**Phase 3 — Card design studio**
```
Phase 3: Build the card design studio per card-studio-fulfillment-rules: a fixed CR-80
canvas (front + back), enforced print-safe margins, logo upload, color/layout controls
gated by plan tier (Starter = presets only, Pro/Enterprise = full studio), a
system-generated QR placeholder that's always present and never user-editable, and the
draft -> submitted -> approved/rejected -> archived lifecycle. Build the platform_admin
review queue for submitted designs. Stop and show me before continuing.
```

**Phase 4 — Card ordering & fulfillment**
```
Phase 4: Build card_stock_settings (reorder threshold, auto-reorder toggle) and the
low-stock detection job that runs after every card link/revoke. Build the reorder/checkout
flow: pick an APPROVED design, quantity, shipping address, pay via Stripe — order cannot
progress past pending_payment without a completed payment. Build the platform_admin
fulfillment queue (paid -> in_production -> shipped -> delivered) with tracking number
entry. Wire the "delivered" transition to auto-insert exactly `quantity` new pvc_cards rows
with status unassigned for that organization, per card-studio-fulfillment-rules — verify
this is the ONLY code path that can create unassigned cards. Stop and show me before
continuing.
```

**Phase 5 — Parts marketplace**
```
Phase 5: Build parts_catalog (seed a starter reference set of common part categories),
marketplace_listings (create/browse/search across ALL organizations, filter by
category/city/condition/price), and marketplace_inquiries (a garage messages another
about a listing). Gate listing CREATION by plan limit + active/trialing subscription per
billing-and-plans-rules; browsing is ungated. Enforce that a garage can only edit/remove
its own listings. Stop and show me before continuing.
```

**Phase 6 — Mechanical solutions knowledge base**
```
Phase 6: Build solution_posts (authored by an individual user, optional org attribution),
tagged by vehicle make/model/year-range and free-text symptom tags, with solution_comments
and solution_votes. Build full-text search across title/body/tags, filterable by
make/model. Build the report/flag -> platform_admin moderation queue per
marketplace-community-rules (soft-delete only, never hard-delete). Stop and show me before
continuing.
```

**Phase 7 — Professional directory**
```
Phase 7: Build professional_profiles (one per user: display name, specialties, city/region,
bio, avatar, public_slug) with a public, SEO-indexable /pro/:slug page and a searchable
/directory page (filter by specialty + city). Directory search ranking and the
listed/featured/spotlight badge must be resolved at query time from the profile's
organization's CURRENT plan — never stored on the profile itself, per
marketplace-community-rules. Verify a plan downgrade removes the boost on the next query
with no separate sync step needed. Stop and show me before continuing.
```

**Phase 8 — Messaging**
```
Phase 8: Build direct messaging between professionals (conversations,
conversation_participants, messages) reachable from a directory profile ("Contact") or a
marketplace inquiry ("Message about this listing"). Gate starting a NEW conversation on
the sender's organization having an active/trialing subscription; reading existing threads
is never blocked, per marketplace-community-rules. Add read receipts and unread counts.
Stop and show me before continuing.
```

**Phase 9 — VIN decoding**
```
Phase 9: Build a VinDecoderService interface with a pluggable provider pattern. Implement
the free NHTSA vPIC provider as the default. Add a second provider slot (config-driven,
e.g. Vincario or VehicleDatabases — leave the actual API key/integration behind an env
flag so it can be enabled once a provider is chosen) for markets/vehicles NHTSA doesn't
cover well. Cache every successful decode in a vin_decode_cache table keyed by VIN — never
re-call a provider for a VIN already decoded. Wire it into vehicle intake to auto-fill
make/model/year/engine/fuel type, editable by staff before saving. Stop and show me before
continuing.
```

**Phase 10 — Notifications**
```
Phase 10: Wire real delivery to the existing appointments/reminders tables plus the new
marketplace inquiries and messages: email (via the configured provider) for all of these,
and SMS/WhatsApp for appointment confirmations and "vehicle ready" alerts specifically.
Add per-user notification preferences (channel on/off per notification type). Use a queue
so delivery never blocks the request/response cycle. Stop and show me before continuing.
```

**Phase 11 — Hardening & launch readiness**
```
Phase 11: Full RLS audit — for every tenant table, write and run a test that attempts to
read another organization's rows as an authenticated user of a different organization, and
confirm it returns zero rows. Rate-limit /v/:token, /directory, and /pro/:slug. Load-test
the public QR route and the directory search. Confirm Stripe webhook signature verification
is enforced. Produce a launch checklist covering: required env vars, backup schedule,
on-call/alerting for failed webhooks and failed card-fulfillment transitions, and a rollback
plan for the Phase 0 migration. Stop and give me the checklist before we schedule launch.
```
