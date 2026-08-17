# Antigravity CLI Build Package — Garage Management Platform

This package has 3 parts:
1. **Setup** — install skills before you start
2. **Two custom Skill files** — encode your garage's business rules so the agent respects them in every session
3. **The master build prompt + 7 phase prompts** — paste these into Antigravity CLI in order

---

## 1. Setup (do this once, in your empty project folder)

```bash
# Install Antigravity CLI if you haven't
curl -fsSL https://antigravity.google/cli/install.sh | bash

# From your empty project folder:
mkdir garage-platform && cd garage-platform
git init

# Install the official Netlify skills (functions, blobs, db, deploy)
npx skills add netlify/context-and-tools --skill '*' --yes
```

This pulls in Netlify's official skills: `netlify-functions`, `netlify-db`, `netlify-blobs`, `netlify-deploy`, `netlify-edge-functions`, `netlify-ai-gateway`. They teach the agent Netlify-specific best practices (correct function signatures, `@netlify/neon` usage, Blobs API, deploy flow) instead of it guessing from generic Node.js knowledge.

> **If `/skills` inside Antigravity CLI doesn't list them**: the installer sometimes drops skills at `~/.agents/skills` (a folder Antigravity CLI doesn't read), while it *does* read `<project-root>/.agents/skills/`. If that happens, just move the installed folders there:
> `mv ~/.agents/skills/netlify-* ./.agents/skills/`
> Run `/skills` again to confirm they show up.

**Optional but recommended** — connect Netlify's official MCP server so the agent can provision the site, set env vars, and trigger deploys itself instead of you doing it by hand. Config format varies slightly by agent, so pull the exact block from `docs.netlify.com/build/build-with-ai/agent-setup-guides` for Antigravity — but it's the same shape as any MCP entry, added to your `mcp_config.json`.

---

## 2. Custom Skills — create these two files before your first prompt

These aren't optional nice-to-haves — they're the guardrails for the two things most likely to get silently "simplified" by an agent working across a long session: the card lifecycle and the money math.

### `.agents/skills/garage-domain-rules/SKILL.md`

```markdown
---
name: garage-domain-rules
description: Non-negotiable business rules for the garage management platform (client/vehicle/PVC card/action/stock/invoice model). Use whenever creating or modifying anything related to clients, vehicles, PVC cards, service actions, parts/stock, workers, or invoices.
---

# Garage Domain Rules

## Ownership model
- A `client` owns N `vehicles`. A `vehicle` belongs to exactly one client at a time.
- A `pvc_card` links to a **vehicle**, never directly to a client. A client can have several
  vehicles, each with its own card and its own history.
- Transferring a vehicle to a new owner updates `vehicles.client_id` in place — never delete
  and recreate the vehicle. History must survive ownership changes. Log the transfer in
  `audit_logs`.

## PVC card lifecycle (do not simplify this state machine)
- Cards are generated in batches BEFORE being assigned: status starts as `unassigned`,
  each with a random, non-sequential token (min 128-bit, e.g. UUIDv4 or crypto-random string
  — never a sequential/incrementing ID, since the token IS the public access key).
- Linking a card to a vehicle sets status `active` and stores `vehicle_id` + `linked_at`.
- Losing/damaging a card sets status `revoked` (never delete the row — keep it for audit
  history) and a new pre-printed card gets linked to the same vehicle. The public route for
  a revoked token must show "this card has been deactivated" — never 404, never leak
  whether the token ever existed if it wasn't valid.
- Every link/revoke action writes an `audit_logs` row (actor, timestamp, old/new status).

## Stock and actions (must be atomic)
- When a part is attached to an action with a quantity, in the SAME database transaction:
  1. Insert the `action_parts` row with `unit_price_snapshot` = the part's CURRENT
     `sale_price` at that instant (never a reference/join to the live price — copy the value).
  2. Decrement `parts.quantity_in_stock` by that quantity.
  3. Insert a `stock_movements` row (`type = 'out'`, referencing the action).
- If any step fails, roll back all three. Never let stock drift from the movement ledger.
- If requested quantity exceeds available stock, warn but allow override by a manager role
  (soft block, not a hard block) — log the override.
- Changing a part's `sale_price` later must NEVER change historical `action_parts` rows or
  past invoices. Only future usages get the new price.

## Invoicing
- Invoice numbers are sequential per calendar year (e.g. `2026-000123`), generated inside a
  transaction with a row lock or a dedicated sequence — never computed as "max + 1" via a
  plain SELECT (race condition under concurrent writes).
- An invoice is generated from a completed action's `action_parts` + labor cost. Once an
  invoice is `issued`, its line items are frozen — regenerating never overwrites an issued
  invoice; it creates a new draft version.

## Roles
- `super_admin`: everything.
- `manager`: clients, vehicles, cards, actions, parts, workers, invoices — no system settings
  or user management.
- `technician`: read/write ONLY on actions they are assigned to via `action_workers`. Cannot
  browse other clients' data, cannot see cost/margin data.

## Public QR view (`/v/:token`)
- Strictly read-only. No endpoint reachable from this route may ever perform a write.
- Never serialize client `phone`, `email`, or `address` into this route's response — enforce
  this in the data-access/serializer layer, not just by omitting fields in the UI.
- Never expose other vehicles owned by the same client.
- Never expose `internal_notes` on an action — only `client_visible_notes`.
- Rate-limit this route; tokens must never be enumerable/guessable in the URL structure
  (no incrementing IDs, no short tokens).
```

### `.agents/skills/netlify-deploy-target/SKILL.md`

```markdown
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
```

---

## 3. The Master Prompt

Paste this as your first message once the skills above are in place and `/skills` confirms they're loaded.

```
I'm building a garage management platform. Follow the garage-domain-rules and
netlify-deploy-target skills for every decision below — they are not suggestions, they are
constraints.

## What this is
A platform for a mechanical garage. Each vehicle gets a physical PVC card with a QR code.
Scanning it shows the vehicle's full service history publicly (read-only) and lets the
client download/print invoices. Staff use an admin panel to manage clients, vehicles, cards,
service actions (repairs/maintenance), workers, parts/inventory, and invoices.

## Stack
- Next.js (App Router), TypeScript, Tailwind CSS
- Netlify DB (Postgres via Neon) — @netlify/neon
- Netlify Blobs for PDFs/QR images
- Auth.js (Credentials provider) + bcrypt, JWT httpOnly session cookie
- qrcode (QR generation), @react-pdf/renderer (invoice PDFs)
- Deployed to Netlify

## Roles
super_admin (everything), manager (day-to-day operations, no user/system settings),
technician (only their assigned actions, no cost/PII visibility).

## Data model (implement as SQL migrations under /migrations)
- clients: id, full_name, phone (unique), email, address, notes, created_at, updated_at
- vehicles: id, client_id FK, plate_number (unique), make, model, year, vin, color,
  current_mileage, created_at, updated_at
- pvc_cards: id, token (unique, random 128-bit+), serial_label, status
  (unassigned|active|revoked|lost), vehicle_id FK nullable, linked_at, revoked_at, created_at
- workers: id, full_name, phone, role, hourly_rate nullable, active, user_id FK nullable
- actions: id, vehicle_id FK, type (repair|maintenance|inspection|other), description,
  client_visible_notes, internal_notes, mileage_at_service, status
  (open|in_progress|completed|invoiced), date_in, date_out, labor_cost, created_by FK,
  created_at, updated_at
- action_workers: action_id FK, worker_id FK, role_on_job (lead|assist)
- action_parts: action_id FK, part_id FK, quantity, unit_price_snapshot, created_at
- parts: id, name, category, sku, unit, purchase_price, sale_price, quantity_in_stock,
  min_stock_threshold, supplier_id FK nullable, active
- stock_movements: id, part_id FK, type (in|out|adjustment), quantity,
  reference_action_id FK nullable, reason, created_by FK, created_at
- invoices: id, action_id FK, invoice_number (unique, sequential per year), subtotal,
  tax_amount, total, status (draft|issued|paid|cancelled), pdf_path, created_at
- users: id, username, password_hash, role (super_admin|manager|technician), active
- audit_logs: id, user_id FK, entity_type, entity_id, action, metadata (jsonb), created_at

## Modules to build (in this order — see phase prompts below, don't try to do it all at once)
1. Auth + Clients + Vehicles CRUD
2. PVC card batch generation, linking, revocation, public /v/:token read-only page
3. Actions CRUD with worker assignment (multiple workers per action)
4. Parts/inventory CRUD with automatic stock deduction wired to action_parts
5. Invoice auto-generation + PDF export (admin AND public download)
6. Admin dashboard (KPIs, low-stock alerts, filters) + audit log viewer
7. Hardening (rate limiting on /v/:token, RBAC middleware, backups note) + Netlify deploy

## Ground rules
- Every write-capable route enforces RBAC per the role table above.
- Every create/update/delete on clients, vehicles, actions, cards, and stock writes an
  audit_logs row.
- The public /v/:token route is a fully separate route group from the admin app — it must
  not import admin-only modules, per the netlify-deploy-target skill.
- Work phase by phase. After each phase, stop, show me what was built, and wait for my
  confirmation before starting the next phase.

Start with Phase 0: scaffold the Next.js project, set up the folder structure, write the
SQL migrations for the full schema above, provision Netlify DB, and confirm the migrations
run cleanly. Do not build any UI yet. Stop after this and show me the schema.
```

---

## 4. Phase Prompts (paste one at a time, after confirming the previous phase)

**Phase 1 — Auth + Clients + Vehicles**
```
Phase 1: Implement Auth.js with Credentials provider (users table, bcrypt), RBAC middleware
for super_admin/manager/technician, and full CRUD for clients and vehicles (list, search by
phone/name/plate, create, edit, deactivate). Vehicle detail page should show its owning
client and be ready to display card status and history (empty for now). Seed one
super_admin user and a handful of test clients/vehicles. Stop and show me before continuing.
```

**Phase 2 — PVC Cards & Public QR View**
```
Phase 2: Build PVC card batch generation (generate N unassigned cards with random tokens,
export a printable PDF sheet of QR codes via @react-pdf/renderer + qrcode), the link/revoke
UI on the vehicle detail page, and the public /v/:token route per the garage-domain-rules
skill (read-only, no client PII, handles revoked/invalid tokens gracefully). Stop and show
me before continuing.
```

**Phase 3 — Actions & Workers**
```
Phase 3: Build Workers CRUD and the Action creation/edit flow: type, description, internal
vs client-visible notes, mileage, status, multiple worker assignment with lead/assist roles.
Action history should now appear on both the admin vehicle page and the public /v/:token
page (client-visible fields only). Stop and show me before continuing.
```

**Phase 4 — Parts & Inventory**
```
Phase 4: Build the parts/inventory catalog CRUD, stock_movements ledger, low-stock
threshold alerts, and the parts picker inside the Action form — wire it to the atomic
stock-deduction transaction described in the garage-domain-rules skill. Include manual
stock adjustment with mandatory reason. Stop and show me before continuing.
```

**Phase 5 — Invoicing**
```
Phase 5: Auto-generate an invoice when an action is marked completed (parts + labor,
sequential per-year numbering, tax rate from env), render it to PDF via
@react-pdf/renderer, store it in Netlify Blobs, and expose download buttons both in the
admin panel and on the public /v/:token page for that specific action. Stop and show me
before continuing.
```

**Phase 6 — Dashboard, Reports, Audit Log**
```
Phase 6: Build the admin dashboard (vehicles currently in shop, actions this month, revenue
this month, low-stock alerts, top parts consumed, worker activity), a filterable
actions/clients export to CSV, and an audit log viewer. Stop and show me before continuing.
```

**Phase 7 — Hardening & Netlify Deploy**
```
Phase 7: Add rate limiting to /v/:token, double-check RBAC coverage on every admin route,
add a netlify.toml with the Next.js plugin configured, list all required environment
variables for me to set via netlify env:set, and deploy to Netlify. Confirm the public QR
route and the admin panel both work end-to-end on the deployed URL before calling this done.
```
